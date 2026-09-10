import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = [
  { id: 'erp', nome: 'ERP Falco', desc: 'Executive Legal Luxury — ônix & ouro' },
  { id: 'editorial', nome: 'Editorial', desc: 'Papel, serifa literária, filetes finos' },
  { id: 'precisao', nome: 'Precisão', desc: 'Neutro frio, tabela densa, numerais mono' },
  { id: 'chancelaria', nome: 'Chancelaria', desc: 'Grafite profundo, latão, painéis elevados' },
];
const IDS = THEMES.map((t) => t.id);

const ThemeCtx = createContext(null);

function lerInicial() {
  const root = document.documentElement;
  let theme = root.getAttribute('data-theme');
  if (!IDS.includes(theme)) theme = 'erp';
  const mode = root.classList.contains('light') ? 'light' : 'dark';
  return { theme, mode };
}

export function ThemeProvider({ children }) {
  const [{ theme, mode }, setState] = useState(lerInicial);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.remove('dark', 'light');
    root.classList.add(mode);
    root.style.colorScheme = mode;
    try {
      localStorage.setItem('falco_theme', theme);
      localStorage.setItem('falco_mode', mode);
    } catch {
      /* noop */
    }
  }, [theme, mode]);

  const value = {
    theme,
    mode,
    themes: THEMES,
    setTheme: (t) => IDS.includes(t) && setState((s) => ({ ...s, theme: t })),
    setMode: (m) => setState((s) => ({ ...s, mode: m === 'light' ? 'light' : 'dark' })),
    toggleMode: () => setState((s) => ({ ...s, mode: s.mode === 'dark' ? 'light' : 'dark' })),
  };
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme fora do ThemeProvider');
  return ctx;
}
