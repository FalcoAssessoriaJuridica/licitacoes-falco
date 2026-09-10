import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { supabase } from '../services/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import ThemeMenu from '../components/ThemeMenu.jsx';

export default function Login() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [modo, setModo] = useState('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeEscritorio, setNomeEscritorio] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  if (user) {
    nav('/', { replace: true });
    return null;
  }

  async function google() {
    setErro('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setErro(traduz(error.message));
  }

  async function submit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const acao =
      modo === 'entrar'
        ? supabase.auth.signInWithPassword({ email, password: senha })
        : supabase.auth.signUp({
            email,
            password: senha,
            options: { data: { nome_escritorio: nomeEscritorio || undefined } },
          });
    const { error } = await acao;
    setCarregando(false);
    if (error) return setErro(traduz(error.message));
    nav('/', { replace: true });
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 panel !rounded-none !border-y-0 !border-l-0 flex-col justify-between p-14">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-[calc(var(--radius)*0.7)] grid place-items-center bg-accent/12 border border-accent/30 text-accent">
            <Scale size={18} />
          </span>
          <span className="font-serif text-xl text-main">Falco Assessoria Jurídica</span>
        </div>
        <div className="max-w-md">
          <h1 className="page-title text-4xl leading-tight mb-5">
            Defesa de licitantes, do edital ao recurso.
          </h1>
          <p className="text-muted-text text-base leading-relaxed">
            Organize casos, gere peças fundamentadas e acompanhe prazos em processos de
            licitação — CAIXA, Banco do Brasil, Petrobras, Correios e órgãos públicos.
          </p>
        </div>
        <p className="text-xs text-dim-text mono">Rua Campo Grande, 1014 — Rio de Janeiro</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-8">
            <span className="font-serif text-lg text-main lg:hidden">Falco — Licitações</span>
            <div className="ml-auto">
              <ThemeMenu />
            </div>
          </div>

          <h2 className="page-title text-2xl mb-1">
            {modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </h2>
          <p className="text-sm text-muted-text mb-7">
            {modo === 'entrar'
              ? 'Acesse sua plataforma de licitações.'
              : 'Configure seu escritório em um minuto.'}
          </p>

          <button onClick={google} className="btn btn-ghost w-full mb-5">
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-panel-border" />
            <span className="text-[11px] text-dim-text uppercase tracking-wider">ou</span>
            <div className="h-px flex-1 bg-panel-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {modo === 'cadastrar' && (
              <div>
                <label className="field-label">Nome do escritório</label>
                <input
                  className="input"
                  value={nomeEscritorio}
                  onChange={(e) => setNomeEscritorio(e.target.value)}
                  placeholder="Falco Assessoria Jurídica"
                />
              </div>
            )}
            <div>
              <label className="field-label">E-mail</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@escritorio.com.br"
              />
            </div>
            <div>
              <label className="field-label">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                className="input"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {erro && (
              <p className="text-sm badge badge-warn !rounded-[var(--radius)] !normal-case !tracking-normal !py-2 w-full">
                {erro}
              </p>
            )}

            <button type="submit" disabled={carregando} className="btn btn-primary w-full">
              {carregando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="text-sm text-muted-text mt-6 text-center">
            {modo === 'entrar' ? 'Ainda não tem conta? ' : 'Já tem conta? '}
            <button
              onClick={() => setModo(modo === 'entrar' ? 'cadastrar' : 'entrar')}
              className="text-accent font-medium hover:underline"
            >
              {modo === 'entrar' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function traduz(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered')) return 'Este e-mail já tem conta. Faça login.';
  if (m.includes('password')) return 'Senha inválida (mínimo 6 caracteres).';
  return msg;
}
