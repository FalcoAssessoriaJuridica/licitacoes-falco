import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarCaso } from '../services/dados.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { FASES, ENTIDADES, ROTULO_FASE, ROTULO_ENTIDADE } from '../lib/rotulos.js';

export default function CasoNovo() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [f, setF] = useState({
    cliente_nome: '',
    cliente_cnpj: '',
    fase: 'recurso_sancao',
    entidade_contratante: 'caixa',
    entidade_contratante_outra: '',
    numero_processo: '',
    numero_edital: '',
    numero_contrato: '',
    prazo_limite: '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const caso = await criarCaso(user.id, f);
      nav(`/casos/${caso.id}`, { replace: true });
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="page-title text-2xl mb-1">Novo caso</h1>
      <p className="text-sm text-muted-text mb-7">
        A fase e a entidade definem o regime, o prazo e a fundamentação aplicável.
      </p>

      <form onSubmit={submit} className="card p-6 space-y-5">
        <div>
          <label className="field-label">Cliente</label>
          <input
            required
            className="input"
            value={f.cliente_nome}
            onChange={set('cliente_nome')}
            placeholder="Razão social do licitante/contratado"
          />
        </div>
        <div>
          <label className="field-label">CNPJ (opcional)</label>
          <input className="input" value={f.cliente_cnpj} onChange={set('cliente_cnpj')} placeholder="00.000.000/0000-00" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Fase do caso</label>
            <select className="input" value={f.fase} onChange={set('fase')}>
              {FASES.map((v) => (
                <option key={v} value={v}>
                  {ROTULO_FASE[v]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Entidade contratante</label>
            <select className="input" value={f.entidade_contratante} onChange={set('entidade_contratante')}>
              {ENTIDADES.map((v) => (
                <option key={v} value={v}>
                  {ROTULO_ENTIDADE[v]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {f.entidade_contratante === 'outra' && (
          <div>
            <label className="field-label">Nome da entidade</label>
            <input
              className="input"
              value={f.entidade_contratante_outra}
              onChange={set('entidade_contratante_outra')}
              placeholder="Ex.: BNDES"
            />
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Nº do processo</label>
            <input className="input mono" value={f.numero_processo} onChange={set('numero_processo')} />
          </div>
          <div>
            <label className="field-label">Prazo limite</label>
            <input type="date" className="input mono" value={f.prazo_limite} onChange={set('prazo_limite')} />
          </div>
          <div>
            <label className="field-label">Nº do edital</label>
            <input className="input mono" value={f.numero_edital} onChange={set('numero_edital')} />
          </div>
          <div>
            <label className="field-label">Nº do contrato</label>
            <input className="input mono" value={f.numero_contrato} onChange={set('numero_contrato')} />
          </div>
        </div>

        {erro && <p className="badge badge-warn !rounded-[var(--radius)] !normal-case !tracking-normal !py-2 w-full">{erro}</p>}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={salvando} className="btn btn-primary">
            {salvando ? 'Salvando…' : 'Criar caso'}
          </button>
          <button type="button" onClick={() => nav('/')} className="btn btn-quiet">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
