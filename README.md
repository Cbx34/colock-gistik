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

## Fixing the Receptions RLS error

The Receptions page first uploads the selected image to the public Supabase Storage bucket `photos`, then inserts a metadata row in the `photos` table, and finally inserts the reception row in `receptions`. If `receptions` already has RLS disabled, the `new row violates row-level security policy` error is triggered by either `storage.objects` during the upload or the `photos` metadata table insert.

Run `supabase/reception_rls_fix.sql` in the Supabase SQL editor (or through a service-role database connection) to disable RLS on `receptions` and `photos` and to add the required Storage policies for the `photos` bucket.
