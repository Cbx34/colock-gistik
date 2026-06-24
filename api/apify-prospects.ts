import { apifyItemToProspect, buildApifyGoogleMapsInput, type SearchCriteria } from '../src/lib/prospecting';

const DEFAULT_ACTOR_ID = 'compass/crawler-google-places';
const DEFAULT_MAX_ITEMS = 25;

type JsonResponse = {
  status: (code: number) => JsonResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type JsonRequest = {
  method?: string;
  body?: unknown;
};

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const asNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default async function handler(req: JsonRequest, res: JsonResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const criteria = body.criteria as SearchCriteria | undefined;
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

  const items = (await apifyRes.json()) as Array<Record<string, unknown>>;
  res.status(200).json({ prospects: items.map((item) => apifyItemToProspect(item, criteria)), query: input.searchStringsArray[0] });
}
