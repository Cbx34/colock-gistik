import { History as HistoryIcon } from 'lucide-react';

const events = [
  { time: '08:12', event: 'Réception REC-2406 validée par Léa' },
  { time: '09:38', event: 'Stock CBOX-M ajusté après inventaire flash' },
  { time: '11:05', event: 'Commande CMD-88421 passée en contrôle qualité' },
  { time: '13:44', event: 'Expédition EXP-7751 affectée à ExpressNord' },
];

export default function History() {
  return (
    <section className="module-page">
      <div className="panel-title"><HistoryIcon /><h3>Journal opérationnel</h3></div>
      <div className="timeline history-list">
        {events.map((event) => <div key={`${event.time}-${event.event}`}><strong>{event.time}</strong><span>{event.event}</span></div>)}
      </div>
    </section>
  );
}
