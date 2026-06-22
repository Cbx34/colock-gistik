import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Layout, { type PageKey } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Receptions from './pages/Receptions';
import Stock from './pages/Stock';
import Preparations from './pages/Preparations';
import Expeditions from './pages/Expeditions';
import Clients from './pages/Clients';
import Search from './pages/Search';
import History from './pages/History';

const pages: Record<PageKey, { title: string; subtitle: string; element: ReactNode }> = {
  dashboard: {
    title: 'Tableau de bord',
    subtitle: 'Vue temps réel des flux Colock-Box : réception, stock, préparation et expédition.',
    element: <Dashboard />,
  },
  receptions: {
    title: 'Réceptions',
    subtitle: 'Contrôlez les arrivages, les quais, les anomalies et les validations de palettes.',
    element: <Receptions />,
  },
  stock: {
    title: 'Stock',
    subtitle: 'Pilotez les emplacements, les niveaux, les alertes et les mouvements internes.',
    element: <Stock />,
  },
  preparations: {
    title: 'Préparations',
    subtitle: 'Organisez les vagues, le picking, le contrôle qualité et la mise à quai.',
    element: <Preparations />,
  },
  expeditions: {
    title: 'Expéditions',
    subtitle: 'Suivez les départs transporteurs, les documents, les preuves et les retards.',
    element: <Expeditions />,
  },
  clients: {
    title: 'Clients',
    subtitle: 'Centralisez les comptes clients, les SLA, les volumes et les contacts opérationnels.',
    element: <Clients />,
  },
  search: {
    title: 'Recherche',
    subtitle: 'Retrouvez rapidement une commande, une palette, un client ou un transporteur.',
    element: <Search />,
  },
  history: {
    title: 'Historique',
    subtitle: 'Consultez les événements critiques et les traces de modification de la plateforme.',
    element: <History />,
  },
};

function getInitialPage(): PageKey {
  const key = window.location.hash.replace('#', '') as PageKey;
  return key in pages ? key : 'dashboard';
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>(getInitialPage);

  useEffect(() => {
    const onHashChange = () => setActivePage(getInitialPage());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const current = useMemo(() => pages[activePage], [activePage]);

  return (
    <Layout activePage={activePage} title={current.title} subtitle={current.subtitle}>
      {current.element}
    </Layout>
  );
}
