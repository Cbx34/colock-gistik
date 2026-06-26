import { Bell, Bot, Command, Search, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import Navbar, { type PageKey } from './Navbar';

export type { PageKey };

type LayoutProps = { activePage: PageKey; title: string; subtitle: string; children: ReactNode; supabaseStatus?: 'connected' | 'disconnected' };

export default function Layout({ activePage, title, subtitle, children, supabaseStatus = 'disconnected' }: LayoutProps) {
  const connected = supabaseStatus === 'connected';
  return <div className="v2-app-frame">
    <Navbar activePage={activePage}/>
    <main className="v2-content-shell">
      <header className="v2-topbar">
        <div className="v2-title-block"><p className="v2-eyebrow"><Sparkles size={14}/> Nouvelle interface SaaS premium</p><h1>{title}</h1><p>{subtitle}</p></div>
        <div className="v2-topbar-stack">
          <label className="v2-global-search"><Search size={18}/><input aria-label="Recherche globale" placeholder="Search anything: client, order, SKU, prospect…" /><kbd><Command size={12}/>K</kbd></label>
          <div className="v2-topbar-actions"><span className={`v2-status ${connected ? 'connected' : 'disconnected'}`}>{connected ? 'Live Supabase' : 'Local mode'}</span><a className="v2-icon-action" href="#prospection"><Bot size={18}/> AI</a><button className="v2-icon-action" type="button"><Bell size={18}/></button></div>
        </div>
      </header>
      {children}
    </main>
  </div>;
}
