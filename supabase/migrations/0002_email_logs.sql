-- Manual email-marketing stats, one row per (account, month). Moves the data
-- off per-browser localStorage (nh-email-logs-<accountId>) into the dashboard's
-- own Supabase so it's shared across devices/users and backed up.
--
-- Server-side only via the secret key (bypasses RLS), through the auth-gated
-- /api/email-logs route. RLS on with no public policies so the browser
-- publishable key can't read or write it.

create table if not exists public.email_logs (
  id               uuid primary key default gen_random_uuid(),
  account_id       text not null,
  month            text not null, -- "YYYY-MM"
  delivered        integer not null default 0,
  opened           integer not null default 0,
  clicked          integer not null default 0,
  replied          integer not null default 0,
  bounced          integer not null default 0,
  unsubscribed     integer not null default 0,
  spam_complaints  integer not null default 0,
  updated_at       timestamptz not null default now(),
  unique (account_id, month)
);

create index if not exists email_logs_account_id_idx on public.email_logs (account_id);

alter table public.email_logs enable row level security;
