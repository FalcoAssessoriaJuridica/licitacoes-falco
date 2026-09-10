import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LayoutGrid, List, CalendarClock } from 'lucide-react';
import { listarCasos } from '../services/dados.js';
import { ROTULO_FASE, nomeEntidade, formatarData } from '../lib/rotulos.js';
import StatusBadge from '../components/StatusBadge.jsx';

const VIEW_KEY = 'falco_casos_view';

export default function Dashboard() {
  const [casos, setCasos] = useState(null);
  const [erro, setErro] = useState('');
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || 'cards');

  useEffect(() => {
    listarCasos().then(setCasos).catch((e) => setErro(e.message));
  }, []);

  function trocarView(v) {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="page-title text-3xl">Casos de licitação</h1>
          <p className="text-sm text-muted-text mt-1">
            {casos == null ? 'carregando…' : `${casos.length} caso${casos.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="panel flex p-0.5">
            <button
              onClick={() => trocarView('cards')}
              className={`btn !py-1.5 !px-2 ${view === 'cards' ? 'btn-primary' : 'btn-quiet'}`}
              title="Cartões"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => trocarView('list')}
              className={`btn !py-1.5 !px-2 ${view === 'list' ? 'btn-primary' : 'btn-quiet'}`}
              title="Lista"
            >
              <List size={14} />
            </button>
          </div>
          <Link to="/casos/novo" className="btn btn-primary">
            <Plus size={15} /> Novo caso
          </Link>
        </div>
      </div>

      {erro && <p className="card p-4 text-sm text-st-warn">{erro}</p>}

      {casos && casos.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-muted-text text-sm mb-4">Nenhum caso cadastrado ainda.</p>
          <Link to="/casos/novo" className="text-accent font-medium hover:underline text-sm">
            Cadastrar o primeiro caso
          </Link>
        </div>
      )}

      {casos && casos.length > 0 && view === 'cards' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {casos.map((c) => (
            <Link key={c.id} to={`/casos/${c.id}`} className="card card-interactive p-5 block">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg text-main leading-tight">{c.cliente_nome}</h3>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-xs text-muted-text mt-1.5">
                {ROTULO_FASE[c.fase]} · {nomeEntidade(c)}
              </p>
              {c.prazo_limite && (
                <p className="text-xs text-muted-text mt-3 flex items-center gap-1.5">
                  <CalendarClock size={13} /> Prazo {formatarData(c.prazo_limite)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {casos && casos.length > 0 && view === 'list' && (
        <div className="card overflow-hidden">
          {casos.map((c, i) => (
            <Link
              key={c.id}
              to={`/casos/${c.id}`}
              className={`flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-accent/5 transition-colors ${
                i > 0 ? 'border-t border-card-border' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-main truncate">{c.cliente_nome}</p>
                <p className="text-xs text-muted-text truncate">
                  {ROTULO_FASE[c.fase]} · {nomeEntidade(c)}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {c.prazo_limite && (
                  <span className="text-xs text-muted-text mono hidden sm:block">
                    {formatarData(c.prazo_limite)}
                  </span>
                )}
                <StatusBadge status={c.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
