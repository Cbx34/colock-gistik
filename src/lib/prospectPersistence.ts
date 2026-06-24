import { isSupabaseConfigured, supabase } from './supabase';
import { defaultCampaigns, followUpDays, generateMessage, mergeProspects, normalizeProspect, type Campaign, type Prospect } from './prospecting';

export type SupabaseConnectionState = {
  connected: boolean;
  configured: boolean;
  initializing: boolean;
  error: string;
};

const schemaError = 'Supabase n’est pas configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans l’environnement Vite pour activer le module Prospection.';

const toDb = (p: Prospect) => ({ id: p.id, nom_boutique: p.nomBoutique, site_web: p.siteWeb, instagram: p.instagram, tiktok: p.tiktok, linkedin: p.linkedin, email: p.email, telephone: p.telephone, plateforme: p.plateforme, type_produits: p.typeProduits, ville: p.ville, pays: p.pays, score: p.score, classement: p.classement, statut_contact: p.statutContact, volume_signaux: p.volumeSignaux, source_url: p.sourceUrl, source: p.source, notes: p.notes, last_contact_at: p.lastContactAt, next_follow_up_at: p.nextFollowUpAt, campagne_id: p.campaignId, created_at: p.createdAt });
const fromDb = (r: Record<string, unknown>) => normalizeProspect({ id: String(r.id), nomBoutique: String(r.nom_boutique), siteWeb: r.site_web as string, instagram: r.instagram as string, tiktok: r.tiktok as string, linkedin: r.linkedin as string, email: r.email as string, telephone: r.telephone as string, plateforme: r.plateforme as Prospect['plateforme'], typeProduits: r.type_produits as string, ville: r.ville as string, pays: r.pays as string, score: r.score as number, classement: r.classement as Prospect['classement'], statutContact: r.statut_contact as Prospect['statutContact'], volumeSignaux: (r.volume_signaux as string[]) ?? [], sourceUrl: r.source_url as string, source: r.source as Prospect['source'], notes: r.notes as string, lastContactAt: r.last_contact_at as string, nextFollowUpAt: r.next_follow_up_at as string, campaignId: r.campagne_id as string, createdAt: r.created_at as string }, (r.source as Prospect['source']) ?? 'CSV');

const campaignToDb = (c: Campaign) => ({ id: c.id, nom: c.nom, cible: c.cible, statut: c.statut, created_at: c.createdAt });
const campaignFromDb = (r: Record<string, unknown>): Campaign => ({ id: String(r.id), nom: String(r.nom), cible: String(r.cible), statut: r.statut as Campaign['statut'], createdAt: String(r.created_at) });

function isMissingTable(message: string) {
  return /does not exist|schema cache|Could not find the table|relation .* does not exist/i.test(message);
}

export async function ensureProspectingSchema() {
  if (!isSupabaseConfigured) throw new Error(schemaError);

  const probe = await supabase.from('prospects').select('id').limit(1);
  if (!probe.error) return;
  if (!isMissingTable(probe.error.message)) throw probe.error;

  const created = await supabase.rpc('create_prospecting_schema');
  if (created.error) {
    throw new Error(`Les tables Supabase Prospection sont absentes et la fonction RPC create_prospecting_schema est indisponible (${created.error.message}). Exécutez le script supabase/prospecting.sql une fois dans Supabase SQL Editor, puis rechargez l’application.`);
  }

  const retry = await supabase.from('prospects').select('id').limit(1);
  if (retry.error) throw retry.error;
}

export async function loadProspectingData() {
  await ensureProspectingSchema();
  const [prospectsResult, campaignsResult] = await Promise.all([
    supabase.from('prospects').select('*').order('score', { ascending: false }),
    supabase.from('campagnes').select('*').order('created_at', { ascending: false }),
  ]);
  if (prospectsResult.error) throw prospectsResult.error;
  if (campaignsResult.error) throw campaignsResult.error;

  const campaigns = (campaignsResult.data ?? []).map(campaignFromDb);
  if (campaigns.length === 0) await saveCampaignsToSupabase(defaultCampaigns());

  return {
    prospects: (prospectsResult.data ?? []).map(fromDb),
    campaigns: campaigns.length ? campaigns : defaultCampaigns(),
  };
}

export async function syncProspectsWithSupabase(current: Prospect[]) {
  await ensureProspectingSchema();
  const { data, error } = await supabase.from('prospects').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const merged = mergeProspects((data ?? []).map(fromDb), current).prospects;
  await saveProspectsToSupabase(merged);
  return merged;
}

export async function saveProspectsToSupabase(prospects: Prospect[]) {
  if (!isSupabaseConfigured) throw new Error(schemaError);
  if (!prospects.length) return;
  const { error } = await supabase.from('prospects').upsert(prospects.map(toDb), { onConflict: 'id' });
  if (error) throw error;
  await saveMessagesAndFollowUpsToSupabase(prospects);
}

export async function saveCampaignsToSupabase(campaigns: Campaign[]) {
  if (!isSupabaseConfigured) throw new Error(schemaError);
  if (!campaigns.length) return;
  const { error } = await supabase.from('campagnes').upsert(campaigns.map(campaignToDb), { onConflict: 'id' });
  if (error) throw error;
}

export async function saveMessagesAndFollowUpsToSupabase(prospects: Prospect[]) {
  const messages = prospects.flatMap((p) => [0, ...followUpDays].map((day) => ({
    prospect_id: p.id,
    canal: 'email',
    sujet: day === 0 ? `Premier contact ${p.nomBoutique}` : `Relance J+${day} ${p.nomBoutique}`,
    contenu: generateMessage(p, day as 0 | 2 | 5 | 10),
    statut: p.lastContactAt && day === 0 ? 'envoye' : 'brouillon',
    scheduled_at: day === 0 ? p.lastContactAt : new Date(new Date(p.lastContactAt ?? p.createdAt).getTime() + day * 86400000).toISOString(),
    sent_at: day === 0 ? p.lastContactAt : null,
  })));
  const relances = prospects.flatMap((p) => followUpDays.map((day, index) => ({
    prospect_id: p.id,
    rang: index + 1,
    due_at: new Date(new Date(p.lastContactAt ?? p.createdAt).getTime() + day * 86400000).toISOString(),
    statut: p.statutContact === `Relance J+${day}` ? 'faite' : 'a_faire',
    contenu: generateMessage(p, day as 2 | 5 | 10),
  })));

  if (messages.length) {
    const { error } = await supabase.from('messages').upsert(messages, { onConflict: 'prospect_id,sujet' });
    if (error) throw error;
  }
  if (relances.length) {
    const { error } = await supabase.from('relances').upsert(relances, { onConflict: 'prospect_id,rang' });
    if (error) throw error;
  }
}
