/**
 * Camada de LLM — provedor-agnóstica, executada NO NAVEGADOR.
 *
 * A chamada parte do browser porque é a única forma de alcançar um
 * modelo local (Ollama / LM Studio) na máquina do usuário ou num
 * servidor dele; e serve igual para qualquer API remota.
 *
 * Três "formatos de fio":
 *  - openai    → POST {baseUrl}/chat/completions   (OpenAI, OpenRouter, Groq,
 *                DeepSeek, Ollama /v1, LM Studio, vLLM, LiteLLM, ...)
 *  - anthropic → POST {baseUrl}/v1/messages
 *  - gemini    → POST {baseUrl}/v1beta/models/{model}:generateContent
 */

export const FORMATOS = [
  { id: 'openai', nome: 'OpenAI-compatível', sub: 'OpenAI · OpenRouter · Groq · Ollama · LM Studio · vLLM · seu servidor' },
  { id: 'anthropic', nome: 'Anthropic (Claude nativo)', sub: 'api.anthropic.com ou proxy compatível' },
  { id: 'gemini', nome: 'Google Gemini', sub: 'generativelanguage.googleapis.com' },
];

export const PRESETS = {
  openai: [
    { rotulo: 'Ollama (local)', base_url: 'http://localhost:11434/v1', modelo: 'qwen2.5:14b', chave_opcional: true },
    { rotulo: 'LM Studio (local)', base_url: 'http://localhost:1234/v1', modelo: '', chave_opcional: true },
    { rotulo: 'OpenAI', base_url: 'https://api.openai.com/v1', modelo: 'gpt-4o' },
    { rotulo: 'OpenRouter', base_url: 'https://openrouter.ai/api/v1', modelo: 'deepseek/deepseek-chat' },
    { rotulo: 'Groq', base_url: 'https://api.groq.com/openai/v1', modelo: 'llama-3.3-70b-versatile' },
    { rotulo: 'Servidor próprio (vLLM/LiteLLM)', base_url: 'https://ia.seudominio.com.br/v1', modelo: '' },
  ],
  anthropic: [
    { rotulo: 'Anthropic', base_url: 'https://api.anthropic.com', modelo: 'claude-sonnet-4-5' },
  ],
  gemini: [
    { rotulo: 'Google AI Studio', base_url: 'https://generativelanguage.googleapis.com', modelo: 'gemini-2.5-flash' },
  ],
};

const trimBar = (s) => (s || '').trim().replace(/\/+$/, '');

async function comErro(res, ctx) {
  let corpo = '';
  try {
    corpo = await res.text();
  } catch {
    /* noop */
  }
  const msg = corpo.slice(0, 400) || res.statusText;
  const e = new Error(`${ctx}: HTTP ${res.status} — ${msg}`);
  e.status = res.status;
  return e;
}

/**
 * Gera a peça. Retorna { texto, modelo, uso:{entrada,saida} }.
 * cfg = { formato, base_url, api_key, modelo }
 */
export async function gerarPeca(cfg, { system, user, maxTokens = 8000, signal } = {}) {
  const base = trimBar(cfg.base_url);
  const modelo = (cfg.modelo || '').trim();
  const chave = (cfg.api_key || '').trim();
  if (!base) throw new Error('Base URL do provedor não configurada.');
  if (!modelo) throw new Error('Modelo não configurado.');

  if (cfg.formato === 'anthropic') {
    const res = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': chave,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: modelo,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) throw await comErro(res, 'Anthropic');
    const j = await res.json();
    const texto = (j.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return {
      texto,
      modelo: j.model || modelo,
      uso: { entrada: j.usage?.input_tokens ?? null, saida: j.usage?.output_tokens ?? null },
    };
  }

  if (cfg.formato === 'gemini') {
    const url = `${base}/v1beta/models/${encodeURIComponent(modelo)}:generateContent?key=${encodeURIComponent(chave)}`;
    const res = await fetch(url, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
      }),
    });
    if (!res.ok) throw await comErro(res, 'Gemini');
    const j = await res.json();
    const texto = (j.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || '')
      .join('')
      .trim();
    return {
      texto,
      modelo,
      uso: {
        entrada: j.usageMetadata?.promptTokenCount ?? null,
        saida: j.usageMetadata?.candidatesTokenCount ?? null,
      },
    };
  }

  // default: openai-compatível
  const headers = { 'content-type': 'application/json' };
  if (chave) headers.authorization = `Bearer ${chave}`;
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    signal,
    headers,
    body: JSON.stringify({
      model: modelo,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
      stream: false,
    }),
  });
  if (!res.ok) throw await comErro(res, 'Provedor');
  const j = await res.json();
  const texto = (j.choices?.[0]?.message?.content || '').trim();
  if (!texto) throw new Error('O provedor respondeu sem conteúdo.');
  return {
    texto,
    modelo: j.model || modelo,
    uso: {
      entrada: j.usage?.prompt_tokens ?? null,
      saida: j.usage?.completion_tokens ?? null,
    },
  };
}

/** Lista de modelos do provedor (best-effort). */
export async function listarModelos(cfg) {
  const base = trimBar(cfg.base_url);
  const chave = (cfg.api_key || '').trim();
  if (!base) return [];
  try {
    if (cfg.formato === 'gemini') {
      const res = await fetch(`${base}/v1beta/models?key=${encodeURIComponent(chave)}`);
      if (!res.ok) return [];
      const j = await res.json();
      return (j.models || [])
        .map((m) => (m.name || '').replace(/^models\//, ''))
        .filter(Boolean);
    }
    if (cfg.formato === 'anthropic') {
      const res = await fetch(`${base}/v1/models`, {
        headers: { 'x-api-key': chave, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      });
      if (!res.ok) return ['claude-sonnet-4-5', 'claude-opus-4-1', 'claude-3-5-haiku-latest'];
      const j = await res.json();
      return (j.data || []).map((m) => m.id).filter(Boolean);
    }
    // openai-compatível
    const headers = {};
    if (chave) headers.authorization = `Bearer ${chave}`;
    const res = await fetch(`${base}/models`, { headers });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.data || j.models || [])
      .map((m) => m.id || m.name || m)
      .filter((x) => typeof x === 'string')
      .sort();
  } catch {
    return [];
  }
}

/** Teste rápido de conectividade. Retorna { ok, msg }. */
export async function testarConexao(cfg) {
  try {
    const modelos = await listarModelos(cfg);
    if (modelos.length > 0) {
      return { ok: true, msg: `Conectado — ${modelos.length} modelo(s) visível(is).` };
    }
    // sem endpoint de modelos: tenta um ping mínimo de geração
    await gerarPeca(cfg, { system: 'ping', user: 'responda só: ok', maxTokens: 8 });
    return { ok: true, msg: 'Conectado — geração respondeu.' };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}
