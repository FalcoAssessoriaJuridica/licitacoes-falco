import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ texto, label = 'Copiar texto' }) {
  const [ok, setOk] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    } catch {
      /* clipboard indisponível */
    }
  }
  return (
    <button onClick={copiar} className="btn btn-ghost !py-1.5 !text-xs">
      {ok ? <Check size={13} /> : <Copy size={13} />}
      {ok ? 'Copiado' : label}
    </button>
  );
}
