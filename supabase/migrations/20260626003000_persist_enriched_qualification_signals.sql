-- Persist enrichment signals used by the qualification dashboard and scoring maluses.
alter table prospects add column if not exists active_store boolean default false;
alter table prospects add column if not exists internal_logistics boolean default false;

create index if not exists prospects_enriched_qualification_idx
  on prospects(has_contact_form, active_store, internal_logistics, product_count);
