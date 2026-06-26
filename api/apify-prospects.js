const { randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_ACTOR_ID = 'clearpath~shopify-store-leads';
const DEFAULT_SHOPIFY_ACTOR_ID = 'clearpath~shopify-store-leads';
const DEFAULT_MAX_ITEMS = 25;
const SELECTABLE_SOURCES = ['Shopify', 'Vinted', 'TikTok Shop', 'Etsy', 'Google Maps'];
const REQUIRED_SHOPIFY_ACTOR_ID = 'clearpath~shopify-store-leads';

const COLOCK_PRIORITY_KEYWORDS = ['mono-produit','dropshipping France','bijoux','cosmétique','vêtements femme','vêtements homme','accessoires','maroquinerie','bébé','jouets','décoration','bougies','animalerie','sport','nutrition sportive','cartes Pokémon','figurines','cadeaux personnalisés','produits personnalisés'];
const ECOMMERCE_KEYWORD_LIBRARY = [
  { category: 'PRIORITÉS COLOCK-GISTIK', keywords: COLOCK_PRIORITY_KEYWORDS },
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
const QUALIFIED_PROSPECTS_TARGET_PER_CATEGORY = 1000;
const ECOMMERCE_KEYWORD_QUERIES = ECOMMERCE_KEYWORD_LIBRARY.flatMap(({ keywords }) => keywords.map((keyword) => `${keyword} France`));
const PRIORITY_SHOPIFY_QUERIES = Array.from(new Set([...COLOCK_PRIORITY_KEYWORDS.map((keyword) => `${keyword} France`), ...ECOMMERCE_KEYWORD_QUERIES]));
const qualifiedTargetPerKeyword = (keywordCount, target = QUALIFIED_PROSPECTS_TARGET_PER_CATEGORY) => Math.max(1, Math.ceil(target / Math.max(1, keywordCount)));
const hasRequiredSocial = (prospect) => Boolean(asString(prospect.instagram) || asString(prospect.facebook));
const isQualifiedShopifyProspect = (prospect) => Boolean(prospect.shopifyVerified && (asString(prospect.email) || asString(prospect.telephone) || prospect.hasContactForm) && (prospect.score || 0) > 65);
const SHOPIFY_MARKERS = [/cdn\.shopify\.com/i, /myshopify\.com/i];
const CONTACT_PATHS = ['/', '/contact', '/pages/contact', '/pages/contact-us', '/a-propos', '/pages/a-propos', '/about', '/pages/about-us', '/livraison', '/pages/livraison', '/pages/expedition', '/shipping', '/policies/shipping-policy', '/mentions-legales', '/pages/mentions-legales', '/legal-notice', '/conditions-generales', '/pages/conditions-generales', '/policies/terms-of-service', '/policies/privacy-policy', '/policies/refund-policy', '/pages/retours', '/sitemap.xml'];
const EMAIL_REGEX = /[A-Z0-9._%+-]+(?:\s*(?:\[at\]|\(at\)|@)\s*)[A-Z0-9.-]+(?:\s*(?:\[dot\]|\(dot\)|\.)\s*)[A-Z]{2,}/gi;
const PHONE_REGEX = /(?:(?:\+33|0033)\s*(?:\(0\)\s*)?|0)\s*[1-9](?:[\s.()-]*\d{2}){4}/g;
const SOCIAL_HOSTS = { instagram: 'instagram.com', facebook: 'facebook.com', tiktok: 'tiktok.com', linkedin: 'linkedin.com', whatsapp: 'wa.me' };
const EXCLUDED_PLATFORM_MARKERS = [/wp-content\//i, /woocommerce/i, /prestashop/i, /prestashop-/i, /wixstatic\.com/i, /x-wix-/i, /static\.parastorage\.com/i];
const EXCLUDED_SHOPIFY_LEAD_MARKERS = [/carrefour/i, /grande enseigne/i, /hypermarch[ée]/i, /supermarch[ée]/i, /garde[- ]?meubles?/i, /self[- ]?stockage/i, /d[ée]m[ée]nage/i, /moving company/i, /magasin physique/i, /click and collect uniquement/i];
const FRANCOPHONE_COUNTRY_MARKERS = [/\bfrance\b|\bfr\b/i, /\bbelgique\b|\bbelgium\b|\bbe\b/i, /\bsuisse\b|\bswitzerland\b|\bch\b/i, /\bluxembourg\b|\blu\b/i];
const EXCLUDED_FRANCE_COUNTRY_MARKERS = [/\bcanada\b|\bcanadian\b|\bca\b/i, /\busa\b|\bunited states\b|\bus\b/i, /\buk\b|\bunited kingdom\b/i, /\bespagne\b|\bspain\b/i, /\bitalie\b|\bitaly\b/i, /\ballemagne\b|\bgermany\b/i];
const FRENCH_LEGAL_MARKERS = [/\bSIRET\b/i, /\bSIREN\b/i, /\bRCS\s+[A-ZÀ-ÿ-]+/i, /TVA\s+(intracommunautaire|FR)/i, /\bAPE\b|\bNAF\b/i, /soci[ée]t[ée]\s+(par actions simplifi[ée]e|à responsabilit[ée] limit[ée]e|immatricul[ée]e)/i, /mentions?\s+l[ée]gales?/i];

const asString = (value) => (typeof value === 'string' ? value.trim() : '');
const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const nowIso = () => new Date().toISOString();
const normalizeSite = (value) => asString(value).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const normalizeEmail = (value) => asString(value).toLowerCase();
const isDuplicateError = (error) => error?.code === '23505' || /duplicate key value violates unique constraint/i.test(error?.message || '');
const PROSPECT_SIGNAL_COLUMNS = ['whatsapp','product_count','is_mono_product','niche','has_contact_form','has_shipping_page','has_return_policy','professional_domain','instagram_active','facebook_active','tiktok_active','ships_to_france','active_store','internal_logistics','recent_store','strong_ad_presence','marketplace','large_brand','inactive_store'];
const PROSPECT_CHECK_CONSTRAINTS = {
  prospects_score_check: { column: 'score', allowed: 'integer between 0 and 100' },
  prospects_classement_check: { column: 'classement', allowed: 'ultra-chaud, chaud, moyen, faible' },
  prospects_statut_contact_check: { column: 'statut_contact', allowed: 'Nouveau, Contacté, Relance J+3, Relance J+7, Client signé, Supprimé' },
  prospects_source_check: { column: 'source', allowed: 'Apify, Shopify, Vinted, TikTok Shop, Etsy, Google Maps, CSV, Démo' },
  prospects_source_reelle_check: { column: 'source_reelle', allowed: 'Shopify, Vinted, TikTok Shop, Etsy, Google Maps, CSV, Démo, Inconnue' },
};
const getCheckConstraintName = (error) => {
  const haystack = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ');
  return Object.keys(PROSPECT_CHECK_CONSTRAINTS).find((name) => haystack.includes(name)) || '';
};
const describeCheckViolation = (error, row = {}) => {
  const constraint = getCheckConstraintName(error);
  if (!constraint) return null;
  const info = PROSPECT_CHECK_CONSTRAINTS[constraint];
  return {
    constraint,
    column: info.column,
    rejectedValue: row[info.column],
    allowed: info.allowed,
  };
};
const isCheckViolation = (error) => error?.code === '23514' || Boolean(getCheckConstraintName(error));
const firstString = (item, keys) => keys.map((key) => asString(item[key] == null ? '' : String(item[key]))).find(Boolean) || '';
const firstNumber = (item, keys) => keys.map((key) => Number(item[key])).find((value) => Number.isFinite(value));
const describeError = (error) => {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  return { message: String(error), raw: error };
};
const formatSupabaseError = (error, context = {}) => {
  const details = {
    message: error?.message || String(error),
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    ...context,
  };
  return Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
    .join(' | ');
};
const logError = (message, error, context = {}) => {
  console.error(message, { ...context, error: describeError(error) });
};
const isGoogleMapsActor = (actorId) => /google[-_~ ]?(maps|places)|crawler[-_~ ]?google[-_~ ]?places/i.test(actorId);
const resolveRealSource = (platform) => SELECTABLE_SOURCES.includes(platform) ? platform : 'Google Maps';

const normalizeActorId = (actorId) => {
  const normalized = asString(actorId || DEFAULT_ACTOR_ID)
    .replace(/^https:\/\/api\.apify\.com\/v2\/acts\//, '')
    .replace(/^https:\/\/console\.apify\.com\/actors\//, '')
    .replace(/\/runs.*$/, '')
    .replace(/\/input.*$/, '')
    .replace(/\//g, '~');
  return normalized || DEFAULT_ACTOR_ID;
};

function readEnv(...names) {
  return names.map((name) => asString(process.env[name])).find(Boolean) || '';
}

async function readApiError(response) {
  const fallback = `Erreur API (${response.status})`;
  const text = await response.text().catch(() => '');
  if (!text) return fallback;
  try {
    const json = JSON.parse(text);
    return json?.error?.message || json?.error || json?.message || text;
  } catch {
    return text;
  }
}

function detectProspectSignals(input) {
  const signals = input.volumeSignaux || [];
  const haystack = `${input.nomBoutique || ''} ${input.siteWeb || ''} ${input.pays || ''} ${input.ville || ''} ${input.typeProduits || ''} ${signals.join(' ')} ${input.notes || ''}`;
  const productCount = input.productCount || (Number(((haystack.match(/(?:produits?|products?)\s*(?:détectés?|count)?\s*[:=]?\s*(\d+)/i) || [])[1]) || NaN) || undefined);
  const isMonoProduct = input.isMonoProduct ?? (Boolean(productCount && productCount >= 1 && productCount <= 10) || /mono[- ]?produit|single[- ]?product|1 à 10 produits/i.test(haystack));
  return {
    productCount,
    isMonoProduct,
    niche: input.niche || input.typeProduits || 'e-commerce',
    countryFrance: /France vérifiée|mentions légales françaises|téléphone \+33|adresse France|\bFrance\b|\bFR\b/i.test(haystack),
    instagramActive: input.instagramActive ?? Boolean(input.instagram && !/instagram inactive|instagram absent/i.test(haystack)),
    facebookActive: input.facebookActive ?? Boolean(input.facebook && !/facebook inactive|facebook absent/i.test(haystack)),
    tiktokActive: input.tiktokActive ?? Boolean(input.tiktok && !/tiktok inactive|tiktok absent/i.test(haystack)),
    whatsapp: input.whatsapp || (/whatsapp/i.test(haystack) ? 'WhatsApp détecté' : undefined),
    hasContactForm: input.hasContactForm ?? /formulaire de contact|contact form|page contact/i.test(haystack),
    hasShippingPage: input.hasShippingPage ?? /page expédition|livraison|shipping|delivery/i.test(haystack),
    hasReturnPolicy: input.hasReturnPolicy ?? /politique de retour|retours?|returns?|refund/i.test(haystack),
    professionalDomain: input.professionalDomain ?? Boolean(input.siteWeb && !/(myshopify\.com|wixsite|wordpress\.com|blogspot|example\.)/i.test(input.siteWeb)),
    shipsToFrance: input.shipsToFrance ?? /expédition France|livraison France|ships to France|shipping to France/i.test(haystack),
    activeStore: input.activeStore ?? /add[- ]?to[- ]?cart|checkout|panier|nouveaut[ée]s|en stock|prix|€/i.test(haystack),
    internalLogistics: input.internalLogistics ?? /logistique interne|notre entrep[oô]t|nos entrep[oô]ts|exp[ée]di[ée]s? par nos soins|pr[ée]par[ée]s? dans nos ateliers|depuis notre atelier/i.test(haystack),
    recentStore: input.recentStore ?? /boutique récente|new store|nouvelle boutique|lancée? en 202[4-6]/i.test(haystack),
    strongAdPresence: input.strongAdPresence ?? /Meta Ads|Facebook Ads|TikTok Ads|ads library|publicit[ée] active|forte présence publicitaire/i.test(haystack),
    marketplace: input.marketplace ?? /marketplace|amazon|cdiscount|fnac|rakuten|etsy marketplace|ebay/i.test(haystack),
    largeBrand: input.largeBrand ?? /grande enseigne|carrefour|auchan|leclerc|decathlon|fnac|zara|h&m|sephora|ikea/i.test(haystack),
    inactiveStore: input.inactiveStore ?? /boutique inactive|site inactif|inactive|dernière publication ancienne|rupture générale/i.test(haystack),
  };
}

function scoreProspect(input) {
  const { score, classement } = scoreProspectDetailed(input);
  return { score, classement };
}


function normalizeProspect(draft, source = 'Apify') {
  const scored = scoreProspect(draft);
  const sourceReelle = draft.sourceReelle || resolveRealSource(draft.plateforme);
  return {
    id: draft.id || randomUUID(),
    nomBoutique: draft.nomBoutique.trim(),
    siteWeb: draft.siteWeb?.trim() || undefined,
    instagram: draft.instagram?.trim() || undefined,
    tiktok: draft.tiktok?.trim() || undefined,
    linkedin: draft.linkedin?.trim() || undefined,
    facebook: draft.facebook?.trim() || undefined,
    email: draft.email?.trim() || undefined,
    telephone: draft.telephone?.trim() || undefined,
    whatsapp: draft.whatsapp?.trim() || undefined,
    plateforme: draft.plateforme || 'Inconnue',
    typeProduits: draft.typeProduits?.trim() || 'e-commerce',
    ville: draft.ville?.trim() || 'France',
    pays: draft.pays?.trim() || 'France',
    score: scored.score,
    classement: scored.classement,
    scoreDetails: scored.details.map((item) => `${item.points > 0 ? '+' : ''}${item.points} ${item.label}`),
    ...detectProspectSignals(draft),
    statutContact: 'Nouveau',
    volumeSignaux: draft.volumeSignaux?.filter(Boolean) || [],
    sourceUrl: draft.sourceUrl?.trim() || draft.siteWeb?.trim() || '',
    source,
    sourceReelle,
    shopifyVerified: draft.shopifyVerified || false,
    notes: draft.notes,
    createdAt: draft.createdAt || nowIso(),
  };
}

function toDb(p, includeSourceReelle = true, includeShopifyVerified = true, includeFacebook = true, includeSignalColumns = PROSPECT_SIGNAL_COLUMNS) {
  const row = { id: p.id, nom_boutique: p.nomBoutique, site_web: p.siteWeb, instagram: p.instagram, tiktok: p.tiktok, linkedin: p.linkedin, email: p.email, telephone: p.telephone, plateforme: p.plateforme, type_produits: p.typeProduits, ville: p.ville, pays: p.pays, score: p.score, classement: p.classement, statut_contact: p.statutContact, volume_signaux: p.volumeSignaux, source_url: p.sourceUrl, source: p.source, notes: p.notes, created_at: p.createdAt };
  if (includeFacebook) row.facebook = p.facebook;
  const signalValues = { whatsapp: p.whatsapp, product_count: p.productCount, is_mono_product: p.isMonoProduct, niche: p.niche, has_contact_form: p.hasContactForm, has_shipping_page: p.hasShippingPage, has_return_policy: p.hasReturnPolicy, professional_domain: p.professionalDomain, instagram_active: p.instagramActive, facebook_active: p.facebookActive, tiktok_active: p.tiktokActive, ships_to_france: p.shipsToFrance, active_store: p.activeStore, internal_logistics: p.internalLogistics, recent_store: p.recentStore, strong_ad_presence: p.strongAdPresence, marketplace: p.marketplace, large_brand: p.largeBrand, inactive_store: p.inactiveStore };
  Object.entries(signalValues).forEach(([key, value]) => { if (includeSignalColumns.includes(key)) row[key] = value; });
  if (includeSourceReelle) row.source_reelle = p.sourceReelle || 'Google Maps';
  if (includeShopifyVerified) row.shopify_verified = p.shopifyVerified || false;
  return row;
}

const isMissingShopifyVerifiedColumn = (error) => error?.code === 'PGRST204' || /shopify_verified|schema cache|Could not find .* column/i.test([error?.message, error?.details, error?.hint].filter(Boolean).join(' '));
const isMissingSourceReelleColumn = (error) => error?.code === 'PGRST204' || /source_reelle|schema cache|Could not find .* column/i.test([error?.message, error?.details, error?.hint].filter(Boolean).join(' '));
const isMissingFacebookColumn = (error) => error?.code === 'PGRST204' || /facebook|schema cache|Could not find .* column/i.test([error?.message, error?.details, error?.hint].filter(Boolean).join(' '));
const missingSignalColumn = (error) => PROSPECT_SIGNAL_COLUMNS.find((column) => [error?.message, error?.details, error?.hint].filter(Boolean).join(' ').includes(column)) || '';

async function detectOptionalProspectColumns(supabase) {
  const [sourceReelleProbe, shopifyVerifiedProbe, facebookProbe, signalProbe] = await Promise.all([
    supabase.from('prospects').select('source_reelle').limit(1),
    supabase.from('prospects').select('shopify_verified').limit(1),
    supabase.from('prospects').select('facebook').limit(1),
    supabase.from('prospects').select(PROSPECT_SIGNAL_COLUMNS.join(',')).limit(1),
  ]);
  return {
    sourceReelle: !sourceReelleProbe.error || !isMissingSourceReelleColumn(sourceReelleProbe.error),
    shopifyVerified: !shopifyVerifiedProbe.error || !isMissingShopifyVerifiedColumn(shopifyVerifiedProbe.error),
    facebook: !facebookProbe.error || !isMissingFacebookColumn(facebookProbe.error),
    signalColumns: signalProbe.error ? [] : PROSPECT_SIGNAL_COLUMNS.slice(),
  };
}

async function verifyShopifySite(siteWeb) {
  const base = asString(siteWeb);
  if (!base) return { verified: false, reason: 'site absent' };
  const url = /^https?:\/\//i.test(base) ? base : `https://${base}`;
  try {
    const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 Colock Shopify verifier' } });
    const html = await response.text();
    const haystack = `${response.url} ${html.slice(0, 250000)}`;
    if (EXCLUDED_PLATFORM_MARKERS.some((marker) => marker.test(haystack))) return { verified: false, reason: 'plateforme exclue détectée' };
    if (SHOPIFY_MARKERS.some((marker) => marker.test(haystack))) return { verified: true, reason: 'signature Shopify cdn.shopify.com/myshopify.com détectée' };
    return { verified: false, reason: 'signature Shopify absente' };
  } catch (error) {
    return { verified: false, reason: error instanceof Error ? error.message : 'vérification impossible' };
  }
}

function buildApifyShopifyInput(criteria, maxItems = DEFAULT_MAX_ITEMS) {
  const product = criteria.productType || '';
  const location = criteria.location || 'France';
  const customQuery = [criteria.keywords, product, location].filter(Boolean).join(' ').trim();
  const queries = Array.from(new Set([customQuery, ...PRIORITY_SHOPIFY_QUERIES].filter(Boolean)));
  return {
    query: queries[0],
    keyword: queries[0],
    keywords: queries,
    search: queries[0],
    searchQuery: queries[0],
    searchTerms: queries,
    queries,
    maxItems,
    maxResults: maxItems,
    limit: maxItems,
    country: 'France',
    location,
    language: 'fr',
    platform: 'shopify',
    onlyShopify: true,
    includeEmails: true,
    includePhones: true,
    requireEmail: false,
    requireSocial: false,
    requireProducts: false,
    qualificationRules: ['shopify_verified_preferred', 'keep_without_email', 'keep_without_phone', 'keep_without_social', 'colock_score_100'],
  };
}

function buildApifyGoogleMapsInput(criteria, maxItems = DEFAULT_MAX_ITEMS) {
  const platform = criteria.platform !== 'Toutes' ? criteria.platform : 'boutique e-commerce';
  const product = criteria.productType || 'colis expédition';
  const location = criteria.location || 'Montpellier';
  const baseQuery = [criteria.keywords, platform, product, location].filter(Boolean).join(' ');
  return {
    searchStringsArray: Array.from(new Set([baseQuery, `${platform} ${location}`, `boutique colis expédition ${location}`].filter(Boolean))),
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


function absoluteUrl(base, path) {
  const raw = asString(base);
  if (!raw) return '';
  try {
    const root = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return new URL(path, root.origin).toString();
  } catch { return ''; }
}


function discoverQualificationLinks(html, siteWeb) {
  const hrefs = Array.from(String(html || '').matchAll(/href=["']([^"']+)["']/gi)).map((match) => match[1]);
  const wanted = /(contact|a-propos|about|livraison|shipping|expedition|mentions|legal|privacy|confidentialit|politique|conditions)/i;
  return hrefs
    .filter((href) => wanted.test(href) && !/^(mailto:|tel:|#|javascript:)/i.test(href))
    .map((href) => {
      try { return new URL(href, absoluteUrl(siteWeb, '/')).toString(); } catch { return ''; }
    })
    .filter(Boolean)
    .slice(0, 20);
}

function cleanSocialUrl(url, host) {
  try {
    const parsed = new URL(url.startsWith('//') ? `https:${url}` : url);
    if (!parsed.hostname.toLowerCase().includes(host)) return '';
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '');
  } catch { return ''; }
}
async function detectShopifyProductCount(siteWeb) {
  const urls = ['/products.json?limit=250', '/collections/all/products.json?limit=250', '/sitemap_products_1.xml'].map((path) => absoluteUrl(siteWeb, path)).filter(Boolean);
  for (const url of urls) {
    try {
      const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 Colock Shopify product counter' } });
      if (!response.ok) continue;
      const text = await response.text();
      if (/\.xml($|\?)/i.test(url)) {
        const count = (text.match(/<loc>/g) || []).length;
        if (count) return count;
      } else {
        const json = JSON.parse(text);
        if (Array.isArray(json?.products)) return json.products.length;
      }
    } catch {}
  }
  return undefined;
}

function normalizeExtractedEmail(value) {
  return asString(value).replace(/\s*(?:\[at\]|\(at\))\s*/i, '@').replace(/\s*(?:\[dot\]|\(dot\))\s*/gi, '.').replace(/\s+/g, '');
}

function extractJsonLd(html) {
  return Array.from(String(html || '').matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).map((match) => match[1]).join('\n');
}

function extractContactData(html) {
  const text = String(html || '').replace(/&amp;/g, '&').replace(/&#64;|&commat;/g, '@');
  const jsonLd = extractJsonLd(text);
  const found = { email: '', telephone: '', instagram: '', facebook: '', tiktok: '', linkedin: '', whatsapp: '', hasContactForm: false, frenchLegalNotice: false, hasShippingPage: false, hasPrivacyPolicy: false, hasLegalPage: false, internalLogistics: false, activeStore: false };
  const haystack = `${text}\n${jsonLd}`;
  found.frenchLegalNotice = FRENCH_LEGAL_MARKERS.some((marker) => marker.test(haystack));
  found.hasContactForm = /<form[\s\S]{0,2500}(contact|email|message|name=)/i.test(text) || /action=["'][^"']*(contact|contact_post)/i.test(text);
  found.hasShippingPage = /livraison|exp[ée]dition|shipping|delivery|colissimo|mondial relay|chronopost|transporteur/i.test(haystack);
  found.hasPrivacyPolicy = /politique de confidentialit[ée]|privacy policy|donn[ée]es personnelles|RGPD/i.test(haystack);
  found.hasLegalPage = found.frenchLegalNotice || /mentions? l[ée]gales?|SIRET|SIREN|RCS/i.test(haystack);
  found.internalLogistics = /notre entrep[oô]t|nos entrep[oô]ts|logistique interne|exp[ée]di[ée]s? par nos soins|pr[ée]par[ée]s? dans nos ateliers|depuis notre atelier/i.test(haystack);
  found.activeStore = /add-to-cart|data-product-id|product-form|checkout|cart|panier|prix|€|soldes|nouveaut[ée]s/i.test(haystack);
  const emails = (haystack.match(EMAIL_REGEX) || []).map(normalizeExtractedEmail).filter((email) => !/example|sentry|wixpress|shopify|schema\.org|domain\.com/i.test(email));
  const mailtos = Array.from(text.matchAll(/href=["']mailto:([^"'?]+)[^"']*["']/gi)).map((match) => normalizeExtractedEmail(match[1]));
  found.email = [...mailtos, ...emails].find(Boolean) || '';
  found.telephone = (haystack.match(PHONE_REGEX) || [])[0] || '';
  const hrefs = Array.from(text.matchAll(/href=["']([^"']+)["']/gi)).map((match) => match[1]);
  for (const href of hrefs) {
    if (!found.whatsapp && /(wa\.me|whatsapp\.com|api\.whatsapp\.com)/i.test(href)) found.whatsapp = href.startsWith('http') ? href : `https://${href.replace(/^\/\//, '')}`;
    for (const [key, host] of Object.entries(SOCIAL_HOSTS)) {
      if (key === 'whatsapp') continue;
      if (!found[key] && href.includes(host)) found[key] = cleanSocialUrl(href, host);
    }
  }
  return found;
}

function scoreProspectDetailed(input) {
  const d = detectProspectSignals(input);
  const details = [];
  const add = (label, points, ok = true) => { if (ok) details.push({ label, points }); };
  add('Shopify vérifié', 20, input.shopifyVerified);
  add('Email trouvé', 25, Boolean(input.email));
  add('Téléphone trouvé', 15, Boolean(input.telephone));
  add('Formulaire de contact fonctionnel/détecté', 15, d.hasContactForm);
  add('Zone France/francophone', 15, d.countryFrance);
  add('Instagram actif', 8, d.instagramActive);
  add('Facebook actif', 8, d.facebookActive);
  add('TikTok actif', 8, d.tiktokActive);
  add('WhatsApp détecté', 5, Boolean(d.whatsapp));
  add('Mono-produit', 12, Boolean(d.isMonoProduct || (d.productCount && d.productCount <= 10)));
  add('Petite boutique', 8, Boolean(d.productCount && d.productCount > 10 && d.productCount <= 50));
  add('Livraison/expéditions présentes', 10, d.hasShippingPage || d.shipsToFrance);
  add('Boutique active', 10, !d.inactiveStore);
  add('Logistique interne détectée', -10, /logistique interne|notre entrep[oô]t|exp[ée]di[ée]s? par nos soins/i.test(`${input.notes || ''} ${input.volumeSignaux?.join(' ') || ''}`));
  add('Marketplace détectée', -30, d.marketplace);
  add('Grande enseigne détectée', -30, d.largeBrand);
  add('Catalogue > 100 produits', -20, Boolean(d.productCount && d.productCount > 100));
  add('Boutique inactive', -20, d.inactiveStore);
  add('Aucun contact direct', -20, !input.email && !input.telephone && !d.hasContactForm);
  const score = Math.max(0, Math.min(100, details.reduce((sum, item) => sum + item.points, 0)));
  return { score, classement: score >= 85 ? 'ultra-chaud' : score >= 65 ? 'chaud' : score >= 40 ? 'moyen' : 'faible', details };
}


function isFranceSelected(criteria) {
  return /(^|[^a-z])france([^a-z]|$)|\bfr\b|fran[çc]ais/i.test(`${criteria?.location || ''} ${criteria?.keywords || ''}`);
}

function hasExcludedCountryMarker(value) {
  const text = asString(value);
  return EXCLUDED_FRANCE_COUNTRY_MARKERS.some((marker) => marker.test(text)) && !FRANCOPHONE_COUNTRY_MARKERS.some((marker) => marker.test(text));
}

function hasFrancophoneMarker(value) {
  return FRANCOPHONE_COUNTRY_MARKERS.some((marker) => marker.test(asString(value))) || /francophone|fran[çc]ais/i.test(asString(value));
}

function normalizePhoneForCountry(value) {
  return asString(value).replace(/[\s.()-]/g, '');
}

function hasFrenchAddress(prospect) {
  const haystack = `${prospect.notes || ''} ${prospect.volumeSignaux?.join(' ') || ''}`;
  return /\b(adresse|address|country|pays)[^\n|,;]*(france|\bFR\b)|\bfrance\b/i.test(haystack) && !hasExcludedCountryMarker(haystack);
}

function getFranceVerificationReason(prospect) {
  const haystack = `${prospect.notes || ''} ${prospect.volumeSignaux?.join(' ') || ''}`;
  if (hasExcludedCountryMarker(haystack)) return '';
  if (hasFrenchAddress(prospect)) return 'adresse France';
  if (normalizePhoneForCountry(prospect.telephone).startsWith('+33')) return 'téléphone +33';
  if (/mentions l[ée]gales fran[çc]aises|SIRET|SIREN|RCS|TVA intracommunautaire FR/i.test(haystack)) return 'mentions légales françaises';
  return '';
}

function markFranceProspects(prospects, criteria) {
  if (!isFranceSelected(criteria)) return prospects;
  return prospects.map((prospect) => {
    const reason = getFranceVerificationReason(prospect);
    const haystack = `${prospect.pays || ''} ${prospect.ville || ''} ${prospect.notes || ''} ${prospect.volumeSignaux?.join(' ') || ''}`;
    if (!reason && !hasFrancophoneMarker(haystack)) return prospect;
    return {
      ...prospect,
      pays: reason ? 'France' : prospect.pays,
      volumeSignaux: Array.from(new Set([...prospect.volumeSignaux, reason ? `France vérifiée (${reason})` : 'zone francophone détectée'])),
    };
  });
}

function productSizeLabel(productCount) {
  if (!productCount) return '';
  if (productCount >= 1 && productCount <= 10) return 'Mono-produit : 1 à 10 produits';
  if (productCount <= 50) return 'Petite boutique : 11 à 50 produits';
  if (productCount <= 100) return 'Boutique moyenne : 51 à 100 produits';
  return 'Grosse boutique : plus de 100 produits';
}

async function fetchText(url, userAgent = 'Mozilla/5.0 Colock Shopify qualification engine') {
  const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } });
  if (!response.ok) return '';
  return response.text();
}

function pageSignal(url) {
  if (/contact/i.test(url)) return 'page Contact visitée';
  if (/a-propos|about/i.test(url)) return 'page À propos visitée';
  if (/livraison|shipping|expedition/i.test(url)) return 'page Livraison visitée';
  if (/mentions|legal|terms/i.test(url)) return 'Mentions légales visitées';
  if (/privacy|confidentialit/i.test(url)) return 'Politique de confidentialité visitée';
  if (/sitemap/i.test(url)) return 'sitemap analysé';
  return 'page d’accueil/footer visités';
}

function mergeCollected(current, next) {
  for (const [key, value] of Object.entries(next)) {
    if (value && !current[key]) current[key] = value;
    if (typeof value === 'boolean') current[key] = Boolean(current[key] || value);
  }
  return current;
}

async function enrichShopifyContactData(prospect) {
  if (!prospect.siteWeb) return prospect;
  const pages = Array.from(new Set(CONTACT_PATHS.map((path) => absoluteUrl(prospect.siteWeb, path)).filter(Boolean)));
  const collected = {};
  const visited = [];
  const detectedPages = [];
  for (const url of pages) {
    try {
      const html = await fetchText(url);
      if (!html) continue;
      visited.push(url);
      detectedPages.push(pageSignal(url));
      mergeCollected(collected, extractContactData(html));
      if (/\/$/.test(new URL(url).pathname)) {
        for (const discoveredUrl of discoverQualificationLinks(html, prospect.siteWeb)) {
          if (!pages.includes(discoveredUrl)) pages.push(discoveredUrl);
        }
      }
      if (!collected.email && /sitemap/i.test(url)) {
        const legalUrls = Array.from(html.matchAll(/<loc>([^<]*(?:contact|mentions|legal|privacy|livraison|shipping)[^<]*)<\/loc>/gi)).slice(0, 8).map((m) => m[1]);
        for (const legalUrl of legalUrls) {
          const legalHtml = await fetchText(legalUrl);
          if (legalHtml) { visited.push(legalUrl); detectedPages.push(pageSignal(legalUrl)); mergeCollected(collected, extractContactData(legalHtml)); }
          if (collected.email) break;
        }
      }
      if (collected.email && collected.telephone && collected.instagram && collected.facebook && collected.tiktok && collected.linkedin && collected.whatsapp) break;
    } catch {}
  }
  const contactFields = Object.fromEntries(Object.entries(collected).filter(([key, value]) => ['email','telephone','instagram','facebook','tiktok','linkedin','whatsapp'].includes(key) && value && !prospect[key]));
  const productCount = prospect.productCount || await detectShopifyProductCount(prospect.siteWeb);
  const scoreInput = { ...prospect, ...contactFields, productCount, hasContactForm: collected.hasContactForm || prospect.hasContactForm, hasShippingPage: collected.hasShippingPage || prospect.hasShippingPage, hasReturnPolicy: prospect.hasReturnPolicy, shipsToFrance: prospect.shipsToFrance || collected.hasShippingPage, activeStore: prospect.activeStore || collected.activeStore, internalLogistics: prospect.internalLogistics || collected.internalLogistics, inactiveStore: prospect.inactiveStore ?? !collected.activeStore };
  const detailed = scoreProspectDetailed(scoreInput);
  const scoreDetails = detailed.details.map((item) => `${item.points > 0 ? '+' : ''}${item.points} ${item.label}`).join(' · ');
  const signals = [
    visited.length ? `pages qualification visitées: ${visited.length}` : 'pages qualification introuvables',
    ...Array.from(new Set(detectedPages)),
    productCount ? `produits détectés: ${productCount}` : '',
    productSizeLabel(productCount),
    collected.hasContactForm ? 'formulaire de contact détecté' : '',
    collected.hasShippingPage ? 'présence d’expéditions/livraison détectée' : '',
    collected.internalLogistics ? 'logistique interne détectée' : '',
    collected.activeStore ? 'boutique active détectée' : '',
    collected.email ? 'email public trouvé par exploration complète' : 'email absent après mentions légales/mailto/JSON-LD/sitemap',
    collected.frenchLegalNotice ? 'mentions légales françaises détectées' : '',
    scoreDetails ? `score détaillé: ${scoreDetails}` : '',
  ].filter(Boolean);
  const enriched = normalizeProspect({ ...scoreInput, volumeSignaux: [...prospect.volumeSignaux, ...signals], notes: [prospect.notes, visited.length ? `Pages explorées: ${visited.join(', ')}` : '', scoreDetails ? `Score détaillé: ${scoreDetails}` : ''].filter(Boolean).join('\n') }, prospect.source);
  return { ...prospect, ...enriched, id: prospect.id, shopifyVerified: prospect.shopifyVerified, sourceReelle: prospect.sourceReelle, score: detailed.score, classement: detailed.classement };
}

function hasQualifyingContact(prospect) {
  return Boolean(asString(prospect.email) || asString(prospect.telephone) || prospect.hasContactForm);
}


function apifyShopifyItemToProspect(item, criteria) {
  const name = firstString(item, ['name', 'shopName', 'storeName', 'title', 'domain', 'store']);
  const website = firstString(item, ['website', 'websiteUrl', 'url', 'domain', 'storeUrl', 'shopUrl', 'myshopifyDomain']);
  const email = firstString(item, ['email', 'contactEmail', 'emailAddress', 'customerEmail', 'contact_email']);
  const instagram = firstString(item, ['instagram', 'instagramUrl']);
  const facebook = firstString(item, ['facebook', 'facebookUrl']);
  const tiktok = firstString(item, ['tiktok', 'tiktokUrl']);
  const linkedin = firstString(item, ['linkedin', 'linkedinUrl']);
  const phone = firstString(item, ['phone', 'phoneNumber', 'telephone', 'contactPhone']);
  const address = firstString(item, ['address', 'formattedAddress', 'streetAddress', 'fullAddress']);
  const country = firstString(item, ['country', 'countryCode', 'addressCountry']);
  const contactUrl = firstString(item, ['contactUrl', 'contactPage', 'contactPageUrl', 'contact']);
  const city = firstString(item, ['city', 'location', 'municipality', 'addressCity']) || criteria.location || 'France';
  const products = firstString(item, ['products', 'productSamples', 'productTitles', 'productExamples', 'topProducts']);
  const productCount = firstNumber(item, ['productCount', 'productsCount', 'numberOfProducts']);
  const category = firstString(item, ['category', 'categoryName', 'industry', 'productType', 'niche']) || products || criteria.productType || 'e-commerce';
  const sourceUrl = firstString(item, ['sourceUrl', 'url', 'website', 'storeUrl', 'shopUrl']) || website;
  return normalizeProspect({ nomBoutique: name || website || 'Boutique Shopify', siteWeb: website, email, telephone: phone, instagram, facebook, tiktok, linkedin, plateforme: 'Shopify', sourceReelle: 'Shopify', typeProduits: category, ville: city, pays: country || 'France', sourceUrl, shopifyVerified: false, productCount, volumeSignaux: ['actor Apify clearpath/shopify-store-leads', address ? `adresse: ${address}` : '', country ? `pays déclaré: ${country}` : '', products ? `produits détectés: ${products}` : '', contactUrl ? `page contact: ${contactUrl}` : '', email ? 'email public détecté' : ''].filter(Boolean), notes: [`Importé via Apify clearpath/shopify-store-leads`, sourceUrl ? `Source: ${sourceUrl}` : '', address ? `Adresse: ${address}` : '', country ? `Pays déclaré: ${country}` : '', contactUrl ? `Contact: ${contactUrl}` : ''].filter(Boolean).join('\n') }, 'Apify');
}

function apifyItemToProspect(item, criteria) {
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
  return normalizeProspect({ nomBoutique: name, siteWeb: website, email, telephone: phone, plateforme: platform, sourceReelle, typeProduits: category, ville: city, pays: 'France', sourceUrl, shopifyVerified: false, volumeSignaux: [sourceReelle === 'Google Maps' ? 'scraping Apify Google Maps' : `scraping Apify ${sourceReelle}`, address ? `adresse: ${address}` : '', rating ? `note Google ${rating}/5` : '', reviews ? `${reviews} avis Google` : ''].filter(Boolean), notes: [`Importé via Apify ${sourceReelle}`, address ? `Adresse: ${address}` : '', sourceUrl ? `Source: ${sourceUrl}` : ''].filter(Boolean).join('\n') }, 'Apify');
}


function hasShopifyContact(prospect) {
  return Boolean(asString(prospect.email) || asString(prospect.telephone) || /contact/i.test(asString(prospect.notes)));
}

function hasShopifyProducts(prospect) {
  const haystack = `${prospect.typeProduits || ''} ${prospect.volumeSignaux?.join(' ') || ''}`;
  return /bijoux|mode|cosm[ée]tique|accessoires?|b[ée]b[ée]|d[ée]coration|produits?|product|collection|e-commerce/i.test(haystack);
}

function isExcludedShopifyLead(prospect) {
  const haystack = `${prospect.nomBoutique || ''} ${prospect.siteWeb || ''} ${prospect.typeProduits || ''} ${prospect.notes || ''} ${prospect.volumeSignaux?.join(' ') || ''}`;
  return EXCLUDED_SHOPIFY_LEAD_MARKERS.some((marker) => marker.test(haystack));
}


function rejectReason(prospect) {
  const haystack = `${prospect.nomBoutique || ''} ${prospect.siteWeb || ''} ${prospect.typeProduits || ''} ${prospect.notes || ''} ${prospect.volumeSignaux?.join(' ') || ''}`;
  if (!asString(prospect.siteWeb)) return 'pas de site';
  try { new URL(/^https?:\/\//i.test(prospect.siteWeb) ? prospect.siteWeb : `https://${prospect.siteWeb}`); } catch { return 'domaine invalide'; }
  if (hasExcludedCountryMarker(haystack)) return 'hors France';
  if (prospect.marketplace || /amazon|cdiscount|rakuten|etsy marketplace|ebay/i.test(haystack)) return 'marketplace';
  if (prospect.largeBrand || isExcludedShopifyLead(prospect)) return /carrefour|auchan|leclerc|decathlon|fnac|zara|h&m|sephora|ikea|grande enseigne/i.test(haystack) ? 'grande enseigne' : 'marketplace';
  if (!prospect.shopifyVerified) return 'pas Shopify vérifié';
  if (!hasQualifyingContact(prospect)) return 'pas de contact qualifiant';
  if ((prospect.score || 0) < 15) return 'score trop faible';
  return '';
}

function buildReport(rawCount, normalized, inserted, duplicates, rejected, supabaseErrors = []) {
  return {
    rawCount,
    normalizedCount: normalized.length,
    insertedCount: inserted,
    duplicateCount: duplicates,
    rejectedCount: rejected.length,
    rejectionReasons: rejected.reduce((acc, item) => ({ ...acc, [item.reason]: (acc[item.reason] || 0) + 1 }), {}),
    supabaseErrors,
  };
}

async function insertProspects(prospects) {
  const url = readEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const key = readEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  if (!url || !key) return { added: 0, ignored: 0, errors: ['Variables Supabase serveur manquantes (prospection conservée côté navigateur)'] };
  if (!prospects.length) return { added: 0, ignored: 0 };
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const optionalColumns = await detectOptionalProspectColumns(supabase);
  const { data: existing, error: selectError } = await supabase.from('prospects').select('id,email,site_web');
  if (selectError) {
    logError('[apify-prospects] Supabase prospect lookup failed', selectError, { code: selectError.code, details: selectError.details, hint: selectError.hint });
    return { added: 0, ignored: 0, errors: [`Erreur Supabase lookup prospects — ${formatSupabaseError(selectError)}`] };
  }

  const existingIds = new Set((existing || []).map((row) => row.id).filter(Boolean));
  const existingEmails = new Set((existing || []).map((row) => normalizeEmail(row.email)).filter(Boolean));
  const existingSites = new Set((existing || []).map((row) => normalizeSite(row.site_web)).filter(Boolean));
  const seenEmails = new Set();
  const seenSites = new Set();
  const rows = [];
  let ignored = 0;

  for (const prospect of prospects) {
    const email = normalizeEmail(prospect.email);
    const site = normalizeSite(prospect.siteWeb);
    const isDuplicate = existingIds.has(prospect.id) || (email && (existingEmails.has(email) || seenEmails.has(email))) || (site && (existingSites.has(site) || seenSites.has(site)));
    if (isDuplicate) {
      ignored += 1;
      continue;
    }
    rows.push(toDb(prospect, optionalColumns.sourceReelle, optionalColumns.shopifyVerified, optionalColumns.facebook, optionalColumns.signalColumns));
    if (email) seenEmails.add(email);
    if (site) seenSites.add(site);
  }

  if (!rows.length) return { added: 0, ignored };
  let { error } = await supabase.from('prospects').insert(rows);
  let safeRows = rows;
  if (error && isMissingShopifyVerifiedColumn(error)) {
    optionalColumns.shopifyVerified = false;
    safeRows = rows.map(({ shopify_verified, ...row }) => row);
    const retry = await supabase.from('prospects').insert(safeRows);
    error = retry.error;
  }
  const absentSignalColumn = missingSignalColumn(error);
  if (error && absentSignalColumn) {
    optionalColumns.signalColumns = optionalColumns.signalColumns.filter((column) => column !== absentSignalColumn);
    safeRows = prospects.filter((prospect) => rows.some((row) => row.id === prospect.id)).map((prospect) => toDb(prospect, optionalColumns.sourceReelle, optionalColumns.shopifyVerified, optionalColumns.facebook, optionalColumns.signalColumns));
    const retry = await supabase.from('prospects').insert(safeRows);
    error = retry.error;
  }
  if (error && isMissingSourceReelleColumn(error)) {
    optionalColumns.sourceReelle = false;
    safeRows = prospects.filter((prospect) => rows.some((row) => row.id === prospect.id)).map((prospect) => toDb(prospect, false, optionalColumns.shopifyVerified, optionalColumns.facebook, optionalColumns.signalColumns));
    const retry = await supabase.from('prospects').insert(safeRows);
    error = retry.error;
  }
  if (error && isMissingFacebookColumn(error)) {
    optionalColumns.facebook = false;
    safeRows = safeRows.map(({ facebook, ...row }) => row);
    const retry = await supabase.from('prospects').insert(safeRows);
    error = retry.error;
  }
  if (!error) return { added: safeRows.length, ignored };
  if (!isDuplicateError(error) && !isCheckViolation(error)) {
    const detail = formatSupabaseError(error, { rows: rows.length });
    logError('[apify-prospects] Supabase bulk insert failed', error, { code: error.code, details: error.details, hint: error.hint, rows: rows.length });
    return { added: 0, ignored, errors: [`Erreur Supabase insertion groupée — ${detail}`] };
  }

  let added = 0;
  for (const row of safeRows) {
    const { error: rowError } = await supabase.from('prospects').insert(row);
    if (!rowError) added += 1;
    else if (isDuplicateError(rowError)) ignored += 1;
    else if (isCheckViolation(rowError)) {
      ignored += 1;
      const violation = describeCheckViolation(rowError, row);
      logError('[apify-prospects] Prospect invalide ignoré après contrainte Supabase', rowError, { prospectId: row.id, nomBoutique: row.nom_boutique, siteWeb: row.site_web, ...violation });
    }
    else {
      const detail = formatSupabaseError(rowError, { prospectId: row.id, nomBoutique: row.nom_boutique, siteWeb: row.site_web });
      logError('[apify-prospects] Supabase single-row insert failed', rowError, { code: rowError.code, details: rowError.details, hint: rowError.hint, prospectId: row.id, row });
      return { added, ignored, errors: [`Erreur Supabase insertion ligne — ${detail}`] };
    }
  }
  return { added, ignored };
}

function dbToProspect(row) {
  return normalizeProspect({
    id: String(row.id), nomBoutique: String(row.nom_boutique || 'Prospect'), siteWeb: row.site_web, instagram: row.instagram, facebook: row.facebook, tiktok: row.tiktok, linkedin: row.linkedin, whatsapp: row.whatsapp, email: row.email, telephone: row.telephone,
    plateforme: row.plateforme || 'Shopify', typeProduits: row.type_produits, ville: row.ville, pays: row.pays, sourceUrl: row.source_url, sourceReelle: row.source_reelle || 'Shopify', source: row.source || 'Apify', shopifyVerified: row.shopify_verified === true,
    productCount: row.product_count, isMonoProduct: row.is_mono_product, hasContactForm: row.has_contact_form, hasShippingPage: row.has_shipping_page, hasReturnPolicy: row.has_return_policy, shipsToFrance: row.ships_to_france, activeStore: row.active_store, internalLogistics: row.internal_logistics,
    volumeSignaux: row.volume_signaux || [], notes: row.notes, createdAt: row.created_at,
  }, row.source || 'Apify');
}

async function enrichExistingProspects() {
  const url = readEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const key = readEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Variables Supabase serveur manquantes pour enrichir les prospects existants');
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const optionalColumns = await detectOptionalProspectColumns(supabase);
  const { data, error } = await supabase.from('prospects').select('*').neq('statut_contact', 'Supprimé').not('site_web', 'is', null);
  if (error) throw error;
  const prospects = (data || []).map(dbToProspect);
  const enriched = [];
  for (const prospect of prospects) enriched.push(await enrichShopifyContactData(prospect));
  const rows = enriched.map((prospect) => toDb(prospect, optionalColumns.sourceReelle, optionalColumns.shopifyVerified, optionalColumns.facebook, optionalColumns.signalColumns));
  if (rows.length) {
    const { error: upsertError } = await supabase.from('prospects').upsert(rows, { onConflict: 'id' });
    if (upsertError) throw upsertError;
  }
  const changed = enriched.filter((p, i) => ['email','telephone','instagram','facebook','tiktok','linkedin','whatsapp'].some((key) => asString(p[key]) && asString(p[key]) !== asString(prospects[i][key])) || p.hasContactForm !== prospects[i].hasContactForm).length;
  return { prospects: enriched, changed };
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const body = req.body || {};
  if (body.mode === 'enrich-existing') {
    try {
      const result = await enrichExistingProspects();
      return res.status(200).json({ prospects: result.prospects, itemsCount: result.prospects.length, insertedCount: result.changed, duplicateCount: 0, query: 'enrich-existing', progress: [`${result.prospects.length} prospects existants réanalysés`, `${result.changed} prospects enrichis avec de nouvelles coordonnées/signaux`] });
    } catch (error) {
      logError('[apify-prospects] Existing enrichment failed', error);
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur enrichissement inconnue', details: describeError(error) });
    }
  }
  const criteria = body.criteria;
  const requestedPlatform = criteria?.platform;
  const actorId = normalizeActorId(DEFAULT_SHOPIFY_ACTOR_ID);
  const token = readEnv('APIFY_TOKEN', 'VITE_APIFY_TOKEN') || asString(body.token);
  const maxItems = asNumber(body.maxItems, DEFAULT_MAX_ITEMS);
  const progress = [];

  if (!criteria) return res.status(400).json({ error: 'Critères de recherche manquants' });
  if (isGoogleMapsActor(actorId)) return res.status(400).json({ error: 'Google Maps est totalement interdit pour Shopify.' });
  if (actorId !== REQUIRED_SHOPIFY_ACTOR_ID) return res.status(400).json({ error: 'Actor Apify autorisé uniquement : clearpath/shopify-store-leads.' });
  if (!token) return res.status(401).json({ error: 'APIFY_TOKEN manquant côté serveur Vercel' });

  progress.push('Token detected');
  const input = buildApifyShopifyInput({ ...criteria, platform: 'Shopify', location: criteria.location || 'France' }, maxItems);

  try {
    const apifyUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
    const apifyRes = await fetch(apifyUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
    progress.push('Actor launched');
    if (!apifyRes.ok) {
      const message = await readApiError(apifyRes);
      logError('[apify-prospects] Apify actor request failed', new Error(message), { status: apifyRes.status, actorId, query: input.searchStringsArray?.[0] || input.query });
      throw new Error(message);
    }

    const items = await apifyRes.json();
    progress.push('Dataset retrieved');
    const safeItems = Array.isArray(items) ? items : [];
    progress.push(`${safeItems.length} results found`);
    let prospects = await Promise.all(safeItems.map(async (item) => enrichShopifyContactData(apifyShopifyItemToProspect(item, { ...criteria, platform: 'Shopify' }))));
    const verified = await Promise.all(prospects.map(async (prospect) => {
      const check = await verifyShopifySite(prospect.siteWeb);
      const verifiedProspect = { ...prospect, plateforme: 'Shopify', sourceReelle: check.verified ? 'Shopify' : 'Inconnue', shopifyVerified: check.verified, volumeSignaux: [...prospect.volumeSignaux, check.verified ? 'Shopify vérifié automatiquement (cdn.shopify.com/myshopify.com)' : `Non Shopify: ${check.reason}`] };
      const rescored = normalizeProspect(verifiedProspect, verifiedProspect.source);
      return { ...verifiedProspect, score: rescored.score, classement: rescored.classement, ...detectProspectSignals(verifiedProspect) };
    }));
    prospects = verified.map((prospect) => ({
      ...prospect,
      plateforme: 'Shopify',
      sourceReelle: prospect.shopifyVerified ? 'Shopify' : prospect.sourceReelle,
      volumeSignaux: [
        ...prospect.volumeSignaux,
        hasShopifyProducts(prospect) ? 'produits Shopify exploitables détectés' : 'produits non renseignés par l’actor',
        hasShopifyContact(prospect) ? 'contact public détecté' : 'contact public absent dans le résultat brut',
        isExcludedShopifyLead(prospect) ? 'signal exclusion détecté (import conservé)' : '',
      ].filter(Boolean),
    }));
    prospects = markFranceProspects(prospects, criteria);
    progress.push(`${prospects.length} prospects Shopify normalisés et scorés`);
    const rejectedProspects = [];
    const exploitable = [];
    prospects.forEach((prospect, index) => {
      const reason = rejectReason(prospect);
      const rejected = Boolean(reason);
      if (rejected) rejectedProspects.push({ id: prospect.id, nomBoutique: prospect.nomBoutique, siteWeb: prospect.siteWeb, score: prospect.score, reason, raw: safeItems[index] });
      else exploitable.push(prospect);
    });
    progress.push(`${exploitable.length} prospects exploitables conservés, ${rejectedProspects.length} rejetés avec raison exacte`);
    const insertResult = await insertProspects(exploitable);
    progress.push(`${insertResult.added} prospects insérés exactement dans Supabase, ${insertResult.ignored} doublons ignorés`);
    (insertResult.errors || []).forEach((message) => progress.push(`Erreur Supabase non bloquante : ${message}`));
    const report = buildReport(safeItems.length, prospects, insertResult.added, insertResult.ignored, rejectedProspects, insertResult.errors || []);

    return res.status(200).json({ prospects: exploitable, rejectedProspects, report, rawItems: safeItems, query: input.searchStringsArray?.[0] || input.query, itemsCount: safeItems.length, insertedCount: insertResult.added, duplicateCount: insertResult.ignored, actorId, progress });
  } catch (error) {
    logError('[apify-prospects] Route failed', error, { actorId, progress });
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur inconnue Apify', details: describeError(error), actorId, progress });
  }
}

module.exports = handler;
