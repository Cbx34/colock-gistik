import { FormEvent, useState } from 'react';
import { Camera, ClipboardList, PackagePlus } from 'lucide-react';
import DataState from '../components/DataState';
import { insertRecord, useSupabaseTable } from '../lib/useSupabaseTable';
import { asText, recordKey, TABLES } from '../lib/supabase';

export default function Receptions() {
  const { rows: receptions, loading, error, refresh } = useSupabaseTable(TABLES.receptions, 'id', false);
  const [message, setMessage] = useState('');

  async function submitReception(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const form = new FormData(event.currentTarget);

    await insertRecord(TABLES.receptions, {
      reference_reception: form.get('reference_reception'),
      transporteur: form.get('transporteur'),
      statut: form.get('statut') || 'Reception_OK',
    });

    event.currentTarget.reset();
    setMessage('Réception enregistrée dans Supabase.');
    await refresh();
  }

  return (
    <section className="module-page">
      <form className="form-card" onSubmit={(event) => void submitReception(event).catch((err) => setMessage(err.message))}>
        <h3><PackagePlus /> Réception simple</h3>
        <p className="helper-text">Version stable : enregistrement direct dans la table receptions, sans upload photo pour l’instant.</p>
        <div className="form-grid">
          <input name="reference_reception" placeholder="Référence réception" required />
          <input name="transporteur" placeholder="Transporteur / fournisseur" />
          <select name="statut" defaultValue="Reception_OK">
            <option value="Reception_OK">Réception OK</option>
            <option value="A_controler">À contrôler</option>
            <option value="Anomalie">Anomalie</option>
          </select>
        </div>
        <button><Camera /> Enregistrer réception</button>{message && <p className="form-message">{message}</p>}
      </form>
      <div className="module-actions"><button className="secondary" type="button" onClick={() => void refresh()}><ClipboardList /> Données réelles Supabase</button></div>
      <DataState loading={loading} error={error} empty={!receptions.length} />
      <div className="data-list">
        {receptions.map((arrival, index) => <article className="data-row" key={recordKey(arrival, `reception-${index}`)}><strong>{asText(arrival, ['reference_reception', 'reference', 'numero', 'id'])}</strong><span>{asText(arrival, ['transporteur', 'fournisseur', 'supplier', 'client'])}</span><em>{asText(arrival, ['statut', 'state', 'status'])}</em></article>)}
      </div>
    </section>
  );
}
