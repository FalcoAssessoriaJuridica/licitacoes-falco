import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/AppHeader';
import { CopiarButton } from '@/components/CopiarButton';

export default async function PecaPage({
  params,
}: {
  params: Promise<{ id: string; pecaId: string }>;
}) {
  const { id, pecaId } = await params;
  const supabase = await createClient();

  const { data: peca } = await supabase
    .from('pecas_geradas')
    .select('*')
    .eq('id', pecaId)
    .eq('caso_id', id)
    .single();
  if (!peca) notFound();

  const tokens =
    (peca.tokens_entrada ?? 0) + (peca.tokens_saida ?? 0);

  return (
    <div className="min-h-screen">
      <AppHeader nomeUsuario={null} />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link
          href={`/casos/${id}`}
          className="text-sm text-ink-700 hover:text-ink-950"
        >
          ← Voltar ao caso
        </Link>

        <div className="flex items-start justify-between mt-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl">
              {peca.titulo ?? `Peça — versão ${peca.versao}`}
            </h1>
            <p className="text-xs text-ink-700 mt-1">
              {new Date(peca.created_at).toLocaleString('pt-BR')} ·{' '}
              {peca.modelo_llm ?? peca.provedor_llm ?? 'llm'}
              {tokens > 0 && ` · ${tokens.toLocaleString('pt-BR')} tokens`}
            </p>
          </div>
          <CopiarButton texto={peca.conteudo} />
        </div>

        <article className="border border-ink-800/10 rounded-lg bg-white p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-950">
            {peca.conteudo}
          </pre>
        </article>

        <details className="mt-6 text-sm">
          <summary className="cursor-pointer text-ink-700 hover:text-ink-950">
            Ver o prompt usado (auditoria)
          </summary>
          <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-ink-700 border border-ink-800/10 rounded-lg p-4 bg-parchment-100 max-h-96 overflow-auto">
            {peca.prompt_usado ?? '—'}
          </pre>
        </details>
      </main>
    </div>
  );
}
