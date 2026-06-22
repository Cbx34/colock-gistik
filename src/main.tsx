import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, Boxes, CalendarClock, CheckCircle2, Clock3, MapPin, PackageCheck, Route, Search, Truck, Warehouse } from 'lucide-react';
import './styles.css';

type ShipmentStatus = 'On time' | 'At risk' | 'Delayed' | 'Delivered';

type Shipment = {
  id: string;
  customer: string;
  origin: string;
  destination: string;
  eta: string;
  status: ShipmentStatus;
  load: string;
  dock: string;
};

const shipments: Shipment[] = [
  { id: 'CG-1048', customer: 'Northline Foods', origin: 'Chicago Hub', destination: 'Detroit DC', eta: '08:40', status: 'On time', load: 'Frozen', dock: 'A-12' },
  { id: 'CG-1051', customer: 'Aster Retail', origin: 'St. Louis Crossdock', destination: 'Columbus DC', eta: '09:15', status: 'At risk', load: 'Palletized', dock: 'B-04' },
  { id: 'CG-1056', customer: 'BluePeak Parts', origin: 'Kansas City Hub', destination: 'Nashville Yard', eta: '10:05', status: 'Delayed', load: 'Automotive', dock: 'C-02' },
  { id: 'CG-1060', customer: 'Greenway Medical', origin: 'Memphis Hub', destination: 'Atlanta Clinic', eta: '10:45', status: 'On time', load: 'Priority', dock: 'P-01' },
  { id: 'CG-1067', customer: 'Harbor Home', origin: 'Cincinnati Hub', destination: 'Charlotte DC', eta: '11:20', status: 'Delivered', load: 'Mixed', dock: 'D-09' },
];

const metrics = [
  { label: 'Active routes', value: '42', detail: '+8% vs yesterday', icon: Route },
  { label: 'Dock utilization', value: '87%', detail: '18 of 21 doors live', icon: Warehouse },
  { label: 'On-time score', value: '94.2%', detail: 'rolling 24 hours', icon: Clock3 },
  { label: 'Units in motion', value: '12.8k', detail: '3 temperature zones', icon: Boxes },
];

const exceptions = [
  'CG-1056 waiting on replacement tractor in Kansas City.',
  'Dock B-04 capacity projected to exceed SLA at 09:30.',
  'Priority medical route CG-1060 requires cold-chain confirmation.',
];

function statusClass(status: ShipmentStatus) {
  return status.toLowerCase().replaceAll(' ', '-');
}

function App() {
  const [query, setQuery] = useState('');
  const filteredShipments = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return shipments;
    return shipments.filter((shipment) => Object.values(shipment).some((value) => value.toLowerCase().includes(term)));
  }, [query]);

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow"><CalendarClock size={16} /> COLOCK-GISTIK Command Center</p>
          <h1>Synchronize every clock, dock, and route in one logistics workspace.</h1>
          <p className="hero-copy">Monitor shipment timing, dock pressure, route health, and operational exceptions from a regenerated COLOCK-GISTIK dashboard.</p>
          <div className="hero-actions">
            <a href="#shipments" className="primary-action">View live shipments</a>
            <a href="#exceptions" className="secondary-action">Review exceptions</a>
          </div>
        </div>
        <div className="control-card">
          <Truck size={44} />
          <span>Network pulse</span>
          <strong>98.6%</strong>
          <p>Carrier check-ins matched to planned arrival windows.</p>
        </div>
      </section>

      <section className="metric-grid" aria-label="Operational metrics">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return <article className="metric-card" key={metric.label}><Icon /><span>{metric.label}</span><strong>{metric.value}</strong><p>{metric.detail}</p></article>;
        })}
      </section>

      <section className="workspace" id="shipments">
        <div className="panel wide-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Dispatch board</p><h2>Shipment timeline</h2></div>
            <label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shipment, city, status..." /></label>
          </div>
          <div className="shipment-list">
            {filteredShipments.map((shipment) => <article className="shipment-row" key={shipment.id}>
              <div><strong>{shipment.id}</strong><span>{shipment.customer}</span></div>
              <div><MapPin size={16} />{shipment.origin} → {shipment.destination}</div>
              <div><Clock3 size={16} />ETA {shipment.eta}</div>
              <div>{shipment.load}</div>
              <div>Dock {shipment.dock}</div>
              <span className={`status ${statusClass(shipment.status)}`}>{shipment.status}</span>
            </article>)}
          </div>
        </div>

        <aside className="panel" id="exceptions">
          <p className="eyebrow">Risk queue</p>
          <h2>Exceptions</h2>
          {exceptions.map((item) => <div className="exception" key={item}><AlertTriangle size={18} /><span>{item}</span></div>)}
          <div className="success-note"><CheckCircle2 size={20} /><span>31 routes cleared without manual escalation.</span></div>
        </aside>
      </section>

      <section className="flow-card">
        <PackageCheck />
        <div><h2>From order promise to proof of delivery</h2><p>COLOCK-GISTIK keeps teams aligned around service windows, load state, dock commitments, and final-mile handoffs.</p></div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
