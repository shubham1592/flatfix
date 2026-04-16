-- ============================================
-- FlatFix Database Schema for Supabase
-- ============================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This creates all tables, RLS policies, functions, and cron jobs.

-- Enable required extensions
create extension if not exists "pg_cron" with schema extensions;

-- ============================================
-- TABLES
-- ============================================

-- Users (profiles linked to Supabase Auth)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null unique,
  avatar_id text,
  preferences jsonb default '{"likes": [], "dislikes": []}',
  busy_status jsonb default '{"is_busy": false, "reason": "", "start_date": null, "end_date": null}',
  total_fixes_closed int default 0,
  current_stars int default 0,
  weekly_fixes_closed int default 0,
  current_streak int default 0,
  heading_out boolean default false,
  created_at timestamptz default now()
);

-- Fixes (the core task cards)
create table public.fixes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default '',
  urgency int not null check (urgency between 1 and 4),
  category text not null check (category in ('trash','dishes','bathroom','kitchen','grocery','general')),
  location text default 'general' check (location in ('kitchen','bathroom','living room','bedroom','hallway','outside','general')),
  status text default 'open' check (status in ('open','claimed','closed')),
  created_by uuid references public.users(id) not null,
  claimed_by uuid references public.users(id),
  closed_by uuid references public.users(id),
  is_from_template boolean default false,
  is_ai_parsed boolean default false,
  created_at timestamptz default now(),
  claimed_at timestamptz,
  closed_at timestamptz
);

-- Reactions on fixes
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  fix_id uuid references public.fixes(id) on delete cascade not null,
  user_id uuid references public.users(id) not null,
  emoji text not null check (emoji in ('thumbsup','fire','clap','heart','star')),
  created_at timestamptz default now(),
  unique(fix_id, user_id, emoji)
);

-- Rotations (weekly chore assignments)
create table public.rotations (
  id uuid default gen_random_uuid() primary key,
  week_start_date date not null,
  week_end_date date not null,
  generated_by text default 'manual' check (generated_by in ('ai','manual')),
  created_at timestamptz default now()
);

-- Individual rotation assignments
create table public.rotation_assignments (
  id uuid default gen_random_uuid() primary key,
  rotation_id uuid references public.rotations(id) on delete cascade not null,
  chore text not null,
  assigned_to uuid references public.users(id) not null,
  completed_at timestamptz,
  skipped boolean default false
);

-- Templates (reusable fix templates)
create table public.templates (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default '',
  category text not null check (category in ('trash','dishes','bathroom','kitchen','grocery','general')),
  urgency int not null check (urgency between 1 and 4),
  created_by uuid references public.users(id) not null,
  created_at timestamptz default now()
);

-- Nudges (anonymous person-to-person)
create table public.nudges (
  id uuid default gen_random_uuid() primary key,
  fix_id uuid references public.fixes(id) on delete cascade not null,
  from_user_id uuid references public.users(id) not null,
  to_user_id uuid references public.users(id) not null,
  created_at timestamptz default now()
);

-- Recaps (AI-generated weekly/monthly summaries)
create table public.recaps (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('weekly','monthly')),
  period_start date not null,
  period_end date not null,
  content text not null,
  stats jsonb,
  star_performer uuid references public.users(id),
  created_at timestamptz default now()
);

-- House rules
create table public.house_rules (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  display_order int not null default 0,
  added_by uuid references public.users(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- INDEXES for performance
-- ============================================

create index idx_fixes_status on public.fixes(status);
create index idx_fixes_created_by on public.fixes(created_by);
create index idx_fixes_category on public.fixes(category);
create index idx_fixes_created_at on public.fixes(created_at desc);
create index idx_reactions_fix_id on public.reactions(fix_id);
create index idx_rotation_assignments_rotation on public.rotation_assignments(rotation_id);
create index idx_nudges_to_user on public.nudges(to_user_id);
create index idx_nudges_rate_limit on public.nudges(from_user_id, fix_id, created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

alter table public.users enable row level security;
alter table public.fixes enable row level security;
alter table public.reactions enable row level security;
alter table public.rotations enable row level security;
alter table public.rotation_assignments enable row level security;
alter table public.templates enable row level security;
alter table public.nudges enable row level security;
alter table public.recaps enable row level security;
alter table public.house_rules enable row level security;

-- Users: everyone can read, only own profile writable
create policy "Users are viewable by authenticated users"
  on public.users for select to authenticated using (true);

create policy "Users can update own profile"
  on public.users for update to authenticated using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert to authenticated with check (auth.uid() = id);

-- Fixes: everyone can read, anyone can create, claim/close rules
create policy "Fixes viewable by all authenticated"
  on public.fixes for select to authenticated using (true);

create policy "Any user can create a fix"
  on public.fixes for insert to authenticated with check (auth.uid() = created_by);

create policy "Fix creator or claimer can update"
  on public.fixes for update to authenticated using (
    auth.uid() = created_by or auth.uid() = claimed_by
  );

create policy "Only creator can delete unclaimed fix"
  on public.fixes for delete to authenticated using (
    auth.uid() = created_by and status = 'open'
  );

-- Reactions: all can read, anyone can create/delete own
create policy "Reactions viewable by all"
  on public.reactions for select to authenticated using (true);

create policy "Users can add reactions"
  on public.reactions for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can remove own reactions"
  on public.reactions for delete to authenticated using (auth.uid() = user_id);

-- Rotations: all can read
create policy "Rotations viewable by all"
  on public.rotations for select to authenticated using (true);

create policy "Rotations insert for service role"
  on public.rotations for insert to authenticated with check (true);

-- Rotation assignments: all can read, assigned person can update
create policy "Rotation assignments viewable by all"
  on public.rotation_assignments for select to authenticated using (true);

create policy "Assigned user can update assignment"
  on public.rotation_assignments for update to authenticated using (
    auth.uid() = assigned_to
  );

create policy "Rotation assignments insert for authenticated"
  on public.rotation_assignments for insert to authenticated with check (true);

-- Templates: all can read, anyone can create
create policy "Templates viewable by all"
  on public.templates for select to authenticated using (true);

create policy "Any user can create templates"
  on public.templates for insert to authenticated with check (auth.uid() = created_by);

create policy "Creator can delete template"
  on public.templates for delete to authenticated using (auth.uid() = created_by);

-- Nudges: only recipient can read their own nudges
create policy "Users can only see nudges sent to them"
  on public.nudges for select to authenticated using (auth.uid() = to_user_id);

create policy "Any user can send a nudge"
  on public.nudges for insert to authenticated with check (auth.uid() = from_user_id);

-- Recaps: all can read
create policy "Recaps viewable by all"
  on public.recaps for select to authenticated using (true);

create policy "Service can insert recaps"
  on public.recaps for insert to authenticated with check (true);

-- House rules: all can read, all can create/edit/delete
create policy "House rules viewable by all"
  on public.house_rules for select to authenticated using (true);

create policy "Any user can add rules"
  on public.house_rules for insert to authenticated with check (true);

create policy "Any user can update rules"
  on public.house_rules for update to authenticated using (true);

create policy "Any user can delete rules"
  on public.house_rules for delete to authenticated using (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create user profile on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to check avatar uniqueness
create or replace function public.check_avatar_unique(user_id uuid, new_avatar_id text)
returns boolean as $$
begin
  return not exists (
    select 1 from public.users
    where avatar_id = new_avatar_id and id != user_id
  );
end;
$$ language plpgsql security definer;

-- Function to reset weekly fix counts (runs every Monday at midnight)
create or replace function public.reset_weekly_counts()
returns void as $$
begin
  update public.users set weekly_fixes_closed = 0;
end;
$$ language plpgsql security definer;

-- Function to increment fix stats when a fix is closed
create or replace function public.on_fix_closed()
returns trigger as $$
begin
  if new.status = 'closed' and old.status != 'closed' then
    update public.users
    set total_fixes_closed = total_fixes_closed + 1,
        weekly_fixes_closed = weekly_fixes_closed + 1
    where id = new.closed_by;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_fix_status_change
  after update of status on public.fixes
  for each row execute function public.on_fix_closed();

-- ============================================
-- REALTIME
-- ============================================

-- Enable realtime on key tables
alter publication supabase_realtime add table public.fixes;
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.rotation_assignments;
alter publication supabase_realtime add table public.house_rules;

-- ============================================
-- SEED DATA: Recurring chores for rotation
-- ============================================
-- (You can customize this list)
-- The rotation system will use these chore names:
-- 'Take out trash', 'Load/unload dishwasher', 'Clean bathroom',
-- 'Refill water filter', 'Vacuum living room', 'Wipe kitchen counters',
-- 'Clean common areas'
