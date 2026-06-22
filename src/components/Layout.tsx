import type { ReactNode } from 'react';
import Navbar, { type NavItem } from './Navbar';

export type PageKey = NavItem['key'];

type LayoutProps = {
  activePage: PageKey;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function Layout({ activePage, title, subtitle, children }: LayoutProps) {
  return (
    <div className="app-frame">
      <Navbar activePage={activePage} />
      <main className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Colock-Box Operations</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <a className="topbar-action" href="#search">+ Nouvelle action</a>
        </header>
        {children}
      </main>
    </div>
  );
}
