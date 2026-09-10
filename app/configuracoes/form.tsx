'use client';

import { useState } from 'react';

const INPUT =
  'w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500';

export function FormConfiguracoes({
  chaveConfigurada,
  modeloPadrao,
}: {
  chaveConfigurada: boolean;
  modeloPadrao: string;
}) {
  const [apiKey, setApiKey] = useState('');
  const [modelo, setModelo] = useState(modeloPadrao);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(
    null
  );
  const [temChave, setTemChave] = useState(chaveConfigurada);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMsg(null);

    const resp = await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        provedor: 'anthropic',
        modelo_padrao: modelo.trim() || null,
        api_key: apiKey.trim(),
      }),
    });
    const json = await resp.json();
    setSalvando(false);

    if (!resp.ok) {
      setMsg({
        tipo: 'erro',
        texto: json?.error?.message ?? 'Falha ao salvar.',
      });
      return;
    }
    setApiKey('');
    setTemChave(true);
    setMsg({ tipo: 'ok', texto: 'Configuração salva.' });
  }

  return (
    <form onSubmit={salvar} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1.5">Provedor</label>
        <input value="Anthropic (Claude)" disabled className={`${INPUT} bg-parchment-100 text-ink-700`} />
        <p className="text-xs text-ink-700 mt-1">
          Outros provedores (OpenAI, Ollama local) chegam na Fase 3.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          Chave da API Anthropic
        </label>
        <input
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={
            temChave ? '•••••••••• (configurada — preencha só para trocar)' : 'sk-ant-...'
          }
          className={INPUT}
        />
        <p className="text-xs text-ink-700 mt-1">
          Começa com <code>sk-ant-</code>. Guardada criptografada (AES-256-GCM).
          {temChave && ' Deixe em branco para manter a atual.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          Modelo <span className="text-ink-700 font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          placeholder="claude-sonnet-4-5 (padrão do servidor)"
          className={INPUT}
        />
        <p className="text-xs text-ink-700 mt-1">
          Em branco usa o padrão. Ex.: um modelo Opus para peça crítica.
        </p>
      </div>

      {msg && (
        <p
          className={`text-sm rounded-md px-3 py-2 border ${
            msg.tipo === 'ok'
              ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
              : 'text-red-800 bg-red-50 border-red-200'
          }`}
        >
          {msg.texto}
        </p>
      )}

      <button
        type="submit"
        disabled={salvando}
        className="bg-ink-950 text-parchment-50 rounded-md px-5 py-2.5 text-sm font-medium hover:bg-ink-900 transition-colors disabled:opacity-50"
      >
        {salvando ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
