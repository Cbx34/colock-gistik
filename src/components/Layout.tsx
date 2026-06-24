import type { ReactNode } from 'react';
import Navbar, { type NavItem } from './Navbar';

export type PageKey = NavItem['key'];

type LayoutProps = { activePage: PageKey; title: string; subtitle: string; children: ReactNode; supabaseStatus?: 'connected' | 'disconnected' };

export default function Layout({ activePage, title, subtitle, children, supabaseStatus = 'disconnected' }: LayoutProps) {
  const connected = supabaseStatus === 'connected';
  return <div className="app-frame"><Navbar activePage={activePage}/><main className="content-shell"><header className="topbar"><div><p className="eyebrow">Colock-Box Prospection</p><h1>{title}</h1><p>{subtitle}</p></div><div className="topbar-actions"><span className={`supabase-indicator ${connected ? 'connected' : 'disconnected'}`}>{connected ? 'Supabase connecté' : 'Supabase non connecté'}</span><a className="topbar-action" href="#search">+ Chercher</a></div></header>{children}</main></div>;
}
