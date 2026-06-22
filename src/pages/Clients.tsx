import { Mail, Phone, Users } from 'lucide-react';

const clients = [
  { name: 'Urban Shop', sla: 'J+1', contact: 'Nadia Martin', volume: '1 240 colis/mois' },
  { name: 'Médical Est', sla: 'Prioritaire', contact: 'Samir Lopez', volume: '430 colis/mois' },
  { name: 'Retail Sud', sla: 'J+2', contact: 'Claire Moreau', volume: '980 colis/mois' },
];

export default function Clients() {
  return (
    <section className="module-page">
      <div className="module-actions"><button><Users /> Nouveau client</button><button className="secondary"><Mail /> Message groupé</button></div>
      <div className="card-grid">
        {clients.map((client) => <article className="work-card client-card" key={client.name}><strong>{client.name}</strong><span>SLA {client.sla}</span><p>{client.volume}</p><small><Phone size={15} /> {client.contact}</small></article>)}
      </div>
    </section>
  );
}
