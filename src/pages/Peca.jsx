import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getPeca } from '../services/dados.js';
import CopyButton from '../components/CopyButton.jsx';

export default function Peca() {
  const { id, pecaId } = useParams();
  const [peca, setPeca] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    getPeca(id, pecaId).then(setPeca).catch((e) => setErro(e.message));
  }, [id, pecaId]);

  if (erro) return <p className="card p-6 text-sm text-st-warn">{erro}</p>;
  if (!peca) return <p className="text-sm text-muted-text">Carregando…</p>;

  const tokens = (peca.tokens_entrada || 0) + (peca.tokens_saida || 0);

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/casos/${id}`}
        className="text-sm text-muted-text hover:text-main flex items-center gap-1.5 mb-4"
      >
        <ArrowLeft size={14} /> Voltar ao caso
      </Link>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="page-title text-2xl">{peca.titulo || `Peça — versão ${peca.versao}`}</h1>
          <p className="text-xs text-muted-text mono mt-1">
            {new Date(peca.created_at).toLocaleString('pt-BR')} ·{' '}
            {peca.modelo_llm || peca.provedor_llm || 'modelo'}
            {tokens > 0 && ` · ${tokens.toLocaleString('pt-BR')} tokens`}
          </p>
        </div>
        <CopyButton texto={peca.conteudo} />
      </div>

      <article className="card p-6">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-main">
          {peca.conteudo}
        </pre>
      </article>

      <details className="mt-6 text-sm">
        <summary className="cursor-pointer text-muted-text hover:text-main">
          Ver o prompt usado (auditoria)
        </summary>
        <pre className="mt-3 whitespace-pre-wrap mono text-xs text-muted-text card p-4 max-h-96 overflow-auto">
          {peca.prompt_usado || '—'}
        </pre>
      </details>
    </div>
  );
}
