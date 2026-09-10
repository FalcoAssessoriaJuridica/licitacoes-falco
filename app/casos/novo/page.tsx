'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { ROTULO_ENTIDADE, ROTULO_FASE } from '@/lib/rotulos';
import type { EntidadeContratante, FaseCaso } from '@/types/database';

export default function NovoCasoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [clienteNome, setClienteNome] = useState('');
  const [clienteCnpj, setClienteCnpj] = useState('');
  const [fase, setFase] = useState<FaseCaso>('recurso_sancao');
  const [entidade, setEntidade] = useState<EntidadeContratante>('caixa');
  const [entidadeOutra, setEntidadeOutra] = useState('');
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [numeroEdital, setNumeroEdital] = useState('');
  const [numeroContrato, setNumeroContrato] = useState('');
  const [prazoLimite, setPrazoLimite] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro('Sessão expirada. Faça login novamente.');
      setCarregando(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      setErro('Não foi possível identificar seu escritório.');
      setCarregando(false);
      return;
    }

    const { data: novoCaso, error } = await supabase
      .from('casos_licitacao')
      .insert({
        tenant_id: profile.tenant_id,
        criado_por: user.id,
        cliente_nome: clienteNome,
        cliente_cnpj: clienteCnpj || null,
        entidade_contratante: entidade,
        entidade_contratante_outra: entidade === 'outra' ? entidadeOutra : null,
        fase,
        numero_processo: numeroProcesso || null,
        numero_edital: numeroEdital || null,
        numero_contrato: numeroContrato || null,
        prazo_limite: prazoLimite || null,
      })
      .select()
      .single();

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    router.push(`/casos/${novoCaso.id}`);
  }

  return (
    <div className="min-h-screen">
      <AppHeader nomeUsuario={null} />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-serif text-2xl mb-1">Novo caso</h1>
        <p className="text-sm text-ink-700 mb-8">
          Identifique a fase e a entidade — isso define a fundamentação
          aplicável ao caso.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Cliente
            </label>
            <input
              type="text"
              required
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Razão social do licitante/contratado"
              className="w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              CNPJ <span className="text-ink-700 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={clienteCnpj}
              onChange={(e) => setClienteCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              className="w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Fase do caso
            </label>
            <select
              value={fase}
              onChange={(e) => setFase(e.target.value as FaseCaso)}
              className="w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
            >
              {Object.entries(ROTULO_FASE).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Entidade contratante
            </label>
            <select
              value={entidade}
              onChange={(e) =>
                setEntidade(e.target.value as EntidadeContratante)
              }
              className="w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
            >
              {Object.entries(ROTULO_ENTIDADE).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>

          {entidade === 'outra' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Nome da entidade
              </label>
              <input
                type="text"
                value={entidadeOutra}
                onChange={(e) => setEntidadeOutra(e.target.value)}
                placeholder="Ex: BNDES"
                className="w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Nº do processo
              </label>
              <input
                type="text"
                value={numeroProcesso}
                onChange={(e) => setNumeroProcesso(e.target.value)}
                className="w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Prazo limite
              </label>
              <input
                type="date"
                value={prazoLimite}
                onChange={(e) => setPrazoLimite(e.target.value)}
                className="w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Nº do edital
              </label>
              <input
                type="text"
                value={numeroEdital}
                onChange={(e) => setNumeroEdital(e.target.value)}
                className="w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Nº do contrato
              </label>
              <input
                type="text"
                value={numeroContrato}
                onChange={(e) => setNumeroContrato(e.target.value)}
                className="w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>

          {erro && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {erro}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={carregando}
              className="bg-ink-950 text-parchment-50 rounded-md px-5 py-2.5 text-sm font-medium hover:bg-ink-900 transition-colors disabled:opacity-50"
            >
              {carregando ? 'Salvando...' : 'Criar caso'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="text-ink-700 text-sm font-medium hover:text-ink-950 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
