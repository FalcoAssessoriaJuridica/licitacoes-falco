export const FASES = [
  'impugnacao_edital',
  'recurso_habilitacao',
  'recurso_sancao',
  'mandado_seguranca',
];

export const ENTIDADES = [
  'caixa',
  'banco_do_brasil',
  'petrobras',
  'correios',
  'orgao_lei14133',
  'outra',
];

export const STATUS = ['rascunho', 'em_revisao', 'finalizado', 'protocolado'];

export const ROTULO_FASE = {
  impugnacao_edital: 'Impugnação de edital',
  recurso_habilitacao: 'Recurso — habilitação/desclassificação',
  recurso_sancao: 'Recurso administrativo — sanção (PAD)',
  mandado_seguranca: 'Mandado de Segurança',
};

export const ROTULO_ENTIDADE = {
  caixa: 'Caixa Econômica Federal',
  banco_do_brasil: 'Banco do Brasil',
  petrobras: 'Petrobras',
  correios: 'Correios (ECT)',
  orgao_lei14133: 'Órgão / Autarquia / Fundação (Lei 14.133/2021)',
  outra: 'Outra estatal',
};

export const ROTULO_STATUS = {
  rascunho: 'Rascunho',
  em_revisao: 'Em revisão',
  finalizado: 'Finalizado',
  protocolado: 'Protocolado',
};

export const CLASSE_STATUS = {
  rascunho: 'badge badge-neutral',
  em_revisao: 'badge badge-warn',
  finalizado: 'badge badge-ok',
  protocolado: 'badge badge-info',
};

export function nomeEntidade(caso) {
  if (caso.entidade_contratante === 'outra') {
    return caso.entidade_contratante_outra || 'Outra estatal';
  }
  return ROTULO_ENTIDADE[caso.entidade_contratante] || caso.entidade_contratante;
}

export function formatarData(iso) {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('pt-BR');
}
