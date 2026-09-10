import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/AppHeader';
import {
  ROTULO_ENTIDADE,
  ROTULO_FASE,
  ROTULO_STATUS,
  COR_STATUS,
} from '@/lib/rotulos';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome')
    .eq('id', user!.id)
    .single();

  const { data: casos } = await supabase
    .from('casos_licitacao')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen">
      <AppHeader nomeUsuario={profile?.nome ?? user?.email ?? null} />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl">Casos de licitação</h1>
            <p className="text-sm text-ink-700 mt-1">
              {casos?.length ?? 0} caso{casos?.length === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            href="/casos/novo"
            className="bg-ink-950 text-parchment-50 rounded-md px-4 py-2 text-sm font-medium hover:bg-ink-900 transition-colors"
          >
            Novo caso
          </Link>
        </div>

        {!casos || casos.length === 0 ? (
          <EstadoVazio />
        ) : (
          <div className="border border-ink-800/10 rounded-lg divide-y divide-ink-800/10">
            {casos.map((caso) => (
              <Link
                key={caso.id}
                href={`/casos/${caso.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] transition-colors"
              >
                <div>
                  <p className="font-medium">{caso.cliente_nome}</p>
                  <p className="text-sm text-ink-700 mt-0.5">
                    {ROTULO_FASE[caso.fase]} — {ROTULO_ENTIDADE[caso.entidade_contratante]}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {caso.prazo_limite && (
                    <span className="text-sm text-ink-700">
                      Prazo: {formatarData(caso.prazo_limite)}
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${COR_STATUS[caso.status]}`}
                  >
                    {ROTULO_STATUS[caso.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EstadoVazio() {
  return (
    <div className="border border-dashed border-ink-800/20 rounded-lg py-16 text-center">
      <p className="text-ink-700 mb-4">Nenhum caso cadastrado ainda.</p>
      <Link
        href="/casos/novo"
        className="text-gold-600 font-medium hover:underline text-sm"
      >
        Cadastrar o primeiro caso
      </Link>
    </div>
  );
}

function formatarData(dataISO: string): string {
  return new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');
}
