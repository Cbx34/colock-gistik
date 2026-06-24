import { FormEvent, useMemo, useState } from 'react';
import { Camera, ClipboardList, PackagePlus } from 'lucide-react';
import DataState from '../components/DataState';
import { insertRecord, useSupabaseTable } from '../lib/useSupabaseTable';
import { asText, recordKey, supabase, TABLES } from '../lib/supabase';

const DEFAULT_LOCATION_PREFIX = 'AUTO-REC';

function nextAutomaticLocation(totalReceptions: number) {
  return `${DEFAULT_LOCATION_PREFIX}-${String(totalReceptions + 1).padStart(3, '0')}`;
}

export default function Receptions() {
  const { rows: receptions, loading, error, refresh } = useSupabaseTable(TABLES.receptions, 'id', false);
  const automaticLocation = useMemo(() => nextAutomaticLocation(receptions.length), [receptions.length]);
  const [client, setClient] = useState('');
  const [produit, setProduit] = useState('');
  const [quantite, setQuantite] = useState('');
  const [transporteur, setTransporteur] = useState('');
  const [referenceReception, setReferenceReception] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submitReception(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const form = new FormData(event.currentTarget);
    const photo = form.get('photo') as File | null;

    if (!photo?.size) {
      setMessage('Ajoute une photo obligatoire pour valider la reception.');
      return;
    }

    if (!referenceReception.trim() || !client.trim() || !produit.trim() || !quantite.trim() || !transporteur.trim()) {
      setMessage('Complete la reference, le client, le produit, la quantite et le transporteur.');
      return;
    }

    setSaving(true);
    try {
      let photoUrl = '';
      const photoPath = `receptions/${Date.now()}-${photo.name}`;
      const upload = await supabase.storage.from('photos').upload(photoPath, photo, { upsert: true });

      if (upload.error) throw upload.error;
      photoUrl = supabase.storage.from('photos').getPublicUrl(photoPath).data.publicUrl;
      await insertRecord(TABLES.photos, { table_source: TABLES.receptions, url: photoUrl, nom: photo.name });

      const commonPayload = {
        reference_reception: referenceReception.trim(),
        client: client.trim(),
        produit: produit.trim(),
        quantite: Number(quantite),
        emplacement: automaticLocation,
        transporteur: transporteur.trim(),
        statut: 'Reception_OK',
        photo_url: photoUrl,
      };

      try {
        await insertRecord(TABLES.receptions, commonPayload);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        if (!message.includes('column') && !message.includes('schema')) throw err;
        await insertRecord(TABLES.receptions, {
          reference_reception: referenceReception.trim(),
          transporteur: transporteur.trim(),
          statut: 'Reception_OK',
        });
      }

      setClient('');
      setProduit('');
      setQuantite('');
      setTransporteur('');
      setReferenceReception('');
      setPhotoName('');
      event.currentTarget.reset();
      setMessage('Reception photo enregistree dans Supabase.');
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
        <h3><PackagePlus /> Reception avec photo obligatoire</h3>
        <p className="helper-text">Chaque reception demande une photo, un client, un produit, une quantite, un emplacement automatique, un transporteur et une reference reception.</p>
        <div className="form-grid reception-form-grid">
          <label className="photo-field">
            <span>Photo obligatoire</span>
            <input name="photo" type="file" accept="image/*" capture="environment" required onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? '')} />
            <strong>{photoName || 'Prendre ou choisir une photo'}</strong>
          </label>
          <input value={client} onChange={(event) => setClient(event.target.value)} placeholder="Client" required />
          <input value={produit} onChange={(event) => setProduit(event.target.value)} placeholder="Produit" required />
          <input value={quantite} onChange={(event) => setQuantite(event.target.value)} placeholder="Quantite" type="number" min="1" step="1" required />
          <input value={automaticLocation} placeholder="Emplacement automatique" readOnly aria-label="Emplacement automatique" />
          <input value={transporteur} onChange={(event) => setTransporteur(event.target.value)} placeholder="Transporteur" required />
          <input value={referenceReception} onChange={(event) => setReferenceReception(event.target.value)} placeholder="Reference reception" required />
        </div>
        <button disabled={saving}><Camera /> {saving ? 'Enregistrement...' : 'Enregistrer reception photo'}</button>{message && <p className="form-message">{message}</p>}
      </form>
      <div className="module-actions"><button className="secondary" type="button" onClick={() => void refresh()}><ClipboardList /> Donnees reelles Supabase</button></div>
      <DataState loading={loading} error={error} empty={!receptions.length} />
      <div className="data-list">
        {receptions.map((arrival, index) => <article className="data-row" key={recordKey(arrival, `reception-${index}`)}><strong>{asText(arrival, ['reference_reception', 'reference', 'numero', 'id'])}</strong><span>{asText(arrival, ['client', 'fournisseur', 'supplier'])}</span><span>{asText(arrival, ['produit', 'product', 'article'])}</span><span>{asText(arrival, ['quantite', 'quantity', 'qty'])}</span><span>{asText(arrival, ['emplacement', 'quai', 'dock'])}</span><em>{asText(arrival, ['transporteur', 'carrier'])}</em></article>)}
      </div>
    </section>
  );
}
