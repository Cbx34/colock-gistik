type DataStateProps = {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyLabel?: string;
};

export default function DataState({ loading, error, empty, emptyLabel = 'Aucune donnée Supabase trouvée.' }: DataStateProps) {
  if (loading) return <p className="notice">Chargement des données Supabase…</p>;
  if (error) return <p className="notice danger-notice">{error}</p>;
  if (empty) return <p className="notice">{emptyLabel}</p>;
  return null;
}
