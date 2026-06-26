-- Add the real acquisition source used by the prospecting UI/API.
alter table public.prospects
  add column if not exists source_reelle text not null default 'Google Maps';

update public.prospects
set source_reelle = 'Google Maps'
where source_reelle is null or btrim(source_reelle) = '' or source_reelle = 'Inconnue';

alter table public.prospects
  alter column source_reelle set default 'Google Maps';

alter table public.prospects drop constraint if exists prospects_source_reelle_check;
alter table public.prospects
  add constraint prospects_source_reelle_check
  check (source_reelle in ('Shopify','Vinted','TikTok Shop','Etsy','Instagram','Google','Google Maps','CSV','Démo','Inconnue'));

notify pgrst, 'reload schema';
