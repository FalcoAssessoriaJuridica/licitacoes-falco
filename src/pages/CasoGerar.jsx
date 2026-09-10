import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Sparkles, ArrowLeft, TriangleAlert } from 'lucide-react';
import { getCaso, getBaseConhecimento, getConfigLlm, salvarPeca } from '../services/dados.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { FASES, ROTULO_FASE, nomeEntidade } from '../lib/rotulos.js';
import {
  selecionarConhecimento,
  montarSystem,
  montarConteudoUsuario,
} from '../lib/prompts/montar.js';
import { gerarPeca } from '../lib/llm/index.js';

const ROTULO_FASE_CURTO = {
  impugnacao_edital: 'Impugnação de edital',
  recurso_habilitacao: 'Recurso — habilitação',
  recurso_sancao: 'Recurso — sanção',
  mandado_seguranca: 'Mandado de Segurança',
};

export default function CasoGerar() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [caso, setCaso] = useState(null);
  const [cfg, setCfg] = useState(undefined); // undefined = carregando
  const [fase, setFase] = useState('');
  const [textoBase, setTextoBase] = useState('');
  const [dataCiencia, setDataCiencia] = useState('');
  const [prazoIndicado, setPrazoIndicado] = useState('');
  const [instrucoes, setInstrucoes] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    getCaso(id).then((c) => {
      setCaso(c);
      setFase(c.fase);
    });
    getConfigLlm(user.id).then(setCfg);
  }, [id, user.id]);

  const cfgOk = cfg && cfg.formato && cfg.base_url && cfg.modelo;
  const podeGerar = !gerando && cfgOk && textoBase.trim().length > 20;

  async function gerar(e) {
    e.preventDefault();
    setErro('');
    setGerando(true);
    try {
      const linhas = await getBaseConhecimento();
      const selec = selecionarConhecimento(linhas, caso.entidade_contratante, fase);
      const system = montarSystem(selec);
      const userContent = montarConteudoUsuario({
        caso,
        fase,
        textoBase,
        instrucoes,
        dataCiencia: dataCiencia || null,
        prazoIndicado: prazoIndicado || null,
      });

      const r = await gerarPeca(cfg, { system, user: userContent });

      const peca = await salvarPeca(user.id, caso.id, {
        titulo: `${ROTULO_FASE_CURTO[fase]}`,
        fase,
        entidade: caso.entidade_contratante,
        conteudo: r.texto,
        provedor_llm: cfg.formato,
        modelo_llm: r.modelo,
        prompt_usado: `## SYSTEM\n\n${system}\n\n## USER\n\n${userContent}`,
        tokens_entrada: r.uso?.entrada ?? null,
        tokens_saida: r.uso?.saida ?? null,
      });
      nav(`/casos/${caso.id}/pecas/${peca.id}`, { replace: true });
    } catch (err) {
      setErro(err.message || 'Falha ao gerar a peça.');
      setGerando(false);
    }
  }

  if (!caso) return <p className="text-sm text-muted-text">Carregando…</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={`/casos/${id}`}
        className="text-sm text-muted-text hover:text-main flex items-center gap-1.5 mb-4"
      >
        <ArrowLeft size={14} /> {caso.cliente_nome}
      </Link>
      <h1 className="page-title text-2xl mb-1">Gerar peça</h1>
      <p className="text-sm text-muted-text mb-6">
        {caso.cliente_nome} — {nomeEntidade(caso)}
      </p>

      {cfg !== undefined && !cfgOk && (
        <div className="card p-4 mb-6 flex items-start gap-3 text-sm">
          <TriangleAlert size={16} className="text-st-warn shrink-0 mt-0.5" />
          <span className="text-muted-text">
            Nenhum provedor de IA configurado.{' '}
            <Link to="/configuracoes" className="text-accent hover:underline">
              Configure em Configurações
            </Link>{' '}
            (API, OpenRouter, ou um modelo local/no seu servidor) antes de gerar.
          </span>
        </div>
      )}

      <form onSubmit={gerar} className="card p-6 space-y-5">
        <div>
          <label className="field-label">Fase</label>
          <select className="input" value={fase} onChange={(e) => setFase(e.target.value)}>
            {FASES.map((v) => (
              <option key={v} value={v}>
                {ROTULO_FASE[v]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-text mt-1">
            Entidade: <strong className="text-main">{nomeEntidade(caso)}</strong> (definida no
            caso). Dela saem o regime, o prazo e o efeito suspensivo.
          </p>
        </div>

        <div>
          <label className="field-label">Documento / contexto</label>
          <textarea
            required
            rows={11}
            className="input mono !text-[13px]"
            value={textoBase}
            onChange={(e) => setTextoBase(e.target.value)}
            placeholder="Cole o edital e a cláusula impugnada, ou a decisão do PAD / o auto de infração / a intimação — o texto que fundamenta a peça."
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Data da ciência do ato</label>
            <input
              type="date"
              className="input mono"
              value={dataCiencia}
              onChange={(e) => setDataCiencia(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Prazo indicado na intimação</label>
            <input
              className="input"
              value={prazoIndicado}
              onChange={(e) => setPrazoIndicado(e.target.value)}
              placeholder="ex.: 10 dias úteis (item 14.4 'c')"
            />
          </div>
        </div>

        <div>
          <label className="field-label">O que você precisa</label>
          <textarea
            rows={3}
            className="input"
            value={instrucoes}
            onChange={(e) => setInstrucoes(e.target.value)}
            placeholder="ex.: recorrer da inabilitação por CNDT positiva; ou: defender da suspensão de 2 anos, atraso justificado por chuvas."
          />
        </div>

        {erro && (
          <p className="badge badge-warn !rounded-[var(--radius)] !normal-case !tracking-normal !py-2 w-full break-words">
            {erro}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={!podeGerar} className="btn btn-primary">
            <Sparkles size={14} />
            {gerando ? 'Gerando… (pode levar 1 min)' : 'Gerar peça'}
          </button>
          <button type="button" onClick={() => nav(`/casos/${id}`)} className="btn btn-quiet">
            Cancelar
          </button>
        </div>
        {gerando && (
          <p className="text-xs text-muted-text">
            A peça é redigida pelo modelo que você configurou, chamado direto do seu navegador,
            com a base de conhecimento do escritório. Não feche a aba.
          </p>
        )}
      </form>
    </div>
  );
}
