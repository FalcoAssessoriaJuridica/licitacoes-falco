import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { getCaso, listarPecas } from '../services/dados.js';
import { ROTULO_FASE, nomeEntidade, formatarData } from '../lib/rotulos.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function CasoDetalhe() {
  const { id } = useParams();
  const [caso, setCaso] = useState(null);
  const [pecas, setPecas] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    getCaso(id).then(setCaso).catch((e) => setErro(e.message));
    listarPecas(id).then(setPecas).catch(() => {});
  }, [id]);

  if (erro) return <p className="card p-6 text-sm text-st-warn">{erro}</p>;
  if (!caso) return <p className="text-sm text-muted-text">Carregando…</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-muted-text hover:text-main flex items-center gap-1.5 mb-4">
        <ArrowLeft size={14} /> Casos
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title text-2xl">{caso.cliente_nome}</h1>
          <p className="text-sm text-muted-text mt-1">
            {ROTULO_FASE[caso.fase]} — {nomeEntidade(caso)}
          </p>
        </div>
        <StatusBadge status={caso.status} />
      </div>

      <div className="card p-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm mb-8">
        <Campo label="CNPJ" valor={caso.cliente_cnpj} />
        <Campo label="Prazo limite" valor={caso.prazo_limite ? formatarData(caso.prazo_limite) : null} />
        <Campo label="Nº do processo" valor={caso.numero_processo} mono />
        <Campo label="Nº do edital" valor={caso.numero_edital} mono />
        <Campo label="Nº do contrato" valor={caso.numero_contrato} mono />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg text-main">Peças</h2>
        <Link to={`/casos/${caso.id}/gerar`} className="btn btn-primary">
          <Sparkles size={14} /> Gerar peça
        </Link>
      </div>

      {pecas.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted-text">
          Nenhuma peça gerada ainda. Use “Gerar peça” — o modelo que você configurou redige a
          partir do texto colado e da base de conhecimento do escritório.
        </div>
      ) : (
        <div className="card overflow-hidden">
          {pecas.map((p, i) => (
            <Link
              key={p.id}
              to={`/casos/${caso.id}/pecas/${p.id}`}
              className={`flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-accent/5 transition-colors ${
                i > 0 ? 'border-t border-card-border' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-main truncate">{p.titulo || `Versão ${p.versao}`}</p>
                <p className="text-xs text-muted-text mono">
                  {new Date(p.created_at).toLocaleString('pt-BR')}
                  {p.modelo_llm ? ` · ${p.modelo_llm}` : ''}
                </p>
              </div>
              <ArrowRight size={15} className="text-muted-text shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Campo({ label, valor, mono }) {
  return (
    <div>
      <p className="field-label !mb-0.5">{label}</p>
      <p className={mono ? 'mono text-main' : 'text-main'}>{valor || '—'}</p>
    </div>
  );
}
