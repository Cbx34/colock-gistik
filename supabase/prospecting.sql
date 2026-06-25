-- Colock-Gistik Prospecting MVP schema
create extension if not exists pgcrypto;

create table if not exists campagnes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  cible text not null default 'e-commerce France',
  statut text not null default 'active' check (statut in ('draft','active','paused','done')),
  created_at timestamptz not null default now()
);

create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  nom_boutique text not null,
  site_web text,
  instagram text,
  facebook text,
  tiktok text,
  linkedin text,
  email text,
  telephone text,
  plateforme text not null default 'Inconnue',
  type_produits text,
  ville text,
  pays text not null default 'France',
  score integer not null default 0 check (score between 0 and 100),
  classement text not null default 'faible' check (classement in ('chaud','moyen','faible')),
  statut_contact text not null default 'Nouveau' check (statut_contact in ('Nouveau','Contacté','Relance J+2','Relance J+5','Client signé','Supprimé')),
  volume_signaux text[] not null default '{}',
  source text not null default 'CSV' check (source in ('Apify','Shopify','Vinted','TikTok Shop','Etsy','Google Maps','CSV','Démo')),
  source_url text,
  source_reelle text not null default 'Google Maps' check (source_reelle in ('Shopify','Vinted','TikTok Shop','Etsy','Google Maps','CSV','Démo','Inconnue')),
  shopify_verified boolean not null default false,
  rgpd_source_publique boolean not null default true,
  rgpd_opt_out boolean not null default false,
  notes text,
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  campagne_id uuid references campagnes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prospect_sources (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  source_type text not null,
  source_url text not null,
  extrait_public text,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  canal text not null default 'email' check (canal in ('email','instagram','tiktok','linkedin','telephone','autre')),
  sujet text,
  contenu text not null,
  statut text not null default 'brouillon' check (statut in ('brouillon','envoye','repondu','archive')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists relances (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  message_id uuid references messages(id) on delete set null,
  rang integer not null check (rang in (1,2,3)),
  due_at timestamptz not null,
  statut text not null default 'a_faire' check (statut in ('a_faire','faite','annulee')),
  contenu text,
  created_at timestamptz not null default now()
);

create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  type text not null check (type in ('note','email','appel','dm','reponse','suppression')),
  contenu text not null,
  created_at timestamptz not null default now()
);


alter table prospects add column if not exists source_reelle text not null default 'Google Maps';
alter table prospects add column if not exists shopify_verified boolean not null default false;
alter table prospects add column if not exists facebook text;
alter table prospects drop constraint if exists prospects_score_check;
alter table prospects add constraint prospects_score_check check (score between 0 and 100);
update prospects set source_reelle = 'Google Maps' where source_reelle is null or btrim(source_reelle) = '' or source_reelle = 'Inconnue';
alter table prospects alter column source_reelle set default 'Google Maps';
alter table prospects drop constraint if exists prospects_source_check;
alter table prospects add constraint prospects_source_check check (source in ('Apify','Shopify','Vinted','TikTok Shop','Etsy','Google Maps','CSV','Démo'));
alter table prospects drop constraint if exists prospects_source_reelle_check;
alter table prospects add constraint prospects_source_reelle_check check (source_reelle in ('Shopify','Vinted','TikTok Shop','Etsy','Google Maps','CSV','Démo','Inconnue'));

create index if not exists prospects_shopify_verified_idx on prospects(shopify_verified desc, score desc);
create index if not exists prospects_colock_gistik_score_idx on prospects(score desc, shopify_verified desc);
create index if not exists prospects_email_found_idx on prospects ((email is not null), score desc);
create index if not exists prospects_classement_idx on prospects(classement);
create index if not exists prospects_next_follow_up_idx on prospects(next_follow_up_at) where statut_contact <> 'Supprimé';
create unique index if not exists prospects_dedupe_email_idx on prospects (lower(email)) where email is not null;
create unique index if not exists prospects_dedupe_site_idx on prospects (lower(regexp_replace(site_web, '^https?://(www\.)?', ''))) where site_web is not null;
create index if not exists relances_due_idx on relances(due_at, statut);
create unique index if not exists messages_prospect_sujet_idx on messages(prospect_id, sujet);
create unique index if not exists relances_prospect_rang_idx on relances(prospect_id, rang);

create or replace function create_prospecting_schema()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  create extension if not exists pgcrypto;

  create table if not exists campagnes (
    id uuid primary key default gen_random_uuid(),
    nom text not null,
    cible text not null default 'e-commerce France',
    statut text not null default 'active' check (statut in ('draft','active','paused','done')),
    created_at timestamptz not null default now()
  );

  create table if not exists prospects (
    id uuid primary key default gen_random_uuid(),
    nom_boutique text not null,
    site_web text,
    instagram text,
    tiktok text,
    linkedin text,
    email text,
    telephone text,
    plateforme text not null default 'Inconnue',
    type_produits text,
    ville text,
    pays text not null default 'France',
    score integer not null default 0 check (score between 0 and 100),
    classement text not null default 'faible' check (classement in ('chaud','moyen','faible')),
    statut_contact text not null default 'Nouveau' check (statut_contact in ('Nouveau','Contacté','Relance J+2','Relance J+5','Client signé','Supprimé')),
    volume_signaux text[] not null default '{}',
    source text not null default 'CSV' check (source in ('Apify','Shopify','Vinted','TikTok Shop','Etsy','Google Maps','CSV','Démo')),
    source_url text,
    source_reelle text not null default 'Google Maps' check (source_reelle in ('Shopify','Vinted','TikTok Shop','Etsy','Google Maps','CSV','Démo','Inconnue')),
    shopify_verified boolean not null default false,
    rgpd_source_publique boolean not null default true,
    rgpd_opt_out boolean not null default false,
    notes text,
    last_contact_at timestamptz,
    next_follow_up_at timestamptz,
    campagne_id uuid references campagnes(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );


  create table if not exists prospect_sources (
    id uuid primary key default gen_random_uuid(),
    prospect_id uuid not null references prospects(id) on delete cascade,
    source_type text not null,
    source_url text not null,
    extrait_public text,
    created_at timestamptz not null default now()
  );

  create table if not exists messages (
    id uuid primary key default gen_random_uuid(),
    prospect_id uuid not null references prospects(id) on delete cascade,
    canal text not null default 'email' check (canal in ('email','instagram','tiktok','linkedin','telephone','autre')),
    sujet text,
    contenu text not null,
    statut text not null default 'brouillon' check (statut in ('brouillon','envoye','repondu','archive')),
    scheduled_at timestamptz,
    sent_at timestamptz,
    created_at timestamptz not null default now()
  );

  create table if not exists relances (
    id uuid primary key default gen_random_uuid(),
    prospect_id uuid not null references prospects(id) on delete cascade,
    message_id uuid references messages(id) on delete set null,
    rang integer not null check (rang in (1,2,3)),
    due_at timestamptz not null,
    statut text not null default 'a_faire' check (statut in ('a_faire','faite','annulee')),
    contenu text,
    created_at timestamptz not null default now()
  );


  create table if not exists interactions (
    id uuid primary key default gen_random_uuid(),
    prospect_id uuid not null references prospects(id) on delete cascade,
    type text not null check (type in ('note','email','appel','dm','reponse','suppression')),
    contenu text not null,
    created_at timestamptz not null default now()
  );

  alter table prospects add column if not exists source_reelle text not null default 'Google Maps';
  alter table prospects add column if not exists shopify_verified boolean not null default false;
alter table prospects add column if not exists facebook text;
  alter table prospects drop constraint if exists prospects_score_check;
  alter table prospects add constraint prospects_score_check check (score between 0 and 100);
  update prospects set source_reelle = 'Google Maps' where source_reelle is null or btrim(source_reelle) = '' or source_reelle = 'Inconnue';
  alter table prospects alter column source_reelle set default 'Google Maps';
  alter table prospects drop constraint if exists prospects_source_check;
  alter table prospects add constraint prospects_source_check check (source in ('Apify','Shopify','Vinted','TikTok Shop','Etsy','Google Maps','CSV','Démo'));
  alter table prospects drop constraint if exists prospects_source_reelle_check;
  alter table prospects add constraint prospects_source_reelle_check check (source_reelle in ('Shopify','Vinted','TikTok Shop','Etsy','Google Maps','CSV','Démo','Inconnue'));

  create unique index if not exists messages_prospect_sujet_idx on messages(prospect_id, sujet);
  create unique index if not exists relances_prospect_rang_idx on relances(prospect_id, rang);
  create index if not exists prospects_shopify_verified_idx on prospects(shopify_verified desc, score desc);
create index if not exists prospects_colock_gistik_score_idx on prospects(score desc, shopify_verified desc);
create index if not exists prospects_email_found_idx on prospects ((email is not null), score desc);
  create index if not exists prospects_classement_idx on prospects(classement);
  create index if not exists prospects_next_follow_up_idx on prospects(next_follow_up_at) where statut_contact <> 'Supprimé';
  create index if not exists relances_due_idx on relances(due_at, statut);
end;
$$;
