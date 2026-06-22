import { FormEvent, useState } from 'react';
import { FileCheck2, Send, Truck } from 'lucide-react';
import DataState from '../components/DataState';
import { insertRecord, useSupabaseTable } from '../lib/useSupabaseTable';
import { asText, recordKey, TABLES } from '../lib/supabase';

export default function Expeditions() {
  const { rows: expeditions, loading, error, refresh } = useSupabaseTable(TABLES.expeditions);
  const { rows: commandes } = useSupabaseTable(TABLES.commandes);
  const [message, setMessage] = useState('');

  async function submitExpedition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await insertRecord(TABLES.expeditions, { reference: form.get('reference'), commande_id: form.get('commande_id'), transporteur: form.get('transporteur'), tracking: form.get('tracking'), statut: form.get('statut') });
    event.currentTarget.reset();
    setMessage('Expédition enregistrée dans Supabase.');
    await refresh();
  }

  return (
    <section className="module-page">
      <form className="form-card" onSubmit={(event) => void submitExpedition(event).catch((err) => setMessage(err.message))}>
        <h3><Send /> Expédition</h3>
        <div className="form-grid"><input name="reference" placeholder="Référence expédition" required /><select name="commande_id"><option value="">Commande</option>{commandes.map((order, index) => <option key={recordKey(order, `order-${index}`)} value={String(order.id ?? asText(order, ['reference']))}>{asText(order, ['reference', 'numero', 'id'])}</option>)}</select><input name="transporteur" placeholder="Transporteur" /><input name="tracking" placeholder="N° tracking" /><select name="statut" defaultValue="expédiée"><option>à expédier</option><option>expédiée</option><option>livrée</option><option>incident</option></select></div>
        <button><FileCheck2 /> Valider expédition</button>{message && <p className="form-message">{message}</p>}
      </form>
      <DataState loading={loading} error={error} empty={!expeditions.length} />
      <div className="data-list">
        {expeditions.map((departure, index) => <article className="data-row" key={recordKey(departure, `exp-${index}`)}><strong>{asText(departure, ['reference', 'numero', 'id'])}</strong><span><Truck size={18} /> {asText(departure, ['transporteur', 'carrier'])}</span><span>{asText(departure, ['tracking', 'commande_id'])}</span><em>{asText(departure, ['statut', 'status'])}</em></article>)}
      </div>
    </section>
  );
}
