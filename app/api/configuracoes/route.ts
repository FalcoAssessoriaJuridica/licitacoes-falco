import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ERROS, fail, ok } from '@/lib/api/http';
import { criptografar } from '@/lib/cripto';

/** GET — estado da configuração de LLM do usuário (nunca devolve a chave). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return ERROS.naoAutenticado();

  const { data } = await supabase
    .from('configuracoes_llm_usuario')
    .select('provedor, modelo_padrao, api_key_criptografada')
    .eq('user_id', user.id)
    .maybeSingle();

  return ok({
    provedor: data?.provedor ?? 'anthropic',
    modelo_padrao: data?.modelo_padrao ?? null,
    chave_configurada: Boolean(data?.api_key_criptografada),
  });
}

const corpo = z.object({
  // fixo em 'anthropic' nesta fase; o campo existe para a Fase 3
  provedor: z.literal('anthropic').default('anthropic'),
  modelo_padrao: z.string().trim().max(120).optional().nullable(),
  // string vazia = "manter a chave atual"; string preenchida = nova chave
  api_key: z.string().trim().max(400).optional().default(''),
});

/** PUT — cria/atualiza a configuração. Criptografa a chave antes de gravar. */
export async function PUT(req: NextRequest) {
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

  const { data: existente } = await supabase
    .from('configuracoes_llm_usuario')
    .select('id, api_key_criptografada')
    .eq('user_id', user.id)
    .maybeSingle();

  const novaChave = dados.api_key.trim();
  if (!existente?.api_key_criptografada && !novaChave) {
    return fail(
      'chave_obrigatoria',
      'Informe a chave da Anthropic na primeira configuração.',
      422
    );
  }
  if (novaChave && !/^sk-ant-/.test(novaChave)) {
    return fail(
      'chave_formato',
      'A chave da Anthropic começa com "sk-ant-".',
      422
    );
  }

  let cifrada: string | undefined;
  try {
    cifrada = novaChave ? criptografar(novaChave) : undefined;
  } catch (e) {
    return fail(
      'cripto_indisponivel',
      e instanceof Error ? e.message : 'Falha ao criptografar a chave.',
      500
    );
  }

  const payload = {
    user_id: user.id,
    provedor: dados.provedor,
    modelo_padrao: dados.modelo_padrao || null,
    ...(cifrada ? { api_key_criptografada: cifrada } : {}),
  };

  const { error } = await supabase
    .from('configuracoes_llm_usuario')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) return fail('gravacao_falhou', error.message, 500);

  return ok({ chave_configurada: true });
}
