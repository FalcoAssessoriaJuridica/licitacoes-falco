import type { EntidadeContratante, FaseCaso, StatusCaso } from '@/types/database';

export const ROTULO_FASE: Record<FaseCaso, string> = {
  impugnacao_edital: 'Impugnação de edital',
  recurso_habilitacao: 'Recurso — habilitação/desclassificação',
  recurso_sancao: 'Recurso administrativo — sanção',
  mandado_seguranca: 'Mandado de Segurança',
};

export const ROTULO_ENTIDADE: Record<EntidadeContratante, string> = {
  caixa: 'Caixa Econômica Federal',
  banco_do_brasil: 'Banco do Brasil',
  petrobras: 'Petrobras',
  correios: 'Correios (ECT)',
  orgao_lei14133: 'Órgão / Autarquia / Fundação (Lei 14.133/2021)',
  outra: 'Outra estatal',
};

export const ROTULO_STATUS: Record<StatusCaso, string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em revisão',
  finalizado: 'Finalizado',
  protocolado: 'Protocolado',
};

export const COR_STATUS: Record<StatusCaso, string> = {
  rascunho: 'bg-ink-800/10 text-ink-700',
  em_revisao: 'bg-gold-500/15 text-gold-600',
  finalizado: 'bg-emerald-500/15 text-emerald-700',
  protocolado: 'bg-blue-500/15 text-blue-700',
};
