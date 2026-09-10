import { useState, useRef, useEffect } from 'react';
import { Palette, Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';

export default function ThemeMenu() {
  const { theme, mode, themes, setTheme, toggleMode } = useTheme();
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function fora(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, []);

  const atual = themes.find((t) => t.id === theme);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setAberto((v) => !v)}
          className="btn btn-ghost !px-2.5 !py-1.5 !text-xs"
          title="Trocar tema"
        >
          <Palette size={14} />
          <span className="hidden sm:inline">{atual?.nome}</span>
        </button>
        <button
          onClick={toggleMode}
          className="btn btn-ghost !px-2 !py-1.5"
          title={mode === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {mode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {aberto && (
        <div className="panel absolute right-0 mt-2 w-64 p-1.5 z-50 shadow-xl">
          <div className="field-label px-2 pt-1.5 !mb-1">Tema</div>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setAberto(false);
              }}
              className="w-full text-left px-2.5 py-2 rounded-[calc(var(--radius)*0.7)] hover:bg-accent/10 transition-colors flex items-start gap-2"
            >
              <span className="w-4 shrink-0 pt-0.5 text-accent">
                {t.id === theme && <Check size={14} />}
              </span>
              <span>
                <span className="block text-sm font-medium text-main">{t.nome}</span>
                <span className="block text-[11px] text-muted-text leading-snug">{t.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
