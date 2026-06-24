import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'public-anon-key',
);

export type DbRecord = Record<string, unknown> & { id?: string | number; created_at?: string };

export const TABLES = {
  clients: 'clients',
  commandes: 'commandes',
  produits: 'produits',
  receptions: 'receptions',
  preparations: 'preparations',
  expeditions: 'expeditions',
  photos: 'photos',
  emplacements: 'emplacements',
  prospects: 'prospects',
  campagnes: 'campagnes',
} as const;

export function asText(record: DbRecord | null | undefined, fields: string[], fallback = '—') {
  if (!record) return fallback;
  for (const field of fields) {
    const value = record[field];
    if (value !== null && value !== undefined && String(value).trim() !== '') return String(value);
  }
  return fallback;
}

export function asNumber(record: DbRecord | null | undefined, fields: string[], fallback = 0) {
  const value = asText(record, fields, '');
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function recordKey(record: DbRecord, fallback: string) {
  return String(record.id ?? record.reference ?? record.code ?? record.numero ?? fallback);
}
