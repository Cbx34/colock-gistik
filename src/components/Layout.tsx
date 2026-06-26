import { Bell, Bot, Search, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import Navbar, { type PageKey } from './Navbar';

export type { PageKey };

type LayoutProps = { activePage: PageKey; title: string; subtitle: string; children: ReactNode; supabaseStatus?: 'connected' | 'disconnected' };

export default function Layout({ activePage, title, subtitle, children, supabaseStatus = 'disconnected' }: LayoutProps) {
  const connected = supabaseStatus === 'connected';
  return <div className="app-frame">
    <Navbar activePage={activePage}/>
    <main className="content-shell">
      <header className="topbar">
        <div className="title-block"><p className="eyebrow"><Sparkles size={14}/> SaaS logistique premium</p><h1>{title}</h1><p>{subtitle}</p></div>
        <div className="topbar-stack">
          <label className="global-search"><Search size={18}/><input aria-label="Recherche globale" placeholder="Rechercher client, colis, prospect, facture…" /></label>
          <div className="topbar-actions"><span className={`supabase-indicator ${connected ? 'connected' : 'disconnected'}`}>{connected ? 'Supabase connecté' : 'Mode local'}</span><a className="icon-action" href="#prospection"><Bot size={18}/> IA</a><button className="icon-action" type="button"><Bell size={18}/></button></div>
        </div>
      </header>
      {children}
      <a className="floating-ai" href="#prospection" aria-label="Ouvrir l'assistant IA"><Bot size={22}/><span>Assistant IA</span></a>
    </main>
  </div>;
}
