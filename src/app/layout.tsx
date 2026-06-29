import type { Metadata } from 'next';
import '../styles.css';

export const metadata: Metadata = {
  title: 'Colock Gistik',
  description: 'Application opérationnelle et prospection Colock Gistik',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
