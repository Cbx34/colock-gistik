const DEFAULT_ACTOR_ID = 'compass/crawler-google-places';
const DEFAULT_MAX_ITEMS = 25;

const asString = (value) => (typeof value === 'string' ? value.trim() : '');
const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const nowIso = () => new Date().toISOString();
const firstString = (item, keys) => keys.map((key) => asString(item[key] == null ? '' : String(item[key]))).find(Boolean) || '';
const firstNumber = (item, keys) => keys.map((key) => Number(item[key])).find((value) => Number.isFinite(value));

function scoreProspect(input) {
  let score = 2;
  const signals = input.volumeSignaux || [];
  score += Math.min(4, signals.length);
  if (input.email) score += 1;
  if (input.telephone) score += 1;
  if (input.siteWeb) score += 1;
  if (['Shopify', 'TikTok Shop', 'Etsy', 'eBay', 'Vinted'].includes(String(input.plateforme))) score += 1;
  if ((input.ville || '').toLowerCase().match(/montpellier|lavérune|laverune|le crès|le cres|nîmes|nimes|sète|sete|béziers|beziers|occitanie/)) score += 1;
  if (input.statutContact === 'Client signé') score += 2;
  const finalScore = Math.max(1, Math.min(10, score));
  return { score: finalScore, classement: finalScore >= 8 ? 'chaud' : finalScore >= 5 ? 'moyen' : 'faible' };
}

function normalizeProspect(draft, source = 'CSV') {
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
    statutContact: draft.statutContact || 'Nouveau',
    volumeSignaux: draft.volumeSignaux?.filter(Boolean) || [],
    sourceUrl: draft.sourceUrl?.trim() || draft.siteWeb?.trim() || '',
    source,
    campaignId: draft.campaignId,
    notes: draft.notes,
    lastContactAt: draft.lastContactAt,
    nextFollowUpAt: draft.nextFollowUpAt,
    createdAt: draft.createdAt || nowIso(),
  };
}

function buildApifyGoogleMapsInput(criteria, maxItems = DEFAULT_MAX_ITEMS) {
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

  return normalizeProspect({
    nomBoutique: name,
    siteWeb: website,
    email,
    telephone: phone,
    plateforme: platform,
    typeProduits: category,
    ville: city,
    pays: 'France',
    sourceUrl,
    statutContact: 'Nouveau',
    volumeSignaux: [
      'scraping Apify Google Maps',
      address ? `adresse: ${address}` : '',
      rating ? `note Google ${rating}/5` : '',
      reviews ? `${reviews} avis Google` : '',
    ].filter(Boolean),
    notes: ['Importé via Apify Google Maps', address ? `Adresse: ${address}` : '', sourceUrl ? `Source: ${sourceUrl}` : ''].filter(Boolean).join('\n'),
  }, 'Apify');
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const body = req.body || {};
  const criteria = body.criteria;
  const actorId = asString(body.actorId) || process.env.APIFY_ACTOR_ID || process.env.VITE_APIFY_ACTOR_ID || DEFAULT_ACTOR_ID;
  const token = process.env.APIFY_TOKEN || process.env.VITE_APIFY_TOKEN || asString(body.token);
  const maxItems = asNumber(body.maxItems, DEFAULT_MAX_ITEMS);

  if (!criteria) {
    res.status(400).json({ error: 'Critères de recherche manquants' });
    return;
  }

  if (!token) {
    res.status(401).json({ error: 'Erreur token Apify' });
    return;
  }

  const input = buildApifyGoogleMapsInput(criteria, maxItems);
  const apifyRes = await fetch(`https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (apifyRes.status === 401 || apifyRes.status === 403) {
    res.status(401).json({ error: 'Erreur token Apify' });
    return;
  }

  if (!apifyRes.ok) {
    const details = await apifyRes.text();
    res.status(apifyRes.status).json({ error: `Erreur Apify (${apifyRes.status})`, details: details.slice(0, 500) });
    return;
  }

  const items = await apifyRes.json();
  res.status(200).json({ prospects: items.map((item) => apifyItemToProspect(item, criteria)), query: input.searchStringsArray[0] });
}

module.exports = handler;
