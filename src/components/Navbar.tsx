import { BarChart3, Bot, Calculator, ChevronRight, Command, LineChart, PackageCheck, Settings, Truck, Users, Warehouse } from 'lucide-react';

export type PageKey = 'dashboard' | 'logistique' | 'prospection' | 'clients' | 'transporteurs' | 'comptabilite' | 'statistiques' | 'settings' | 'search' | 'shopifyRaw' | 'priority' | 'rejections' | 'prospects' | 'prospect' | 'messages' | 'followups' | 'campaigns' | 'export';
export type NavItem = { key: PageKey; label: string; icon: typeof BarChart3; section: string };

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3, section: 'Pilotage' },
  { key: 'logistique', label: 'Logistique', icon: Warehouse, section: 'Opérations' },
  { key: 'prospection', label: 'Prospection IA', icon: Bot, section: 'Croissance' },
  { key: 'clients', label: 'Clients', icon: Users, section: 'CRM' },
  { key: 'transporteurs', label: 'Transporteurs', icon: Truck, section: 'Réseau' },
  { key: 'comptabilite', label: 'Comptabilité', icon: Calculator, section: 'Finance' },
  { key: 'statistiques', label: 'Statistiques', icon: LineChart, section: 'Analyse' },
  { key: 'settings', label: 'Paramètres', icon: Settings, section: 'Admin' },
];

export default function Navbar({ activePage }: { activePage: PageKey }) {
  return <aside className="v2-sidebar" aria-label="Navigation principale">
    <a className="v2-brand" href="#dashboard" aria-label="COLOCK-GISTIK accueil">
      <span className="v2-brand-mark"><PackageCheck size={23}/></span>
      <span><strong>Colock</strong><small>OS V3</small></span>
    </a>
    <div className="v2-workspace"><Command size={15}/><span>Suite fulfilment premium</span><ChevronRight size={15}/></div>
    <nav className="v2-nav-list">{navItems.map((item)=>{const Icon=item.icon;return <a title={item.label} className={`v2-nav-button ${activePage===item.key?'is-active':''}`} href={`#${item.key}`} key={item.key}><Icon size={19}/><span>{item.label}</span><small>{item.section}</small></a>})}</nav>
    <a className="v2-ai-card" href="#prospection"><Bot size={18}/><strong>Assistant IA</strong><span>Commandes, clients, factures et prospection</span></a>
  </aside>;
}
