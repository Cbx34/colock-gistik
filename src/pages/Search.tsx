import { Search as SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import DataState from '../components/DataState';
import { useSupabaseTable } from '../lib/useSupabaseTable';
import { asText, recordKey, TABLES, type DbRecord } from '../lib/supabase';

const searchableTables = [TABLES.produits, TABLES.commandes, TABLES.clients, TABLES.receptions, TABLES.preparations, TABLES.expeditions, TABLES.emplacements];

export default function Search() {
  const [term, setTerm] = useState('');
  const datasets = searchableTables.map((table) => ({ table, ...useSupabaseTable(table) }));
  const loading = datasets.some((dataset) => dataset.loading);
  const error = datasets.find((dataset) => dataset.error)?.error ?? null;
  const records = useMemo(() => datasets.flatMap(({ table, rows }) => rows.map((row) => ({ table, row }))), [datasets.map((dataset) => dataset.rows.length).join('|')]);
  const results = records.filter(({ row }) => JSON.stringify(row).toLowerCase().includes(term.toLowerCase()));

  function label(row: DbRecord) {
    return [asText(row, ['reference', 'numero', 'sku', 'code', 'nom', 'name', 'id']), asText(row, ['client', 'client_id', 'statut', 'status', 'emplacement'], '')].filter(Boolean).join(' · ');
  }

  return (
    <section className="module-page">
      <label className="global-search"><SearchIcon /><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Recherche article, SKU, commande, client, emplacement..." /></label>
      <DataState loading={loading} error={error} empty={!records.length} />
      <div className="data-list">
        {(term ? results : records).map(({ table, row }, index) => <article className="data-row search-result" key={`${table}-${recordKey(row, String(index))}`}><strong>{table}</strong><span>{label(row)}</span><em>Réel Supabase</em></article>)}
      </div>
    </section>
  );
}
