import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Recebe o redirecionamento do provedor OAuth (Google) após login,
 * troca o código de autorização pela sessão, e redireciona ao dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=callback_falhou`);
}
