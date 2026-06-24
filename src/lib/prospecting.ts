export type Platform = 'Shopify' | 'Vinted' | 'TikTok Shop' | 'Etsy' | 'eBay' | 'Dropshipping' | 'Marque e-commerce' | 'Inconnue';
export type Ranking = 'chaud' | 'moyen' | 'faible';
export type ContactStatus = 'Nouveau' | 'Contacté' | 'Relance J+2' | 'Relance J+5' | 'Client signé' | 'Supprimé';
export type ImportSource = 'Apify' | 'Shopify' | 'Vinted' | 'TikTok Shop' | 'Etsy' | 'Google Maps' | 'CSV' | 'Démo';
export type RealSource = 'Shopify' | 'Vinted' | 'TikTok Shop' | 'Etsy' | 'Google Maps' | 'CSV' | 'Démo' | 'Inconnue';

export type Prospect = {
  id: string; nomBoutique: string; siteWeb?: string; instagram?: string; tiktok?: string; linkedin?: string; email?: string; telephone?: string;
  plateforme: Platform; typeProduits: string; ville: string; pays: string; score: number; classement: Ranking; statutContact: ContactStatus;
  volumeSignaux: string[]; sourceUrl: string; source: ImportSource; sourceReelle: RealSource; campaignId?: string; notes?: string; lastContactAt?: string; nextFollowUpAt?: string; createdAt: string;
};

export type Campaign = { id: string; nom: string; cible: string; statut: 'draft' | 'active' | 'paused' | 'done'; createdAt: string };
export type SearchCriteria = { platform: Platform | 'Toutes'; productType: string; location: string; keywords: string };
export type ProspectImportDraft = Partial<Prospect> & { nomBoutique: string };
export type ApifyImportResult = { prospects: Prospect[]; query: string; itemsCount: number; insertedCount?: number; duplicateCount?: number; progress?: string[] };
export type ApifyProgressStep = 'token-detected' | 'actor-started' | 'dataset-retrieved' | 'results-found' | 'prospects-inserted';
export type ApifyProgress = { step: ApifyProgressStep; message: string; count?: number };

const DEFAULT_APIFY_MAX_ITEMS = 25;

const nowIso = () => new Date().toISOString();
const addDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

export const prospectStatuses: ContactStatus[] = ['Nouveau', 'Contacté', 'Relance J+2', 'Relance J+5', 'Client signé'];

export function dedupeKey(input: Partial<Prospect>) {
  const first = [input.email, input.telephone, input.siteWeb, input.instagram, input.tiktok, input.nomBoutique].find(Boolean) ?? crypto.randomUUID();
  return String(first).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[^a-z0-9@.+-]+/g, '').trim();
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

export function resolveRealSource(platform: SearchCriteria['platform'] | Platform | ImportSource): RealSource {
  if (platform === 'Shopify' || platform === 'Vinted' || platform === 'TikTok Shop' || platform === 'Etsy' || platform === 'Google Maps' || platform === 'CSV' || platform === 'Démo') return platform;
  return 'Inconnue';
}

export function isGoogleMapsActor(actorId: string) {
  return /google[-_~ ]?(maps|places)|crawler[-_~ ]?google[-_~ ]?places/i.test(actorId);
}

export function normalizeProspect(draft: ProspectImportDraft, source: ImportSource = 'CSV'): Prospect {
  const scored = scoreProspect(draft);
  const sourceReelle = draft.sourceReelle ?? resolveRealSource(source === 'Apify' ? draft.plateforme ?? 'Inconnue' : source);
  return { id: draft.id ?? crypto.randomUUID(), nomBoutique: draft.nomBoutique.trim(), siteWeb: draft.siteWeb?.trim() || undefined, instagram: draft.instagram?.trim() || undefined, tiktok: draft.tiktok?.trim() || undefined, linkedin: draft.linkedin?.trim() || undefined, email: draft.email?.trim() || undefined, telephone: draft.telephone?.trim() || undefined, plateforme: draft.plateforme ?? 'Inconnue', typeProduits: draft.typeProduits?.trim() || 'e-commerce', ville: draft.ville?.trim() || 'France', pays: draft.pays?.trim() || 'France', ...scored, statutContact: draft.statutContact ?? 'Nouveau', volumeSignaux: draft.volumeSignaux?.filter(Boolean) ?? [], sourceUrl: draft.sourceUrl?.trim() || draft.siteWeb?.trim() || '', source, sourceReelle, campaignId: draft.campaignId, notes: draft.notes, lastContactAt: draft.lastContactAt, nextFollowUpAt: draft.nextFollowUpAt, createdAt: draft.createdAt ?? nowIso() };
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
    return normalizeProspect({ nomBoutique: get('nom_boutique','boutique','name','shop_name') || 'Boutique importée', siteWeb: get('site_web','website','url'), instagram: get('instagram'), tiktok: get('tiktok'), email: get('email'), telephone: get('telephone','phone'), plateforme: (get('plateforme','platform') as Platform) || (source === 'TikTok Shop' ? 'TikTok Shop' : source === 'Shopify' ? 'Shopify' : source === 'Vinted' ? 'Vinted' : source === 'Etsy' ? 'Etsy' : 'Inconnue'), typeProduits: get('type_produits','products','category'), ville: get('ville','city'), pays: get('pays','country') || 'France', sourceUrl: get('source','source_url','url'), volumeSignaux: get('signaux','signals').split('|').map((s)=>s.trim()).filter(Boolean), sourceReelle: resolveRealSource(source), notes: `Import ${source}` }, source);
  });
}

const asCleanString = (value: unknown) => typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
const firstString = (item: Record<string, unknown>, keys: string[]) => keys.map((key) => asCleanString(item[key])).find(Boolean) ?? '';
const firstNumber = (item: Record<string, unknown>, keys: string[]) => keys.map((key) => Number(item[key])).find((value) => Number.isFinite(value));

export function buildApifyGoogleMapsInput(criteria: SearchCriteria, maxItems = DEFAULT_APIFY_MAX_ITEMS) {
  const platform = criteria.platform !== 'Toutes' ? criteria.platform : 'boutique e-commerce';
  const product = criteria.productType || 'colis expédition';
  const location = criteria.location || 'Montpellier';
  const baseQuery = [criteria.keywords, platform, product, location].filter(Boolean).join(' ');
  const searchStringsArray = Array.from(new Set([baseQuery, `${platform} ${location}`, `boutique colis expédition ${location}`].filter(Boolean)));

  return {
    searchStringsArray,
    locationQuery: location,
    maxCrawledPlacesPerSearch: maxItems,
    maxImages: 0,
    language: 'fr',
    scrapePlaceDetailPage: true,
    scrapeTableReservationProvider: false,
    scrapeDirectories: false,
    includeWebResults: false,
  };
}

export function apifyItemToProspect(item: Record<string, unknown>, criteria: SearchCriteria): Prospect {
  const name = firstString(item, ['title', 'name', 'placeName', 'shopName']) || 'Prospect Apify';
  const website = firstString(item, ['website', 'websiteUrl', 'siteWeb', 'url']);
  const email = firstString(item, ['email', 'emailAddress', 'contactEmail']);
  const phone = firstString(item, ['phone', 'phoneNumber', 'telephone', 'internationalPhoneNumber']);
  const address = firstString(item, ['address', 'street', 'formattedAddress']);
  const city = firstString(item, ['city', 'municipality', 'location']) || criteria.location || 'France';
  const category = firstString(item, ['categoryName', 'category', 'categories', 'subTitle']) || criteria.productType || 'e-commerce';
  const rating = firstNumber(item, ['totalScore', 'rating', 'stars']);
  const reviews = firstNumber(item, ['reviewsCount', 'reviews', 'reviewCount']);
  const sourceUrl = firstString(item, ['url', 'placeUrl', 'googleMapsUrl', 'searchPageUrl']) || website;
  const platform = criteria.platform !== 'Toutes' ? criteria.platform : website.toLowerCase().includes('shopify') ? 'Shopify' : 'Inconnue';
  const sourceReelle = criteria.platform === 'Toutes' ? 'Google Maps' : resolveRealSource(criteria.platform);

  return normalizeProspect({
    nomBoutique: name,
    siteWeb: website,
    email,
    telephone: phone,
    plateforme: platform as Platform,
    sourceReelle,
    typeProduits: category,
    ville: city,
    pays: 'France',
    sourceUrl,
    statutContact: 'Nouveau',
    volumeSignaux: [
      sourceReelle === 'Google Maps' ? 'scraping Apify Google Maps' : `scraping Apify ${sourceReelle}`,
      address ? `adresse: ${address}` : '',
      rating ? `note Google ${rating}/5` : '',
      reviews ? `${reviews} avis Google` : '',
    ].filter(Boolean),
    notes: [`Importé via Apify ${sourceReelle}`, address ? `Adresse: ${address}` : '', sourceUrl ? `Source: ${sourceUrl}` : ''].filter(Boolean).join('\n'),
  }, 'Apify');
}

async function readApifyError(res: Response) {
  const fallback = `Erreur Apify (${res.status})`;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await res.json().catch(() => ({})) as { error?: string; details?: string; message?: string };
    return [body.error, body.details, body.message].filter(Boolean).join(' — ') || fallback;
  }
  const text = await res.text().catch(() => '');
  return text || fallback;
}

function normalizeApifyActorId(actorId: string) {
  return actorId.trim().replace(/^https:\/\/api\.apify\.com\/v2\/acts\//, '').replace(/^https:\/\/console\.apify\.com\/actors\//, '').replace(/\//g, '~');
}

export async function fetchApifyProspects(actorId: string, token: string, criteria: SearchCriteria, maxItems = DEFAULT_APIFY_MAX_ITEMS, onProgress?: (progress: ApifyProgress) => void): Promise<ApifyImportResult> {
  const cleanActorId = normalizeApifyActorId(actorId || 'compass/crawler-google-places');
  if (criteria.platform === 'Vinted' && isGoogleMapsActor(cleanActorId)) throw new Error('Google Maps est interdit lorsque la source Vinted est sélectionnée. Configurez un actor Apify Vinted dédié.');
  const cleanToken = token.trim();
  const proxyRes = await fetch('/api/apify-prospects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ actorId: cleanActorId, token: cleanToken || undefined, criteria, maxItems }),
  });
  if (!proxyRes.ok) throw new Error(await readApifyError(proxyRes));
  const result = await proxyRes.json() as ApifyImportResult;

  const progressMessages = result?.progress?.length ? result.progress : [
    'Token detected',
    'Actor launched',
    'Dataset retrieved',
    `${result?.itemsCount ?? result?.prospects.length ?? 0} results found`,
    `${result?.insertedCount ?? result?.prospects.length ?? 0} nouveaux prospects ajoutés, ${result?.duplicateCount ?? 0} doublons ignorés`,
  ];
  progressMessages.forEach((message) => {
    const step: ApifyProgressStep = message.includes('Token') ? 'token-detected'
      : message.includes('Actor') ? 'actor-started'
      : message.includes('Dataset') ? 'dataset-retrieved'
      : message.includes('results') ? 'results-found'
      : 'prospects-inserted';
    onProgress?.({ step, message });
  });
  return result;
}

export function generateMessage(prospect: Prospect, step: 0 | 2 | 5 | 10 = 0) { const firstLine = prospect.typeProduits ? `J’ai vu votre boutique ${prospect.nomBoutique} autour de ${prospect.typeProduits}.` : `J’ai vu votre boutique ${prospect.nomBoutique}.`; const local = prospect.ville ? ` depuis Montpellier / Lavérune / Le Crès vers vos clients` : ' depuis Montpellier / Lavérune / Le Crès'; const base = `${firstLine}\n\nChez Colock-Gistik, nous aidons les vendeurs e-commerce à externaliser la réception marchandise, le stockage, la préparation colis, l’emballage et l’expédition multi-transporteurs${local}.\n\nSi vous expédiez régulièrement des colis, je peux vous proposer une solution simple pour gagner du temps sans recruter ni louer plus d’espace.\n\nEst-ce que je peux vous envoyer une estimation rapide adaptée à vos volumes ?\n\nBonne journée,\nL’équipe Colock-Gistik`; const relances: Record<number, string> = { 2: `Bonjour,\n\nJe me permets une relance rapide concernant ${prospect.nomBoutique}. Si vos commandes augmentent, Colock-Gistik peut prendre en charge stockage, préparation et expédition depuis la métropole de Montpellier.\n\nSouhaitez-vous que je vous envoie une proposition courte ?`, 5: `Bonjour,\n\nJe reviens vers vous une dernière fois cette semaine. Nous accompagnons des petites marques e-commerce qui veulent expédier plus vite sans gérer l’entrepôt au quotidien.\n\nSi ce n’est pas le bon moment, dites-le moi et je ne vous relancerai pas.`, 10: `Bonjour,\n\nJe clôture ma prise de contact pour ${prospect.nomBoutique}. Si vous cherchez plus tard une solution de stockage, préparation colis et expédition multi-transporteurs à Montpellier, vous pouvez me répondre ici.\n\nBonne continuation !` }; return step === 0 ? base : relances[step]; }
export function buildSearchLinks(criteria: SearchCriteria) { const target = [criteria.platform !== 'Toutes' ? criteria.platform : 'e-commerce', criteria.productType, criteria.location, criteria.keywords].filter(Boolean).join(' '); return [{ label: 'Google boutiques', url: `https://www.google.com/search?q=${encodeURIComponent(`${target} contact livraison colis`)}` }, { label: 'Instagram', url: `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com ${target} boutique`)}` }, { label: 'TikTok', url: `https://www.google.com/search?q=${encodeURIComponent(`site:tiktok.com ${target} shop`)}` }, { label: 'Etsy', url: `https://www.etsy.com/search/shops?search_query=${encodeURIComponent(criteria.productType || criteria.keywords || 'france')}` }]; }
const templates = [['Maison Luma','https://maison-luma.example','@maisonluma','','','contact@maison-luma.example','','Shopify','décoration maison','Montpellier',['mentions expédition 24/48h','nouveautés chaque semaine','avis clients nombreux']], ['GlowCase FR','https://glowcase.example','@glowcasefr','@glowcasefr','','hello@glowcase.example','','TikTok Shop','accessoires téléphone','France',['live shopping','promos quotidiennes','dropshipping probable']]] as const;
export function mockProspectSearch(criteria: SearchCriteria): Prospect[] { return templates.filter((row) => criteria.platform === 'Toutes' || row[7] === criteria.platform).map((row, index) => normalizeProspect({ nomBoutique: row[0], siteWeb: row[1], instagram: row[2], tiktok: row[3], linkedin: row[4], email: row[5], telephone: row[6], plateforme: row[7] as Platform, typeProduits: criteria.productType || row[8], ville: criteria.location || row[9], pays: 'France', volumeSignaux: [...row[10]], sourceUrl: row[1], sourceReelle: resolveRealSource(row[7] as Platform), nextFollowUpAt: addDays(index + 2), notes: 'Donnée publique à vérifier avant contact.' }, 'Démo')); }
export const followUpDays = [2, 5, 10];
export function defaultCampaigns(): Campaign[] { return [{ id: crypto.randomUUID(), nom: 'E-commerce Sud France', cible: 'Shopify, TikTok Shop et marques e-commerce Occitanie', statut: 'active', createdAt: nowIso() }]; }
