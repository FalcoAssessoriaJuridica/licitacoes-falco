import { createClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/AppHeader';
import { FormConfiguracoes } from './form';

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: config } = await supabase
    .from('configuracoes_llm_usuario')
    .select('modelo_padrao, api_key_criptografada')
    .eq('user_id', user!.id)
    .maybeSingle();

  return (
    <div className="min-h-screen">
      <AppHeader nomeUsuario={user?.email ?? null} />
      <main className="max-w-xl mx-auto px-6 py-10">
        <h1 className="font-serif text-2xl mb-1">Configurações</h1>
        <p className="text-sm text-ink-700 mb-8">
          Chave da Anthropic usada para gerar as peças. Fica criptografada no
          banco e nunca é reexibida.
        </p>
        <FormConfiguracoes
          chaveConfigurada={Boolean(config?.api_key_criptografada)}
          modeloPadrao={config?.modelo_padrao ?? ''}
        />
      </main>
    </div>
  );
}
