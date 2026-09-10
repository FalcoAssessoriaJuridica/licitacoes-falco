import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ERROS, ok } from '@/lib/api/http';
import { descriptografar } from '@/lib/cripto';
import {
  gerarPeca,
  AnthropicAuthError,
  AnthropicError,
} from '@/lib/llm/anthropic';
import {
  montarSystem,
  montarConteudoUsuario,
  selecionarConhecimento,
  type LinhaConhecimento,
} from '@/lib/prompts/montar';
import type { FaseCaso } from '@/types/database';

export const maxDuration = 120; // geração pode passar de 60s

const FASES = [
  'impugnacao_edital',
  'recurso_habilitacao',
  'recurso_sancao',
  'mandado_seguranca',
] as const;

const ROTULO_FASE_CURTO: Record<FaseCaso, string> = {
  impugnacao_edital: 'Impugnação de edital',
  recurso_habilitacao: 'Recurso — habilitação',
  recurso_sancao: 'Recurso — sanção',
  mandado_seguranca: 'Mandado de Segurança',
};

const corpo = z.object({
  fase: z.enum(FASES).optional(),
  textoBase: z
    .string()
    .trim()
    .min(1, 'Cole o edital, a decisão do PAD ou a intimação.')
    .max(200_000),
  instrucoes: z.string().trim().max(10_000).optional().default(''),
  dataCiencia: z.string().trim().max(40).optional().nullable(),
  prazoIndicado: z.string().trim().max(200).optional().nullable(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return ERROS.naoAutenticado();

  let dados: z.infer<typeof corpo>;
  try {
    dados = corpo.parse(await req.json());
  } catch (e) {
    return ERROS.corpoInvalido(
      e instanceof z.ZodError ? e.flatten() : String(e)
    );
  }

  const { data: caso } = await supabase
    .from('casos_licitacao')
    .select('*')
    .eq('id', id)
    .single();
  if (!caso) return ERROS.casoNaoEncontrado();

  const { data: config } = await supabase
    .from('configuracoes_llm_usuario')
    .select('api_key_criptografada, modelo_padrao')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!config?.api_key_criptografada) return ERROS.llmNaoConfigurado();

  let apiKey: string;
  try {
    apiKey = descriptografar(config.api_key_criptografada);
  } catch {
    return ERROS.llmNaoConfigurado();
  }

  const { data: rows } = await supabase
    .from('base_conhecimento')
    .select('slug, tipo, titulo, conteudo_md, fases, ordem');
  const conhecimento = (rows ?? []) as unknown as LinhaConhecimento[];

  const fase = (dados.fase ?? caso.fase) as FaseCaso;
  const selecionado = selecionarConhecimento(
    conhecimento,
    caso.entidade_contratante,
    fase
  );
  const system = montarSystem(selecionado);
  const conteudoUsuario = montarConteudoUsuario({
    caso,
    fase,
    textoBase: dados.textoBase,
    instrucoes: dados.instrucoes ?? '',
    dataCiencia: dados.dataCiencia ?? null,
    prazoIndicado: dados.prazoIndicado ?? null,
  });

  let resultado;
  try {
    resultado = await gerarPeca({
      apiKey,
      modelo: config.modelo_padrao ?? undefined,
      system,
      conteudoUsuario,
    });
  } catch (e) {
    if (e instanceof AnthropicAuthError) return ERROS.anthropicAuth();
    if (e instanceof AnthropicError) return ERROS.anthropicFalhou(e.message);
    return ERROS.anthropicFalhou('erro inesperado');
  }

  const { data: ultima } = await supabase
    .from('pecas_geradas')
    .select('versao')
    .eq('caso_id', id)
    .order('versao', { ascending: false })
    .limit(1)
    .maybeSingle();
  const versao = (ultima?.versao ?? 0) + 1;

  const { data: peca, error } = await supabase
    .from('pecas_geradas')
    .insert({
      caso_id: id,
      versao,
      titulo: `${ROTULO_FASE_CURTO[fase]} — v${versao}`,
      fase,
      entidade: caso.entidade_contratante,
      conteudo: resultado.texto,
      provedor_llm: 'anthropic',
      modelo_llm: resultado.modelo,
      prompt_usado: `## SYSTEM\n\n${system}\n\n## USER\n\n${conteudoUsuario}`,
      tokens_entrada: resultado.tokensEntrada,
      tokens_saida: resultado.tokensSaida,
      gerado_por: user.id,
    })
    .select('*')
    .single();

  if (error) {
    return ERROS.anthropicFalhou(
      'a peça foi gerada, mas falhou ao gravar: ' + error.message
    );
  }

  return ok({ peca });
}
