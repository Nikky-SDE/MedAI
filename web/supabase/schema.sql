-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  age integer,
  blood_group text,
  allergies text,
  medical_history text
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies
create policy "Profiles are viewable by owner." on profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Set up a trigger to auto-create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a table for reports
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  symptom_description text,
  image_url text,
  ai_response jsonb,
  is_emergency boolean default false,
  is_public boolean default false
);

-- Enable RLS
alter table public.reports enable row level security;

-- Create policies for reports
create policy "Users can view their own reports." on reports
  for select using (auth.uid() = user_id);

create policy "Public reports are viewable by everyone." on reports
  for select using (is_public = true);

create policy "Users can insert their own reports." on reports
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own reports." on reports
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own reports." on reports
  for delete using (auth.uid() = user_id);

-- Trigger to prevent client tampering with immutable columns
create or replace function public.prevent_report_immutable_columns_update()
returns trigger as $$
begin
  if new.user_id <> old.user_id then
    raise exception 'Security violation: user_id is immutable on reports.';
  end if;
  if new.created_at <> old.created_at then
    raise exception 'Security violation: created_at is immutable on reports.';
  end if;
  if new.ai_response is distinct from old.ai_response then
    raise exception 'Security violation: ai_response is immutable once generated.';
  end if;
  if new.is_emergency is distinct from old.is_emergency then
    raise exception 'Security violation: is_emergency is immutable once generated.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_report_tampering on public.reports;
create trigger trg_prevent_report_tampering
  before update on public.reports
  for each row execute function public.prevent_report_immutable_columns_update();

-- Create private storage bucket for symptoms (idempotent)
insert into storage.buckets (id, name, public) 
values ('symptoms', 'symptoms', false)
on conflict (id) do update set public = false;

-- Enable RLS for storage with strict per-user folder scoping (<auth.uid()>/...)
create policy "Users can upload own symptom photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'symptoms'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own symptom photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'symptoms'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own symptom photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'symptoms'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ====== Version 2 Schema Additions ======
alter table public.reports
  add column if not exists is_public boolean default false;

alter table public.profiles
  add column if not exists height text,
  add column if not exists weight text,
  add column if not exists biological_sex text,
  add column if not exists medications_list jsonb default '[]'::jsonb,
  add column if not exists diet_preferences jsonb default '[]'::jsonb,
  add column if not exists food_intolerances jsonb default '[]'::jsonb,
  add column if not exists water_intake text,
  add column if not exists meal_frequency text,
  add column if not exists last_period_start date,
  add column if not exists cycle_length integer,
  add column if not exists period_duration integer,
  add column if not exists cycle_symptoms jsonb default '[]'::jsonb,
  add column if not exists is_pregnant boolean default false;

-- Performance Indexes
create index if not exists idx_reports_user_id on public.reports(user_id);
create index if not exists idx_reports_created_at on public.reports(created_at desc);
create index if not exists idx_reports_is_public on public.reports(is_public);

-- Foreign Key Cascading (ensures clean account deletion without orphan lockouts)
alter table public.profiles
  drop constraint if exists profiles_id_fkey,
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

alter table public.reports
  drop constraint if exists reports_user_id_fkey,
  add constraint reports_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

-- ====== Version 3 Schema Additions (Server-Owned Triage & Audit Logging) ======
create table if not exists public.triage_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text default 'active' check (status in ('active', 'completed', 'emergency', 'abandoned')) not null,
  messages jsonb default '[]'::jsonb not null,
  extracted_slots jsonb default '{}'::jsonb not null,
  turn_count integer default 0 not null,
  max_turns integer default 3 not null,
  language text default 'en' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.triage_sessions enable row level security;

-- Owner-only policies for triage_sessions
drop policy if exists "Users can view own triage sessions" on public.triage_sessions;
create policy "Users can view own triage sessions"
  on public.triage_sessions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own triage sessions" on public.triage_sessions;
create policy "Users can create own triage sessions"
  on public.triage_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own triage sessions" on public.triage_sessions;
create policy "Users can update own triage sessions"
  on public.triage_sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own triage sessions" on public.triage_sessions;
create policy "Users can delete own triage sessions"
  on public.triage_sessions for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists idx_triage_sessions_user_id on public.triage_sessions(user_id);
create index if not exists idx_triage_sessions_status on public.triage_sessions(status);
create index if not exists idx_triage_sessions_created_at on public.triage_sessions(created_at desc);

create table if not exists public.ai_calls (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid references public.triage_sessions(id) on delete set null,
  provider text not null,
  model text not null,
  latency_ms integer not null,
  tokens_prompt integer default 0,
  tokens_completion integer default 0,
  status text not null check (status in ('success', 'error', 'timeout', 'fallback')),
  error_code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ai_calls enable row level security;

drop policy if exists "Users can view own AI call logs" on public.ai_calls;
create policy "Users can view own AI call logs"
  on public.ai_calls for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Authenticated users can insert AI call logs" on public.ai_calls;
create policy "Authenticated users can insert AI call logs"
  on public.ai_calls for insert
  to authenticated
  with check (auth.uid() = user_id or auth.uid() is null);

create index if not exists idx_ai_calls_user_id on public.ai_calls(user_id);
create index if not exists idx_ai_calls_created_at on public.ai_calls(created_at desc);
create index if not exists idx_ai_calls_session_id on public.ai_calls(session_id);

alter table public.reports
  add column if not exists session_id uuid references public.triage_sessions(id) on delete set null;

create unique index if not exists idx_reports_idempotent_session
  on public.reports(session_id)
  where session_id is not null;
