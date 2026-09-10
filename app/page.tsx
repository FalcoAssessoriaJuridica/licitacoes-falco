import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const temCookieSupabase = allCookies.some(
    (c) => c.name.startsWith('sb-') || c.name.includes('auth-token')
  );

  if (!temCookieSupabase) {
    redirect('/login');
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    redirect(user ? '/dashboard' : '/login');
  } catch {
    redirect('/login');
  }
}
