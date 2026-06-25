alter table prospects drop constraint if exists prospects_score_check;
alter table prospects add constraint prospects_score_check check (score between 0 and 100);
