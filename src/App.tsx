"use client";
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BarChart3, Boxes, CheckCircle2, Clock, Download, FileText, MapPin, PackageCheck, PackageOpen, Plus, Search as SearchIcon, Settings, ShieldCheck, ShoppingCart, Truck, Users, Zap } from 'lucide-react';
import Layout, { type PageKey } from './components/Layout';
import { V2Bars, V2MetricCard, V2Panel, V2Table } from './components/V2Shell';
import { isSupabaseConfigured, supabase, TABLES } from './lib/supabase';

type EntityPage = Exclude<PageKey, 'dashboard' | 'statistiques' | 'settings'>;
type DemoRow = { id: string; primary: string; secondary: string; status: string; value: string; date: string };

type ModuleConfig = {
  key: EntityPage;
  title: string;
  subtitle: string;
  icon: typeof PackageCheck;
  columns: string[];
  rows: DemoRow[];
  tableName: string;
};

const modules: Record<EntityPage, ModuleConfig> = {
  clients: { key: 'clients', title: 'Clients', subtitle: 'Fiches clients, contrats, contacts et priorités opérationnelles.', icon: Users, tableName: TABLES.clients, columns: ['Client', 'Contact / segment', 'Statut', 'CA mensuel', 'Dernière activité'], rows: [
    { id: 'CLI-001', primary: 'Maison Aura', secondary: 'Lina Martin · cosmétique', status: 'Actif', value: '8 420 €', date: 'Aujourd’hui 09:12' },
    { id: 'CLI-002', primary: 'Nordic Home', secondary: 'B2C décoration', status: 'Onboarding', value: '3 100 €', date: 'Hier 16:40' },
    { id: 'CLI-003', primary: 'Velvet Kids', secondary: 'Textile enfant', status: 'Actif', value: '12 900 €', date: '26/06/2026' },
  ] },
  receptions: { key: 'receptions', title: 'Réceptions', subtitle: 'Contrôle des arrivages, écarts, photos et mise en stock.', icon: PackageOpen, tableName: TABLES.receptions, columns: ['Réception', 'Fournisseur / client', 'Statut', 'Unités', 'Créneau'], rows: [
    { id: 'REC-2048', primary: 'Palette bijoux été', secondary: 'Maison Aura · DHL', status: 'Contrôle qualité', value: '842 u.', date: '10:30' },
    { id: 'REC-2049', primary: 'Cartons textile', secondary: 'Velvet Kids · Geodis', status: 'À scanner', value: '1 260 u.', date: '13:00' },
    { id: 'REC-2050', primary: 'Accessoires maison', secondary: 'Nordic Home · UPS', status: 'Attendu', value: '420 u.', date: 'Demain' },
  ] },
  emplacements: { key: 'emplacements', title: 'Emplacements', subtitle: 'Cartographie dynamique des allées, racks, bacs et zones tampon.', icon: MapPin, tableName: TABLES.emplacements, columns: ['Emplacement', 'Zone', 'Statut', 'Occupation', 'Dernier mouvement'], rows: [
    { id: 'A-01-03', primary: 'Rack A-01-03', secondary: 'Zone picking rapide', status: 'Disponible', value: '62%', date: '09:52' },
    { id: 'B-12-02', primary: 'Bac B-12-02', secondary: 'Petites pièces', status: 'Complet', value: '98%', date: '08:15' },
    { id: 'Q-RET-01', primary: 'Quarantaine retours', secondary: 'Contrôle litige', status: 'Bloqué', value: '41%', date: 'Hier' },
  ] },
  stock: { key: 'stock', title: 'Stock', subtitle: 'Inventaire par SKU, seuils d’alerte et traçabilité prête Supabase.', icon: Boxes, tableName: TABLES.produits, columns: ['SKU', 'Produit', 'Statut', 'Quantité', 'MAJ'], rows: [
    { id: 'SKU-BIJ-882', primary: 'Bracelet doré', secondary: 'Maison Aura', status: 'OK', value: '1 842', date: 'Instantané' },
    { id: 'SKU-TEX-117', primary: 'Sweat enfant bleu', secondary: 'Velvet Kids', status: 'Réassort', value: '42', date: '11:02' },
    { id: 'SKU-HOM-330', primary: 'Bougie céramique', secondary: 'Nordic Home', status: 'Alerte', value: '8', date: '10:18' },
  ] },
  commandes: { key: 'commandes', title: 'Commandes', subtitle: 'Préparation, picking, packing et contrôle avant expédition.', icon: ShoppingCart, tableName: TABLES.commandes, columns: ['Commande', 'Client / canal', 'Statut', 'Articles', 'SLA'], rows: [
    { id: 'CMD-54321', primary: '#54321', secondary: 'Maison Aura · Shopify', status: 'Picking', value: '3 articles', date: 'J+0 15:00' },
    { id: 'CMD-54322', primary: '#54322', secondary: 'Velvet Kids · Woo', status: 'Packing', value: '1 article', date: 'J+0 16:00' },
    { id: 'CMD-54323', primary: '#54323', secondary: 'Nordic Home · B2B', status: 'Prioritaire', value: '12 articles', date: 'J+0 12:30' },
  ] },
  expeditions: { key: 'expeditions', title: 'Expéditions', subtitle: 'Remise transporteurs, étiquettes, tracking et SLA.', icon: Truck, tableName: TABLES.expeditions, columns: ['Expédition', 'Transporteur', 'Statut', 'Colis', 'Départ'], rows: [
    { id: 'EXP-8801', primary: 'Vague matin', secondary: 'Colissimo', status: 'Remis', value: '48 colis', date: '11:45' },
    { id: 'EXP-8802', primary: 'Vague relais', secondary: 'Mondial Relay', status: 'Étiquettes prêtes', value: '31 colis', date: '16:30' },
    { id: 'EXP-8803', primary: 'Express', secondary: 'Chronopost', status: 'À clôturer', value: '12 colis', date: '17:15' },
  ] },
  factures: { key: 'factures', title: 'Factures', subtitle: 'Facturation logistique, stockage, préparation et impayés.', icon: FileText, tableName: TABLES.factures, columns: ['Facture', 'Client', 'Statut', 'Montant', 'Échéance'], rows: [
    { id: 'FAC-2026-061', primary: 'FAC-2026-061', secondary: 'Maison Aura', status: 'Payée', value: '4 820 €', date: '25/06/2026' },
    { id: 'FAC-2026-062', primary: 'FAC-2026-062', secondary: 'Velvet Kids', status: 'À envoyer', value: '2 340 €', date: '30/06/2026' },
    { id: 'FAC-2026-063', primary: 'FAC-2026-063', secondary: 'Nordic Home', status: 'Impayée', value: '1 260 €', date: '20/06/2026' },
  ] },
};

function Toolbar({ search, setSearch, onNew }: { search: string; setSearch: (value: string) => void; onNew: () => void }) {
  return <div className="cg-toolbar"><label><SearchIcon size={19}/><input placeholder="Rechercher dans cette page…" value={search} onChange={(event)=>setSearch(event.target.value)}/></label><button onClick={onNew}><Plus size={21}/> Nouveau</button></div>;
}

function ModulePage({ config }: { config: ModuleConfig }) {
  const [search, setSearch] = useState('');
  const [created, setCreated] = useState(0);
  const rows = useMemo(() => {
    const allRows = created ? [{ id: `NEW-${created}`, primary: 'Nouvel enregistrement', secondary: 'Créé localement · prêt Supabase', status: 'Brouillon', value: '—', date: 'Maintenant' }, ...config.rows] : config.rows;
    const needle = search.toLowerCase();
    return allRows.filter((row) => !needle || Object.values(row).join(' ').toLowerCase().includes(needle));
  }, [config.rows, created, search]);
  return <div className="module-page cg-page"><Toolbar search={search} setSearch={setSearch} onNew={()=>setCreated((value)=>value+1)}/><section className="cg-module-hero"><config.icon size={30}/><div><strong>{config.tableName}</strong><p>Module fonctionnel avec état local instantané, données de démonstration et mapping Supabase documenté.</p></div></section><V2Panel title={config.title} eyebrow="Données opérationnelles"><V2Table columns={config.columns} rows={rows.map((row)=>[<strong>{row.primary}</strong>, row.secondary, <span className="v2-tag">{row.status}</span>, <em>{row.value}</em>, row.date])}/></V2Panel></div>;
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>(() => (typeof window === 'undefined' ? 'dashboard' : (window.location.hash.replace('#', '') as PageKey) || 'dashboard'));
  const [globalSearch, setGlobalSearch] = useState('');
  const [auth, setAuth] = useState({ email: '', password: '', userEmail: '', loading: false, message: '' });
  useEffect(() => { const fn = () => setActivePage((window.location.hash.replace('#', '') as PageKey) || 'dashboard'); window.addEventListener('hashchange', fn); return () => window.removeEventListener('hashchange', fn); }, []);
  useEffect(() => { if (!isSupabaseConfigured) return; supabase.auth.getSession().then(({ data }) => setAuth((current) => ({ ...current, userEmail: data.session?.user.email ?? '' }))); const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setAuth((current) => ({ ...current, userEmail: session?.user.email ?? '' }))); return () => listener.subscription.unsubscribe(); }, []);
  const signIn = async () => { if (!isSupabaseConfigured) { setAuth((current) => ({ ...current, message: 'Supabase non configuré : ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.' })); return; } setAuth((current) => ({ ...current, loading: true, message: '' })); const { error } = await supabase.auth.signInWithPassword({ email: auth.email, password: auth.password }); setAuth((current) => ({ ...current, loading: false, message: error ? error.message : 'Connexion réussie.' })); };
  const signOut = async () => { if (!isSupabaseConfigured) return; const { error } = await supabase.auth.signOut(); setAuth((current) => ({ ...current, userEmail: '', message: error ? error.message : 'Session fermée.' })); };

  const dashboard = <div className="v2-page v3-dashboard"><section className="v2-metric-grid v3-kpi-row"><V2MetricCard label="Commandes du jour" value="184" delta="+22%" icon={ShoppingCart} tone="orange"/><V2MetricCard label="Réceptions" value="37" delta="6 à contrôler" icon={PackageOpen} tone="green"/><V2MetricCard label="SKU en stock" value="8 420" delta="98% exactitude" icon={Boxes} tone="purple"/><V2MetricCard label="Expéditions" value="156" delta="SLA 97%" icon={Truck} tone="orange"/><V2MetricCard label="Clients actifs" value="42" delta="3 onboarding" icon={Users} tone="green"/><V2MetricCard label="Factures" value="12" delta="2 impayées" icon={FileText} tone="orange"/></section><section className="v3-dashboard-columns"><V2Panel title="Activité entrepôt" eyebrow="Temps réel"><V2Bars values={[42, 68, 55, 91, 76, 88, 64]}/></V2Panel><V2Panel title="Actions rapides" eyebrow="Gros boutons"><div className="cg-action-grid">{Object.values(modules).slice(1,7).map((module)=><a href={`#${module.key}`} key={module.key}><module.icon size={22}/>{module.title}</a>)}</div></V2Panel><V2Panel title="Connexion" eyebrow="Supabase"><div className="cg-status"><ShieldCheck/><strong>{isSupabaseConfigured ? 'Prêt à synchroniser' : 'Mode démonstration local'}</strong><span>Tables attendues : clients, commandes, produits, réceptions, emplacements et expéditions.</span></div></V2Panel></section><V2Panel title="Commandes prioritaires" eyebrow="Aujourd’hui"><V2Table columns={modules.commandes.columns} rows={modules.commandes.rows.map((row)=>[<strong>{row.primary}</strong>, row.secondary, <span className="v2-tag">{row.status}</span>, <em>{row.value}</em>, row.date])}/></V2Panel></div>;
  const statistics = <div className="module-page cg-page"><Toolbar search={globalSearch} setSearch={setGlobalSearch} onNew={()=>window.alert('Nouveau rapport créé localement')}/><section className="v2-metric-grid"><V2MetricCard label="Productivité" value="312/h" delta="+9%" icon={Zap} tone="orange"/><V2MetricCard label="Exactitude stock" value="98,7%" delta="audit OK" icon={CheckCircle2} tone="green"/><V2MetricCard label="Retard moyen" value="8 min" delta="-14 min" icon={Clock} tone="purple"/><V2MetricCard label="CA logistique" value="28,4k€" delta="+11%" icon={BarChart3} tone="orange"/></section><V2Panel title="Volumes hebdomadaires" eyebrow="Réceptions / commandes / expéditions"><V2Bars values={[52, 61, 74, 69, 95, 82, 77, 88]}/></V2Panel></div>;
  const settings = <div className="module-page cg-page"><Toolbar search={globalSearch} setSearch={setGlobalSearch} onNew={()=>window.alert('Nouveau connecteur prêt à configurer')}/><section className="panel"><h3><Settings/> Connexion utilisateur</h3><p>{auth.userEmail ? `Connecté : ${auth.userEmail}` : 'Connexion email/mot de passe via Supabase Auth.'}</p><div className="form-grid"><input placeholder="Email" value={auth.email} onChange={(e)=>setAuth({...auth, email:e.target.value})}/><input placeholder="Mot de passe" type="password" value={auth.password} onChange={(e)=>setAuth({...auth, password:e.target.value})}/></div><div className="module-actions"><button onClick={signIn} disabled={auth.loading}>Se connecter</button><button className="secondary" onClick={signOut}>Se déconnecter</button><button className="secondary"><Download/> Export configuration</button></div>{auth.message ? <p className="notice">{auth.message}</p> : null}</section><section className="panel"><h3>Architecture prête Supabase</h3><p>Les modules sont isolés, typés TypeScript, réutilisent la barre d’outils, le tableau moderne et le shell responsive. Les noms de tables sont centralisés dans <code>src/lib/supabase.ts</code>.</p></section></div>;

  const pages: Record<PageKey, { title: string; subtitle: string; element: ReactNode }> = {
    dashboard: { title: 'Tableau de bord', subtitle: 'Vue instantanée des opérations COLOCK-GISTIK, pensée pour PC, téléphone et terrain.', element: dashboard },
    clients: { title: modules.clients.title, subtitle: modules.clients.subtitle, element: <ModulePage config={modules.clients}/> },
    receptions: { title: modules.receptions.title, subtitle: modules.receptions.subtitle, element: <ModulePage config={modules.receptions}/> },
    emplacements: { title: modules.emplacements.title, subtitle: modules.emplacements.subtitle, element: <ModulePage config={modules.emplacements}/> },
    stock: { title: modules.stock.title, subtitle: modules.stock.subtitle, element: <ModulePage config={modules.stock}/> },
    commandes: { title: modules.commandes.title, subtitle: modules.commandes.subtitle, element: <ModulePage config={modules.commandes}/> },
    expeditions: { title: modules.expeditions.title, subtitle: modules.expeditions.subtitle, element: <ModulePage config={modules.expeditions}/> },
    factures: { title: modules.factures.title, subtitle: modules.factures.subtitle, element: <ModulePage config={modules.factures}/> },
    statistiques: { title: 'Statistiques', subtitle: 'Analyse des volumes, SLA, productivité et performance financière.', element: statistics },
    settings: { title: 'Paramètres', subtitle: 'Authentification, configuration Supabase et connecteurs futurs.', element: settings },
  };
  const current = pages[activePage] ?? pages.dashboard;
  return <Layout activePage={activePage in pages ? activePage : 'dashboard'} title={current.title} subtitle={current.subtitle} supabaseStatus={isSupabaseConfigured ? 'connected' : 'disconnected'} globalSearch={globalSearch} onGlobalSearch={setGlobalSearch}>{current.element}</Layout>;
}
