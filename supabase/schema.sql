-- QuoteSnap Database Schema
-- Run this in the Supabase SQL editor

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────
-- USERS (mirrors auth.users)
-- ─────────────────────────────────────────────────────────
create table public.users (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  full_name      text,
  has_seen_demo  boolean not null default false,
  created_at     timestamptz not null default now()
);
alter table public.users enable row level security;
create policy "own record select" on public.users for select using (auth.uid() = id);
create policy "own record update" on public.users for update using (auth.uid() = id);
create policy "own record insert" on public.users for insert with check (auth.uid() = id);

-- Auto-create user row on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────
-- BUSINESSES (one per user for MVP)
-- ─────────────────────────────────────────────────────────
create table public.businesses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  name            text not null,
  phone           text,
  email           text,
  address         text,
  logo_url        text,
  license_number  text,
  default_terms   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint businesses_user_id_key unique (user_id)
);
alter table public.businesses enable row level security;
create policy "owner" on public.businesses
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────────────────────
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  name        text not null,
  phone       text,
  email       text,
  address     text,
  created_at  timestamptz not null default now()
);
alter table public.customers enable row level security;
create policy "owner" on public.customers
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- JOBS
-- ─────────────────────────────────────────────────────────
create table public.jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  customer_id  uuid references public.customers(id) on delete set null,
  job_type     text not null,
  notes        text,
  status       text not null default 'draft', -- draft | ready | sent
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.jobs enable row level security;
create policy "owner" on public.jobs
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- JOB PHOTOS
-- ─────────────────────────────────────────────────────────
create table public.job_photos (
  id                          uuid primary key default gen_random_uuid(),
  job_id                      uuid not null references public.jobs(id) on delete cascade,
  user_id                     uuid not null references public.users(id) on delete cascade,
  storage_path                text not null,
  description                 text,
  include_in_customer_estimate boolean not null default false,
  sort_order                  integer not null default 0,
  created_at                  timestamptz not null default now()
);
alter table public.job_photos enable row level security;
create policy "owner" on public.job_photos
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- ESTIMATES
-- ─────────────────────────────────────────────────────────
create table public.estimates (
  id                   uuid primary key default gen_random_uuid(),
  job_id               uuid not null references public.jobs(id) on delete cascade,
  user_id              uuid not null references public.users(id) on delete cascade,
  ai_payload           jsonb not null default '{}',
  job_summary          text,
  scope_of_work        text,
  line_items           jsonb not null default '[]',
  materials_checklist  jsonb not null default '[]',
  missing_questions    jsonb not null default '[]',
  assumptions          jsonb not null default '[]',
  optional_upsells     jsonb not null default '[]',
  customer_message     text,
  subtotal             numeric(10,2),
  total                numeric(10,2),
  status               text not null default 'draft', -- draft | pricing_needed | draft_ready | ready | sent
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
alter table public.estimates enable row level security;
create policy "owner" on public.estimates
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- MIGRATIONS (run these if upgrading an existing database)
-- ─────────────────────────────────────────────────────────
alter table public.estimates add column if not exists materials_checked jsonb not null default '[]'::jsonb;
alter table public.estimates add column if not exists clarifying_answers jsonb not null default '[]'::jsonb;
alter table public.estimates add column if not exists optional_questions jsonb not null default '[]'::jsonb;
alter table public.estimates add column if not exists prices_confirmed boolean not null default false;
alter table public.estimates add column if not exists prices_confirmed_at timestamptz;
alter table public.estimates add column if not exists clarification_round integer not null default 0;
alter table public.estimates add column if not exists title text;

alter table public.job_photos add column if not exists include_in_customer_estimate boolean not null default false;
alter table public.job_photos add column if not exists sort_order integer not null default 0;

alter table public.users add column if not exists has_seen_demo boolean not null default false;

-- ─────────────────────────────────────────────────────────
-- STORAGE
-- ─────────────────────────────────────────────────────────
-- Run in Supabase dashboard Storage tab or via CLI:
-- Create bucket: job-photos (private)
-- Add policy: authenticated users can upload to their own folder (user_id/*)
