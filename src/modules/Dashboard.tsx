import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, PackageCheck, Route, Warehouse } from 'lucide-react';
import DataState from '../components/DataState';
import { useSupabaseTable } from '../lib/useSupabaseTable';
import { asText, recordKey, TABLES } from '../lib/supabase';

export default function Dashboard() {
  const commandes = useSupabaseTable(TABLES.commandes);
  const receptions = useSupabaseTable(TABLES.receptions);
  const produits = useSupabaseTable(TABLES.produits);
  const expeditions = useSupabaseTable(TABLES.expeditions);
  const loading = [commandes, receptions, produits, expeditions].some((state) => state.loading);
  const error = [commandes, receptions, produits, expeditions].find((state) => state.error)?.error ?? null;
  const indicators = [
    { label: 'Commandes Supabase', value: commandes.rows.length, trend: 'table commandes', icon: PackageCheck },
    { label: 'Réceptions', value: receptions.rows.length, trend: 'table receptions', icon: Warehouse },
    { label: 'Produits en stock', value: produits.rows.length, trend: 'table produits', icon: CheckCircle2 },
    { label: 'Expéditions', value: expeditions.rows.length, trend: 'table expeditions', icon: Route },
  ];
  const events = [...receptions.rows.slice(0, 2).map((row) => ({ table: 'Réception', row })), ...expeditions.rows.slice(0, 2).map((row) => ({ table: 'Expédition', row }))];

  return (
    <div className="page-grid">
      <section className="hero-card orange-hero">
        <div>
          <span className="pill">Connecté à Supabase</span>
          <h2>Tour de contrôle logistique alimentée par vos tables métier.</h2>
          <p>Les modules lisent et écrivent dans clients, commandes, produits, receptions, preparations, expeditions, photos et emplacements.</p>
        </div>
        <a className="big-action" href="#receptions">Démarrer une réception <ArrowRight size={22} /></a>
      </section>
      <DataState loading={loading} error={error} empty={false} />
      <section className="stats-grid">
        {indicators.map((indicator) => { const Icon = indicator.icon; return <article className="stat-card" key={indicator.label}><Icon /><span>{indicator.label}</span><strong>{indicator.value}</strong><small>{indicator.trend}</small></article>; })}
      </section>
      <section className="panel wide-panel">
        <div className="panel-title"><Clock3 /><h3>Flux en cours Supabase</h3></div>
        <div className="timeline">{events.map(({ table, row }, index) => <div key={`${table}-${recordKey(row, String(index))}`}><strong>{table}</strong><span>{asText(row, ['reference', 'numero', 'id'])} · {asText(row, ['statut', 'status', 'transporteur', 'fournisseur'], '')}</span></div>)}</div>
      </section>
      <aside className="panel alert-panel"><div className="panel-title"><AlertTriangle /><h3>Priorités</h3></div><p className="alert-line">Surveillez les produits à stock nul et les commandes sans expédition depuis les tables Supabase.</p></aside>
    </div>
  );
}
