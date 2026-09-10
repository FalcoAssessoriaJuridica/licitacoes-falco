'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Modo = 'entrar' | 'cadastrar';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeEscritorio, setNomeEscritorio] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrarComGoogle() {
    setErro(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) setErro(error.message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      if (error) {
        setErro(traduzErro(error.message));
        setCarregando(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome_escritorio: nomeEscritorio || undefined },
        },
      });
      if (error) {
        setErro(traduzErro(error.message));
        setCarregando(false);
        return;
      }
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Coluna de contexto — só aparece em telas maiores */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink-950 text-parchment-50 flex-col justify-between p-16">
        <div>
          <p className="font-serif text-2xl tracking-tight">Falco Assessoria Jurídica</p>
        </div>
        <div className="max-w-md">
          <h1 className="font-serif text-4xl leading-tight mb-6">
            Defesa de licitantes, do edital ao recurso.
          </h1>
          <p className="text-ink-700 text-lg leading-relaxed" style={{ color: '#94a3ad' }}>
            Organize casos, gere peças fundamentadas e acompanhe prazos em
            processos de licitação — CAIXA, Banco do Brasil, Petrobras,
            Correios e órgãos públicos.
          </p>
        </div>
        <p className="text-sm" style={{ color: '#5c7180' }}>
          Rua Campo Grande, 1014 — Rio de Janeiro
        </p>
      </div>

      {/* Coluna do formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <p className="font-serif text-xl">Falco Assessoria Jurídica</p>
          </div>

          <h2 className="font-serif text-2xl mb-1">
            {modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </h2>
          <p className="text-sm text-ink-700 mb-8">
            {modo === 'entrar'
              ? 'Acesse sua plataforma de licitações.'
              : 'Configure seu escritório em um minuto.'}
          </p>

          <button
            onClick={entrarComGoogle}
            className="w-full flex items-center justify-center gap-3 border border-ink-800/20 rounded-md py-2.5 text-sm font-medium hover:bg-black/5 transition-colors mb-6"
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-ink-800/15" />
            <span className="text-xs text-ink-700">ou</span>
            <div className="h-px flex-1 bg-ink-800/15" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'cadastrar' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Nome do escritório
                </label>
                <input
                  type="text"
                  value={nomeEscritorio}
                  onChange={(e) => setNomeEscritorio(e.target.value)}
                  placeholder="Falco Assessoria Jurídica"
                  className="w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@escritorio.com.br"
                className="w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-ink-800/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            {erro && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-ink-950 text-parchment-50 rounded-md py-2.5 text-sm font-medium hover:bg-ink-900 transition-colors disabled:opacity-50"
            >
              {carregando
                ? 'Aguarde...'
                : modo === 'entrar'
                  ? 'Entrar'
                  : 'Criar conta'}
            </button>
          </form>

          <p className="text-sm text-ink-700 mt-6 text-center">
            {modo === 'entrar' ? (
              <>
                Ainda não tem conta?{' '}
                <button
                  onClick={() => setModo('cadastrar')}
                  className="text-gold-600 font-medium hover:underline"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem conta?{' '}
                <button
                  onClick={() => setModo('entrar')}
                  className="text-gold-600 font-medium hover:underline"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function traduzErro(mensagem: string): string {
  if (mensagem.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (mensagem.includes('User already registered')) {
    return 'Já existe uma conta com este e-mail.';
  }
  return mensagem;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}
