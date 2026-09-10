import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // erro claro e cedo em vez de "app estranho" depois
  console.error(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não definidos. Configure o .env (ou as variáveis do serviço no EasyPanel).',
  );
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
