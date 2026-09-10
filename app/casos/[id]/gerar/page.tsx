import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/AppHeader';
import { ROTULO_ENTIDADE } from '@/lib/rotulos';
import { GerarForm } from './gerar-form';

export default async function GerarPecaPage({
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

  const entidadeTxt =
    caso.entidade_contratante === 'outra'
      ? caso.entidade_contratante_outra || 'Outra estatal'
      : ROTULO_ENTIDADE[caso.entidade_contratante];

  return (
    <div className="min-h-screen">
      <AppHeader nomeUsuario={null} />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-serif text-2xl mb-1">Gerar peça</h1>
        <p className="text-sm text-ink-700 mb-8">
          {caso.cliente_nome} — {entidadeTxt}
        </p>
        <GerarForm
          casoId={caso.id}
          faseInicial={caso.fase}
          entidadeTxt={entidadeTxt}
        />
      </main>
    </div>
  );
}
