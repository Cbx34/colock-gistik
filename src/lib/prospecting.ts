export type Platform = 'Shopify' | 'Vinted' | 'TikTok Shop' | 'Etsy' | 'eBay' | 'Dropshipping' | 'Marque e-commerce' | 'Inconnue';
export type Ranking = 'ultra-chaud' | 'chaud' | 'moyen' | 'faible';
export type ContactStatus = 'Nouveau' | 'Contacté' | 'Relance J+2' | 'Relance J+5' | 'Client signé' | 'Supprimé';
export type ImportSource = 'Apify' | 'Shopify' | 'Vinted' | 'TikTok Shop' | 'Etsy' | 'Google Maps' | 'CSV' | 'Démo';
export type RealSource = 'Shopify' | 'Vinted' | 'TikTok Shop' | 'Etsy' | 'Google Maps' | 'CSV' | 'Démo' | 'Inconnue';


export type EcommerceKeywordCategory = { category: string; keywords: string[] };
export const ECOMMERCE_KEYWORD_LIBRARY: EcommerceKeywordCategory[] = [
  { category: 'MODE', keywords: ['vêtement','vêtements','vêtements femme','vêtements homme','robe','robe femme','pantalon','jean','chemise','t-shirt','tee-shirt','sweat','pull','veste','manteau','lingerie','sous-vêtements','chaussures','baskets','sneakers','sac','sacs','maroquinerie','montre','montres','bijoux','lunettes','accessoires','accessoires mode','mode femme','mode homme','prêt-à-porter','pret a porter','streetwear','sportswear','costume','casquettes'] },
  { category: 'BEAUTÉ', keywords: ['cosmétique','cosmétiques','maquillage','parfum','soins visage','soins corps','crème','huile','beauté bio','skincare','savon','shampoing','coiffure','esthétique','ongles','bien-être','barbier'] },
  { category: 'MAISON', keywords: ['décoration','meuble','meubles','cuisine','salle de bain','rangement','textile maison','linge de maison','jardin','bricolage','éclairage','mobilier','bougies','art de la table','plantes'] },
  { category: 'SPORT', keywords: ['fitness','musculation','yoga','running','vélo','cyclisme','randonnée','crossfit','sportwear','sportswear','nutrition sportive','natation','tennis','football'] },
  { category: 'ANIMAUX', keywords: ['chien','chat','animalerie','accessoires animaux','alimentation chien','alimentation chat','aquarium'] },
  { category: 'HIGH TECH', keywords: ['informatique','gaming','smartphone','accessoires téléphone','électronique','domotique','objets connectés'] },
  { category: 'ALIMENTAIRE', keywords: ['épicerie','bio','complément alimentaire','compléments alimentaires','nutrition','thé','café'] },
  { category: 'ENFANTS', keywords: ['bébé','jouets','puériculture','vêtements enfant','jeux éducatifs'] },
  { category: 'AUTO MOTO', keywords: ['automobile','moto','accessoires auto','accessoires moto'] },
  { category: 'B2B', keywords: ['grossiste','fournisseur','industriel','matériel professionnel','emballage','fournitures bureau','équipements professionnels','artisanat'] },
];
export const QUALIFIED_PROSPECTS_TARGET_PER_CATEGORY = 1000;
export const ECOMMERCE_KEYWORD_QUERIES = ECOMMERCE_KEYWORD_LIBRARY.flatMap(({ category, keywords }) => keywords.map((keyword) => ({ category, keyword, query: `${keyword} France` })));

export type Prospect = {
  id: string; nomBoutique: string; siteWeb?: string; instagram?: string; facebook?: string; tiktok?: string; linkedin?: string; whatsapp?: string; email?: string; telephone?: string;
  plateforme: Platform; typeProduits: string; ville: string; pays: string; score: number; classement: Ranking; statutContact: ContactStatus;
  volumeSignaux: string[]; sourceUrl: string; source: ImportSource; sourceReelle: RealSource; shopifyVerified: boolean; productCount?: number; isMonoProduct?: boolean; niche?: string; hasContactForm?: boolean; hasShippingPage?: boolean; hasReturnPolicy?: boolean; professionalDomain?: boolean; instagramActive?: boolean; facebookActive?: boolean; tiktokActive?: boolean; shipsToFrance?: boolean; recentStore?: boolean; strongAdPresence?: boolean; marketplace?: boolean; largeBrand?: boolean; inactiveStore?: boolean; campaignId?: string; notes?: string; lastContactAt?: string; nextFollowUpAt?: string; createdAt: string;
};

export type Campaign = { id: string; nom: string; cible: string; statut: 'draft' | 'active' | 'paused' | 'done'; createdAt: string };
export type SearchCriteria = { platform: Platform | 'Toutes'; productType: string; location: string; keywords: string };
export type ProspectImportDraft = Partial<Prospect> & { nomBoutique: string };
export type ApifyImportResult = { prospects: Prospect[]; rawItems?: Record<string, unknown>[]; query: string; itemsCount: number; insertedCount?: number; duplicateCount?: number; progress?: string[] };
export type ApifyProgressStep = 'token-detected' | 'actor-started' | 'dataset-retrieved' | 'results-found' | 'prospects-inserted';
export type ApifyProgress = { step: ApifyProgressStep; message: string; count?: number };

const DEFAULT_APIFY_MAX_ITEMS = 25;
export const DEFAULT_APIFY_GOOGLE_MAPS_ACTOR_ID = 'clearpath/shopify-store-leads';
export const DEFAULT_APIFY_SHOPIFY_ACTOR_ID = 'clearpath/shopify-store-leads';
export const PRIORITY_SHOPIFY_QUERIES = ECOMMERCE_KEYWORD_QUERIES.map((item) => item.query);
export function qualifiedTargetPerKeyword(keywordCount: number, target = QUALIFIED_PROSPECTS_TARGET_PER_CATEGORY) { return Math.max(1, Math.ceil(target / Math.max(1, keywordCount))); }
export function isQualifiedShopifyProspect(prospect: Partial<Prospect>) { return Boolean(prospect.shopifyVerified && prospect.email && (prospect.instagram || prospect.facebook)); }

const nowIso = () => new Date().toISOString();
const addDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

export const prospectStatuses: ContactStatus[] = ['Nouveau', 'Contacté', 'Relance J+2', 'Relance J+5', 'Client signé'];

export function dedupeKey(input: Partial<Prospect>) {
  const first = [input.email, input.telephone, input.siteWeb, input.instagram, input.tiktok, input.nomBoutique].find(Boolean) ?? crypto.randomUUID();
  return String(first).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[^a-z0-9@.+-]+/g, '').trim();
}

export function detectProspectSignals(input: Partial<Prospect> & { volumeSignaux?: string[] }) {
  const signals = input.volumeSignaux ?? [];
  const haystack = `${input.nomBoutique ?? ''} ${input.siteWeb ?? ''} ${input.pays ?? ''} ${input.ville ?? ''} ${input.typeProduits ?? ''} ${signals.join(' ')} ${input.notes ?? ''}`;
  const productCount = input.productCount ?? (Number((haystack.match(/(?:produits?|products?)\s*(?:détectés?|count)?\s*[:=]?\s*(\d+)/i) ?? [])[1] ?? NaN) || undefined);
  const isMonoProduct = input.isMonoProduct ?? (Boolean(productCount && productCount >= 1 && productCount <= 10) || /mono[- ]?produit|single[- ]?product|1 à 10 produits/i.test(haystack));
  const countryFrance = /France vérifiée|mentions légales françaises|téléphone \+33|adresse France|\bFrance\b|\bFR\b/i.test(haystack);
  const instagramActive = input.instagramActive ?? Boolean(input.instagram && !/instagram inactive|instagram absent/i.test(haystack));
  const facebookActive = input.facebookActive ?? Boolean(input.facebook && !/facebook inactive|facebook absent/i.test(haystack));
  const tiktokActive = input.tiktokActive ?? Boolean(input.tiktok && !/tiktok inactive|tiktok absent/i.test(haystack));
  const hasShippingPage = input.hasShippingPage ?? /page expédition|livraison|shipping|delivery/i.test(haystack);
  const hasReturnPolicy = input.hasReturnPolicy ?? /politique de retour|retours?|returns?|refund/i.test(haystack);
  const hasContactForm = input.hasContactForm ?? /formulaire de contact|contact form|page contact/i.test(haystack);
  const shipsToFrance = input.shipsToFrance ?? /expédition France|livraison France|ships to France|shipping to France/i.test(haystack);
  const professionalDomain = input.professionalDomain ?? Boolean(input.siteWeb && !/(myshopify\.com|wixsite|wordpress\.com|blogspot|example\.)/i.test(input.siteWeb));
  return {
    productCount,
    isMonoProduct,
    niche: input.niche || input.typeProduits || 'e-commerce',
    countryFrance,
    instagramActive,
    facebookActive,
    tiktokActive,
    whatsapp: input.whatsapp || (/whatsapp/i.test(haystack) ? 'WhatsApp détecté' : undefined),
    hasContactForm,
    hasShippingPage,
    hasReturnPolicy,
    professionalDomain,
    shipsToFrance,
    recentStore: input.recentStore ?? /boutique récente|new store|nouvelle boutique|lancée? en 202[4-6]/i.test(haystack),
    strongAdPresence: input.strongAdPresence ?? /Meta Ads|Facebook Ads|TikTok Ads|ads library|publicit[ée] active|forte présence publicitaire/i.test(haystack),
    marketplace: input.marketplace ?? /marketplace|amazon|cdiscount|fnac|rakuten|etsy marketplace|ebay/i.test(haystack),
    largeBrand: input.largeBrand ?? /grande enseigne|carrefour|auchan|leclerc|decathlon|fnac|zara|h&m|sephora|ikea/i.test(haystack),
    inactiveStore: input.inactiveStore ?? /boutique inactive|site inactif|inactive|dernière publication ancienne|rupture générale/i.test(haystack),
  };
}

export function scoreProspect(input: Partial<Prospect> & { volumeSignaux?: string[] }): { score: number; classement: Ranking } {
  const d = detectProspectSignals(input);
  let score = 0;
  if (d.isMonoProduct) score += 30;
  if (input.email) score += 20;
  if (input.telephone) score += 15;
  if (d.countryFrance) score += 15;
  if (d.instagramActive) score += 10;
  if (d.facebookActive) score += 10;
  if (d.tiktokActive) score += 15;
  if (input.shopifyVerified) score += 10;
  if (d.recentStore) score += 10;
  if (d.shipsToFrance) score += 15;
  if (d.strongAdPresence) score += 10;
  if (d.productCount && d.productCount > 100) score -= 30;
  if (d.marketplace) score -= 20;
  if (d.largeBrand) score -= 20;
  if (d.inactiveStore) score -= 15;
  score = Math.max(0, Math.min(100, score));
  return { score, classement: score >= 90 ? 'ultra-chaud' : score >= 75 ? 'chaud' : score >= 50 ? 'moyen' : 'faible' };
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
  return { id: draft.id ?? crypto.randomUUID(), nomBoutique: draft.nomBoutique.trim(), siteWeb: draft.siteWeb?.trim() || undefined, instagram: draft.instagram?.trim() || undefined, facebook: draft.facebook?.trim() || undefined, tiktok: draft.tiktok?.trim() || undefined, linkedin: draft.linkedin?.trim() || undefined, email: draft.email?.trim() || undefined, telephone: draft.telephone?.trim() || undefined, plateforme: draft.plateforme ?? 'Inconnue', typeProduits: draft.typeProduits?.trim() || 'e-commerce', ville: draft.ville?.trim() || 'France', pays: draft.pays?.trim() || 'France', ...scored, ...detectProspectSignals(draft), statutContact: draft.statutContact ?? 'Nouveau', volumeSignaux: draft.volumeSignaux?.filter(Boolean) ?? [], sourceUrl: draft.sourceUrl?.trim() || draft.siteWeb?.trim() || '', source, sourceReelle, campaignId: draft.campaignId, notes: draft.notes, shopifyVerified: draft.shopifyVerified ?? false, lastContactAt: draft.lastContactAt, nextFollowUpAt: draft.nextFollowUpAt, createdAt: draft.createdAt ?? nowIso() };
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
  return { prospects: sortProspects(Array.from(byKey.values())), added, merged };
}

export function sortProspects(prospects: Prospect[]) {
  return [...prospects].sort((a, b) => b.score - a.score || Number(b.shopifyVerified) - Number(a.shopifyVerified) || Number(Boolean(b.email)) - Number(Boolean(a.email)));
}

export function parseCsvProspects(csv: string, source: ImportSource = 'CSV') {
  const [head = '', ...lines] = csv.split(/\r?\n/).filter((line) => line.trim());
  const headers = head.split(',').map((h) => h.trim().toLowerCase());
  return lines.map((line) => {
    const cells = line.match(/("(?:""|[^"])*"|[^,]+)/g)?.map((c)=>c.replace(/^"|"$/g, '').replaceAll('""','"').trim()) ?? [];
    const get = (...names: string[]) => cells[headers.findIndex((h)=>names.includes(h))] || '';
    return normalizeProspect({ nomBoutique: get('nom_boutique','boutique','name','shop_name') || 'Boutique importée', siteWeb: get('site_web','website','url'), instagram: get('instagram'), facebook: get('facebook'), tiktok: get('tiktok'), whatsapp: get('whatsapp'), email: get('email'), telephone: get('telephone','phone'), plateforme: (get('plateforme','platform') as Platform) || (source === 'TikTok Shop' ? 'TikTok Shop' : source === 'Shopify' ? 'Shopify' : source === 'Vinted' ? 'Vinted' : source === 'Etsy' ? 'Etsy' : 'Inconnue'), typeProduits: get('type_produits','products','category'), ville: get('ville','city'), pays: get('pays','country') || 'France', sourceUrl: get('source','source_url','url'), volumeSignaux: get('signaux','signals').split('|').map((s)=>s.trim()).filter(Boolean), sourceReelle: resolveRealSource(source), shopifyVerified: get('shopify_verified','shopifyVerified') === 'true', productCount: Number(get('product_count','products_count','nombre_produits')) || undefined, notes: `Import ${source}` }, source);
  });
}

const asCleanString = (value: unknown) => typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
const firstString = (item: Record<string, unknown>, keys: string[]) => keys.map((key) => asCleanString(item[key])).find(Boolean) ?? '';
const firstNumber = (item: Record<string, unknown>, keys: string[]) => keys.map((key) => Number(item[key])).find((value) => Number.isFinite(value));

export function buildApifyShopifyInput(criteria: SearchCriteria, maxItems = DEFAULT_APIFY_MAX_ITEMS) {
  const product = criteria.productType || '';
  const location = criteria.location || 'France';
  const customQuery = [criteria.keywords, product, location].filter(Boolean).join(' ').trim();
  const queries = Array.from(new Set([customQuery, ...PRIORITY_SHOPIFY_QUERIES].filter(Boolean)));
  const query = queries[0];
  return { query, keyword: query, keywords: queries, search: query, searchQuery: query, searchTerms: queries, queries, maxItems, maxResults: maxItems, limit: maxItems, country: 'France', location, language: 'fr', platform: 'shopify', onlyShopify: true, includeEmails: true, includePhones: true, requireEmail: true, requireSocial: true, requireProducts: true, qualificationRules: ['shopify_verified','email_found','instagram_or_facebook','france_priority'] };
}

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
  const sourceReelle = criteria.platform === 'Toutes' ? 'Inconnue' : resolveRealSource(criteria.platform);

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
    shopifyVerified: false,
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
    return [body.error, typeof body.details === 'string' ? body.details : body.details ? JSON.stringify(body.details) : '', body.message].filter(Boolean).join(' — ') || fallback;
  }
  const text = await res.text().catch(() => '');
  return text || fallback;
}

function normalizeApifyActorId(actorId: string) {
  return actorId.trim().replace(/^https:\/\/api\.apify\.com\/v2\/acts\//, '').replace(/^https:\/\/console\.apify\.com\/actors\//, '').replace(/\//g, '~');
}

export async function fetchApifyProspects(actorId: string, token: string, criteria: SearchCriteria, maxItems = DEFAULT_APIFY_MAX_ITEMS, onProgress?: (progress: ApifyProgress) => void): Promise<ApifyImportResult> {
  const cleanActorId = normalizeApifyActorId(DEFAULT_APIFY_SHOPIFY_ACTOR_ID);
  if (isGoogleMapsActor(actorId || '')) throw new Error('Google Maps est totalement interdit pour Shopify.');
  const cleanToken = token.trim();
  const proxyRes = await fetch('/api/apify-prospects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ shopifyActorId: cleanActorId, token: cleanToken || undefined, criteria: { ...criteria, platform: 'Shopify', location: criteria.location || 'France' }, maxItems }),
  });
  if (!proxyRes.ok) throw new Error(await readApifyError(proxyRes));
  const result = await proxyRes.json() as ApifyImportResult;

  const progressMessages = result?.progress?.length ? result.progress : [
    'Token detected',
    'Actor launched',
    'Dataset retrieved',
    `${result?.itemsCount ?? result?.prospects.length ?? 0} results found`,
    `${result?.insertedCount ?? result?.prospects.length ?? 0} prospects insérés exactement dans Supabase, ${result?.duplicateCount ?? 0} doublons ignorés`,
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
