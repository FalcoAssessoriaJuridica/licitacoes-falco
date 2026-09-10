import Anthropic from '@anthropic-ai/sdk';

export const MODELO_PADRAO =
  process.env.ANTHROPIC_MODEL_PADRAO?.trim() || 'claude-sonnet-4-5';

export interface ResultadoGeracao {
  texto: string;
  modelo: string;
  tokensEntrada: number;
  tokensSaida: number;
}

export class AnthropicAuthError extends Error {}
export class AnthropicError extends Error {}

/**
 * Chama a API da Anthropic com a chave do próprio usuário (decifrada na
 * rota). Sem streaming nesta fase — a UI mostra um estado de carregando.
 */
export async function gerarPeca(params: {
  apiKey: string;
  modelo?: string;
  system: string;
  conteudoUsuario: string;
  maxTokens?: number;
}): Promise<ResultadoGeracao> {
  const client = new Anthropic({ apiKey: params.apiKey });
  const modelo = params.modelo?.trim() || MODELO_PADRAO;

  try {
    const resp = await client.messages.create({
      model: modelo,
      max_tokens: params.maxTokens ?? 8000,
      system: params.system,
      messages: [{ role: 'user', content: params.conteudoUsuario }],
    });

    const texto = resp.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('\n')
      .trim();

    return {
      texto,
      modelo: resp.model,
      tokensEntrada: resp.usage.input_tokens,
      tokensSaida: resp.usage.output_tokens,
    };
  } catch (e) {
    const status =
      e instanceof Anthropic.APIError ? e.status : undefined;
    if (status === 401 || status === 403) {
      throw new AnthropicAuthError('Chave da Anthropic recusada.');
    }
    const msg = e instanceof Error ? e.message : 'erro desconhecido';
    throw new AnthropicError(msg);
  }
}
