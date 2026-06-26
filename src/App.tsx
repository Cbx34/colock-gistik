import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, Bot, Calculator, Download, ExternalLink, Mail, PackageCheck, Plus, RefreshCw, Search as SearchIcon, ShieldCheck, Trash2, Upload, Rocket, ShoppingBag, BarChart3, Wand2, Warehouse, Truck, Users, LineChart, Euro, PackagePlus, Send, ClipboardCheck, Box, CreditCard, Sparkles } from 'lucide-react';
import Layout, { type PageKey } from './components/Layout';
import { V2Bars, V2MetricCard, V2Panel, V2Table } from './components/V2Shell';
import { buildSearchLinks, defaultCampaigns, ECOMMERCE_KEYWORD_LIBRARY, ECOMMERCE_KEYWORD_QUERIES, QUALIFIED_PROSPECTS_TARGET_PER_CATEGORY, fetchApifyProspects, enrichExistingProspects, qualifiedTargetPerKeyword, followUpDays, generateMessage, generateChannelMessages, AUTO_PROSPECTING_COUNTRIES, AUTO_PROSPECTING_QUOTAS, mergeProspects, mockProspectSearch, parseCsvProspects, prospectStatuses, scoreProspect, type Campaign, type Platform, type Prospect, type ApifyProgress, type SearchCriteria, type AutoProspectingQuota, type AutoSearchHistoryEntry, type RejectedProspect, isPriorityProspect, COLOCK_PRIORITY_KEYWORDS } from './lib/prospecting';
import { exportProspectsCsv } from './lib/storage';
import { isSupabaseConfigured } from './lib/supabase';
import { loadProspectingData, saveCampaignsToSupabase, saveProspectsToSupabase, syncProspectsWithSupabase, type SupabaseConnectionState } from './lib/prospectPersistence';

function Stat({ label, value }: { label: string; value: ReactNode }) { return <div className="stat-card"><strong>{value}</strong><span>{label}</span></div>; }
function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) { return <span className={`badge ${tone}`}>{children}</span>; }

const platforms: Array<SearchCriteria['platform']> = ['Shopify'];

function SourceHeader({ source }: { source: Prospect['sourceReelle'] }) { return <p className="source-header"><strong>Source :</strong> {source}</p>; }

function ContactLink({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  const href = label === 'Email' ? `mailto:${value}` : /^https?:\/\//i.test(value) ? value : undefined;
  return <li><strong>{label} :</strong> {href ? <a href={href} target={label === 'Email' ? undefined : '_blank'}>{value}</a> : value}</li>;
}

function isFranceVerified(p: Prospect) {
  return p.pays.toLowerCase() === 'france' && (p.volumeSignaux ?? []).some((signal) => /France vérifiée|mentions légales françaises|téléphone \+33|adresse France/i.test(signal));
}

function ProspectCard({ p, onSelect, onDelete, onContact }: { p: Prospect; onSelect: () => void; onDelete: () => void; onContact: () => void }) {
  const franceVerified = isFranceVerified(p);
  const mailto = p.email ? `mailto:${p.email}?subject=${encodeURIComponent(`Proposition logistique pour ${p.nomBoutique}`)}&body=${encodeURIComponent(generateMessage(p))}` : undefined;
  return <article className="prospect-card"><div><SourceHeader source={p.sourceReelle}/><h3>{p.nomBoutique}</h3><p>{p.typeProduits} · {p.ville}, {p.pays}</p><div className="chips"><Badge tone={p.classement}>{p.classement === 'ultra-chaud' ? '🔥 Ultra chaud' : p.classement === 'chaud' ? '🟢 Chaud' : p.classement === 'moyen' ? '🟡 Moyen' : '⚪ Faible'}</Badge><Badge>{p.plateforme}</Badge><Badge tone={p.shopifyVerified ? 'chaud' : 'neutral'}>{p.shopifyVerified ? '✅ Shopify vérifié' : '❌ Non vérifié'}</Badge>{franceVerified ? <Badge tone="chaud">France vérifiée</Badge> : null}<Badge tone={p.email ? 'chaud' : 'neutral'}>{p.email ? 'Email trouvé' : 'Email absent'}</Badge><Badge>Score Colock Prospect {p.score}/100</Badge>{p.isMonoProduct ? <Badge tone="chaud">Mono-produit</Badge> : null}{p.productCount ? <Badge>{p.productCount} produits</Badge> : null}{p.niche ? <Badge>Niche : {p.niche}</Badge> : null}<Badge>{p.statutContact}</Badge></div></div><ul>{(p.volumeSignaux ?? []).map((signal) => <li key={signal}>{signal}</li>)}{p.siteWeb ? <li><a href={p.siteWeb} target="_blank">Site web</a></li> : null}<ContactLink label="Email" value={p.email}/><ContactLink label="Téléphone" value={p.telephone}/><ContactLink label="WhatsApp" value={p.whatsapp}/><ContactLink label="Instagram" value={p.instagram}/><ContactLink label="Facebook" value={p.facebook}/><ContactLink label="TikTok" value={p.tiktok}/><ContactLink label="LinkedIn" value={p.linkedin}/>{p.sourceUrl ? <li><a href={p.sourceUrl} target="_blank">URL source</a></li> : null}{(p.scoreDetails ?? []).length ? <li><details><summary>Score détaillé</summary><ul className="score-details">{(p.scoreDetails ?? []).map((detail) => <li key={detail}>{detail}</li>)}</ul></details></li> : null}</ul><div className="card-actions"><button onClick={onSelect}>Ouvrir</button>{mailto ? <a className="action-button" href={mailto} onClick={onContact}><Mail size={17}/> Envoyer email</a> : null}<button onClick={onContact}><Mail size={17}/> Contacté</button><button className="secondary danger" onClick={onDelete}><Trash2 size={17}/> Supprimer</button></div></article>;
}
export default function App() {
  const [activePage, setActivePage] = useState<PageKey>(() => (window.location.hash.replace('#', '') as PageKey) || 'dashboard');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>(defaultCampaigns);
  const [connection, setConnection] = useState<SupabaseConnectionState>({ connected: false, configured: isSupabaseConfigured, initializing: true, error: '' });
  const [importText, setImportText] = useState('nom_boutique,site_web,email,plateforme,type_produits,ville,signaux\nMa Boutique,https://example.com,contact@example.com,Shopify,cosmétiques,Montpellier,expédition 48h | avis clients');
  const [apifyActor, setApifyActor] = useState(import.meta.env.VITE_APIFY_ACTOR_ID ?? 'clearpath/shopify-store-leads');
  const [apifyToken, setApifyToken] = useState(import.meta.env.VITE_APIFY_TOKEN ?? '');
  const [apifyLoading, setApifyLoading] = useState(false);
  const [autoProspecting, setAutoProspecting] = useState(false);
  const [autoQuota, setAutoQuota] = useState<AutoProspectingQuota>(100);
  const [searchHistory, setSearchHistory] = useState<AutoSearchHistoryEntry[]>(() => { try { return JSON.parse(localStorage.getItem('colock-auto-search-history') || '[]'); } catch { return []; } });
  const [apifyMessages, setApifyMessages] = useState<string[]>([]);
  const [shopifyRawResults, setShopifyRawResults] = useState<Record<string, unknown>[]>([]);
  const [rejectedProspects, setRejectedProspects] = useState<RejectedProspect[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [filters, setFilters] = useState({ emailOnly: false, phoneOnly: false, franceOnly: false, monoOnly: false, shopifyOnly: false, score40: false, score65: false, score85: false, instagramOnly: false, facebookOnly: false, tiktokOnly: false });
  const setFilter = (key: keyof typeof filters, value: boolean) => setFilters((current) => ({ ...current, [key]: value }));
  const visibleProspects = prospects.filter((p) => p.statutContact !== 'Supprimé'
    && (!filters.emailOnly || Boolean(p.email))
    && (!filters.phoneOnly || Boolean(p.telephone))
    && (!filters.franceOnly || p.pays.toLowerCase() === 'france')
    && (!filters.monoOnly || Boolean(p.isMonoProduct))
    && (!filters.shopifyOnly || Boolean(p.shopifyVerified))
    && (!filters.score40 || p.score > 40)
    && (!filters.score65 || p.score > 65)
    && (!filters.score85 || p.score > 85)
    && (!filters.instagramOnly || Boolean(p.instagram))
    && (!filters.facebookOnly || Boolean(p.facebook))
    && (!filters.tiktokOnly || Boolean(p.tiktok)));
  const priorityProspects = prospects.filter((p) => p.statutContact !== 'Supprimé' && isPriorityProspect(p));
  const selected = prospects.find((p) => p.id === selectedId) ?? visibleProspects[0] ?? prospects[0];
  const [criteria, setCriteria] = useState<SearchCriteria>({ platform: 'Shopify', productType: '', location: 'France', keywords: 'bijoux France' });
  const quotaReached = (count: number) => autoQuota !== 'illimité' && count >= autoQuota;

  useEffect(() => { const fn = () => setActivePage((window.location.hash.replace('#', '') as PageKey) || 'dashboard'); window.addEventListener('hashchange', fn); return () => window.removeEventListener('hashchange', fn); }, []);
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setConnection({ connected: false, configured: false, initializing: false, error: 'Supabase n’est pas configuré : renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour utiliser la prospection.' });
      return;
    }
    loadProspectingData()
      .then((data) => { setProspects(data.prospects); setCampaigns(data.campaigns); setConnection({ connected: true, configured: true, initializing: false, error: '' }); })
      .catch((error: Error) => setConnection({ connected: false, configured: true, initializing: false, error: error.message }));
  }, []);
  useEffect(() => { if (connection.connected) saveProspectsToSupabase(prospects).catch((error: Error) => setConnection((current) => ({ ...current, connected: false, error: error.message }))); }, [connection.connected, prospects]);
  useEffect(() => { if (connection.connected) saveCampaignsToSupabase(campaigns).catch((error: Error) => setConnection((current) => ({ ...current, connected: false, error: error.message }))); }, [campaigns, connection.connected]);
  useEffect(() => { localStorage.setItem('colock-auto-search-history', JSON.stringify(searchHistory.slice(-500))); }, [searchHistory]);

  const metrics = useMemo(() => { const active = prospects.filter((p) => p.statutContact !== 'Supprimé'); const qualified = active.filter((p) => Boolean(p.email || p.telephone || p.hasContactForm)).length; const emails = active.filter((p) => Boolean(p.email)).length; const phones = active.filter((p) => Boolean(p.telephone)).length; const forms = active.filter((p) => Boolean(p.hasContactForm)).length; const instagram = active.filter((p) => Boolean(p.instagram)).length; const facebook = active.filter((p) => Boolean(p.facebook)).length; const tiktok = active.filter((p) => Boolean(p.tiktok)).length; const monoProducts = active.filter((p) => Boolean(p.isMonoProduct)).length; const smallStores = active.filter((p) => Boolean(p.productCount && p.productCount <= 50)).length; const activeStores = active.filter((p) => Boolean(p.activeStore || (!p.inactiveStore && p.hasShippingPage))).length; const internalLogistics = active.filter((p) => Boolean(p.internalLogistics)).length; const ultra = active.filter((p) => p.classement === 'ultra-chaud').length; const contacted = active.filter((p) => ['Contacté','Relance J+3','Relance J+7','Client signé'].includes(p.statutContact)).length; const signed = active.filter((p) => p.statutContact === 'Client signé').length; return { found: active.length, qualified, emails, phones, forms, instagram, facebook, tiktok, monoProducts, smallStores, activeStores, internalLogistics, qualificationRate: active.length ? Math.round((qualified / active.length) * 100) : 0, ultraRate: active.length ? Math.round((ultra / active.length) * 100) : 0, contacted, responseRate: contacted ? Math.round(((active.filter((p) => ['Relance J+3','Relance J+7','Client signé'].includes(p.statutContact)).length) / contacted) * 100) : 0, signed, followups: active.filter((p) => p.nextFollowUpAt && new Date(p.nextFollowUpAt) <= new Date(Date.now() + 10 * 86400000)).length }; }, [prospects]);
  const importProspects = (incoming: Prospect[]) => {
    let result = { added: 0, merged: 0, prospects: [] as Prospect[] };
    setProspects((current) => { result = mergeProspects(current, incoming); return result.prospects; });
    return result;
  };
  const formatImportSummary = (added: number, ignored: number) => `${added} nouveaux prospects ajoutés, ${ignored} doublons ignorés`;
  const addProspects = () => { const result = importProspects(mockProspectSearch(criteria)); setApifyMessages([formatImportSummary(result.added, result.merged)]); };
  const importCsv = (source: 'CSV' | 'Shopify' | 'Vinted' | 'TikTok Shop' | 'Etsy') => { const result = importProspects(parseCsvProspects(importText, source)); setApifyMessages([formatImportSummary(result.added, result.merged)]); };
  const addApifyMessage = (message: string) => setApifyMessages((current) => [...current, message]);
  const runApify = async () => {
    setApifyMessages([]);
    setApifyLoading(true);
    try {
      const result = await fetchApifyProspects(apifyActor, apifyToken, criteria, undefined, (progress: ApifyProgress) => addApifyMessage(progress.message));
      setShopifyRawResults(result.rawItems ?? []);
      setRejectedProspects(result.rejectedProspects ?? []);
      if (result.report) addApifyMessage(`Rapport détaillé : ${result.report.rawCount} bruts Apify · ${result.report.normalizedCount} normalisés · ${result.report.insertedCount} insérés · ${result.report.duplicateCount} doublons · ${result.report.rejectedCount} rejetés (${Object.entries(result.report.rejectionReasons).map(([reason, count]) => `${reason}: ${count}`).join(', ') || 'aucun rejet'})`);
      if (typeof result.insertedCount === 'number') addApifyMessage(`${result.insertedCount} prospects insérés exactement dans Supabase`);
      if (connection.connected) {
        try {
          const refreshed = await syncProspectsWithSupabase(result.prospects);
          setProspects(refreshed);
        } catch (error) {
          const merged = mergeProspects(prospects, result.prospects);
          setProspects(merged.prospects);
          addApifyMessage(`Erreur Supabase non bloquante : ${error instanceof Error ? error.message : 'synchronisation impossible'}`);
        }
      } else {
        const merged = mergeProspects(prospects, result.prospects);
        setProspects(merged.prospects);
        addApifyMessage(formatImportSummary(merged.added, merged.merged));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur Apify inconnue';
      addApifyMessage(`Erreur exacte : ${message}`);
    } finally {
      setApifyLoading(false);
    }
  };
  const enrichProspects = async () => {
    setApifyMessages(['Enrichissement des prospects existants lancé : réanalyse des sites sans nouvelle recherche Shopify.']);
    setApifyLoading(true);
    try {
      const result = await enrichExistingProspects((progress) => addApifyMessage(progress.message));
      if (connection.connected) setProspects(await syncProspectsWithSupabase(result.prospects));
      else setProspects((current) => mergeProspects(current, result.prospects).prospects);
      addApifyMessage(`${result.prospects.length} prospects réanalysés, ${result.insertedCount ?? 0} enrichis.`);
    } catch (error) {
      addApifyMessage(`Erreur enrichissement : ${error instanceof Error ? error.message : 'erreur inconnue'}`);
    } finally {
      setApifyLoading(false);
    }
  };
  const runAutoProspecting = async () => {
    const targetLabel = autoQuota === 'illimité' ? 'illimité' : `${autoQuota}`;
    setApifyMessages([`Agent IA autonome lancé : quota ${targetLabel}, pays ${AUTO_PROSPECTING_COUNTRIES.join(' → ')}, doublons et recherches déjà effectuées ignorés.`]);
    setAutoProspecting(true);
    setApifyLoading(true);
    let qualifiedTotal = prospects.filter((p) => p.statutContact !== 'Supprimé').length;
    const alreadySearched = new Set(searchHistory.map((entry) => `${entry.country}|${entry.keyword}`.toLowerCase()));
    try {
      for (const country of AUTO_PROSPECTING_COUNTRIES) {
        if (quotaReached(qualifiedTotal)) break;
        const autoKeywordGroups = [{ category: 'PRIORITÉS COLOCK-GISTIK', keywords: COLOCK_PRIORITY_KEYWORDS }, ...ECOMMERCE_KEYWORD_LIBRARY];
        for (const group of autoKeywordGroups) {
          if (quotaReached(qualifiedTotal)) break;
          for (const keyword of group.keywords) {
            if (quotaReached(qualifiedTotal)) break;
            const historyKey = `${country}|${keyword}`.toLowerCase();
            if (alreadySearched.has(historyKey)) {
              addApifyMessage(`↷ Recherche déjà mémorisée ignorée : ${keyword} · ${country}`);
              continue;
            }
            const remaining = autoQuota === 'illimité' ? 50 : Math.max(1, autoQuota - qualifiedTotal);
            const batchSize = Math.min(50, remaining);
            const autoCriteria: SearchCriteria = { platform: 'Shopify', productType: keyword, location: country, keywords: `${keyword} Shopify ${country}` };
            addApifyMessage(`▶ ${group.category}/${keyword} · ${country} — lot ${batchSize}, progression ${qualifiedTotal}/${targetLabel}`);
            let result;
            try {
              result = await fetchApifyProspects(apifyActor, apifyToken, autoCriteria, batchSize, (progress: ApifyProgress) => addApifyMessage(`${country}/${keyword} : ${progress.message}`));
            } catch (error) {
              addApifyMessage(`⚠ ${keyword} · ${country} ignoré après erreur : ${error instanceof Error ? error.message : 'erreur inconnue'}`);
              continue;
            }
            setShopifyRawResults(result.rawItems ?? []);
            setRejectedProspects((current) => [...current, ...(result.rejectedProspects ?? [])].slice(-1000));
            if (result.report) addApifyMessage(`Rapport ${keyword} : ${result.report.rawCount} bruts · ${result.report.normalizedCount} normalisés · ${result.report.insertedCount} insérés · ${result.report.duplicateCount} doublons · ${result.report.rejectedCount} rejetés (${Object.entries(result.report.rejectionReasons).map(([reason, count]) => `${reason}: ${count}`).join(', ') || 'aucun rejet'})`);
            if (connection.connected) {
              try { setProspects(await syncProspectsWithSupabase(result.prospects)); }
              catch (error) { setProspects((current) => mergeProspects(current, result.prospects).prospects); addApifyMessage(`Erreur Supabase non bloquante : ${error instanceof Error ? error.message : 'synchronisation impossible'}`); }
            } else setProspects((current) => mergeProspects(current, result.prospects).prospects);
            const insertedCount = result.insertedCount ?? result.prospects.length;
            const entry: AutoSearchHistoryEntry = { id: crypto.randomUUID(), country, niche: group.category, keyword, query: result.query || autoCriteria.keywords, searchedAt: new Date().toISOString(), insertedCount, duplicateCount: result.duplicateCount ?? 0, qualifiedCount: result.prospects.length };
            alreadySearched.add(historyKey);
            setSearchHistory((current) => [...current, entry]);
            qualifiedTotal += insertedCount;
            addApifyMessage(`✓ ${keyword} · ${country} : ${insertedCount} enregistrés, ${result.duplicateCount ?? 0} doublons, progression ${qualifiedTotal}/${targetLabel}.`);
          }
        }
      }
      addApifyMessage(quotaReached(qualifiedTotal) ? `Quota atteint : ${qualifiedTotal}/${targetLabel} prospects.` : `Agent terminé : bibliothèque épuisée avec ${qualifiedTotal}/${targetLabel} prospects.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur Apify inconnue';
      addApifyMessage(`Erreur prospection automatique : ${message}`);
    } finally {
      setAutoProspecting(false);
      setApifyLoading(false);
    }
  };
  const select = (id: string) => { setSelectedId(id); window.location.hash = 'prospect'; };
  const markContacted = (id: string) => setProspects((list) => list.map((p) => p.id === id ? { ...p, statutContact: 'Contacté', lastContactAt: new Date().toISOString(), nextFollowUpAt: new Date(Date.now() + 3 * 86400000).toISOString() } : p));
  const deleteProspect = (id: string) => setProspects((list) => list.map((p) => p.id === id ? { ...p, statutContact: 'Supprimé', notes: `${p.notes ?? ''}\nSuppression demandée / opt-out.` } : p));
  const updateSelected = (patch: Partial<Prospect>) => selected && setProspects((list) => list.map((p) => p.id === selected.id ? { ...p, ...patch, ...scoreProspect({ ...p, ...patch }) } : p));


  const activeProspects = prospects.filter((p) => p.statutContact !== 'Supprimé');
  const hotProspects = activeProspects.filter((p) => p.classement === 'ultra-chaud' || p.classement === 'chaud');
  const dashboardKpis = [
    ['CA du jour', '2 840 €', '+12% vs hier', Euro, 'orange'],
    ['Colis reçus', '126', '+18 entrants', PackagePlus, 'green'],
    ['Colis expédiés', '98', 'SLA 96%', Send, 'orange'],
    ['Préparations', '14', 'à traiter', ClipboardCheck, 'purple'],
    ['Box libres', '32', 'capacité OK', Box, 'green'],
    ['Impayés', '6 420 €', '6 factures', CreditCard, 'orange'],
  ] as const;
  const preparationRows = activeProspects.slice(0, 6).map((p, i) => [
    <strong>PREP-{String(i + 1248).padStart(4, '0')}</strong>,
    p.nomBoutique,
    <span className="v2-tag">Picking & packing</span>,
    <em>{p.classement}</em>,
  ]);
  const orderRows = (activeProspects.length ? activeProspects : visibleProspects).slice(0, 7).map((p, i) => [
    <strong>CMD-{String(i + 4312).padStart(5, '0')}</strong>,
    p.nomBoutique,
    <span className="v2-tag">En préparation</span>,
    <em>{p.score}/100</em>,
  ]);
  const quickActions = [
    ['Nouvelle réception', '#logistique', PackagePlus],
    ['Nouvelle préparation', '#logistique', ClipboardCheck],
    ['Nouvelle expédition', '#transporteurs', Send],
    ['Nouveau prospect', '#search', Bot],
    ['Ajouter client', '#clients', Users],
  ] as const;
  const dashboardElement = <div className="v2-page v3-dashboard">
    <section className="v3-quick-actions" aria-label="Boutons rapides">
      {quickActions.map(([label, href, Icon]) => <a href={href} key={label}><Icon size={17}/>{label}</a>)}
    </section>
    <section className="v2-metric-grid v3-kpi-row">{dashboardKpis.map(([label,value,delta,Icon,tone])=><V2MetricCard key={label} label={label} value={value} delta={delta} icon={Icon} tone={tone as 'green' | 'orange' | 'purple'}/>)}</section>
    <section className="v3-dashboard-columns">
      <V2Panel title="Graphique activité" eyebrow="7 derniers jours" className="v3-activity"><V2Bars values={[58,82,46,72,64,90,76,68,84]}/><p className="v2-muted">Volumes réceptions, préparations et expéditions consolidés pour la journée.</p></V2Panel>
      <V2Panel title="Préparations du jour" eyebrow="Opérations"><div className="v2-account-list">{preparationRows.length ? preparationRows.slice(0,5).map((row, index)=><button key={index}><span>{row[0]}</span><strong>{row[3]}</strong><small>{row[1]}</small></button>) : <p className="v2-empty">Aucune préparation prioritaire.</p>}</div></V2Panel>
      <V2Panel title="Alertes importantes" eyebrow="Contrôle"><div className="v3-alert-list"><p><AlertTriangle size={17}/> 6 impayés à relancer avant clôture.</p><p><PackageCheck size={17}/> 14 préparations attendent une validation.</p><p><Sparkles size={17}/> Assistant IA prêt : “Prépare les commandes du jour”.</p></div></V2Panel>
    </section>
    <V2Panel title="Commandes en cours" eyebrow="Suivi temps réel"><V2Table columns={["Commande", "Client", "Statut", "Score"]} rows={orderRows}/>{!orderRows.length ? <p className="v2-empty">Aucune commande en cours à afficher.</p> : null}</V2Panel>
    <aside className="v3-ai-dock" aria-label="Assistant IA permanent"><Bot size={18}/><strong>Assistant IA</strong><span>“Trouve 100 vendeurs Shopify”, “Affiche les impayés”, “Créer une facture”…</span><a href="#prospection">Ouvrir</a></aside>
  </div>;
  const logisticsElement = <div className="module-page"><section className="panel"><h3><Warehouse/> Logistique</h3><p>Suivi opérationnel des réceptions, stocks, box, préparations et expéditions. Les connexions Supabase existantes restent inchangées.</p><div className="card-grid"><article className="work-card"><strong>Réceptions</strong><span>126 colis reçus aujourd'hui</span></article><article className="work-card"><strong>Préparations</strong><span>14 dossiers en attente</span></article><article className="work-card"><strong>Expéditions</strong><span>98 colis remis transporteurs</span></article></div></section></div>;
  const accountingElement = <div className="module-page"><section className="panel"><h3><Calculator/> Comptabilité</h3><p>Vue synthétique prête pour factures, impayés, CA et exports comptables.</p><div className="stats-grid"><Stat label="CA du jour" value="2 840 €"/><Stat label="Impayés" value="6 420 €"/><Stat label="Factures à éditer" value="12"/><Stat label="Marge estimée" value="31%"/></div></section></div>;
  const carrierElement = <div className="module-page"><section className="panel"><h3><Truck/> Transporteurs</h3><div className="card-grid"><article className="work-card"><strong>Colissimo</strong><span>42 expéditions · SLA 98%</span></article><article className="work-card"><strong>Mondial Relay</strong><span>31 expéditions · SLA 94%</span></article><article className="work-card"><strong>Chronopost</strong><span>25 expéditions · SLA 96%</span></article></div></section></div>;
  const statsElement = <div className="module-page"><section className="panel chart-panel"><h3><LineChart/> Statistiques</h3><div className="bars tall"><i style={{height:'42%'}}/><i style={{height:'67%'}}/><i style={{height:'51%'}}/><i style={{height:'88%'}}/><i style={{height:'73%'}}/><i style={{height:'92%'}}/><i style={{height:'79%'}}/></div></section></div>;

  const pages: Record<PageKey, { title: string; subtitle: string; element: ReactNode }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Pilotage quotidien COLOCK-GISTIK : KPI, préparations, alertes, prospects et performance.', element: dashboardElement },
    logistique: { title: 'Logistique', subtitle: 'Réceptions, stocks, préparations, box et expéditions dans une vue opérationnelle compacte.', element: logisticsElement },
    prospection: { title: 'Prospection IA', subtitle: 'Assistant IA, recherche Shopify, scoring Colock Prospect, relances et messages multicanaux.', element: <div className="module-page"><section className="panel"><h3><Bot/> Prospection IA</h3><p>L'assistant IA reste connecté aux fonctions existantes : recherche Shopify/Apify, imports, scoring, messages et relances.</p><div className="module-actions"><a className="big-action" href="#search"><SearchIcon/> Lancer une recherche IA</a><a className="big-action light" href="#messages"><Mail/> Messages générés</a><a className="big-action light" href="#followups"><RefreshCw/> Relances</a></div></section></div> },
    clients: { title: 'Clients', subtitle: 'Portefeuille clients et prospects qualifiés avec actions rapides.', element: <div className="module-page"><section className="panel"><h3><Users/> Clients</h3><p>Accès au portefeuille prospects/clients sans modifier la donnée ni les règles de scoring.</p><div className="module-actions"><a className="big-action" href="#prospects"><Users/> Ouvrir la liste complète</a><button onClick={()=>exportProspectsCsv(prospects)}><Download/> Export CSV</button></div></section><div className="prospect-list">{visibleProspects.slice(0,8).map((p)=><ProspectCard key={p.id} p={p} onSelect={()=>select(p.id)} onContact={()=>markContacted(p.id)} onDelete={()=>deleteProspect(p.id)}/>)}</div></div> },
    transporteurs: { title: 'Transporteurs', subtitle: 'Suivi des transporteurs, volumes expédiés et qualité de service.', element: carrierElement },
    comptabilite: { title: 'Comptabilité', subtitle: 'CA, impayés, factures et indicateurs financiers.', element: accountingElement },
    statistiques: { title: 'Statistiques', subtitle: 'Analyse visuelle des volumes, performances et signaux commerciaux.', element: statsElement },
    search: { title: 'Recherche prospects', subtitle: 'Générez des pistes et ouvrez les recherches web/sociales publiques en un clic.', element: <div className="module-page"><div className="form-card"><h3><SearchIcon/> Critères</h3><div className="form-grid"><select value={criteria.platform} onChange={(e)=>setCriteria({...criteria, platform:e.target.value as Platform | 'Toutes'})}>{platforms.map((p)=><option key={p}>{p}</option>)}</select><input placeholder="Type produits" value={criteria.productType} onChange={(e)=>setCriteria({...criteria, productType:e.target.value})}/><input placeholder="Ville / pays" value={criteria.location} onChange={(e)=>setCriteria({...criteria, location:e.target.value})}/><input placeholder="Mots-clés" value={criteria.keywords} onChange={(e)=>setCriteria({...criteria, keywords:e.target.value})}/></div><div className="module-actions"><button onClick={runApify} disabled={apifyLoading}><SearchIcon/> {apifyLoading ? 'Recherche en cours…' : 'Chercher'}</button><select value={String(autoQuota)} onChange={(e)=>setAutoQuota(e.target.value === 'illimité' ? 'illimité' : Number(e.target.value) as AutoProspectingQuota)}>{AUTO_PROSPECTING_QUOTAS.map((quota)=><option key={quota} value={quota}>Quota {quota}</option>)}</select><button onClick={runAutoProspecting} disabled={apifyLoading}><Wand2/> {autoProspecting ? 'Agent IA autonome…' : 'Prospection automatique'}</button><button onClick={enrichProspects} disabled={apifyLoading}><RefreshCw/> Enrichir les prospects</button><button onClick={addProspects} className="secondary"><Plus/> Ajouter prospects démo</button></div><p className="form-message">Synchronisation : {connection.connected ? 'Supabase connecté' : 'Supabase non connecté'} · Score Colock Prospect /100 : Shopify vérifié, contacts publics, France/francophone, réseaux actifs, mono-produit/petite boutique, livraison, activité et formulaire. Malus : marketplace, grande enseigne, plus de 100 produits, inactive, pas de contact, hors Europe francophone. Qualification : un prospect est qualifié dès qu’un email, un téléphone ou un formulaire de contact est détecté. Conservation : aucun blocage pour réseaux manquants si le site Shopify reste exploitable.</p><div className="keyword-library">{ECOMMERCE_KEYWORD_LIBRARY.map((group)=><details key={group.category}><summary>{group.category} · {group.keywords.length} mots-clés</summary><div className="chips">{group.keywords.map((keyword)=><Badge key={keyword}>{keyword}</Badge>)}</div></details>)}</div>{apifyMessages.length ? <ol className="form-message apify-status">{apifyMessages.map((message, index)=><li key={`${index}-${message}`}>{message}</li>)}</ol> : null}<div className="auto-dashboard"><strong>Historique des recherches</strong>{searchHistory.slice(-10).reverse().map((entry)=><span key={entry.id}>{entry.keyword} · {entry.country} · +{entry.insertedCount} · {new Date(entry.searchedAt).toLocaleString('fr-FR')}</span>)}</div></div><div className="form-card"><h3><Upload/> Imports</h3><textarea value={importText} onChange={(e)=>setImportText(e.target.value)} /><div className="module-actions"><button onClick={()=>importCsv('CSV')}><Upload/> Import CSV</button><button onClick={()=>importCsv('Shopify')}><ShoppingBag/> Import Shopify</button><button onClick={()=>importCsv('TikTok Shop')}><Rocket/> Import TikTok Shop</button><button onClick={()=>importCsv('Vinted')}><Upload/> Import Vinted</button><button onClick={()=>importCsv('Etsy')}><Upload/> Import Etsy</button></div><div className="form-grid"><input placeholder="Apify Actor ID" value={apifyActor} readOnly onChange={(e)=>setApifyActor(e.target.value)}/><input placeholder="Token Apify (masqué)" type="password" autoComplete="off" value={apifyToken} onChange={(e)=>setApifyToken(e.target.value)}/><button onClick={runApify} disabled={apifyLoading}><Rocket/> {apifyLoading ? 'Connexion…' : 'Connecter Apify'}</button></div><p className="form-message">En production, le token Apify est lu côté serveur depuis Vercel. Shopify utilise exclusivement l’actor clearpath/shopify-store-leads ; Google Maps est interdit.</p>{apifyMessages.length ? <ol className="form-message apify-status">{apifyMessages.map((message, index)=><li key={`${index}-${message}`}>{message}</li>)}</ol> : null}</div><div className="card-grid">{buildSearchLinks(criteria).map((l)=><a className="work-card link-card" href={l.url} target="_blank" key={l.label}><ExternalLink/><strong>{l.label}</strong><span>Source publique à vérifier avant import.</span></a>)}</div></div> },
    shopifyRaw: { title: 'Résultats bruts Shopify', subtitle: 'Inspectez les données retournées par clearpath/shopify-store-leads avant insertion Supabase.', element: <div className="module-page"><section className="panel wide-panel"><h3>Dataset brut Apify Shopify</h3><p className="notice">{shopifyRawResults.length} résultat(s) brut(s) reçu(s) du dernier lancement Shopify.</p>{shopifyRawResults.length ? <pre className="message-box">{JSON.stringify(shopifyRawResults, null, 2)}</pre> : <p className="notice">Aucun résultat brut disponible. Lancez une recherche Shopify depuis l’onglet Recherche prospects.</p>}</section></div> },
    priority: { title: 'Prospects prioritaires', subtitle: 'Shopify vérifié, France/francophone, contact disponible et score >65.', element: <div className="module-page"><div className="module-actions"><button onClick={()=>exportProspectsCsv(priorityProspects)}><Download/> Export CSV prioritaire</button></div><div className="prospect-list">{priorityProspects.map((p)=><ProspectCard key={p.id} p={p} onSelect={()=>select(p.id)} onContact={()=>markContacted(p.id)} onDelete={()=>deleteProspect(p.id)}/>)}</div></div> },
    rejections: { title: 'Rejets', subtitle: 'Prospects rejetés avec score et raison exacte.', element: <div className="module-page"><section className="panel wide-panel"><h3>Rejets dernière prospection</h3><div className="data-list">{rejectedProspects.map((r)=><article className="data-row search-result" key={r.id}><strong>{r.nomBoutique}</strong><span>{r.siteWeb || 'Pas de site'} · score {r.score}/100</span><em>{r.reason}</em></article>)}</div></section></div> },
    prospects: { title: 'Liste prospects', subtitle: 'Classement 🔥 Ultra chaud / 🟢 Chaud / 🟡 Moyen / ⚪ Faible selon signaux de volume, contacts publics et proximité.', element: <div className="module-page"><div className="module-actions"><button onClick={()=>exportProspectsCsv(prospects)}><Download/> Export CSV</button>{[
      ['emailOnly','Email trouvé uniquement'], ['phoneOnly','Téléphone trouvé uniquement'], ['franceOnly','France vérifiée uniquement'], ['shopifyOnly','Shopify vérifié uniquement'], ['monoOnly','Mono-produit uniquement'], ['score40','Score >40'], ['score65','Score >65'], ['score85','Score >85'], ['instagramOnly','Avec Instagram'], ['facebookOnly','Avec Facebook'], ['tiktokOnly','Avec TikTok']
    ].map(([key,label])=><label className="filter-toggle" key={key}><input type="checkbox" checked={filters[key as keyof typeof filters]} onChange={(event)=>setFilter(key as keyof typeof filters,event.target.checked)}/> {label}</label>)}</div><div className="prospect-list">{visibleProspects.map((p)=><ProspectCard key={p.id} p={p} onSelect={()=>select(p.id)} onContact={()=>markContacted(p.id)} onDelete={()=>deleteProspect(p.id)}/>)}</div></div> },
    prospect: { title: 'Fiche prospect', subtitle: 'Informations utiles, score, message personnalisé et suppression RGPD.', element: <div className="module-page">{selected ? <><ProspectCard p={selected} onSelect={()=>{}} onContact={()=>markContacted(selected.id)} onDelete={()=>deleteProspect(selected.id)}/><div className="form-card"><h3>Modifier</h3><div className="form-grid"><input value={selected.email ?? ''} placeholder="Email public" onChange={(e)=>updateSelected({email:e.target.value})}/><input value={selected.telephone ?? ''} placeholder="Téléphone public" onChange={(e)=>updateSelected({telephone:e.target.value})}/><input value={selected.instagram ?? ''} placeholder="Instagram" onChange={(e)=>updateSelected({instagram:e.target.value})}/><input value={selected.facebook ?? ''} placeholder="Facebook" onChange={(e)=>updateSelected({facebook:e.target.value})}/><input value={selected.tiktok ?? ''} placeholder="TikTok" onChange={(e)=>updateSelected({tiktok:e.target.value})}/><input value={selected.linkedin ?? ''} placeholder="LinkedIn" onChange={(e)=>updateSelected({linkedin:e.target.value})}/><input value={selected.siteWeb ?? ''} placeholder="Site web" onChange={(e)=>updateSelected({siteWeb:e.target.value})}/><select value={selected.statutContact} onChange={(e)=>updateSelected({statutContact:e.target.value as Prospect['statutContact']})}>{prospectStatuses.map((status)=><option key={status}>{status}</option>)}</select><textarea value={selected.notes ?? ''} onChange={(e)=>updateSelected({notes:e.target.value})}/></div></div><pre className="message-box">{Object.entries(generateChannelMessages(selected)).map(([channel, message]) => `${channel.toUpperCase()}\n${message}`).join('\n\n---\n\n')}</pre></> : <p>Aucun prospect.</p>}</div> },
    messages: { title: 'Messages générés', subtitle: 'Scripts personnalisés pour premier contact et relances.', element: <div className="module-page"><div className="prospect-list">{prospects.filter((p)=>p.statutContact!=='Supprimé').map((p)=><article className="panel" key={p.id}><h3>{p.nomBoutique}</h3><pre className="message-box">{Object.entries(generateChannelMessages(p)).map(([channel, message]) => `${channel.toUpperCase()}\n${message}`).join('\n\n---\n\n')}</pre></article>)}</div></div> },
    followups: { title: 'Relances', subtitle: 'Séquences automatiques J+3 et J+7 à envoyer sans spam massif.', element: <div className="module-page"><div className="prospect-list">{prospects.filter((p)=>p.statutContact!=='Supprimé').map((p)=><article className="panel" key={p.id}><h3><RefreshCw/> {p.nomBoutique}</h3>{followUpDays.map((d)=><details key={d}><summary>Relance J+{d}</summary><pre className="message-box">{generateMessage(p, d as 3|7)}</pre></details>)}</article>)}</div></div> },
    campaigns: { title: 'Campagnes', subtitle: 'Suivez les campagnes de prospection, leurs sources et leurs statistiques.', element: <div className="module-page"><div className="stats-grid"><Stat label="prospects trouvés" value={metrics.found}/><Stat label="prospects qualifiés" value={metrics.qualified}/><Stat label="emails trouvés" value={metrics.emails}/><Stat label="taux de qualification" value={`${metrics.qualificationRate}%`}/></div><div className="prospect-list">{campaigns.map((c)=><article className="panel campaign-card" key={c.id}><h3><BarChart3/> {c.nom}</h3><p>{c.cible}</p><div className="chips"><Badge>{c.statut}</Badge><Badge>Apify · Shopify · TikTok Shop · CSV</Badge></div></article>)}</div></div> },
    export: { title: 'Export CSV', subtitle: 'Téléchargez les prospects pour CRM, tableur ou import commercial.', element: <div className="module-page"><button className="big-action" onClick={()=>exportProspectsCsv(prospects)}><Download/> Télécharger le CSV</button><p className="notice">Colonnes : nom, site, réseaux, contacts publics, plateforme, produits, ville, score, classement, source, source réelle.</p></div> },
    settings: { title: 'Paramètres', subtitle: 'Architecture, Supabase et connecteurs futurs Apify / Octoparse.', element: <div className="module-page"><section className="panel"><h3>Architecture MVP</h3><ol><li>React + Supabase uniquement pour la persistance des prospects, campagnes, relances et messages.</li><li>Schéma SQL Supabase dans <code>supabase/prospecting.sql</code>.</li><li>Scoring et modèles dans <code>src/lib/prospecting.ts</code>.</li><li>Connecteurs web externes ajoutables ensuite via Edge Functions.</li></ol></section><section className="panel"><h3>Ajouter Apify ou Octoparse ensuite</h3><p>Créer une Edge Function Supabase <code>run-prospect-scraper</code>, appeler un actor Apify ou une tâche Octoparse, normaliser le résultat vers <code>prospects</code> et <code>prospect_sources</code>, puis planifier via cron. Garder uniquement les données publiques et limiter les volumes par campagne.</p></section></div> },
  };
  const current = pages[activePage] ?? pages.dashboard;
  return <Layout activePage={activePage in pages ? activePage : 'dashboard'} title={current.title} subtitle={current.subtitle} supabaseStatus={connection.connected ? 'connected' : 'disconnected'}>{connection.error ? <p className="notice danger-notice">{connection.error}</p> : null}{connection.initializing ? <p className="notice">Connexion à Supabase en cours…</p> : null}{current.element}</Layout>;
}
