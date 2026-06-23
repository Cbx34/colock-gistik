import { FormEvent, useState } from 'react';
import { Camera, ClipboardList, PackagePlus } from 'lucide-react';
import DataState from '../components/DataState';
import { insertRecord, useSupabaseTable } from '../lib/useSupabaseTable';
import { asText, recordKey, TABLES } from '../lib/supabase';

export default function Receptions() {
  const { rows: receptions, loading, error, refresh } = useSupabaseTable(TABLES.receptions, 'id', false);
  const [referenceReception, setReferenceReception] = useState('');
  const [transporteur, setTransporteur] = useState('');
  const [statut, setStatut] = useState('Reception_OK');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submitReception(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!referenceReception.trim()) {
      setMessage('Ajoute une reference reception.');
      return;
    }

    setSaving(true);
    try {
      await insertRecord(TABLES.receptions, {
        reference_reception: referenceReception.trim(),
        transporteur: transporteur.trim() || null,
        statut: statut || 'Reception_OK',
      });

      setReferenceReception('');
      setTransporteur('');
      setStatut('Reception_OK');
      setMessage('Reception enregistree dans Supabase.');
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur pendant l enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="module-page">
      <form className="form-card" onSubmit={submitReception}>
        <h3><PackagePlus /> Reception simple</h3>
        <p className="helper-text">Version stable : enregistrement direct dans la table receptions, sans upload photo pour l instant.</p>
        <div className="form-grid">
          <input value={referenceReception} onChange={(event) => setReferenceReception(event.target.value)} placeholder="Reference reception" required />
          <input value={transporteur} onChange={(event) => setTransporteur(event.target.value)} placeholder="Transporteur / fournisseur" />
          <select value={statut} onChange={(event) => setStatut(event.target.value)}>
            <option value="Reception_OK">Reception OK</option>
            <option value="A_controler">A controler</option>
            <option value="Anomalie">Anomalie</option>
          </select>
        </div>
        <button disabled={saving}><Camera /> {saving ? 'Enregistrement...' : 'Enregistrer reception'}</button>{message && <p className="form-message">{message}</p>}
      </form>
      <div className="module-actions"><button className="secondary" type="button" onClick={() => void refresh()}><ClipboardList /> Donnees reelles Supabase</button></div>
      <DataState loading={loading} error={error} empty={!receptions.length} />
      <div className="data-list">
        {receptions.map((arrival, index) => <article className="data-row" key={recordKey(arrival, `reception-${index}`)}><strong>{asText(arrival, ['reference_reception', 'reference', 'numero', 'id'])}</strong><span>{asText(arrival, ['transporteur', 'fournisseur', 'supplier', 'client'])}</span><em>{asText(arrival, ['statut', 'state', 'status'])}</em></article>)}
      </div>
    </section>
  );
}
