import { ClipboardCheck, ScanLine } from 'lucide-react';

const waves = [
  { id: 'VAG-09', client: 'Urban Shop', orders: 28, progress: '78%' },
  { id: 'VAG-10', client: 'Médical Est', orders: 14, progress: '45%' },
  { id: 'VAG-11', client: 'Retail Sud', orders: 33, progress: '12%' },
];

export default function Preparations() {
  return (
    <section className="module-page">
      <div className="module-actions"><button><ClipboardCheck /> Lancer une vague</button><button className="secondary"><ScanLine /> Scanner colis</button></div>
      <div className="card-grid">
        {waves.map((wave) => <article className="work-card" key={wave.id}><strong>{wave.id}</strong><span>{wave.client}</span><p>{wave.orders} commandes</p><div className="progress"><i style={{ width: wave.progress }} /></div><em>{wave.progress}</em></article>)}
      </div>
    </section>
  );
}
