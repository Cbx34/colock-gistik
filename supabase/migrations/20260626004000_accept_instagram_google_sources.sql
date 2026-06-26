alter table public.prospects drop constraint if exists prospects_source_check;
alter table public.prospects
  add constraint prospects_source_check
  check (source in ('Apify','Shopify','Vinted','TikTok Shop','Etsy','Instagram','Google','Google Maps','CSV','Démo'));

alter table public.prospects drop constraint if exists prospects_source_reelle_check;
alter table public.prospects
  add constraint prospects_source_reelle_check
  check (source_reelle in ('Shopify','Vinted','TikTok Shop','Etsy','Instagram','Google','Google Maps','CSV','Démo','Inconnue'));
