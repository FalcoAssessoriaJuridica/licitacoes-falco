import { CLASSE_STATUS, ROTULO_STATUS } from '../lib/rotulos.js';

export default function StatusBadge({ status }) {
  return (
    <span className={CLASSE_STATUS[status] || 'badge badge-neutral'}>
      {ROTULO_STATUS[status] || status}
    </span>
  );
}
