import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Cliente Supabase para uso em Server Components, Route Handlers e
 * Server Actions. Lê/escreve a sessão via cookies do Next.js.
 *
 * IMPORTANTE: chamar de novo (não reaproveitar uma instância global) a
 * cada requisição — cada requisição tem seus próprios cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll foi chamado de um Server Component (não Route Handler
            // ou Server Action). Isso é esperado se houver um middleware
            // atualizando a sessão — pode ser ignorado com segurança aqui.
          }
        },
      },
    }
  );
}
