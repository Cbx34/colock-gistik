import { BarChart3, Bot, Calculator, ChevronRight, Command, LineChart, PackageCheck, Settings, Truck, Users, Warehouse } from 'lucide-react';

export type PageKey = 'dashboard' | 'logistique' | 'prospection' | 'clients' | 'transporteurs' | 'comptabilite' | 'statistiques' | 'settings' | 'search' | 'shopifyRaw' | 'priority' | 'rejections' | 'prospects' | 'prospect' | 'messages' | 'followups' | 'campaigns' | 'export';
export type NavItem = { key: PageKey; label: string; icon: typeof BarChart3; section: string };

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Command center', icon: BarChart3, section: 'Pilotage' },
  { key: 'logistique', label: 'Operations', icon: Warehouse, section: 'Pilotage' },
  { key: 'prospection', label: 'AI growth', icon: Bot, section: 'Growth' },
  { key: 'clients', label: 'Customers', icon: Users, section: 'Growth' },
  { key: 'transporteurs', label: 'Carriers', icon: Truck, section: 'Ops' },
  { key: 'comptabilite', label: 'Finance', icon: Calculator, section: 'Ops' },
  { key: 'statistiques', label: 'Analytics', icon: LineChart, section: 'Insights' },
  { key: 'settings', label: 'Settings', icon: Settings, section: 'Insights' },
];

export default function Navbar({ activePage }: { activePage: PageKey }) {
  return <aside className="v2-sidebar" aria-label="Navigation principale">
    <a className="v2-brand" href="#dashboard" aria-label="COLOCK-GISTIK accueil">
      <span className="v2-brand-mark"><PackageCheck size={23}/></span>
      <span><strong>Colock</strong><small>Gistik V2</small></span>
    </a>
    <div className="v2-workspace"><Command size={15}/><span>Premium ops suite</span><ChevronRight size={15}/></div>
    <nav className="v2-nav-list">{navItems.map((item)=>{const Icon=item.icon;return <a title={item.label} className={`v2-nav-button ${activePage===item.key?'is-active':''}`} href={`#${item.key}`} key={item.key}><Icon size={19}/><span>{item.label}</span><small>{item.section}</small></a>})}</nav>
    <a className="v2-ai-card" href="#prospection"><Bot size={18}/><strong>Assistant IA</strong><span>Prospection autonome et scoring premium</span></a>
  </aside>;
}
