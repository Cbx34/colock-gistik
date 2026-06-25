alter table public.prospects
  add column if not exists shopify_verified boolean default false;

update public.prospects
set shopify_verified = false
where shopify_verified is null;

alter table public.prospects
  alter column shopify_verified set default false;
