import { Bell, Bot, Command, Search, Sparkles, UserCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import Navbar, { type PageKey } from './Navbar';

export type { PageKey };

type LayoutProps = { activePage: PageKey; title: string; subtitle: string; children: ReactNode; supabaseStatus?: 'connected' | 'disconnected' };

export default function Layout({ activePage, title, subtitle, children, supabaseStatus = 'disconnected' }: LayoutProps) {
  const connected = supabaseStatus === 'connected';
  const notifyNotConnected = () => window.alert('Fonction non encore connectée');
  return <div className="v2-app-frame">
    <Navbar activePage={activePage}/>
    <main className="v2-content-shell">
      <header className="v2-topbar">
        <div className="v2-title-block"><p className="v2-eyebrow"><Sparkles size={14}/> COLOCK OS V3 · interface premium</p><h1>{title}</h1><p>{subtitle}</p></div>
        <div className="v2-topbar-stack">
          <label className="v2-global-search"><Search size={18}/><input aria-label="Recherche globale" placeholder="Recherche universelle : client, commande, SKU, prospect…" onFocus={notifyNotConnected} /><kbd><Command size={12}/>K</kbd></label>
          <div className="v2-topbar-actions"><span className={`v2-status ${connected ? 'connected' : 'disconnected'}`}>{connected ? 'Live Supabase' : 'Local mode'}</span><a className="v2-icon-action" href="#prospection"><Bot size={18}/> Assistant IA</a><button className="v2-icon-action" type="button" aria-label="Notifications" onClick={notifyNotConnected}><Bell size={18}/></button><button className="v2-icon-action v2-profile" type="button" aria-label="Profil utilisateur" onClick={notifyNotConnected}><UserCircle size={18}/> Profil</button></div>
        </div>
      </header>
      {children}
    </main>
  </div>;
}
