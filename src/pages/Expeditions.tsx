import { FileCheck2, Send, Truck } from 'lucide-react';

const departures = [
  { id: 'EXP-7751', carrier: 'ExpressNord', slots: '16:30', parcels: 96 },
  { id: 'EXP-7752', carrier: 'ChronoBox', slots: '17:10', parcels: 142 },
  { id: 'EXP-7753', carrier: 'GreenLine', slots: '18:00', parcels: 54 },
];

export default function Expeditions() {
  return (
    <section className="module-page">
      <div className="module-actions"><button><Send /> Créer expédition</button><button className="secondary"><FileCheck2 /> Documents</button></div>
      <div className="data-list">
        {departures.map((departure) => <article className="data-row" key={departure.id}><strong>{departure.id}</strong><span><Truck size={18} /> {departure.carrier}</span><span>Départ {departure.slots}</span><em>{departure.parcels} colis</em></article>)}
      </div>
    </section>
  );
}
