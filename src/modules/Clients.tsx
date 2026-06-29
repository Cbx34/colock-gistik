import { Mail, Phone, Users } from 'lucide-react';
import DataState from '../components/DataState';
import { useSupabaseTable } from '../lib/useSupabaseTable';
import { asText, recordKey, TABLES } from '../lib/supabase';

export default function Clients() {
  const { rows: clients, loading, error } = useSupabaseTable(TABLES.clients);
  return (
    <section className="module-page">
      <div className="module-actions"><button type="button"><Users /> Clients Supabase</button><button type="button" className="secondary"><Mail /> Contacts réels</button></div>
      <DataState loading={loading} error={error} empty={!clients.length} />
      <div className="card-grid">
        {clients.map((client, index) => <article className="work-card client-card" key={recordKey(client, `client-${index}`)}><strong>{asText(client, ['nom', 'name', 'raison_sociale', 'id'])}</strong><span>{asText(client, ['email', 'sla', 'statut'])}</span><p>{asText(client, ['adresse', 'ville', 'volume'], '')}</p><small><Phone size={15} /> {asText(client, ['telephone', 'phone', 'contact'], 'Contact non renseigné')}</small></article>)}
      </div>
    </section>
  );
}
