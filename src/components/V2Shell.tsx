import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function V2MetricCard({ label, value, delta, icon: Icon, tone = 'blue' }: { label: string; value: ReactNode; delta: string; icon: LucideIcon; tone?: 'blue' | 'green' | 'orange' | 'purple' }) {
  return <article className={`v2-metric v2-${tone}`}>
    <div className="v2-metric-icon"><Icon size={20}/></div>
    <span>{label}</span>
    <strong>{value}</strong>
    <small><ArrowUpRight size={14}/>{delta}</small>
  </article>;
}

export function V2Panel({ title, eyebrow, action, children, className = '' }: { title: string; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`v2-panel ${className}`}>
    <header className="v2-panel-head">
      <div>{eyebrow ? <span>{eyebrow}</span> : null}<h3>{title}</h3></div>
      {action}
    </header>
    {children}
  </section>;
}

export function V2Bars({ values }: { values: number[] }) {
  return <div className="v2-bars" aria-label="Graphique en barres">
    {values.map((value, index) => <i key={`${value}-${index}`} style={{ height: `${value}%` }} />)}
  </div>;
}

export function V2Table({ columns, rows }: { columns: string[]; rows: Array<Array<ReactNode>> }) {
  return <div className="v2-table">
    <div className="v2-tr v2-th">{columns.map((column) => <strong key={column}>{column}</strong>)}</div>
    {rows.map((row, index) => <div className="v2-tr" key={index}>{row.map((cell, cellIndex) => <span key={cellIndex}>{cell}</span>)}</div>)}
  </div>;
}
