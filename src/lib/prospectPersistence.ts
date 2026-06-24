import { isSupabaseConfigured, supabase } from './supabase';
import { mergeProspects, normalizeProspect, type Prospect } from './prospecting';

const toDb = (p: Prospect) => ({ id: p.id, nom_boutique: p.nomBoutique, site_web: p.siteWeb, instagram: p.instagram, tiktok: p.tiktok, linkedin: p.linkedin, email: p.email, telephone: p.telephone, plateforme: p.plateforme, type_produits: p.typeProduits, ville: p.ville, pays: p.pays, score: p.score, classement: p.classement, statut_contact: p.statutContact, volume_signaux: p.volumeSignaux, source_url: p.sourceUrl, source: p.source, notes: p.notes, last_contact_at: p.lastContactAt, next_follow_up_at: p.nextFollowUpAt, campagne_id: p.campaignId, created_at: p.createdAt });
const fromDb = (r: Record<string, unknown>) => normalizeProspect({ id: String(r.id), nomBoutique: String(r.nom_boutique), siteWeb: r.site_web as string, instagram: r.instagram as string, tiktok: r.tiktok as string, linkedin: r.linkedin as string, email: r.email as string, telephone: r.telephone as string, plateforme: r.plateforme as Prospect['plateforme'], typeProduits: r.type_produits as string, ville: r.ville as string, pays: r.pays as string, score: r.score as number, classement: r.classement as Prospect['classement'], statutContact: r.statut_contact as Prospect['statutContact'], volumeSignaux: (r.volume_signaux as string[]) ?? [], sourceUrl: r.source_url as string, source: r.source as Prospect['source'], notes: r.notes as string, lastContactAt: r.last_contact_at as string, nextFollowUpAt: r.next_follow_up_at as string, campaignId: r.campagne_id as string, createdAt: r.created_at as string }, (r.source as Prospect['source']) ?? 'CSV');

export async function syncProspectsWithSupabase(local: Prospect[]) {
  if (!isSupabaseConfigured) return { prospects: local, mode: 'local' as const, error: '' };
  const { data, error } = await supabase.from('prospects').select('*').order('created_at', { ascending: false });
  if (error) return { prospects: local, mode: 'local' as const, error: error.message };
  const merged = mergeProspects((data ?? []).map(fromDb), local).prospects;
  await supabase.from('prospects').upsert(merged.map(toDb), { onConflict: 'id' });
  return { prospects: merged, mode: 'supabase' as const, error: '' };
}

export async function saveProspectsToSupabase(prospects: Prospect[]) {
  if (!isSupabaseConfigured) return;
  await supabase.from('prospects').upsert(prospects.map(toDb), { onConflict: 'id' });
}
