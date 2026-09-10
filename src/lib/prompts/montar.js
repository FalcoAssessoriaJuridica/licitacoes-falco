import { PROMPT_SISTEMA_BASE } from './sistema.js';

/** MANTER slugs em sincronia com scripts/seed-base-conhecimento.mjs */
export const SLUG_MESTRE = '00-mestre-comparativo-regimes';

export const SLUG_REGULAMENTO_POR_ENTIDADE = {
  caixa: '01-regulamento-caixa',
  banco_do_brasil: '02-regulamento-bb',
  petrobras: '03-regulamento-petrobras',
  correios: '04-regulamento-correios',
  orgao_lei14133: '05-orgao-lei14133',
  outra: null,
};

const ROTULO_FASE = {
  impugnacao_edital: 'Impugnação de edital',
  recurso_habilitacao: 'Recurso contra inabilitação/desclassificação',
  recurso_sancao: 'Recurso administrativo contra sanção (PAD)',
  mandado_seguranca: 'Mandado de Segurança',
};

const ROTULO_ENTIDADE = {
  caixa: 'Caixa Econômica Federal',
  banco_do_brasil: 'Banco do Brasil',
  petrobras: 'Petrobras',
  correios: 'Correios (ECT)',
  orgao_lei14133: 'Órgão/autarquia/fundação sob a Lei 14.133/2021',
  outra: 'Outra estatal',
};

/**
 * Do acervo carregado, escolhe: quadro mestre (sempre) + regulamento
 * da entidade + fichas de doutrina da fase (ou todas, se nenhuma casar).
 */
export function selecionarConhecimento(todas, entidade, fase) {
  const porSlug = new Map(todas.map((l) => [l.slug, l]));
  const escolhidas = [];

  const mestre = porSlug.get(SLUG_MESTRE);
  if (mestre) escolhidas.push(mestre);

  const slugReg = SLUG_REGULAMENTO_POR_ENTIDADE[entidade];
  const reg = slugReg ? porSlug.get(slugReg) : undefined;
  if (reg) escolhidas.push(reg);

  const doutrina = todas.filter((l) => l.tipo === 'doutrina');
  const daFase = doutrina.filter((l) => (l.fases || []).includes(fase));
  escolhidas.push(...(daFase.length > 0 ? daFase : doutrina));

  return escolhidas
    .filter((l, i, arr) => arr.findIndex((x) => x.slug === l.slug) === i)
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

export function montarSystem(conhecimento) {
  const blocos = conhecimento
    .map((l) => `## ${l.titulo}\n\n${(l.conteudo_md || '').trim()}`)
    .join('\n\n---\n\n');

  return `${PROMPT_SISTEMA_BASE}

# BASE DE CONHECIMENTO APLICÁVEL

O material abaixo foi selecionado para a entidade e a fase deste caso. É a doutrina do escritório — siga-a; onde ela mandar alertar (ex.: Correios, RLCC 14.5), alerte.

${blocos}`;
}

export function montarConteudoUsuario({
  caso,
  fase,
  textoBase,
  instrucoes,
  dataCiencia,
  prazoIndicado,
}) {
  const c = caso;
  const entidadeTxt =
    c.entidade_contratante === 'outra'
      ? c.entidade_contratante_outra || 'Outra estatal (não especificada)'
      : ROTULO_ENTIDADE[c.entidade_contratante];

  const L = [];
  L.push('# DADOS DO CASO');
  L.push(`- Cliente: ${c.cliente_nome}${c.cliente_cnpj ? ` (CNPJ ${c.cliente_cnpj})` : ''}`);
  L.push(`- Entidade contratante: ${entidadeTxt}`);
  L.push(`- Fase: ${ROTULO_FASE[fase]}`);
  if (c.numero_processo) L.push(`- Nº do processo: ${c.numero_processo}`);
  if (c.numero_edital) L.push(`- Nº do edital: ${c.numero_edital}`);
  if (c.numero_contrato) L.push(`- Nº do contrato: ${c.numero_contrato}`);

  L.push('');
  L.push('# PRAZO');
  L.push(
    dataCiencia
      ? `- Data da ciência do ato: ${dataCiencia}`
      : '- Data da ciência: NÃO INFORMADA — calcule o prazo em função dela e sinalize a pendência.',
  );
  if (prazoIndicado) L.push(`- Prazo indicado na própria intimação/decisão: ${prazoIndicado}`);
  if (c.prazo_limite) L.push(`- Prazo-limite registrado no caso: ${c.prazo_limite}`);

  L.push('');
  L.push('# DOCUMENTO / CONTEXTO FÁTICO (colado pelo advogado)');
  L.push((textoBase || '').trim() || '(nenhum texto colado)');

  L.push('');
  L.push('# TAREFA');
  L.push((instrucoes || '').trim() || 'Analisar o caso e produzir a peça cabível para a fase indicada.');
  L.push('');
  L.push(
    'Entregue estratégia + prazo + esqueleto da peça, no formato definido no prompt de sistema. Feche com "PONTOS A CONFIRMAR COM O DR. FALCO".',
  );
  return L.join('\n');
}
