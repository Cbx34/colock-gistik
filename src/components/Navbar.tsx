import { BarChart3, Boxes, ClipboardCheck, History, PackageSearch, PackagePlus, Search, Send, Truck, Users } from 'lucide-react';

export type NavItem = {
  key: 'dashboard' | 'receptions' | 'stock' | 'preparations' | 'expeditions' | 'clients' | 'search' | 'history';
  label: string;
  icon: typeof BarChart3;
};

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Accueil', icon: BarChart3 },
  { key: 'receptions', label: 'Réceptions', icon: PackagePlus },
  { key: 'stock', label: 'Stock', icon: Boxes },
  { key: 'preparations', label: 'Préparations', icon: ClipboardCheck },
  { key: 'expeditions', label: 'Expéditions', icon: Send },
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'search', label: 'Recherche', icon: Search },
  { key: 'history', label: 'Historique', icon: History },
];

type NavbarProps = {
  activePage: NavItem['key'];
};

export default function Navbar({ activePage }: NavbarProps) {
  return (
    <aside className="sidebar" aria-label="Navigation principale">
      <a className="brand" href="#dashboard" aria-label="COLOCK-GISTIK accueil">
        <span className="brand-mark"><Truck size={28} /></span>
        <span><strong>COLOCK</strong><small>GISTIK</small></span>
      </a>

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a className={`nav-button ${activePage === item.key ? 'is-active' : ''}`} href={`#${item.key}`} key={item.key}>
              <Icon size={22} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="sidebar-card">
        <PackageSearch size={28} />
        <strong>Scan rapide</strong>
        <span>Palette, BL, commande ou quai.</span>
      </div>
    </aside>
  );
}
