import { FormEvent, useState } from 'react';
import { Camera, ClipboardList, PackagePlus } from 'lucide-react';
import DataState from '../components/DataState';
import { insertRecord, useSupabaseTable } from '../lib/useSupabaseTable';
import { asText, recordKey, supabase, TABLES } from '../lib/supabase';

function receptionError(step: 'storage' | 'photos' | 'receptions', error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`Erreur Supabase ${step}: ${message}`);
}

export default function Receptions() {
  const { rows: receptions, loading, error, refresh } = useSupabaseTable(TABLES.receptions);
  const [message, setMessage] = useState('');

  async function submitReception(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const form = new FormData(event.currentTarget);
    const file = form.get('photo') as File;
    let photo_url = '';

    if (file?.size) {
      const path = `receptions/${Date.now()}-${file.name}`;
      const upload = await supabase.storage.from('photos').upload(path, file, { upsert: true });
      if (upload.error) throw receptionError('storage', upload.error);
      photo_url = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
      await insertRecord(TABLES.photos, { table_source: TABLES.receptions, url: photo_url, nom: file.name })
        .catch((error) => { throw receptionError('photos', error); });
    }

    await insertRecord(TABLES.receptions, {
      reference: form.get('reference'),
      fournisseur: form.get('fournisseur'),
      quai: form.get('quai'),
      statut: form.get('statut'),
      commentaire: form.get('commentaire'),
      photo_url,
    }).catch((error) => { throw receptionError('receptions', error); });
    event.currentTarget.reset();
    setMessage('Réception enregistrée dans Supabase.');
    await refresh();
  }

  return (
    <section className="module-page">
      <form className="form-card" onSubmit={(event) => void submitReception(event).catch((err) => setMessage(err.message))}>
        <h3><PackagePlus /> Réception avec photo</h3>
        <div className="form-grid"><input name="reference" placeholder="Référence réception" required /><input name="fournisseur" placeholder="Fournisseur" /><input name="quai" placeholder="Quai" /><select name="statut" defaultValue="reçue"><option>planifiée</option><option>reçue</option><option>contrôle</option><option>anomalie</option></select><input name="photo" type="file" accept="image/*" /><textarea name="commentaire" placeholder="Commentaire / anomalie" /></div>
        <button><Camera /> Enregistrer réception</button>{message && <p className="form-message">{message}</p>}
      </form>
      <div className="module-actions"><button className="secondary" type="button"><ClipboardList /> Données réelles Supabase</button></div>
      <DataState loading={loading} error={error} empty={!receptions.length} />
      <div className="data-list">
        {receptions.map((arrival, index) => <article className="data-row" key={recordKey(arrival, `reception-${index}`)}><strong>{asText(arrival, ['reference', 'numero', 'id'])}</strong><span>{asText(arrival, ['fournisseur', 'supplier', 'client'])}</span><span>{asText(arrival, ['quai', 'dock', 'emplacement'])}</span><em>{asText(arrival, ['statut', 'state', 'status'])}</em></article>)}
      </div>
    </section>
  );
}
