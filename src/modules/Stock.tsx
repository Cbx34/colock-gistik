import { FormEvent, useState } from 'react';
import { Boxes, MoveRight, TriangleAlert } from 'lucide-react';
import DataState from '../components/DataState';
import { insertRecord, useSupabaseTable } from '../lib/useSupabaseTable';
import { asNumber, asText, recordKey, TABLES } from '../lib/supabase';

export default function Stock() {
  const { rows: produits, loading, error, refresh } = useSupabaseTable(TABLES.produits);
  const { rows: emplacements } = useSupabaseTable(TABLES.emplacements);
  const [message, setMessage] = useState('');

  async function submitStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await insertRecord(TABLES.produits, { sku: form.get('sku'), nom: form.get('nom'), quantite: Number(form.get('quantite')), emplacement: form.get('emplacement') });
    event.currentTarget.reset();
    setMessage('Stock mis à jour dans Supabase.');
    await refresh();
  }

  return (
    <section className="module-page">
      <form className="form-card" onSubmit={(event) => void submitStock(event).catch((err) => setMessage(err.message))}>
        <h3><Boxes /> Gestion stock</h3>
        <div className="form-grid"><input name="sku" placeholder="SKU / code article" required /><input name="nom" placeholder="Nom produit" /><input name="quantite" type="number" placeholder="Quantité" required /><input name="emplacement" placeholder="Emplacement" list="locations" /></div>
        <datalist id="locations">{emplacements.map((location, index) => <option key={recordKey(location, `loc-${index}`)} value={asText(location, ['code', 'nom', 'reference', 'id'])} />)}</datalist>
        <button><MoveRight /> Enregistrer mouvement stock</button>{message && <p className="form-message">{message}</p>}
      </form>
      <DataState loading={loading} error={error} empty={!produits.length} />
      <div className="data-list">
        {produits.map((item, index) => { const qty = asNumber(item, ['quantite', 'qty', 'stock']); return <article className="data-row" key={recordKey(item, `stock-${index}`)}><strong>{asText(item, ['sku', 'reference', 'code', 'id'])}</strong><span>{asText(item, ['nom', 'name', 'libelle'])}</span><span>Zone {asText(item, ['emplacement', 'zone', 'location_id'])}</span><em className={qty < 1 ? 'danger' : ''}>{qty} unités</em>{qty < 1 && <TriangleAlert />}</article>; })}
      </div>
    </section>
  );
}
