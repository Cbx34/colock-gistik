import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Download, ExternalLink, Mail, Plus, RefreshCw, Search as SearchIcon, ShieldCheck, Trash2, Upload, Rocket, ShoppingBag, BarChart3, Wand2 } from 'lucide-react';
import Layout, { type PageKey } from './components/Layout';
import { buildSearchLinks, defaultCampaigns, ECOMMERCE_KEYWORD_LIBRARY, ECOMMERCE_KEYWORD_QUERIES, QUALIFIED_PROSPECTS_TARGET_PER_CATEGORY, fetchApifyProspects, qualifiedTargetPerKeyword, followUpDays, generateMessage, mergeProspects, mockProspectSearch, parseCsvProspects, prospectStatuses, scoreProspect, type Campaign, type Platform, type Prospect, type ApifyProgress, type SearchCriteria } from './lib/prospecting';
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
  return p.pays.toLowerCase() === 'france' && p.volumeSignaux.some((signal) => /France vérifiée|mentions légales françaises|téléphone \+33|adresse France/i.test(signal));
}

function ProspectCard({ p, onSelect, onDelete, onContact }: { p: Prospect; onSelect: () => void; onDelete: () => void; onContact: () => void }) {
  const franceVerified = isFranceVerified(p);
  const mailto = p.email ? `mailto:${p.email}?subject=${encodeURIComponent(`Proposition logistique pour ${p.nomBoutique}`)}&body=${encodeURIComponent(generateMessage(p))}` : undefined;
  return <article className="prospect-card"><div><SourceHeader source={p.sourceReelle}/><h3>{p.nomBoutique}</h3><p>{p.typeProduits} · {p.ville}, {p.pays}</p><div className="chips"><Badge tone={p.classement}>{p.classement}</Badge><Badge>{p.plateforme}</Badge><Badge tone={p.shopifyVerified ? 'chaud' : 'neutral'}>{p.shopifyVerified ? '✅ Shopify vérifié' : '❌ Non vérifié'}</Badge>{franceVerified ? <Badge tone="chaud">France vérifiée</Badge> : null}<Badge tone={p.email ? 'chaud' : 'neutral'}>{p.email ? 'Email trouvé' : 'Email absent'}</Badge><Badge>Score Colock-Gistik {p.score}/20</Badge><Badge>{p.statutContact}</Badge></div></div><ul>{p.volumeSignaux.map((signal) => <li key={signal}>{signal}</li>)}{p.siteWeb ? <li><a href={p.siteWeb} target="_blank">Site web</a></li> : null}<ContactLink label="Email" value={p.email}/><ContactLink label="Téléphone" value={p.telephone}/><ContactLink label="Instagram" value={p.instagram}/><ContactLink label="Facebook" value={p.facebook}/><ContactLink label="TikTok" value={p.tiktok}/><ContactLink label="LinkedIn" value={p.linkedin}/>{p.sourceUrl ? <li><a href={p.sourceUrl} target="_blank">URL source</a></li> : null}</ul><div className="card-actions"><button onClick={onSelect}>Ouvrir</button>{mailto ? <a className="action-button" href={mailto} onClick={onContact}><Mail size={17}/> Envoyer email</a> : null}<button onClick={onContact}><Mail size={17}/> Contacté</button><button className="secondary danger" onClick={onDelete}><Trash2 size={17}/> Supprimer</button></div></article>;
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
  const [apifyMessages, setApifyMessages] = useState<string[]>([]);
  const [shopifyRawResults, setShopifyRawResults] = useState<Record<string, unknown>[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [emailOnly, setEmailOnly] = useState(false);
  const visibleProspects = prospects.filter((p) => p.statutContact !== 'Supprimé' && (!emailOnly || Boolean(p.email)));
  const selected = prospects.find((p) => p.id === selectedId) ?? visibleProspects[0] ?? prospects[0];
  const [criteria, setCriteria] = useState<SearchCriteria>({ platform: 'Shopify', productType: '', location: 'France', keywords: 'bijoux France' });

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

  const metrics = useMemo(() => { const active = prospects.filter((p) => p.statutContact !== 'Supprimé'); const contacted = active.filter((p) => ['Contacté','Relance J+2','Relance J+5','Client signé'].includes(p.statutContact)).length; const signed = active.filter((p) => p.statutContact === 'Client signé').length; return { found: active.length, contacted, responseRate: contacted ? Math.round(((active.filter((p) => ['Relance J+2','Relance J+5','Client signé'].includes(p.statutContact)).length) / contacted) * 100) : 0, signed, followups: active.filter((p) => p.nextFollowUpAt && new Date(p.nextFollowUpAt) <= new Date(Date.now() + 10 * 86400000)).length }; }, [prospects]);
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
      if (typeof result.insertedCount === 'number') addApifyMessage(`${result.insertedCount} prospects insérés exactement dans Supabase`);
      if (connection.connected) {
        const refreshed = await syncProspectsWithSupabase(result.prospects);
        setProspects(refreshed);
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
  const runAutoProspecting = async () => {
    setApifyMessages([`Prospection automatique lancée sur ${ECOMMERCE_KEYWORD_LIBRARY.length} catégories, objectif ${QUALIFIED_PROSPECTS_TARGET_PER_CATEGORY} prospects Shopify qualifiés minimum par catégorie.`]);
    setAutoProspecting(true);
    setApifyLoading(true);
    try {
      for (const group of ECOMMERCE_KEYWORD_LIBRARY) {
        const perKeywordTarget = qualifiedTargetPerKeyword(group.keywords.length);
        let categoryInserted = 0;
        addApifyMessage(`▶ ${group.category} — ${group.keywords.length} mots-clés, cible ${QUALIFIED_PROSPECTS_TARGET_PER_CATEGORY} qualifiés (${perKeywordTarget}/mot-clé).`);
        for (const keyword of group.keywords) {
          const autoCriteria: SearchCriteria = { platform: 'Shopify', productType: keyword, location: 'France', keywords: `${keyword} France` };
          const result = await fetchApifyProspects(apifyActor, apifyToken, autoCriteria, perKeywordTarget, (progress: ApifyProgress) => addApifyMessage(`${group.category}/${keyword} : ${progress.message}`));
          setShopifyRawResults(result.rawItems ?? []);
          if (connection.connected) setProspects(await syncProspectsWithSupabase(result.prospects));
          else setProspects((current) => mergeProspects(current, result.prospects).prospects);
          categoryInserted += result.insertedCount ?? result.prospects.length;
          addApifyMessage(`✓ ${group.category}/${keyword} : ${result.insertedCount ?? result.prospects.length} qualifiés insérés, ${result.duplicateCount ?? 0} doublons.`);
        }
        addApifyMessage(`■ ${group.category} terminé : ${categoryInserted}/${QUALIFIED_PROSPECTS_TARGET_PER_CATEGORY} prospects qualifiés insérés.`);
      }
      addApifyMessage('Prospection automatique terminée : seuls les prospects Shopify vérifiés avec email et Instagram/Facebook sont conservés.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur Apify inconnue';
      addApifyMessage(`Erreur prospection automatique : ${message}`);
    } finally {
      setAutoProspecting(false);
      setApifyLoading(false);
    }
  };
  const select = (id: string) => { setSelectedId(id); window.location.hash = 'prospect'; };
  const markContacted = (id: string) => setProspects((list) => list.map((p) => p.id === id ? { ...p, statutContact: 'Contacté', lastContactAt: new Date().toISOString(), nextFollowUpAt: new Date(Date.now() + 2 * 86400000).toISOString() } : p));
  const deleteProspect = (id: string) => setProspects((list) => list.map((p) => p.id === id ? { ...p, statutContact: 'Supprimé', notes: `${p.notes ?? ''}\nSuppression demandée / opt-out.` } : p));
  const updateSelected = (patch: Partial<Prospect>) => selected && setProspects((list) => list.map((p) => p.id === selected.id ? { ...p, ...patch, ...scoreProspect({ ...p, ...patch }) } : p));

  const pages: Record<PageKey, { title: string; subtitle: string; element: ReactNode }> = {
    dashboard: { title: 'Prospection automatique Colock-Gistik', subtitle: 'MVP simple pour trouver, scorer, contacter et relancer des vendeurs e-commerce.', element: <div className="page-grid"><section className="orange-hero"><div><span className="pill">Stockage · Préparation · Expédition</span><h2>Pipeline commercial e-commerce</h2><p>Centralisez les boutiques Shopify, Vinted Pro, TikTok Shop, Etsy, eBay, dropshippers et petites marques françaises à prospecter.</p></div><a className="big-action" href="#search"><Plus/> Lancer une recherche</a></section><div className="stats-grid"><Stat label="prospects trouvés" value={metrics.found}/><Stat label="prospects contactés" value={metrics.contacted}/><Stat label="taux de réponse" value={`${metrics.responseRate}%`}/><Stat label="clients signés" value={metrics.signed}/></div><section className="panel wide-panel"><h3>Priorité du jour</h3>{prospects.filter((p)=>p.classement==='chaud' && p.statutContact!=='Supprimé').slice(0,4).map((p)=><ProspectCard key={p.id} p={p} onSelect={()=>select(p.id)} onContact={()=>markContacted(p.id)} onDelete={()=>deleteProspect(p.id)}/>)}</section><aside className="panel"><h3><ShieldCheck/> RGPD</h3><p>Données publiques uniquement, pas de spam massif, historique de contact et suppression immédiate via le bouton Supprimer.</p></aside></div> },
    search: { title: 'Recherche prospects', subtitle: 'Générez des pistes et ouvrez les recherches web/sociales publiques en un clic.', element: <div className="module-page"><div className="form-card"><h3><SearchIcon/> Critères</h3><div className="form-grid"><select value={criteria.platform} onChange={(e)=>setCriteria({...criteria, platform:e.target.value as Platform | 'Toutes'})}>{platforms.map((p)=><option key={p}>{p}</option>)}</select><input placeholder="Type produits" value={criteria.productType} onChange={(e)=>setCriteria({...criteria, productType:e.target.value})}/><input placeholder="Ville / pays" value={criteria.location} onChange={(e)=>setCriteria({...criteria, location:e.target.value})}/><input placeholder="Mots-clés" value={criteria.keywords} onChange={(e)=>setCriteria({...criteria, keywords:e.target.value})}/></div><div className="module-actions"><button onClick={runApify} disabled={apifyLoading}><SearchIcon/> {apifyLoading ? 'Recherche en cours…' : 'Chercher'}</button><button onClick={runAutoProspecting} disabled={apifyLoading}><Wand2/> {autoProspecting ? 'Prospection automatique…' : 'Prospection automatique'}</button><button onClick={addProspects} className="secondary"><Plus/> Ajouter prospects démo</button></div><p className="form-message">Synchronisation : {connection.connected ? 'Supabase connecté' : 'Supabase non connecté'} · Score Colock-Gistik /20 : +5 email, +2 téléphone, +4 France, +4 Shopify vérifié, +2 boutique active, +3 Instagram/Facebook. Conservation : Shopify vérifié + email + Instagram ou Facebook, France prioritaire.</p><div className="keyword-library">{ECOMMERCE_KEYWORD_LIBRARY.map((group)=><details key={group.category}><summary>{group.category} · {group.keywords.length} mots-clés</summary><div className="chips">{group.keywords.map((keyword)=><Badge key={keyword}>{keyword}</Badge>)}</div></details>)}</div>{apifyMessages.length ? <ol className="form-message apify-status">{apifyMessages.map((message, index)=><li key={`${index}-${message}`}>{message}</li>)}</ol> : null}</div><div className="form-card"><h3><Upload/> Imports</h3><textarea value={importText} onChange={(e)=>setImportText(e.target.value)} /><div className="module-actions"><button onClick={()=>importCsv('CSV')}><Upload/> Import CSV</button><button onClick={()=>importCsv('Shopify')}><ShoppingBag/> Import Shopify</button><button onClick={()=>importCsv('TikTok Shop')}><Rocket/> Import TikTok Shop</button><button onClick={()=>importCsv('Vinted')}><Upload/> Import Vinted</button><button onClick={()=>importCsv('Etsy')}><Upload/> Import Etsy</button></div><div className="form-grid"><input placeholder="Apify Actor ID" value={apifyActor} readOnly onChange={(e)=>setApifyActor(e.target.value)}/><input placeholder="Token Apify (masqué)" type="password" autoComplete="off" value={apifyToken} onChange={(e)=>setApifyToken(e.target.value)}/><button onClick={runApify} disabled={apifyLoading}><Rocket/> {apifyLoading ? 'Connexion…' : 'Connecter Apify'}</button></div><p className="form-message">En production, le token Apify est lu côté serveur depuis Vercel. Shopify utilise exclusivement l’actor clearpath/shopify-store-leads ; Google Maps est interdit.</p>{apifyMessages.length ? <ol className="form-message apify-status">{apifyMessages.map((message, index)=><li key={`${index}-${message}`}>{message}</li>)}</ol> : null}</div><div className="card-grid">{buildSearchLinks(criteria).map((l)=><a className="work-card link-card" href={l.url} target="_blank" key={l.label}><ExternalLink/><strong>{l.label}</strong><span>Source publique à vérifier avant import.</span></a>)}</div></div> },
    shopifyRaw: { title: 'Résultats bruts Shopify', subtitle: 'Inspectez les données retournées par clearpath/shopify-store-leads avant insertion Supabase.', element: <div className="module-page"><section className="panel wide-panel"><h3>Dataset brut Apify Shopify</h3><p className="notice">{shopifyRawResults.length} résultat(s) brut(s) reçu(s) du dernier lancement Shopify.</p>{shopifyRawResults.length ? <pre className="message-box">{JSON.stringify(shopifyRawResults, null, 2)}</pre> : <p className="notice">Aucun résultat brut disponible. Lancez une recherche Shopify depuis l’onglet Recherche prospects.</p>}</section></div> },
    prospects: { title: 'Liste prospects', subtitle: 'Classement chaud / moyen / faible selon signaux de volume, contacts publics et proximité.', element: <div className="module-page"><div className="module-actions"><button onClick={()=>exportProspectsCsv(prospects)}><Download/> Export CSV</button><label className="filter-toggle"><input type="checkbox" checked={emailOnly} onChange={(event)=>setEmailOnly(event.target.checked)}/> Email trouvé uniquement</label></div><div className="prospect-list">{visibleProspects.map((p)=><ProspectCard key={p.id} p={p} onSelect={()=>select(p.id)} onContact={()=>markContacted(p.id)} onDelete={()=>deleteProspect(p.id)}/>)}</div></div> },
    prospect: { title: 'Fiche prospect', subtitle: 'Informations utiles, score, message personnalisé et suppression RGPD.', element: <div className="module-page">{selected ? <><ProspectCard p={selected} onSelect={()=>{}} onContact={()=>markContacted(selected.id)} onDelete={()=>deleteProspect(selected.id)}/><div className="form-card"><h3>Modifier</h3><div className="form-grid"><input value={selected.email ?? ''} placeholder="Email public" onChange={(e)=>updateSelected({email:e.target.value})}/><input value={selected.telephone ?? ''} placeholder="Téléphone public" onChange={(e)=>updateSelected({telephone:e.target.value})}/><input value={selected.instagram ?? ''} placeholder="Instagram" onChange={(e)=>updateSelected({instagram:e.target.value})}/><input value={selected.facebook ?? ''} placeholder="Facebook" onChange={(e)=>updateSelected({facebook:e.target.value})}/><input value={selected.tiktok ?? ''} placeholder="TikTok" onChange={(e)=>updateSelected({tiktok:e.target.value})}/><input value={selected.linkedin ?? ''} placeholder="LinkedIn" onChange={(e)=>updateSelected({linkedin:e.target.value})}/><input value={selected.siteWeb ?? ''} placeholder="Site web" onChange={(e)=>updateSelected({siteWeb:e.target.value})}/><select value={selected.statutContact} onChange={(e)=>updateSelected({statutContact:e.target.value as Prospect['statutContact']})}>{prospectStatuses.map((status)=><option key={status}>{status}</option>)}</select><textarea value={selected.notes ?? ''} onChange={(e)=>updateSelected({notes:e.target.value})}/></div></div><pre className="message-box">{generateMessage(selected)}</pre></> : <p>Aucun prospect.</p>}</div> },
    messages: { title: 'Messages générés', subtitle: 'Scripts personnalisés pour premier contact et relances.', element: <div className="module-page"><div className="prospect-list">{prospects.filter((p)=>p.statutContact!=='Supprimé').map((p)=><article className="panel" key={p.id}><h3>{p.nomBoutique}</h3><pre className="message-box">{generateMessage(p)}</pre></article>)}</div></div> },
    followups: { title: 'Relances', subtitle: 'Séquences automatiques J+2, J+5 et J+10 à envoyer sans spam massif.', element: <div className="module-page"><div className="prospect-list">{prospects.filter((p)=>p.statutContact!=='Supprimé').map((p)=><article className="panel" key={p.id}><h3><RefreshCw/> {p.nomBoutique}</h3>{followUpDays.map((d)=><details key={d}><summary>Relance J+{d}</summary><pre className="message-box">{generateMessage(p, d as 2|5|10)}</pre></details>)}</article>)}</div></div> },
    campaigns: { title: 'Campagnes', subtitle: 'Suivez les campagnes de prospection, leurs sources et leurs statistiques.', element: <div className="module-page"><div className="stats-grid"><Stat label="prospects trouvés" value={metrics.found}/><Stat label="prospects contactés" value={metrics.contacted}/><Stat label="taux de réponse" value={`${metrics.responseRate}%`}/><Stat label="clients signés" value={metrics.signed}/></div><div className="prospect-list">{campaigns.map((c)=><article className="panel campaign-card" key={c.id}><h3><BarChart3/> {c.nom}</h3><p>{c.cible}</p><div className="chips"><Badge>{c.statut}</Badge><Badge>Apify · Shopify · TikTok Shop · CSV</Badge></div></article>)}</div></div> },
    export: { title: 'Export CSV', subtitle: 'Téléchargez les prospects pour CRM, tableur ou import commercial.', element: <div className="module-page"><button className="big-action" onClick={()=>exportProspectsCsv(prospects)}><Download/> Télécharger le CSV</button><p className="notice">Colonnes : nom, site, réseaux, contacts publics, plateforme, produits, ville, score, classement, source, source réelle.</p></div> },
    settings: { title: 'Paramètres', subtitle: 'Architecture, Supabase et connecteurs futurs Apify / Octoparse.', element: <div className="module-page"><section className="panel"><h3>Architecture MVP</h3><ol><li>React + Supabase uniquement pour la persistance des prospects, campagnes, relances et messages.</li><li>Schéma SQL Supabase dans <code>supabase/prospecting.sql</code>.</li><li>Scoring et modèles dans <code>src/lib/prospecting.ts</code>.</li><li>Connecteurs web externes ajoutables ensuite via Edge Functions.</li></ol></section><section className="panel"><h3>Ajouter Apify ou Octoparse ensuite</h3><p>Créer une Edge Function Supabase <code>run-prospect-scraper</code>, appeler un actor Apify ou une tâche Octoparse, normaliser le résultat vers <code>prospects</code> et <code>prospect_sources</code>, puis planifier via cron. Garder uniquement les données publiques et limiter les volumes par campagne.</p></section></div> },
  };
  const current = pages[activePage] ?? pages.dashboard;
  return <Layout activePage={activePage in pages ? activePage : 'dashboard'} title={current.title} subtitle={current.subtitle} supabaseStatus={connection.connected ? 'connected' : 'disconnected'}>{connection.error ? <p className="notice danger-notice">{connection.error}</p> : null}{connection.initializing ? <p className="notice">Connexion à Supabase en cours…</p> : null}{current.element}</Layout>;
}
