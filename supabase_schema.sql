-- =============================================================
-- B Laban Qatar — Supabase Backend Schema
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================

create extension if not exists "uuid-ossp";

-- ====== USER PROFILES (linked to auth.users) ======
create table if not exists public.blaban_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text default 'evaluator' check (role in ('admin', 'ops_manager', 'evaluator', 'viewer')),
  branch_assigned text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_blaban_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.blaban_profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_blaban_user_created on auth.users;
create trigger on_blaban_user_created
  after insert on auth.users
  for each row execute procedure public.handle_blaban_new_user();

-- ====== EVALUATIONS (one row per branch+date) ======
create table if not exists public.blaban_evaluations (
  id uuid primary key default uuid_generate_v4(),
  branch_id text not null,
  eval_date date not null,
  managers text[] default '{}',
  results jsonb default '{}'::jsonb,
  notes jsonb default '{}'::jsonb,
  photos jsonb default '{}'::jsonb,
  action_status jsonb default '{}'::jsonb,
  user_critical jsonb default '{}'::jsonb,
  score_percent numeric(5,2) default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(branch_id, eval_date)
);

create index if not exists evals_branch_idx on public.blaban_evaluations(branch_id);
create index if not exists evals_date_idx on public.blaban_evaluations(eval_date desc);

-- ====== TASKS ======
create table if not exists public.blaban_tasks (
  id text primary key,
  title text not null,
  branch_id text,
  assignee text,
  due_date date,
  done boolean default false,
  done_by text,
  done_at timestamptz,
  photo_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists tasks_branch_idx on public.blaban_tasks(branch_id);
create index if not exists tasks_done_idx on public.blaban_tasks(done);

-- ====== MANAGER PROFILES ======
create table if not exists public.blaban_managers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  phone text,
  email text,
  joined_date date,
  age integer,
  notes text,
  updated_at timestamptz default now()
);

-- ====== SETTINGS (custom items, etc.) ======
create table if not exists public.blaban_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz default now()
);

-- ====== AUTO-UPDATE TIMESTAMPS ======
create or replace function public.blaban_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists evals_touch on public.blaban_evaluations;
create trigger evals_touch before update on public.blaban_evaluations
  for each row execute procedure public.blaban_touch_updated_at();

drop trigger if exists tasks_touch on public.blaban_tasks;
create trigger tasks_touch before update on public.blaban_tasks
  for each row execute procedure public.blaban_touch_updated_at();

-- ====== ROW LEVEL SECURITY ======
alter table public.blaban_profiles enable row level security;
alter table public.blaban_evaluations enable row level security;
alter table public.blaban_tasks enable row level security;
alter table public.blaban_managers enable row level security;
alter table public.blaban_settings enable row level security;

-- Profiles
drop policy if exists "blaban_profiles_select" on public.blaban_profiles;
create policy "blaban_profiles_select" on public.blaban_profiles for select using (true);
drop policy if exists "blaban_profiles_update_own" on public.blaban_profiles;
create policy "blaban_profiles_update_own" on public.blaban_profiles for update using (auth.uid() = id);
drop policy if exists "blaban_profiles_insert_own" on public.blaban_profiles;
create policy "blaban_profiles_insert_own" on public.blaban_profiles for insert with check (auth.uid() = id);

-- Evaluations — authenticated users read/write all
drop policy if exists "blaban_evals_read" on public.blaban_evaluations;
create policy "blaban_evals_read" on public.blaban_evaluations for select using (auth.role() = 'authenticated');
drop policy if exists "blaban_evals_write" on public.blaban_evaluations;
create policy "blaban_evals_write" on public.blaban_evaluations for all using (auth.role() = 'authenticated');

-- Tasks
drop policy if exists "blaban_tasks_read" on public.blaban_tasks;
create policy "blaban_tasks_read" on public.blaban_tasks for select using (auth.role() = 'authenticated');
drop policy if exists "blaban_tasks_write" on public.blaban_tasks;
create policy "blaban_tasks_write" on public.blaban_tasks for all using (auth.role() = 'authenticated');

-- Managers
drop policy if exists "blaban_managers_read" on public.blaban_managers;
create policy "blaban_managers_read" on public.blaban_managers for select using (auth.role() = 'authenticated');
drop policy if exists "blaban_managers_write" on public.blaban_managers;
create policy "blaban_managers_write" on public.blaban_managers for all using (auth.role() = 'authenticated');

-- Settings
drop policy if exists "blaban_settings_read" on public.blaban_settings;
create policy "blaban_settings_read" on public.blaban_settings for select using (auth.role() = 'authenticated');
drop policy if exists "blaban_settings_write" on public.blaban_settings;
create policy "blaban_settings_write" on public.blaban_settings for all using (auth.role() = 'authenticated');

-- ====== REALTIME PUBLICATION ======
alter publication supabase_realtime add table public.blaban_evaluations;
alter publication supabase_realtime add table public.blaban_tasks;
alter publication supabase_realtime add table public.blaban_managers;
alter publication supabase_realtime add table public.blaban_settings;

-- ====== Sample seed: 4 B Laban branches reference ======
-- (branches are stored as text IDs: nasr, farosiya, gharafa, wakra)
-- No table needed since they're constants in the app.
