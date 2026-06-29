import { BarChart3, Boxes, Building2, ChevronRight, ClipboardList, FileText, Home, MapPin, PackageCheck, PackageOpen, Settings, ShoppingCart, Truck, Users } from 'lucide-react';

export type PageKey = 'dashboard' | 'clients' | 'receptions' | 'emplacements' | 'stock' | 'commandes' | 'expeditions' | 'factures' | 'statistiques' | 'settings';
export type NavItem = { key: PageKey; label: string; icon: typeof BarChart3; section: string };

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Tableau de bord', icon: Home, section: 'Pilotage' },
  { key: 'clients', label: 'Clients', icon: Users, section: 'CRM' },
  { key: 'receptions', label: 'Réceptions', icon: PackageOpen, section: 'Entrées' },
  { key: 'emplacements', label: 'Emplacements', icon: MapPin, section: 'Entrepôt' },
  { key: 'stock', label: 'Stock', icon: Boxes, section: 'Inventaire' },
  { key: 'commandes', label: 'Commandes', icon: ShoppingCart, section: 'Préparation' },
  { key: 'expeditions', label: 'Expéditions', icon: Truck, section: 'Sorties' },
  { key: 'factures', label: 'Factures', icon: FileText, section: 'Finance' },
  { key: 'statistiques', label: 'Statistiques', icon: BarChart3, section: 'Analyse' },
  { key: 'settings', label: 'Paramètres', icon: Settings, section: 'Admin' },
];

export default function Navbar({ activePage }: { activePage: PageKey }) {
  return <aside className="v2-sidebar" aria-label="Navigation principale">
    <a className="v2-brand" href="#dashboard" aria-label="COLOCK-GISTIK accueil">
      <span className="v2-brand-mark"><PackageCheck size={23}/></span>
      <span><strong>COLOCK-GISTIK</strong><small>WMS Fulfillment</small></span>
    </a>
    <div className="v2-workspace"><Building2 size={15}/><span>Entrepôt connecté</span><ChevronRight size={15}/></div>
    <nav className="v2-nav-list">{navItems.map((item)=>{const Icon=item.icon;return <a title={item.label} className={`v2-nav-button ${activePage===item.key?'is-active':''}`} href={`#${item.key}`} key={item.key}><Icon size={19}/><span>{item.label}</span><small>{item.section}</small></a>})}</nav>
    <a className="v2-ai-card" href="#commandes"><ClipboardList size={18}/><strong>Mode entrepôt</strong><span>Gros boutons, recherche rapide, prêt Supabase</span></a>
  </aside>;
}
