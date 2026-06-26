-- Persist every signal used by the Colock Prospect scoring engine.
alter table prospects add column if not exists whatsapp text;
alter table prospects add column if not exists product_count integer;
alter table prospects add column if not exists is_mono_product boolean default false;
alter table prospects add column if not exists niche text;
alter table prospects add column if not exists has_contact_form boolean default false;
alter table prospects add column if not exists has_shipping_page boolean default false;
alter table prospects add column if not exists has_return_policy boolean default false;
alter table prospects add column if not exists professional_domain boolean default false;
alter table prospects add column if not exists instagram_active boolean default false;
alter table prospects add column if not exists facebook_active boolean default false;
alter table prospects add column if not exists tiktok_active boolean default false;
alter table prospects add column if not exists ships_to_france boolean default false;
alter table prospects add column if not exists active_store boolean default false;
alter table prospects add column if not exists internal_logistics boolean default false;
alter table prospects add column if not exists recent_store boolean default false;
alter table prospects add column if not exists strong_ad_presence boolean default false;
alter table prospects add column if not exists marketplace boolean default false;
alter table prospects add column if not exists large_brand boolean default false;
alter table prospects add column if not exists inactive_store boolean default false;

create unique index if not exists prospects_email_unique_not_null on prospects (lower(email)) where email is not null and email <> '';
create unique index if not exists prospects_site_web_unique_not_null on prospects (lower(regexp_replace(regexp_replace(site_web, '^https?://(www\\.)?', ''), '/$', ''))) where site_web is not null and site_web <> '';
create index if not exists prospects_colock_filters_idx on prospects(score desc, shopify_verified, is_mono_product, pays);
