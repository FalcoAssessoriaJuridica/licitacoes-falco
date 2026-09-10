import { Link, NavLink, Outlet } from 'react-router-dom';
import { Scale, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import ThemeMenu from './ThemeMenu.jsx';

export default function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="panel !rounded-none !border-x-0 !border-t-0 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-[calc(var(--radius)*0.7)] grid place-items-center bg-accent/12 border border-accent/30 text-accent">
              <Scale size={16} />
            </span>
            <span className="font-serif text-lg text-main leading-none">
              Falco <span className="text-muted-text">— Licitações</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:block text-xs text-muted-text mono">{user?.email}</span>
            <ThemeMenu />
            <NavLink
              to="/configuracoes"
              className={({ isActive }) =>
                `btn btn-quiet !px-2 !py-1.5 ${isActive ? '!text-accent' : ''}`
              }
              title="Configurações"
            >
              <Settings size={15} />
            </NavLink>
            <button onClick={signOut} className="btn btn-quiet !px-2 !py-1.5" title="Sair">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
