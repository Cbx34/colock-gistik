import { FormEvent, useState } from 'react';
import { ClipboardCheck, ScanLine } from 'lucide-react';
import DataState from '../components/DataState';
import { insertRecord, useSupabaseTable } from '../lib/useSupabaseTable';
import { asText, recordKey, TABLES } from '../lib/supabase';

export default function Preparations() {
  const { rows: preparations, loading, error, refresh } = useSupabaseTable(TABLES.preparations);
  const { rows: commandes } = useSupabaseTable(TABLES.commandes);
  const [message, setMessage] = useState('');

  async function submitPreparation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await insertRecord(TABLES.preparations, { reference: form.get('reference'), commande_id: form.get('commande_id'), preparateur: form.get('preparateur'), statut: form.get('statut') });
    event.currentTarget.reset();
    setMessage('Préparation créée dans Supabase.');
    await refresh();
  }

  return (
    <section className="module-page">
      <form className="form-card" onSubmit={(event) => void submitPreparation(event).catch((err) => setMessage(err.message))}>
        <h3><ClipboardCheck /> Préparation commande</h3>
        <div className="form-grid"><input name="reference" placeholder="Référence préparation" required /><select name="commande_id"><option value="">Commande Supabase</option>{commandes.map((order, index) => <option key={recordKey(order, `cmd-${index}`)} value={String(order.id ?? asText(order, ['reference']))}>{asText(order, ['reference', 'numero', 'id'])}</option>)}</select><input name="preparateur" placeholder="Préparateur" /><select name="statut" defaultValue="à préparer"><option>à préparer</option><option>picking</option><option>contrôle</option><option>terminée</option></select></div>
        <button><ScanLine /> Lancer préparation</button>{message && <p className="form-message">{message}</p>}
      </form>
      <DataState loading={loading} error={error} empty={!preparations.length} />
      <div className="card-grid">
        {preparations.map((wave, index) => <article className="work-card" key={recordKey(wave, `prep-${index}`)}><strong>{asText(wave, ['reference', 'numero', 'id'])}</strong><span>Commande {asText(wave, ['commande_id', 'commande', 'order_id'])}</span><p>{asText(wave, ['preparateur', 'operator'])}</p><em>{asText(wave, ['statut', 'status'])}</em></article>)}
      </div>
    </section>
  );
}
