alter table public.prospects
  add column if not exists email text,
  add column if not exists telephone text,
  add column if not exists instagram text,
  add column if not exists facebook text,
  add column if not exists tiktok text,
  add column if not exists linkedin text;

create index if not exists prospects_email_found_idx
  on public.prospects ((email is not null), score desc);
