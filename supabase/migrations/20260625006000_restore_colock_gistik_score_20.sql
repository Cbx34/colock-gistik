alter table prospects drop constraint if exists prospects_score_check;
alter table prospects add constraint prospects_score_check check (score between 0 and 20);
create index if not exists prospects_colock_gistik_score_20_idx on prospects(score desc, shopify_verified desc);
