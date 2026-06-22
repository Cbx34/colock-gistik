import { Search as SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

const records = ['CMD-88421 · Urban Shop · en préparation', 'PAL-009812 · Quai 3 · réceptionnée', 'EXP-7752 · ChronoBox · départ 17:10', 'SKU CBOX-M · Stock faible'];

export default function Search() {
  const [term, setTerm] = useState('');
  const results = useMemo(() => records.filter((record) => record.toLowerCase().includes(term.toLowerCase())), [term]);

  return (
    <section className="module-page">
      <label className="global-search"><SearchIcon /><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Rechercher commande, palette, SKU, client..." /></label>
      <div className="data-list">
        {(term ? results : records).map((record) => <article className="data-row search-result" key={record}><strong>{record.split(' · ')[0]}</strong><span>{record}</span><em>Ouvrir</em></article>)}
      </div>
    </section>
  );
}
