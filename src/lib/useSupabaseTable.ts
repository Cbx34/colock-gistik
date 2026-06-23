import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase, type DbRecord } from './supabase';

type TableState = {
  rows: DbRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useSupabaseTable(table: string, orderBy = 'id', ascending = false): TableState {
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

    let request = supabase.from(table).select('*');
    if (orderBy) request = request.order(orderBy, { ascending });

    let { data, error: requestError } = await request;

    if (requestError && requestError.message.includes('does not exist')) {
      const fallback = await supabase.from(table).select('*');
      data = fallback.data;
      requestError = fallback.error;
    }

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
  const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== '' && value !== undefined && value !== null));
  const { error } = await supabase.from(table).insert(cleaned);
  if (error) throw error;
}
