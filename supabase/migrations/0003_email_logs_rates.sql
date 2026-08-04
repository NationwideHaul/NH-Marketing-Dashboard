-- Switch email_logs from raw counts to RATES (%). The tab now tracks
-- open/click/reply/bounce rate as percentages, not counts. The table was just
-- created (0002) and holds no real data, so recreate it with rate columns.

drop table if exists public.email_logs;

create table public.email_logs (
  id           uuid primary key default gen_random_uuid(),
  account_id   text not null,
  month        text not null, -- "YYYY-MM"
  open_rate    numeric not null default 0,
  click_rate   numeric not null default 0,
  reply_rate   numeric not null default 0,
  bounce_rate  numeric not null default 0,
  updated_at   timestamptz not null default now(),
  unique (account_id, month)
);

create index if not exists email_logs_account_id_idx on public.email_logs (account_id);

alter table public.email_logs enable row level security;
