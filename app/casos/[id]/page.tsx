import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/AppHeader';
import {
  ROTULO_ENTIDADE,
  ROTULO_FASE,
  ROTULO_STATUS,
  COR_STATUS,
} from '@/lib/rotulos';

export default async function DetalheCasoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: caso } = await supabase
    .from('casos_licitacao')
    .select('*')
    .eq('id', id)
    .single();

  if (!caso) notFound();

  const { data: pecas } = await supabase
    .from('pecas_geradas')
    .select('*')
    .eq('caso_id', id)
    .order('versao', { ascending: false });

  return (
    <div className="min-h-screen">
      <AppHeader nomeUsuario={null} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl">{caso.cliente_nome}</h1>
            <p className="text-sm text-ink-700 mt-1">
              {ROTULO_FASE[caso.fase]} —{' '}
              {caso.entidade_contratante === 'outra'
                ? caso.entidade_contratante_outra
                : ROTULO_ENTIDADE[caso.entidade_contratante]}
            </p>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${COR_STATUS[caso.status]}`}
          >
            {ROTULO_STATUS[caso.status]}
          </span>
        </div>

        <div className="border border-ink-800/10 rounded-lg p-5 mb-8 grid grid-cols-2 gap-4 text-sm">
          <Campo label="CNPJ" valor={caso.cliente_cnpj} />
          <Campo label="Prazo limite" valor={caso.prazo_limite ? formatarData(caso.prazo_limite) : null} />
          <Campo label="Nº do processo" valor={caso.numero_processo} />
          <Campo label="Nº do edital" valor={caso.numero_edital} />
          <Campo label="Nº do contrato" valor={caso.numero_contrato} />
        </div>

        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-lg">Peças</h2>
          <Link
            href={`/casos/${caso.id}/gerar`}
            className="bg-ink-950 text-parchment-50 rounded-md px-4 py-2 text-sm font-medium hover:bg-ink-900 transition-colors"
          >
            Gerar peça
          </Link>
        </div>

        {!pecas || pecas.length === 0 ? (
          <div className="border border-dashed border-ink-800/20 rounded-lg p-8 text-center mb-8">
            <p className="text-ink-700 text-sm">
              Nenhuma peça gerada ainda. Use “Gerar peça” — a Claude redige a
              partir do texto que você colar e da base de conhecimento do
              escritório.
            </p>
          </div>
        ) : (
          <div className="border border-ink-800/10 rounded-lg divide-y divide-ink-800/10">
            {pecas.map((peca) => (
              <Link
                key={peca.id}
                href={`/casos/${caso.id}/pecas/${peca.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">
                    {peca.titulo ?? `Versão ${peca.versao}`}
                  </p>
                  <p className="text-xs text-ink-700">
                    {new Date(peca.created_at).toLocaleString('pt-BR')}
                    {peca.modelo_llm ? ` · ${peca.modelo_llm}` : ''}
                  </p>
                </div>
                <span className="text-ink-700 text-sm">→</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div>
      <p className="text-ink-700 text-xs mb-0.5">{label}</p>
      <p>{valor || '—'}</p>
    </div>
  );
}

function formatarData(dataISO: string): string {
  return new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');
}
