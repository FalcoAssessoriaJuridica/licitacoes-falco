import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Mantém a sessão do Supabase sincronizada a cada requisição e redireciona
 * usuários não autenticados para /login quando tentam acessar rotas
 * protegidas (tudo, exceto /login, /auth e assets estáticos).
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rotaPublica =
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname === '/favicon.ico';

  // Se já está em rota pública, não bloqueia nem faz requisições extras
  if (rotaPublica) {
    return NextResponse.next({ request });
  }

  // Verifica se há algum cookie do Supabase presente
  const allCookies = request.cookies.getAll();
  const temCookieSupabase = allCookies.some(
    (c) => c.name.startsWith('sb-') || c.name.includes('auth-token')
  );

  // Se não tem cookie de autenticação, redireciona para login direto sem roundtrip
  if (!temCookieSupabase) {
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

  let supabaseResponse = NextResponse.next({ request });

  try {
    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://djzlxcllzznrjqbtgnen.supabase.co';
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

    const supabase = createServerClient(
      url,
      anonKey,
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

    if (!user) {
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
  } catch (err) {
    console.error('Erro na verificação de sessão no middleware:', err);
  }

  return supabaseResponse;
}
