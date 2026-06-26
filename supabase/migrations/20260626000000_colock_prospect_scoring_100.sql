-- Colock Prospect scoring 0-100 with automatic heat categories.
alter table prospects drop constraint if exists prospects_score_check;
alter table prospects add constraint prospects_score_check check (score between 0 and 100);

alter table prospects drop constraint if exists prospects_classement_check;
alter table prospects add constraint prospects_classement_check check (classement in ('ultra-chaud','chaud','moyen','faible'));

create index if not exists prospects_score_100_idx on prospects(score desc, shopify_verified desc);
