# COLOCK-GISTIK Prospection MVP

Application React mobile/desktop pour prospecter automatiquement des vendeurs e-commerce à qui proposer Colock-Gistik : stockage, réception marchandise, préparation colis, emballage et expédition multi-transporteurs depuis Montpellier / Lavérune / Le Crès.

## Fonctionnalités

- Dashboard avec prospects trouvés, contactés, réponses et relances.
- Recherche assistée de vendeurs Shopify, Vinted, TikTok Shop, Etsy, eBay, dropshippers et marques e-commerce françaises.
- Fiche prospect avec site, réseaux sociaux, contacts publics, plateforme, produits, ville, score et classement.
- Scoring automatique de 1 à 10 et classement `chaud`, `moyen` ou `faible`.
- Messages personnalisés et relances J+2, J+5, J+10.
- Export CSV.
- Garde-fous RGPD : données publiques, suppression/opt-out et historique prévu dans Supabase.

## Architecture

- `src/App.tsx` : pages MVP et orchestration de l'interface.
- `src/lib/prospecting.ts` : scoring, modèles de messages, liens de recherche et données de test.
- `src/lib/storage.ts` : persistance locale et export CSV pour tester immédiatement.
- `supabase/prospecting.sql` : tables Supabase `prospects`, `prospect_sources`, `messages`, `relances`, `campagnes` et `interactions`.

## Supabase

Exécutez le SQL de `supabase/prospecting.sql` dans l'éditeur SQL Supabase. Le MVP fonctionne aussi sans Supabase grâce à `localStorage`, pour permettre un test immédiat.

## Ajouter Apify ou Octoparse ensuite

1. Créer une Edge Function Supabase `run-prospect-scraper`.
2. Appeler un Actor Apify ou une tâche Octoparse par plateforme.
3. Normaliser les résultats vers les colonnes de `prospects` et stocker chaque URL publique dans `prospect_sources`.
4. Réutiliser `scoreProspect` côté serveur ou dupliquer sa logique SQL.
5. Planifier des campagnes limitées via cron pour éviter le spam et respecter le RGPD.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
