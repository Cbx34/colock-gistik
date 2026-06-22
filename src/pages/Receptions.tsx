import { Check, ClipboardList, PackagePlus } from 'lucide-react';

const arrivals = [
  { id: 'REC-2406', supplier: 'Colock Packaging', dock: 'Quai 1', state: 'Déchargement' },
  { id: 'REC-2407', supplier: 'Orange Supply', dock: 'Quai 3', state: 'Contrôle qualité' },
  { id: 'REC-2408', supplier: 'Box Partner', dock: 'Attente', state: 'Planifiée' },
];

export default function Receptions() {
  return (
    <section className="module-page">
      <div className="module-actions">
        <button><PackagePlus /> Nouvelle réception</button>
        <button className="secondary"><ClipboardList /> Liste d'attente</button>
      </div>
      <div className="data-list">
        {arrivals.map((arrival) => <article className="data-row" key={arrival.id}><strong>{arrival.id}</strong><span>{arrival.supplier}</span><span>{arrival.dock}</span><em>{arrival.state}</em><Check /></article>)}
      </div>
    </section>
  );
}
