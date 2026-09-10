'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function AppHeader({ nomeUsuario }: { nomeUsuario: string | null }) {
  const router = useRouter();
  const supabase = createClient();

  async function sair() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-ink-800/10 bg-parchment-50">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-serif text-lg">
          Falco — Licitações
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {nomeUsuario && <span className="text-ink-700">{nomeUsuario}</span>}
          <Link
            href="/configuracoes"
            className="text-ink-700 hover:text-ink-950 transition-colors"
          >
            Configurações
          </Link>
          <button
            onClick={sair}
            className="text-ink-700 hover:text-ink-950 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
