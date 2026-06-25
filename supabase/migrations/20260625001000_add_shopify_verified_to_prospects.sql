alter table public.prospects
  add column if not exists shopify_verified boolean not null default false;

update public.prospects
set shopify_verified = false
where shopify_verified is null;

create index if not exists prospects_shopify_verified_idx
  on public.prospects(shopify_verified desc, score desc);
