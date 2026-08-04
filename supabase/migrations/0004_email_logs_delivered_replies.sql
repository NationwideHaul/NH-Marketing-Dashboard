-- Email metrics: delivered (count), open_rate/click_rate/bounce_rate (%),
-- replied (count). Replaces reply_rate with a replied count and adds delivered.
-- Table holds no real data yet, so recreate it.

drop table if exists public.email_logs;

create table public.email_logs (
  id           uuid primary key default gen_random_uuid(),
  account_id   text not null,
  month        text not null, -- "YYYY-MM"
  delivered    integer not null default 0,
  open_rate    numeric not null default 0,
  click_rate   numeric not null default 0,
  replied      integer not null default 0,
  bounce_rate  numeric not null default 0,
  updated_at   timestamptz not null default now(),
  unique (account_id, month)
);

create index if not exists email_logs_account_id_idx on public.email_logs (account_id);

alter table public.email_logs enable row level security;
