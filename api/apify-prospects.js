const { createClient } = require('@supabase/supabase-js');

const DEFAULT_ACTOR_ID = 'compass~crawler-google-places';
const DEFAULT_MAX_ITEMS = 25;

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
  if (['Shopify', 'TikTok Shop', 'Etsy', 'eBay', 'Vinted'].includes(String(input.plateforme))) score += 1;
  if ((input.ville || '').toLowerCase().match(/montpellier|lavérune|laverune|le crès|le cres|nîmes|nimes|sète|sete|béziers|beziers|occitanie/)) score += 1;
  const finalScore = Math.max(1, Math.min(10, score));
  return { score: finalScore, classement: finalScore >= 8 ? 'chaud' : finalScore >= 5 ? 'moyen' : 'faible' };
}

function normalizeProspect(draft, source = 'Apify') {
  const scored = scoreProspect(draft);
  return {
    id: draft.id || crypto.randomUUID(),
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
    notes: draft.notes,
    createdAt: draft.createdAt || nowIso(),
  };
}

function toDb(p) {
  return { id: p.id, nom_boutique: p.nomBoutique, site_web: p.siteWeb, instagram: p.instagram, tiktok: p.tiktok, linkedin: p.linkedin, email: p.email, telephone: p.telephone, plateforme: p.plateforme, type_produits: p.typeProduits, ville: p.ville, pays: p.pays, score: p.score, classement: p.classement, statut_contact: p.statutContact, volume_signaux: p.volumeSignaux, source_url: p.sourceUrl, source: p.source, notes: p.notes, created_at: p.createdAt };
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
  return normalizeProspect({ nomBoutique: name, siteWeb: website, email, telephone: phone, plateforme: platform, typeProduits: category, ville: city, pays: 'France', sourceUrl, volumeSignaux: ['scraping Apify Google Maps', address ? `adresse: ${address}` : '', rating ? `note Google ${rating}/5` : '', reviews ? `${reviews} avis Google` : ''].filter(Boolean), notes: ['Importé via Apify Google Maps', address ? `Adresse: ${address}` : '', sourceUrl ? `Source: ${sourceUrl}` : ''].filter(Boolean).join('\n') }, 'Apify');
}

async function insertProspects(prospects) {
  const url = readEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const key = readEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Variables Supabase serveur manquantes (SUPABASE_URL/VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY)');
  if (!prospects.length) return { added: 0, ignored: 0 };
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: existing, error: selectError } = await supabase.from('prospects').select('id,email,site_web');
  if (selectError) throw new Error(selectError.message);

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
    rows.push(toDb(prospect));
    if (email) seenEmails.add(email);
    if (site) seenSites.add(site);
  }

  if (!rows.length) return { added: 0, ignored };
  const { error } = await supabase.from('prospects').insert(rows);
  if (!error) return { added: rows.length, ignored };
  if (!isDuplicateError(error)) throw new Error(error.message);

  let added = 0;
  for (const row of rows) {
    const { error: rowError } = await supabase.from('prospects').insert(row);
    if (!rowError) added += 1;
    else if (isDuplicateError(rowError)) ignored += 1;
    else throw new Error(rowError.message);
  }
  return { added, ignored };
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const body = req.body || {};
  const criteria = body.criteria;
  const actorId = normalizeActorId(body.actorId || process.env.APIFY_ACTOR_ID || process.env.VITE_APIFY_ACTOR_ID || DEFAULT_ACTOR_ID);
  const token = readEnv('APIFY_TOKEN', 'VITE_APIFY_TOKEN') || asString(body.token);
  const maxItems = asNumber(body.maxItems, DEFAULT_MAX_ITEMS);
  const progress = [];

  if (!criteria) return res.status(400).json({ error: 'Critères de recherche manquants' });
  if (!token) return res.status(401).json({ error: 'APIFY_TOKEN manquant côté serveur Vercel' });

  progress.push('Token detected');
  const input = buildApifyGoogleMapsInput(criteria, maxItems);

  try {
    const apifyUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
    const apifyRes = await fetch(apifyUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
    progress.push('Actor launched');
    if (!apifyRes.ok) throw new Error(await readApiError(apifyRes));

    const items = await apifyRes.json();
    progress.push('Dataset retrieved');
    const safeItems = Array.isArray(items) ? items : [];
    progress.push(`${safeItems.length} results found`);
    const prospects = safeItems.map((item) => apifyItemToProspect(item, criteria));
    const insertResult = await insertProspects(prospects);
    progress.push(`${insertResult.added} nouveaux prospects ajoutés, ${insertResult.ignored} doublons ignorés`);

    return res.status(200).json({ prospects, query: input.searchStringsArray[0], itemsCount: safeItems.length, insertedCount: insertResult.added, duplicateCount: insertResult.ignored, actorId, progress });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur inconnue Apify', actorId, progress });
  }
}

module.exports = handler;
