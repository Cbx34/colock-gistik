import type { Prospect } from './prospecting';

const KEY = 'colock-prospects-mvp';

export function loadProspects(): Prospect[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function saveProspects(prospects: Prospect[]) { localStorage.setItem(KEY, JSON.stringify(prospects)); }

export function exportProspectsCsv(prospects: Prospect[]) {
  const headers = ['nom_boutique','site_web','instagram','tiktok','linkedin','email','telephone','plateforme','type_produits','ville','pays','score','classement','statut_contact','signaux','source'];
  const rows = prospects.map((p) => [p.nomBoutique,p.siteWeb,p.instagram,p.tiktok,p.linkedin,p.email,p.telephone,p.plateforme,p.typeProduits,p.ville,p.pays,p.score,p.classement,p.statutContact,p.volumeSignaux.join(' | '),p.sourceUrl]);
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `colock-prospects-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
