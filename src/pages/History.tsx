import { History as HistoryIcon } from 'lucide-react';
import DataState from '../components/DataState';
import { useSupabaseTable } from '../lib/useSupabaseTable';
import { asText, recordKey, TABLES } from '../lib/supabase';

const movementTables = [TABLES.receptions, TABLES.preparations, TABLES.expeditions, TABLES.produits];

export default function History() {
  const datasets = movementTables.map((table) => ({ table, ...useSupabaseTable(table) }));
  const loading = datasets.some((dataset) => dataset.loading);
  const error = datasets.find((dataset) => dataset.error)?.error ?? null;
  const events = datasets.flatMap(({ table, rows }) => rows.map((row) => ({ table, row, date: asText(row, ['updated_at', 'created_at', 'date'], '') }))).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section className="module-page">
      <div className="panel-title"><HistoryIcon /><h3>Historique mouvements Supabase</h3></div>
      <DataState loading={loading} error={error} empty={!events.length} />
      <div className="timeline history-list">
        {events.map(({ table, row, date }, index) => <div key={`${table}-${recordKey(row, String(index))}`}><strong>{date || table}</strong><span>{table} · {asText(row, ['reference', 'numero', 'sku', 'nom', 'id'])} · {asText(row, ['statut', 'status', 'quantite', 'emplacement'], '')}</span></div>)}
      </div>
    </section>
  );
}
