export type Platform = 'Shopify' | 'Vinted' | 'TikTok Shop' | 'Etsy' | 'eBay' | 'Dropshipping' | 'Marque e-commerce' | 'Inconnue';
export type Ranking = 'chaud' | 'moyen' | 'faible';
export type ContactStatus = 'Nouveau' | 'Contacté' | 'Relance J+2' | 'Relance J+5' | 'Client signé' | 'Supprimé';
export type ImportSource = 'Apify' | 'Shopify' | 'TikTok Shop' | 'CSV' | 'Démo';

export type Prospect = {
  id: string; nomBoutique: string; siteWeb?: string; instagram?: string; tiktok?: string; linkedin?: string; email?: string; telephone?: string;
  plateforme: Platform; typeProduits: string; ville: string; pays: string; score: number; classement: Ranking; statutContact: ContactStatus;
  volumeSignaux: string[]; sourceUrl: string; source: ImportSource; campaignId?: string; notes?: string; lastContactAt?: string; nextFollowUpAt?: string; createdAt: string;
};

export type Campaign = { id: string; nom: string; cible: string; statut: 'draft' | 'active' | 'paused' | 'done'; createdAt: string };
export type SearchCriteria = { platform: Platform | 'Toutes'; productType: string; location: string; keywords: string };
export type ProspectImportDraft = Partial<Prospect> & { nomBoutique: string };

const nowIso = () => new Date().toISOString();
const addDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

export const prospectStatuses: ContactStatus[] = ['Nouveau', 'Contacté', 'Relance J+2', 'Relance J+5', 'Client signé'];

export function dedupeKey(input: Partial<Prospect>) {
  const first = [input.email, input.siteWeb, input.instagram, input.tiktok, input.nomBoutique].find(Boolean) ?? crypto.randomUUID();
  return String(first).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[@/\s]+$/g, '').trim();
}

export function scoreProspect(input: Partial<Prospect> & { volumeSignaux?: string[] }): { score: number; classement: Ranking } {
  let score = 2;
  const signals = input.volumeSignaux ?? [];
  score += Math.min(4, signals.length);
  if (input.email) score += 1;
  if (input.telephone) score += 1;
  if (input.siteWeb) score += 1;
  if (['Shopify', 'TikTok Shop', 'Etsy', 'eBay', 'Vinted'].includes(String(input.plateforme))) score += 1;
  if ((input.ville ?? '').toLowerCase().match(/montpellier|lavérune|laverune|le crès|le cres|nîmes|nimes|sète|sete|béziers|beziers|occitanie/)) score += 1;
  if (input.statutContact === 'Client signé') score += 2;
  const finalScore = Math.max(1, Math.min(10, score));
  return { score: finalScore, classement: finalScore >= 8 ? 'chaud' : finalScore >= 5 ? 'moyen' : 'faible' };
}

export function normalizeProspect(draft: ProspectImportDraft, source: ImportSource = 'CSV'): Prospect {
  const scored = scoreProspect(draft);
  return { id: draft.id ?? crypto.randomUUID(), nomBoutique: draft.nomBoutique.trim(), siteWeb: draft.siteWeb?.trim() || undefined, instagram: draft.instagram?.trim() || undefined, tiktok: draft.tiktok?.trim() || undefined, linkedin: draft.linkedin?.trim() || undefined, email: draft.email?.trim() || undefined, telephone: draft.telephone?.trim() || undefined, plateforme: draft.plateforme ?? 'Inconnue', typeProduits: draft.typeProduits?.trim() || 'e-commerce', ville: draft.ville?.trim() || 'France', pays: draft.pays?.trim() || 'France', ...scored, statutContact: draft.statutContact ?? 'Nouveau', volumeSignaux: draft.volumeSignaux?.filter(Boolean) ?? [], sourceUrl: draft.sourceUrl?.trim() || draft.siteWeb?.trim() || '', source, campaignId: draft.campaignId, notes: draft.notes, lastContactAt: draft.lastContactAt, nextFollowUpAt: draft.nextFollowUpAt, createdAt: draft.createdAt ?? nowIso() };
}

export function mergeProspects(existing: Prospect[], incoming: Prospect[]) {
  const byKey = new Map(existing.map((p) => [dedupeKey(p), p]));
  let added = 0, merged = 0;
  for (const prospect of incoming) {
    const key = dedupeKey(prospect);
    const current = byKey.get(key);
    if (current) { byKey.set(key, { ...current, ...prospect, id: current.id, volumeSignaux: Array.from(new Set([...current.volumeSignaux, ...prospect.volumeSignaux])), notes: [current.notes, prospect.notes].filter(Boolean).join('\n') }); merged += 1; }
    else { byKey.set(key, prospect); added += 1; }
  }
  return { prospects: Array.from(byKey.values()).sort((a,b)=>b.score-a.score), added, merged };
}

export function parseCsvProspects(csv: string, source: ImportSource = 'CSV') {
  const [head = '', ...lines] = csv.split(/\r?\n/).filter((line) => line.trim());
  const headers = head.split(',').map((h) => h.trim().toLowerCase());
  return lines.map((line) => {
    const cells = line.match(/("(?:""|[^"])*"|[^,]+)/g)?.map((c)=>c.replace(/^"|"$/g, '').replaceAll('""','"').trim()) ?? [];
    const get = (...names: string[]) => cells[headers.findIndex((h)=>names.includes(h))] || '';
    return normalizeProspect({ nomBoutique: get('nom_boutique','boutique','name','shop_name') || 'Boutique importée', siteWeb: get('site_web','website','url'), instagram: get('instagram'), tiktok: get('tiktok'), email: get('email'), telephone: get('telephone','phone'), plateforme: (get('plateforme','platform') as Platform) || (source === 'TikTok Shop' ? 'TikTok Shop' : source === 'Shopify' ? 'Shopify' : 'Inconnue'), typeProduits: get('type_produits','products','category'), ville: get('ville','city'), pays: get('pays','country') || 'France', sourceUrl: get('source','source_url','url'), volumeSignaux: get('signaux','signals').split('|').map((s)=>s.trim()).filter(Boolean), notes: `Import ${source}` }, source);
  });
}

export async function fetchApifyProspects(actorId: string, token: string, input: Record<string, unknown>) {
  const res = await fetch(`https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error(`Apify ${res.status}`);
  const items = await res.json() as Array<Record<string, unknown>>;
  return items.map((item) => normalizeProspect({ nomBoutique: String(item.name ?? item.title ?? item.shopName ?? 'Prospect Apify'), siteWeb: String(item.url ?? item.website ?? ''), email: String(item.email ?? ''), telephone: String(item.phone ?? ''), plateforme: String(item.platform ?? 'Inconnue') as Platform, typeProduits: String(item.category ?? item.description ?? 'e-commerce'), ville: String(item.city ?? item.location ?? 'France'), sourceUrl: String(item.url ?? ''), volumeSignaux: ['scraping Apify', item.reviews ? `${item.reviews} avis` : '', item.followers ? `${item.followers} abonnés` : ''].filter(Boolean) as string[], notes: 'Importé via Apify' }, 'Apify'));
}

export function generateMessage(prospect: Prospect, step: 0 | 2 | 5 | 10 = 0) { const firstLine = prospect.typeProduits ? `J’ai vu votre boutique ${prospect.nomBoutique} autour de ${prospect.typeProduits}.` : `J’ai vu votre boutique ${prospect.nomBoutique}.`; const local = prospect.ville ? ` depuis Montpellier / Lavérune / Le Crès vers vos clients` : ' depuis Montpellier / Lavérune / Le Crès'; const base = `${firstLine}\n\nChez Colock-Gistik, nous aidons les vendeurs e-commerce à externaliser la réception marchandise, le stockage, la préparation colis, l’emballage et l’expédition multi-transporteurs${local}.\n\nSi vous expédiez régulièrement des colis, je peux vous proposer une solution simple pour gagner du temps sans recruter ni louer plus d’espace.\n\nEst-ce que je peux vous envoyer une estimation rapide adaptée à vos volumes ?\n\nBonne journée,\nL’équipe Colock-Gistik`; const relances: Record<number, string> = { 2: `Bonjour,\n\nJe me permets une relance rapide concernant ${prospect.nomBoutique}. Si vos commandes augmentent, Colock-Gistik peut prendre en charge stockage, préparation et expédition depuis la métropole de Montpellier.\n\nSouhaitez-vous que je vous envoie une proposition courte ?`, 5: `Bonjour,\n\nJe reviens vers vous une dernière fois cette semaine. Nous accompagnons des petites marques e-commerce qui veulent expédier plus vite sans gérer l’entrepôt au quotidien.\n\nSi ce n’est pas le bon moment, dites-le moi et je ne vous relancerai pas.`, 10: `Bonjour,\n\nJe clôture ma prise de contact pour ${prospect.nomBoutique}. Si vous cherchez plus tard une solution de stockage, préparation colis et expédition multi-transporteurs à Montpellier, vous pouvez me répondre ici.\n\nBonne continuation !` }; return step === 0 ? base : relances[step]; }
export function buildSearchLinks(criteria: SearchCriteria) { const target = [criteria.platform !== 'Toutes' ? criteria.platform : 'e-commerce', criteria.productType, criteria.location, criteria.keywords].filter(Boolean).join(' '); return [{ label: 'Google boutiques', url: `https://www.google.com/search?q=${encodeURIComponent(`${target} contact livraison colis`)}` }, { label: 'Instagram', url: `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com ${target} boutique`)}` }, { label: 'TikTok', url: `https://www.google.com/search?q=${encodeURIComponent(`site:tiktok.com ${target} shop`)}` }, { label: 'Etsy', url: `https://www.etsy.com/search/shops?search_query=${encodeURIComponent(criteria.productType || criteria.keywords || 'france')}` }]; }
const templates = [['Maison Luma','https://maison-luma.example','@maisonluma','','','contact@maison-luma.example','','Shopify','décoration maison','Montpellier',['mentions expédition 24/48h','nouveautés chaque semaine','avis clients nombreux']], ['GlowCase FR','https://glowcase.example','@glowcasefr','@glowcasefr','','hello@glowcase.example','','TikTok Shop','accessoires téléphone','France',['live shopping','promos quotidiennes','dropshipping probable']]] as const;
export function mockProspectSearch(criteria: SearchCriteria): Prospect[] { return templates.filter((row) => criteria.platform === 'Toutes' || row[7] === criteria.platform).map((row, index) => normalizeProspect({ nomBoutique: row[0], siteWeb: row[1], instagram: row[2], tiktok: row[3], linkedin: row[4], email: row[5], telephone: row[6], plateforme: row[7] as Platform, typeProduits: criteria.productType || row[8], ville: criteria.location || row[9], pays: 'France', volumeSignaux: [...row[10]], sourceUrl: row[1], nextFollowUpAt: addDays(index + 2), notes: 'Donnée publique à vérifier avant contact.' }, 'Démo')); }
export const followUpDays = [2, 5, 10];
export function defaultCampaigns(): Campaign[] { return [{ id: crypto.randomUUID(), nom: 'E-commerce Sud France', cible: 'Shopify, TikTok Shop et marques e-commerce Occitanie', statut: 'active', createdAt: nowIso() }]; }
