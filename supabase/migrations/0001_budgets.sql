-- Dashboard budgets — one row per (account, platform). Org-wide settings shared
-- across all users/devices (not per-user). Replaces the per-browser
-- localStorage store (nh-budget-<accountId>).
--
-- Access is server-side only via the Supabase secret key (which bypasses RLS),
-- through API routes already gated by the dashboard's auth middleware. RLS is
-- enabled with NO public policies so the publishable/anon key cannot read or
-- write this table from the browser.

create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  account_id  text not null,
  platform    text not null,
  budget      numeric not null default 0,
  spent       numeric not null default 0,
  category    text not null check (category in ('advertising', 'platform', 'tools')),
  updated_at  timestamptz not null default now(),
  unique (account_id, platform)
);

create index if not exists budgets_account_id_idx on public.budgets (account_id);

alter table public.budgets enable row level security;
-- No policies on purpose: only the server-side secret key (bypasses RLS) may
-- read/write. The browser's publishable key gets nothing.
