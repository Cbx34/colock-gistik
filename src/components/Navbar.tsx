import { BarChart3, Braces, Download, Mail, MessageSquareText, Radar, RefreshCw, Settings, Target, Truck, Users } from 'lucide-react';

export type NavItem = { key: 'dashboard' | 'search' | 'shopifyRaw' | 'priority' | 'rejections' | 'prospects' | 'prospect' | 'messages' | 'followups' | 'campaigns' | 'export' | 'settings'; label: string; icon: typeof BarChart3 };
export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'search', label: 'Recherche prospects', icon: Radar },
  { key: 'prospects', label: 'Liste prospects', icon: Users },
  { key: 'priority', label: 'Prospects prioritaires', icon: Target },
  { key: 'rejections', label: 'Rejets', icon: Braces },
  { key: 'shopifyRaw', label: 'Résultats bruts Shopify', icon: Braces },
  { key: 'prospect', label: 'Fiche prospect', icon: Target },
  { key: 'messages', label: 'Messages générés', icon: MessageSquareText },
  { key: 'followups', label: 'Relances', icon: RefreshCw },
  { key: 'campaigns', label: 'Campagnes', icon: BarChart3 },
  { key: 'export', label: 'Export CSV', icon: Download },
  { key: 'settings', label: 'Paramètres', icon: Settings },
];
export default function Navbar({ activePage }: { activePage: NavItem['key'] }) {
  return <aside className="sidebar" aria-label="Navigation principale"><a className="brand" href="#dashboard"><span className="brand-mark"><Truck size={28}/></span><span><strong>COLOCK</strong><small>PROSPECTION</small></span></a><nav className="nav-list">{navItems.map((item)=>{const Icon=item.icon;return <a className={`nav-button ${activePage===item.key?'is-active':''}`} href={`#${item.key}`} key={item.key}><Icon size={22}/><span>{item.label}</span></a>})}</nav><div className="sidebar-card"><Mail size={28}/><strong>RGPD safe</strong><span>Données publiques, contact modéré, suppression possible.</span></div></aside>;
}
