import type { Metadata } from 'next';
import '../styles.css';

export const metadata: Metadata = {
  title: 'COLOCK-GISTIK',
  description: 'Application web professionnelle de fulfillment, WMS et logistique connectée Supabase.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
