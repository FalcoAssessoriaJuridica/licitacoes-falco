'use client';

import { useState } from 'react';

export function CopiarButton({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível — ignora */
    }
  }

  return (
    <button
      onClick={copiar}
      className="text-sm font-medium text-gold-600 hover:underline"
    >
      {copiado ? 'Copiado ✓' : 'Copiar texto'}
    </button>
  );
}
