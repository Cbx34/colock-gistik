import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, PackageCheck, Route, Warehouse } from 'lucide-react';

const indicators = [
  { label: 'Commandes du jour', value: '248', trend: '+18%', icon: PackageCheck },
  { label: 'Taux de service', value: '97,4%', trend: 'SLA OK', icon: CheckCircle2 },
  { label: 'Quais occupés', value: '12/16', trend: '75%', icon: Warehouse },
  { label: 'Tournées actives', value: '34', trend: '6 urgentes', icon: Route },
];

const priorities = ['Réception fournisseur OX-884 à contrôler', 'Rupture proche : Carton CBOX-M', 'Départ Chrono 16:30 à fermer'];

export default function Dashboard() {
  return (
    <div className="page-grid">
      <section className="hero-card orange-hero">
        <div>
          <span className="pill">Plateforme complète</span>
          <h2>Votre tour de contrôle logistique Colock-Box.</h2>
          <p>Une application métier claire pour piloter les flux entrants, le stock, les préparations, les expéditions et la relation client.</p>
        </div>
        <a className="big-action" href="#receptions">Démarrer une réception <ArrowRight size={22} /></a>
      </section>

      <section className="stats-grid">
        {indicators.map((indicator) => {
          const Icon = indicator.icon;
          return <article className="stat-card" key={indicator.label}><Icon /><span>{indicator.label}</span><strong>{indicator.value}</strong><small>{indicator.trend}</small></article>;
        })}
      </section>

      <section className="panel wide-panel">
        <div className="panel-title"><Clock3 /><h3>Flux en cours</h3></div>
        <div className="timeline">
          <div><strong>08:10</strong><span>Dock 2 · 18 palettes reçues</span></div>
          <div><strong>10:45</strong><span>Vague B2B · 42 colis en picking</span></div>
          <div><strong>14:20</strong><span>Transporteur ExpressNord annoncé</span></div>
        </div>
      </section>

      <aside className="panel alert-panel">
        <div className="panel-title"><AlertTriangle /><h3>Priorités</h3></div>
        {priorities.map((priority) => <p className="alert-line" key={priority}>{priority}</p>)}
      </aside>
    </div>
  );
}
