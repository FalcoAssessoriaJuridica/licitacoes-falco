import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Mantém a sessão do Supabase sincronizada a cada requisição e redireciona
 * usuários não autenticados para /login quando tentam acessar rotas
 * protegidas (tudo, exceto /login, /auth e assets estáticos).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const rotaPublica =
    pathname.startsWith('/login') || pathname.startsWith('/auth');

  if (!user && !rotaPublica) {
    // API responde 401 em JSON; páginas redirecionam para o login.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'nao_autenticado', message: 'Faça login.' } },
        { status: 401 }
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
