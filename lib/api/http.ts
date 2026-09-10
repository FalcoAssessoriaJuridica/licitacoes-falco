import { NextResponse } from 'next/server';

/**
 * Envelopes de resposta da API — mesmo contrato em todas as rotas.
 *   sucesso: { data: ... }
 *   erro:    { error: { code, message, details? } }
 */

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

export const ERROS = {
  naoAutenticado: () =>
    fail('nao_autenticado', 'Faça login para continuar.', 401),
  casoNaoEncontrado: () =>
    fail('caso_nao_encontrado', 'Caso não encontrado ou sem acesso.', 404),
  corpoInvalido: (details: unknown) =>
    fail('corpo_invalido', 'Dados enviados são inválidos.', 422, details),
  llmNaoConfigurado: () =>
    fail(
      'llm_nao_configurado',
      'Configure sua chave da Anthropic em Configurações antes de gerar peças.',
      400
    ),
  anthropicAuth: () =>
    fail(
      'anthropic_auth',
      'A chave da Anthropic foi recusada. Revise-a em Configurações.',
      502
    ),
  anthropicFalhou: (msg: string) =>
    fail('anthropic_falhou', `Falha ao gerar a peça: ${msg}`, 502),
} as const;
