import { BarChart3, Bot, Calculator, LineChart, PackageCheck, Settings, Truck, Users, Warehouse } from 'lucide-react';

export type PageKey = 'dashboard' | 'logistique' | 'prospection' | 'clients' | 'transporteurs' | 'comptabilite' | 'statistiques' | 'settings' | 'search' | 'shopifyRaw' | 'priority' | 'rejections' | 'prospects' | 'prospect' | 'messages' | 'followups' | 'campaigns' | 'export';
export type NavItem = { key: PageKey; label: string; icon: typeof BarChart3 };

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'logistique', label: 'Logistique', icon: Warehouse },
  { key: 'prospection', label: 'Prospection IA', icon: Bot },
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'transporteurs', label: 'Transporteurs', icon: Truck },
  { key: 'comptabilite', label: 'Comptabilité', icon: Calculator },
  { key: 'statistiques', label: 'Statistiques', icon: LineChart },
  { key: 'settings', label: 'Paramètres', icon: Settings },
];

export default function Navbar({ activePage }: { activePage: PageKey }) {
  return <aside className="sidebar" aria-label="Navigation principale">
    <a className="brand" href="#dashboard" aria-label="COLOCK-GISTIK accueil"><span className="brand-mark"><PackageCheck size={24}/></span><span className="brand-copy"><strong>COLOCK</strong><small>GISTIK</small></span></a>
    <nav className="nav-list">{navItems.map((item)=>{const Icon=item.icon;return <a title={item.label} className={`nav-button ${activePage===item.key?'is-active':''}`} href={`#${item.key}`} key={item.key}><Icon size={21}/><span>{item.label}</span></a>})}</nav>
    <a className="assistant-chip" href="#prospection"><Bot size={18}/><span>Assistant IA</span></a>
  </aside>;
}
