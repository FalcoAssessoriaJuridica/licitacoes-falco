'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROTULO_FASE } from '@/lib/rotulos';
import type { FaseCaso } from '@/types/database';

const INPUT =
  'w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500';

export function GerarForm({
  casoId,
  faseInicial,
  entidadeTxt,
}: {
  casoId: string;
  faseInicial: FaseCaso;
  entidadeTxt: string;
}) {
  const router = useRouter();

  const [fase, setFase] = useState<FaseCaso>(faseInicial);
  const [textoBase, setTextoBase] = useState('');
  const [dataCiencia, setDataCiencia] = useState('');
  const [prazoIndicado, setPrazoIndicado] = useState('');
  const [instrucoes, setInstrucoes] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const podeGerar = textoBase.trim().length > 20 && !gerando;

  async function gerar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setGerando(true);

    try {
      const resp = await fetch(`/api/casos/${casoId}/gerar-peca`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fase,
          textoBase,
          instrucoes,
          dataCiencia: dataCiencia || null,
          prazoIndicado: prazoIndicado || null,
        }),
      });
      const json = await resp.json();

      if (!resp.ok) {
        setErro(json?.error?.message ?? 'Falha ao gerar a peça.');
        setGerando(false);
        return;
      }

      router.push(`/casos/${casoId}/pecas/${json.data.peca.id}`);
    } catch {
      setErro('Erro de rede ao chamar a geração.');
      setGerando(false);
    }
  }

  return (
    <form onSubmit={gerar} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1.5">Fase</label>
        <select
          value={fase}
          onChange={(e) => setFase(e.target.value as FaseCaso)}
          className={`${INPUT} bg-white`}
        >
          {Object.entries(ROTULO_FASE).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </select>
        <p className="text-xs text-ink-700 mt-1">
          Entidade: <strong>{entidadeTxt}</strong> (definida no caso). O regime,
          o prazo e o efeito suspensivo saem daí.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          Documento / contexto
        </label>
        <textarea
          required
          value={textoBase}
          onChange={(e) => setTextoBase(e.target.value)}
          rows={12}
          placeholder="Cole aqui o edital e a cláusula impugnada, ou a decisão do PAD / o auto de infração / a intimação — o texto que fundamenta a peça."
          className={`${INPUT} font-mono leading-relaxed`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Data da ciência do ato
          </label>
          <input
            type="date"
            value={dataCiencia}
            onChange={(e) => setDataCiencia(e.target.value)}
            className={INPUT}
          />
          <p className="text-xs text-ink-700 mt-1">
            Base para a contagem do prazo.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Prazo indicado na intimação
          </label>
          <input
            type="text"
            value={prazoIndicado}
            onChange={(e) => setPrazoIndicado(e.target.value)}
            placeholder="ex.: 10 dias úteis (item 14.4 'c')"
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          O que você precisa
        </label>
        <textarea
          value={instrucoes}
          onChange={(e) => setInstrucoes(e.target.value)}
          rows={3}
          placeholder="ex.: impugnar a exigência de atestado com quantitativo de 80%; ou: recorrer da inabilitação por CNDT positiva; ou: defender da suspensão de 2 anos, atraso justificado por chuvas."
          className={INPUT}
        />
      </div>

      {erro && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {erro}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={!podeGerar}
          className="bg-ink-950 text-parchment-50 rounded-md px-5 py-2.5 text-sm font-medium hover:bg-ink-900 transition-colors disabled:opacity-50"
        >
          {gerando ? 'Gerando (pode levar 1 min)...' : 'Gerar peça'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/casos/${casoId}`)}
          className="text-ink-700 text-sm font-medium hover:text-ink-950 transition-colors"
        >
          Cancelar
        </button>
      </div>
      {gerando && (
        <p className="text-xs text-ink-700">
          A peça é redigida pela Claude com a sua chave e a base de conhecimento
          do escritório. Não feche a aba.
        </p>
      )}
    </form>
  );
}
