const { randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_ACTOR_ID = 'compass~crawler-google-places';
const DEFAULT_SHOPIFY_ACTOR_ID = 'drobnikj~shopify-scraper';
const DEFAULT_MAX_ITEMS = 25;
const SELECTABLE_SOURCES = ['Shopify', 'Vinted', 'TikTok Shop', 'Etsy', 'Google Maps'];
const SHOPIFY_MARKERS = [/cdn\.shopify\.com/i, /myshopify\.com/i];
const EXCLUDED_PLATFORM_MARKERS = [/wp-content\//i, /woocommerce/i, /prestashop/i, /prestashop-/i, /wixstatic\.com/i, /x-wix-/i, /static\.parastorage\.com/i];

const asString = (value) => (typeof value === 'string' ? value.trim() : '');
const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const nowIso = () => new Date().toISOString();
const normalizeSite = (value) => asString(value).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const normalizeEmail = (value) => asString(value).toLowerCase();
const isDuplicateError = (error) => error?.code === '23505' || /duplicate key value violates unique constraint/i.test(error?.message || '');
const firstString = (item, keys) => keys.map((key) => asString(item[key] == null ? '' : String(item[key]))).find(Boolean) || '';
const firstNumber = (item, keys) => keys.map((key) => Number(item[key])).find((value) => Number.isFinite(value));
const describeError = (error) => {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  return { message: String(error), raw: error };
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

function scoreProspect(input) {
  let score = 2;
  const signals = input.volumeSignaux || [];
  score += Math.min(4, signals.length);
  if (input.email) score += 1;
  if (input.telephone) score += 1;
  if (input.siteWeb) score += 1;
  if (input.shopifyVerified) score += 2;
  if (['Shopify', 'TikTok Shop', 'Etsy', 'eBay', 'Vinted'].includes(String(input.plateforme))) score += 1;
  if ((input.ville || '').toLowerCase().match(/montpellier|lavérune|laverune|le crès|le cres|nîmes|nimes|sète|sete|béziers|beziers|occitanie/)) score += 1;
  const finalScore = Math.max(1, Math.min(10, score));
  return { score: finalScore, classement: finalScore >= 8 ? 'chaud' : finalScore >= 5 ? 'moyen' : 'faible' };
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
    email: draft.email?.trim() || undefined,
    telephone: draft.telephone?.trim() || undefined,
    plateforme: draft.plateforme || 'Inconnue',
    typeProduits: draft.typeProduits?.trim() || 'e-commerce',
    ville: draft.ville?.trim() || 'France',
    pays: draft.pays?.trim() || 'France',
    ...scored,
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

function toDb(p, includeSourceReelle = true, includeShopifyVerified = true) {
  const row = { id: p.id, nom_boutique: p.nomBoutique, site_web: p.siteWeb, instagram: p.instagram, tiktok: p.tiktok, linkedin: p.linkedin, email: p.email, telephone: p.telephone, plateforme: p.plateforme, type_produits: p.typeProduits, ville: p.ville, pays: p.pays, score: p.score, classement: p.classement, statut_contact: p.statutContact, volume_signaux: p.volumeSignaux, source_url: p.sourceUrl, source: p.source, notes: p.notes, created_at: p.createdAt };
  if (includeSourceReelle) row.source_reelle = p.sourceReelle || 'Google Maps';
  if (includeShopifyVerified) row.shopify_verified = p.shopifyVerified || false;
  return row;
}

const isMissingShopifyVerifiedColumn = (error) => error?.code === 'PGRST204' || /shopify_verified|schema cache|Could not find .* column/i.test([error?.message, error?.details, error?.hint].filter(Boolean).join(' '));
const isMissingSourceReelleColumn = (error) => error?.code === 'PGRST204' || /source_reelle|schema cache|Could not find .* column/i.test([error?.message, error?.details, error?.hint].filter(Boolean).join(' '));

async function detectOptionalProspectColumns(supabase) {
  const [sourceReelleProbe, shopifyVerifiedProbe] = await Promise.all([
    supabase.from('prospects').select('source_reelle').limit(1),
    supabase.from('prospects').select('shopify_verified').limit(1),
  ]);
  return {
    sourceReelle: !sourceReelleProbe.error || !isMissingSourceReelleColumn(sourceReelleProbe.error),
    shopifyVerified: !shopifyVerifiedProbe.error || !isMissingShopifyVerifiedColumn(shopifyVerifiedProbe.error),
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
  const product = criteria.productType || 'e-commerce';
  const location = criteria.location || 'France';
  const query = [criteria.keywords, product, location, 'Shopify', 'myshopify.com', 'cdn.shopify.com'].filter(Boolean).join(' ');
  return {
    query,
    search: query,
    searchQuery: query,
    searchTerms: [query],
    startUrls: [],
    maxItems,
    maxResults: maxItems,
    country: location,
    location,
    language: 'fr',
    onlyShopify: true,
    includeEmails: true,
    includePhones: true,
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

function apifyShopifyItemToProspect(item, criteria) {
  const name = firstString(item, ['name', 'shopName', 'storeName', 'title', 'domain']) || 'Boutique Shopify';
  const website = firstString(item, ['website', 'websiteUrl', 'url', 'domain', 'storeUrl', 'shopUrl', 'myshopifyDomain']);
  const email = firstString(item, ['email', 'contactEmail', 'emailAddress', 'customerEmail']);
  const phone = firstString(item, ['phone', 'phoneNumber', 'telephone', 'contactPhone']);
  const city = firstString(item, ['city', 'location', 'municipality', 'addressCity']) || criteria.location || 'France';
  const category = firstString(item, ['category', 'categoryName', 'industry', 'products', 'productType']) || criteria.productType || 'e-commerce';
  const sourceUrl = firstString(item, ['sourceUrl', 'url', 'website', 'storeUrl', 'shopUrl']) || website;
  return normalizeProspect({ nomBoutique: name, siteWeb: website, email, telephone: phone, plateforme: 'Shopify', sourceReelle: 'Shopify', typeProduits: category, ville: city, pays: 'France', sourceUrl, shopifyVerified: false, volumeSignaux: ['scraping Apify Shopify dédié', 'candidat Shopify à vérifier automatiquement'], notes: [`Importé via Apify Shopify`, sourceUrl ? `Source: ${sourceUrl}` : ''].filter(Boolean).join('\n') }, 'Apify');
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

async function insertProspects(prospects) {
  const url = readEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const key = readEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Variables Supabase serveur manquantes (SUPABASE_URL/VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY)');
  if (!prospects.length) return { added: 0, ignored: 0 };
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const optionalColumns = await detectOptionalProspectColumns(supabase);
  const { data: existing, error: selectError } = await supabase.from('prospects').select('id,email,site_web');
  if (selectError) {
    logError('[apify-prospects] Supabase prospect lookup failed', selectError, { code: selectError.code, details: selectError.details, hint: selectError.hint });
    throw new Error(selectError.message);
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
    rows.push(toDb(prospect, optionalColumns.sourceReelle, optionalColumns.shopifyVerified));
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
  if (error && isMissingSourceReelleColumn(error)) {
    optionalColumns.sourceReelle = false;
    safeRows = prospects.filter((prospect) => rows.some((row) => row.id === prospect.id)).map((prospect) => toDb(prospect, false, optionalColumns.shopifyVerified));
    const retry = await supabase.from('prospects').insert(safeRows);
    error = retry.error;
  }
  if (!error) return { added: safeRows.length, ignored };
  if (!isDuplicateError(error)) {
    logError('[apify-prospects] Supabase bulk insert failed', error, { code: error.code, details: error.details, hint: error.hint, rows: rows.length });
    throw new Error(error.message);
  }

  let added = 0;
  for (const row of safeRows) {
    const { error: rowError } = await supabase.from('prospects').insert(row);
    if (!rowError) added += 1;
    else if (isDuplicateError(rowError)) ignored += 1;
    else {
      logError('[apify-prospects] Supabase single-row insert failed', rowError, { code: rowError.code, details: rowError.details, hint: rowError.hint, prospectId: row.id });
      throw new Error(rowError.message);
    }
  }
  return { added, ignored };
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const body = req.body || {};
  const criteria = body.criteria;
  const requestedPlatform = criteria?.platform;
  const actorId = normalizeActorId(requestedPlatform === 'Shopify'
    ? body.shopifyActorId || process.env.APIFY_SHOPIFY_ACTOR_ID || process.env.VITE_APIFY_SHOPIFY_ACTOR_ID || DEFAULT_SHOPIFY_ACTOR_ID
    : body.actorId || process.env.APIFY_ACTOR_ID || process.env.VITE_APIFY_ACTOR_ID || DEFAULT_ACTOR_ID);
  const token = readEnv('APIFY_TOKEN', 'VITE_APIFY_TOKEN') || asString(body.token);
  const maxItems = asNumber(body.maxItems, DEFAULT_MAX_ITEMS);
  const progress = [];

  if (!criteria) return res.status(400).json({ error: 'Critères de recherche manquants' });
  if (criteria.platform === 'Shopify' && isGoogleMapsActor(actorId)) return res.status(400).json({ error: 'Google Maps est interdit pour la source Shopify. Configurez APIFY_SHOPIFY_ACTOR_ID avec un actor Shopify dédié.' });
  if (criteria.platform === 'Vinted' && isGoogleMapsActor(actorId)) return res.status(400).json({ error: `Google Maps est interdit lorsque la source ${criteria.platform} est sélectionnée. Configurez un actor Apify ${criteria.platform} dédié.` });
  if (!token) return res.status(401).json({ error: 'APIFY_TOKEN manquant côté serveur Vercel' });

  progress.push('Token detected');
  const input = criteria.platform === 'Shopify' ? buildApifyShopifyInput(criteria, maxItems) : buildApifyGoogleMapsInput(criteria, maxItems);

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
    let prospects = safeItems.map((item) => criteria.platform === 'Shopify' ? apifyShopifyItemToProspect(item, criteria) : apifyItemToProspect(item, criteria));
    if (criteria.platform === 'Shopify') {
      const verified = await Promise.all(prospects.map(async (prospect) => {
        const check = await verifyShopifySite(prospect.siteWeb);
        return { ...prospect, plateforme: 'Shopify', sourceReelle: check.verified ? 'Shopify' : 'Inconnue', shopifyVerified: check.verified, volumeSignaux: [...prospect.volumeSignaux, check.verified ? 'Shopify vérifié automatiquement (cdn.shopify.com/myshopify.com)' : `Non Shopify: ${check.reason}`] };
      }));
      prospects = verified.filter((prospect) => prospect.shopifyVerified);
      progress.push(`${prospects.length} boutiques Shopify vérifiées`);
    }
    const insertResult = await insertProspects(prospects);
    progress.push(`${insertResult.added} nouveaux prospects ajoutés, ${insertResult.ignored} doublons ignorés`);

    return res.status(200).json({ prospects, query: input.searchStringsArray?.[0] || input.query, itemsCount: safeItems.length, insertedCount: insertResult.added, duplicateCount: insertResult.ignored, actorId, progress });
  } catch (error) {
    logError('[apify-prospects] Route failed', error, { actorId, progress });
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur inconnue Apify', actorId, progress });
  }
}

module.exports = handler;
