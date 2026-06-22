import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase, type DbRecord } from './supabase';

type TableState = {
  rows: DbRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useSupabaseTable(table: string, orderBy = 'created_at', ascending = false): TableState {
  const [rows, setRows] = useState<DbRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setRows([]);
      setError('Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour charger les données Supabase.');
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error: requestError } = await supabase.from(table).select('*').order(orderBy, { ascending });
    if (requestError) setError(requestError.message);
    setRows((data ?? []) as DbRecord[]);
    setLoading(false);
  }, [ascending, orderBy, table]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, loading, error, refresh };
}

export async function insertRecord(table: string, payload: DbRecord) {
  if (!isSupabaseConfigured) throw new Error('Supabase n’est pas configuré.');
  const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== '' && value !== undefined));
  const { error } = await supabase.from(table).insert(cleaned);
  if (error) throw error;
}
