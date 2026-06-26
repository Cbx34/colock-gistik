export type Platform = 'Shopify' | 'Vinted' | 'TikTok Shop' | 'Etsy' | 'eBay' | 'Dropshipping' | 'Marque e-commerce' | 'Inconnue';
export type Ranking = 'ultra-chaud' | 'chaud' | 'moyen' | 'faible';
export type ContactStatus = 'Nouveau' | 'Contacté' | 'Relance J+3' | 'Relance J+7' | 'Client signé' | 'Supprimé';
export type ImportSource = 'Apify' | 'Shopify' | 'Vinted' | 'TikTok Shop' | 'Etsy' | 'Google Maps' | 'CSV' | 'Démo';
export type RealSource = 'Shopify' | 'Vinted' | 'TikTok Shop' | 'Etsy' | 'Google Maps' | 'CSV' | 'Démo' | 'Inconnue';


export type EcommerceKeywordCategory = { category: string; keywords: string[] };
export const ECOMMERCE_KEYWORD_LIBRARY: EcommerceKeywordCategory[] = [
  { category: 'MODE', keywords: ['mode','vêtements','vêtements femme','vêtements homme','robe','pantalon','jean','chemise','t-shirt','sweat','pull','veste','manteau','chaussures','baskets','sneakers','maroquinerie','sacs','lingerie','bijoux','montres','lunettes','accessoires mode','streetwear','sportswear','costume','casquettes'] },
  { category: 'BEAUTÉ', keywords: ['beauté','cosmétiques','maquillage','parfum','soins visage','soins corps','crème','huile','beauté bio','skincare','savon','shampoing','coiffure','barbier','esthétique','ongles','bien-être'] },
  { category: 'BÉBÉ & ENFANTS', keywords: ['bébé','enfants','jouets','puériculture','vêtements enfant','jeux éducatifs','doudou','naissance','maternité'] },
  { category: 'ANIMAUX', keywords: ['animaux','chien','chat','animalerie','accessoires animaux','alimentation chien','alimentation chat','aquarium'] },
  { category: 'SPORT', keywords: ['sport','fitness','musculation','yoga','running','vélo','cyclisme','randonnée','crossfit','nutrition sportive','natation','tennis','football'] },
  { category: 'MAISON', keywords: ['maison','décoration','meubles','cuisine','salle de bain','rangement','linge de maison','jardin','bricolage','éclairage','LED','bougies','art de la table','plantes'] },
  { category: 'AUTO MOTO OUTDOOR', keywords: ['auto','moto','accessoires auto','accessoires moto','camping','pêche','randonnée','vanlife','outdoor'] },
  { category: 'HIGH-TECH', keywords: ['high-tech','gaming','téléphone','accessoires téléphone','informatique','électronique','domotique','objets connectés','éclairage LED'] },
  { category: 'ARTISANAT & CADEAUX', keywords: ['artisanat','créateurs','papeterie','cadeaux','mariage','bijoux créateur','illustration','affiches','personnalisé'] },
  { category: 'VOYAGE & ÉCOLOGIE', keywords: ['voyage','écologie','zéro déchet','bio','produits naturels','gourde','accessoires voyage','upcycling'] },
  { category: 'ALIMENTAIRE', keywords: ['épicerie','boissons','café','thé','compléments alimentaires','nutrition','chocolat','épices','CBD autorisé'] },
  { category: 'B2B & INDUSTRIE', keywords: ['B2B','industrie','impression 3D','grossiste','fournisseur','matériel professionnel','emballage','fournitures bureau','équipements professionnels'] },
  { category: 'NICHES PERTINENTES', keywords: ['petite marque ecommerce','boutique mono produit','marque DTC','nouvelle marque française','concept store en ligne','boutique Shopify indépendante'] },
];
export const QUALIFIED_PROSPECTS_TARGET_PER_CATEGORY = 1000;
export const ECOMMERCE_KEYWORD_QUERIES = ECOMMERCE_KEYWORD_LIBRARY.flatMap(({ category, keywords }) => keywords.map((keyword) => ({ category, keyword, query: `${keyword} France` })));

export type Prospect = {
  id: string; nomBoutique: string; siteWeb?: string; instagram?: string; facebook?: string; tiktok?: string; linkedin?: string; whatsapp?: string; email?: string; telephone?: string;
  plateforme: Platform; typeProduits: string; ville: string; pays: string; score: number; classement: Ranking; statutContact: ContactStatus;
  volumeSignaux: string[]; sourceUrl: string; source: ImportSource; sourceReelle: RealSource; shopifyVerified: boolean; productCount?: number; isMonoProduct?: boolean; niche?: string; hasContactForm?: boolean; hasShippingPage?: boolean; hasReturnPolicy?: boolean; professionalDomain?: boolean; instagramActive?: boolean; facebookActive?: boolean; tiktokActive?: boolean; shipsToFrance?: boolean; activeStore?: boolean; internalLogistics?: boolean; scoreDetails?: string[]; recentStore?: boolean; strongAdPresence?: boolean; marketplace?: boolean; largeBrand?: boolean; inactiveStore?: boolean; campaignId?: string; notes?: string; lastContactAt?: string; nextFollowUpAt?: string; createdAt: string;
};

export type Campaign = { id: string; nom: string; cible: string; statut: 'draft' | 'active' | 'paused' | 'done'; createdAt: string };
export type SearchCriteria = { platform: Platform | 'Toutes'; productType: string; location: string; keywords: string };
export type ProspectImportDraft = Partial<Prospect> & { nomBoutique: string };
export type RejectedProspect = { id: string; nomBoutique: string; siteWeb?: string; score: number; reason: string; raw?: Record<string, unknown> };
export type ImportReport = { rawCount: number; normalizedCount: number; insertedCount: number; duplicateCount: number; rejectedCount: number; rejectionReasons: Record<string, number>; supabaseErrors?: string[] };
export type ApifyImportResult = { prospects: Prospect[]; rejectedProspects?: RejectedProspect[]; report?: ImportReport; rawItems?: Record<string, unknown>[]; query: string; itemsCount: number; insertedCount?: number; duplicateCount?: number; progress?: string[] };
export type AutoProspectingQuota = 100 | 500 | 1000 | 'illimité';
export type AutoSearchHistoryEntry = { id: string; country: string; niche: string; keyword: string; query: string; searchedAt: string; insertedCount: number; duplicateCount: number; qualifiedCount: number };
export type ProspectChannelMessages = { email: string; linkedin: string; instagram: string; sms: string; followUpJ3: string; followUpJ7: string };
export const AUTO_PROSPECTING_COUNTRIES = ['France', 'Belgique', 'Suisse', 'Luxembourg'];
export const AUTO_PROSPECTING_QUOTAS: AutoProspectingQuota[] = [100, 500, 1000, 'illimité'];
export type ApifyProgressStep = 'token-detected' | 'actor-started' | 'dataset-retrieved' | 'results-found' | 'prospects-inserted';
export type ApifyProgress = { step: ApifyProgressStep; message: string; count?: number };

const DEFAULT_APIFY_MAX_ITEMS = 25;
export const DEFAULT_APIFY_GOOGLE_MAPS_ACTOR_ID = 'clearpath/shopify-store-leads';
export const DEFAULT_APIFY_SHOPIFY_ACTOR_ID = 'clearpath/shopify-store-leads';
export const COLOCK_PRIORITY_KEYWORDS = ['mono-produit','dropshipping France','bijoux','cosmétique','vêtements femme','vêtements homme','accessoires','maroquinerie','bébé','jouets','décoration','bougies','animalerie','sport','nutrition sportive','cartes Pokémon','figurines','cadeaux personnalisés','produits personnalisés'];
export const PRIORITY_SHOPIFY_QUERIES = Array.from(new Set([...COLOCK_PRIORITY_KEYWORDS.map((keyword) => `${keyword} France`), ...ECOMMERCE_KEYWORD_QUERIES.map((item) => item.query)]));
export function qualifiedTargetPerKeyword(keywordCount: number, target = QUALIFIED_PROSPECTS_TARGET_PER_CATEGORY) { return Math.max(1, Math.ceil(target / Math.max(1, keywordCount))); }
export function isQualifiedShopifyProspect(prospect: Partial<Prospect>) { return Boolean(prospect.shopifyVerified && (prospect.email || prospect.telephone || prospect.hasContactForm) && (prospect.score ?? 0) > 65); }
export function isPriorityProspect(prospect: Partial<Prospect>) { return isQualifiedShopifyProspect(prospect) && /France|Belgique|Suisse|Luxembourg|francophone/i.test(`${prospect.pays ?? ''} ${prospect.ville ?? ''} ${prospect.volumeSignaux?.join(' ') ?? ''}`); }

const nowIso = () => new Date().toISOString();
const addDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

export const prospectStatuses: ContactStatus[] = ['Nouveau', 'Contacté', 'Relance J+3', 'Relance J+7', 'Client signé'];

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
    activeStore: input.activeStore ?? /add[- ]?to[- ]?cart|checkout|panier|nouveaut[ée]s|en stock|prix|€/i.test(haystack),
    internalLogistics: input.internalLogistics ?? /logistique interne|notre entrep[oô]t|nos entrep[oô]ts|exp[ée]di[ée]s? par nos soins|pr[ée]par[ée]s? dans nos ateliers|depuis notre atelier/i.test(haystack),
    recentStore: input.recentStore ?? /boutique récente|new store|nouvelle boutique|lancée? en 202[4-6]/i.test(haystack),
    strongAdPresence: input.strongAdPresence ?? /Meta Ads|Facebook Ads|TikTok Ads|ads library|publicit[ée] active|forte présence publicitaire/i.test(haystack),
    marketplace: input.marketplace ?? /marketplace|amazon|cdiscount|fnac|rakuten|etsy marketplace|ebay/i.test(haystack),
    largeBrand: input.largeBrand ?? /grande enseigne|carrefour|auchan|leclerc|decathlon|fnac|zara|h&m|sephora|ikea/i.test(haystack),
    inactiveStore: input.inactiveStore ?? /boutique inactive|site inactif|inactive|dernière publication ancienne|rupture générale/i.test(haystack),
  };
}

export function scoreProspectDetailed(input: Partial<Prospect> & { volumeSignaux?: string[] }): { score: number; classement: Ranking; details: string[] } {
  const d = detectProspectSignals(input);
  const lines: { label: string; points: number; ok: boolean }[] = [
    { label: 'Shopify vérifié', points: 20, ok: Boolean(input.shopifyVerified) },
    { label: 'Email trouvé', points: 25, ok: Boolean(input.email) },
    { label: 'Téléphone trouvé', points: 15, ok: Boolean(input.telephone) },
    { label: 'Formulaire de contact détecté', points: 15, ok: Boolean(d.hasContactForm) },
    { label: 'Zone France/francophone', points: 15, ok: Boolean(d.countryFrance) },
    { label: 'Instagram actif', points: 8, ok: Boolean(d.instagramActive) },
    { label: 'Facebook actif', points: 8, ok: Boolean(d.facebookActive) },
    { label: 'TikTok actif', points: 8, ok: Boolean(d.tiktokActive) },
    { label: 'WhatsApp détecté', points: 5, ok: Boolean(d.whatsapp) },
    { label: 'Mono-produit', points: 12, ok: Boolean(d.isMonoProduct || (d.productCount && d.productCount <= 10)) },
    { label: 'Petite boutique', points: 8, ok: Boolean(d.productCount && d.productCount > 10 && d.productCount <= 50) },
    { label: 'Livraison/expéditions présentes', points: 10, ok: Boolean(d.hasShippingPage || d.shipsToFrance) },
    { label: 'Boutique active', points: 10, ok: !d.inactiveStore },
    { label: 'Logistique interne détectée', points: -10, ok: Boolean(d.internalLogistics) },
    { label: 'Marketplace détectée', points: -30, ok: Boolean(d.marketplace) },
    { label: 'Grande enseigne détectée', points: -30, ok: Boolean(d.largeBrand) },
    { label: 'Catalogue > 100 produits', points: -20, ok: Boolean(d.productCount && d.productCount > 100) },
    { label: 'Boutique inactive', points: -20, ok: Boolean(d.inactiveStore) },
    { label: 'Aucun contact qualifiant', points: -20, ok: !input.email && !input.telephone && !d.hasContactForm },
    { label: 'Hors Europe francophone', points: -15, ok: !d.countryFrance && /hors Europe francophone|outside french europe/i.test(`${input.notes ?? ''} ${input.volumeSignaux?.join(' ') ?? ''}`) },
  ];
  const applied = lines.filter((line) => line.ok);
  const score = Math.max(0, Math.min(100, applied.reduce((sum, line) => sum + line.points, 0)));
  return { score, classement: score >= 85 ? 'ultra-chaud' : score >= 65 ? 'chaud' : score >= 40 ? 'moyen' : 'faible', details: applied.map((line) => `${line.points > 0 ? '+' : ''}${line.points} ${line.label}`) };
}

export function scoreProspect(input: Partial<Prospect> & { volumeSignaux?: string[] }): { score: number; classement: Ranking } {
  const { score, classement } = scoreProspectDetailed(input);
  return { score, classement };
}

export function resolveRealSource(platform: SearchCriteria['platform'] | Platform | ImportSource): RealSource {
  if (platform === 'Shopify' || platform === 'Vinted' || platform === 'TikTok Shop' || platform === 'Etsy' || platform === 'Google Maps' || platform === 'CSV' || platform === 'Démo') return platform;
  return 'Inconnue';
}

export function isGoogleMapsActor(actorId: string) {
  return /google[-_~ ]?(maps|places)|crawler[-_~ ]?google[-_~ ]?places/i.test(actorId);
}

export function normalizeProspect(draft: ProspectImportDraft, source: ImportSource = 'CSV'): Prospect {
  const scored = scoreProspectDetailed(draft);
  const sourceReelle = draft.sourceReelle ?? resolveRealSource(source === 'Apify' ? draft.plateforme ?? 'Inconnue' : source);
  return { id: draft.id ?? crypto.randomUUID(), nomBoutique: draft.nomBoutique.trim(), siteWeb: draft.siteWeb?.trim() || undefined, instagram: draft.instagram?.trim() || undefined, facebook: draft.facebook?.trim() || undefined, tiktok: draft.tiktok?.trim() || undefined, linkedin: draft.linkedin?.trim() || undefined, email: draft.email?.trim() || undefined, telephone: draft.telephone?.trim() || undefined, plateforme: draft.plateforme ?? 'Inconnue', typeProduits: draft.typeProduits?.trim() || 'e-commerce', ville: draft.ville?.trim() || 'France', pays: draft.pays?.trim() || 'France', score: scored.score, classement: scored.classement, scoreDetails: scored.details, ...detectProspectSignals(draft), statutContact: draft.statutContact ?? 'Nouveau', volumeSignaux: draft.volumeSignaux?.filter(Boolean) ?? [], sourceUrl: draft.sourceUrl?.trim() || draft.siteWeb?.trim() || '', source, sourceReelle, campaignId: draft.campaignId, notes: draft.notes, shopifyVerified: draft.shopifyVerified ?? false, lastContactAt: draft.lastContactAt, nextFollowUpAt: draft.nextFollowUpAt, createdAt: draft.createdAt ?? nowIso() };
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
  return { query, keyword: query, keywords: queries, search: query, searchQuery: query, searchTerms: queries, queries, maxItems, maxResults: maxItems, limit: maxItems, country: location, location, language: 'fr', platform: 'shopify', onlyShopify: true, includeEmails: true, includePhones: true, requireEmail: false, requireSocial: false, requireProducts: false, qualificationRules: ['shopify_verified_preferred','keep_without_email','keep_without_phone','keep_without_social','colock_score_100'] };
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

export async function enrichExistingProspects(onProgress?: (progress: ApifyProgress) => void): Promise<ApifyImportResult> {
  const proxyRes = await fetch('/api/apify-prospects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode: 'enrich-existing' }),
  });
  if (!proxyRes.ok) throw new Error(await readApifyError(proxyRes));
  const result = await proxyRes.json() as ApifyImportResult;
  (result.progress ?? []).forEach((message) => onProgress?.({ step: 'prospects-inserted', message }));
  return result;
}

export function generateMessage(prospect: Prospect, step: 0 | 3 | 7 = 0) {
  const firstLine = prospect.typeProduits ? `J’ai vu votre boutique ${prospect.nomBoutique} autour de ${prospect.typeProduits}.` : `J’ai vu votre boutique ${prospect.nomBoutique}.`;
  const local = prospect.ville ? ` depuis Montpellier / Lavérune / Le Crès vers vos clients` : ' depuis Montpellier / Lavérune / Le Crès';
  const base = `${firstLine}

Chez Colock-Gistik, nous aidons les vendeurs e-commerce à externaliser la réception marchandise, le stockage, la préparation colis, l’emballage et l’expédition multi-transporteurs${local}.

Si vous expédiez régulièrement des colis, je peux vous proposer une solution simple pour gagner du temps sans recruter ni louer plus d’espace.

Est-ce que je peux vous envoyer une estimation rapide adaptée à vos volumes ?

Bonne journée,
L’équipe Colock-Gistik`;
  const relances: Record<3 | 7, string> = {
    3: `Bonjour,

Je me permets une relance rapide concernant ${prospect.nomBoutique}. Si vos commandes augmentent, Colock-Box peut prendre en charge stockage, préparation et expédition depuis la métropole de Montpellier.

Souhaitez-vous que je vous envoie une proposition courte ?`,
    7: `Bonjour,

Je reviens vers vous une dernière fois cette semaine. Nous accompagnons des petites marques e-commerce qui veulent expédier plus vite sans gérer l’entrepôt au quotidien.

Si ce n’est pas le bon moment, dites-le moi et je ne vous relancerai pas.`,
  };
  return step === 0 ? base : relances[step];
}

export function generateChannelMessages(prospect: Prospect): ProspectChannelMessages {
  const niche = prospect.niche || prospect.typeProduits || 'votre boutique';
  const email = generateMessage(prospect);
  const linkedin = `Bonjour, j’ai repéré ${prospect.nomBoutique} (${niche}). Colock-Box peut vous aider à stocker, préparer et expédier vos colis depuis Montpellier sans recruter. Ouvert à un échange de 10 minutes ?`;
  const instagram = `Bonjour ${prospect.nomBoutique} 👋 J’ai vu vos produits ${niche}. Colock-Box peut gérer stockage + préparation + expédition pour les petites marques Shopify. Je peux vous envoyer une estimation simple ?`;
  const sms = `Bonjour, ici Colock-Box. J’ai repéré ${prospect.nomBoutique}; nous aidons les boutiques e-commerce à externaliser stockage/préparation/expédition. Intéressé(e) par une estimation rapide ?`;
  return { email, linkedin, instagram, sms, followUpJ3: generateMessage(prospect, 3), followUpJ7: generateMessage(prospect, 7) };
}

export function buildSearchLinks(criteria: SearchCriteria) { const target = [criteria.platform !== 'Toutes' ? criteria.platform : 'e-commerce', criteria.productType, criteria.location, criteria.keywords].filter(Boolean).join(' '); return [{ label: 'Google boutiques', url: `https://www.google.com/search?q=${encodeURIComponent(`${target} contact livraison colis`)}` }, { label: 'Instagram', url: `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com ${target} boutique`)}` }, { label: 'TikTok', url: `https://www.google.com/search?q=${encodeURIComponent(`site:tiktok.com ${target} shop`)}` }, { label: 'Etsy', url: `https://www.etsy.com/search/shops?search_query=${encodeURIComponent(criteria.productType || criteria.keywords || 'france')}` }]; }
const templates = [['Maison Luma','https://maison-luma.example','@maisonluma','','','contact@maison-luma.example','','Shopify','décoration maison','Montpellier',['mentions expédition 24/48h','nouveautés chaque semaine','avis clients nombreux']], ['GlowCase FR','https://glowcase.example','@glowcasefr','@glowcasefr','','hello@glowcase.example','','TikTok Shop','accessoires téléphone','France',['live shopping','promos quotidiennes','dropshipping probable']]] as const;
export function mockProspectSearch(criteria: SearchCriteria): Prospect[] { return templates.filter((row) => criteria.platform === 'Toutes' || row[7] === criteria.platform).map((row, index) => normalizeProspect({ nomBoutique: row[0], siteWeb: row[1], instagram: row[2], tiktok: row[3], linkedin: row[4], email: row[5], telephone: row[6], plateforme: row[7] as Platform, typeProduits: criteria.productType || row[8], ville: criteria.location || row[9], pays: 'France', volumeSignaux: [...row[10]], sourceUrl: row[1], sourceReelle: resolveRealSource(row[7] as Platform), nextFollowUpAt: addDays(index + 2), notes: 'Donnée publique à vérifier avant contact.' }, 'Démo')); }
export const followUpDays = [3, 7];
export function defaultCampaigns(): Campaign[] { return [{ id: crypto.randomUUID(), nom: 'E-commerce Sud France', cible: 'Shopify, TikTok Shop et marques e-commerce Occitanie', statut: 'active', createdAt: nowIso() }]; }
