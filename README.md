# COLOCK-GISTIK

Single-page logistics operations dashboard connected to an existing Supabase project.

## Supabase tables used

The application reads and writes real data from these tables: `clients`, `commandes`, `produits`, `receptions`, `preparations`, `expeditions`, `photos`, and `emplacements`.

## Environment variables

Create `.env.local` locally or configure the same variables in Vercel:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Reception photos are uploaded to a public Supabase Storage bucket named `photos`, then referenced in the `photos` and `receptions` tables.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to Vercel

```bash
npx vercel --prod
```

Make sure the Vercel project has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured before deploying.
