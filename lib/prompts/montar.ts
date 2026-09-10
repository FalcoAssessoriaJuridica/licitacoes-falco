import type { EntidadeContratante, FaseCaso } from '@/types/database';
import { PROMPT_SISTEMA_BASE } from './sistema';

/**
 * Slugs das linhas de `base_conhecimento` migradas da skill.
 * MANTER EM SINCRONIA com `scripts/seed-base-conhecimento.mjs`.
 */
export const SLUG_MESTRE = '00-mestre-comparativo-regimes';

export const SLUG_REGULAMENTO_POR_ENTIDADE: Record<
  EntidadeContratante,
  string | null
> = {
  caixa: '01-regulamento-caixa',
  banco_do_brasil: '02-regulamento-bb',
  petrobras: '03-regulamento-petrobras',
  correios: '04-regulamento-correios',
  orgao_lei14133: '05-orgao-lei14133',
  outra: null,
};

export interface LinhaConhecimento {
  slug: string | null;
  tipo: 'regulamento_entidade' | 'doutrina' | 'peca_modelo';
  titulo: string;
  conteudo_md: string;
  fases: FaseCaso[];
  ordem: number;
}

export interface DadosCasoPrompt {
  cliente_nome: string;
  cliente_cnpj: string | null;
  entidade_contratante: EntidadeContratante;
  entidade_contratante_outra: string | null;
  fase: FaseCaso;
  numero_processo: string | null;
  numero_edital: string | null;
  numero_contrato: string | null;
  prazo_limite: string | null;
}

const ROTULO_FASE: Record<FaseCaso, string> = {
  impugnacao_edital: 'Impugnação de edital',
  recurso_habilitacao: 'Recurso contra inabilitação/desclassificação',
  recurso_sancao: 'Recurso administrativo contra sanção (PAD)',
  mandado_seguranca: 'Mandado de Segurança',
};

const ROTULO_ENTIDADE: Record<EntidadeContratante, string> = {
  caixa: 'Caixa Econômica Federal',
  banco_do_brasil: 'Banco do Brasil',
  petrobras: 'Petrobras',
  correios: 'Correios (ECT)',
  orgao_lei14133: 'Órgão/autarquia/fundação sob a Lei 14.133/2021',
  outra: 'Outra estatal',
};

/**
 * Escolhe, do acervo carregado, as linhas relevantes para este caso:
 * o quadro mestre (sempre) + o regulamento da entidade + as fichas de
 * doutrina marcadas para a fase (ou todas as fichas, se nenhuma casar).
 */
export function selecionarConhecimento(
  todas: LinhaConhecimento[],
  entidade: EntidadeContratante,
  fase: FaseCaso
): LinhaConhecimento[] {
  const porSlug = new Map(todas.map((l) => [l.slug, l]));
  const escolhidas: LinhaConhecimento[] = [];

  const mestre = porSlug.get(SLUG_MESTRE);
  if (mestre) escolhidas.push(mestre);

  const slugReg = SLUG_REGULAMENTO_POR_ENTIDADE[entidade];
  const reg = slugReg ? porSlug.get(slugReg) : undefined;
  if (reg) escolhidas.push(reg);

  const doutrina = todas.filter((l) => l.tipo === 'doutrina');
  const daFase = doutrina.filter((l) => l.fases.includes(fase));
  escolhidas.push(...(daFase.length > 0 ? daFase : doutrina));

  return escolhidas
    .filter((l, i, arr) => arr.findIndex((x) => x.slug === l.slug) === i)
    .sort((a, b) => a.ordem - b.ordem);
}

export function montarSystem(
  conhecimento: LinhaConhecimento[]
): string {
  const blocos = conhecimento
    .map((l) => `## ${l.titulo}\n\n${l.conteudo_md.trim()}`)
    .join('\n\n---\n\n');

  return `${PROMPT_SISTEMA_BASE}

# BASE DE CONHECIMENTO APLICÁVEL

O material abaixo foi selecionado para a entidade e a fase deste caso. É a doutrina do escritório — siga-a; onde ela mandar alertar (ex.: Correios, RLCC 14.5), alerte.

${blocos}`;
}

export interface EntradaUsuario {
  caso: DadosCasoPrompt;
  fase: FaseCaso;
  textoBase: string;
  instrucoes: string;
  dataCiencia?: string | null;
  prazoIndicado?: string | null;
}

export function montarConteudoUsuario(e: EntradaUsuario): string {
  const c = e.caso;
  const entidadeTxt =
    c.entidade_contratante === 'outra'
      ? c.entidade_contratante_outra || 'Outra estatal (não especificada)'
      : ROTULO_ENTIDADE[c.entidade_contratante];

  const linhas: string[] = [];

  linhas.push('# DADOS DO CASO');
  linhas.push(`- Cliente: ${c.cliente_nome}${c.cliente_cnpj ? ` (CNPJ ${c.cliente_cnpj})` : ''}`);
  linhas.push(`- Entidade contratante: ${entidadeTxt}`);
  linhas.push(`- Fase: ${ROTULO_FASE[e.fase]}`);
  if (c.numero_processo) linhas.push(`- Nº do processo: ${c.numero_processo}`);
  if (c.numero_edital) linhas.push(`- Nº do edital: ${c.numero_edital}`);
  if (c.numero_contrato) linhas.push(`- Nº do contrato: ${c.numero_contrato}`);

  linhas.push('');
  linhas.push('# PRAZO');
  linhas.push(
    e.dataCiencia
      ? `- Data da ciência do ato: ${e.dataCiencia}`
      : '- Data da ciência: NÃO INFORMADA — calcule o prazo em função dela e sinalize a pendência.'
  );
  if (e.prazoIndicado) {
    linhas.push(`- Prazo indicado na própria intimação/decisão: ${e.prazoIndicado}`);
  }
  if (c.prazo_limite) linhas.push(`- Prazo-limite registrado no caso: ${c.prazo_limite}`);

  linhas.push('');
  linhas.push('# DOCUMENTO / CONTEXTO FÁTICO (colado pelo advogado)');
  linhas.push(e.textoBase.trim() || '(nenhum texto colado)');

  linhas.push('');
  linhas.push('# TAREFA');
  linhas.push(e.instrucoes.trim() || 'Analisar o caso e produzir a peça cabível para a fase indicada.');
  linhas.push('');
  linhas.push(
    'Entregue estratégia + prazo + esqueleto da peça, no formato definido no prompt de sistema. Feche com "PONTOS A CONFIRMAR COM O DR. FALCO".'
  );

  return linhas.join('\n');
}
