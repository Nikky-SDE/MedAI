-- ==============================================================================
-- Migration: 002_triage_sessions_and_rate_limiting.sql
-- Description: Server-owned triage sessions, AI audit logging, and rate limiting.
-- - Creates public.triage_sessions table with owner-only RLS.
-- - Creates public.ai_calls audit log table for latency, token & error tracking.
-- - Links public.reports to session_id with unique idempotency constraint.
-- ==============================================================================

-- 1. Create table public.triage_sessions
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

-- Enable RLS on triage_sessions
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

-- Performance Indexes for triage_sessions
create index if not exists idx_triage_sessions_user_id on public.triage_sessions(user_id);
create index if not exists idx_triage_sessions_status on public.triage_sessions(status);
create index if not exists idx_triage_sessions_created_at on public.triage_sessions(created_at desc);

-- 2. Create table public.ai_calls (Audit Logging & DB Rate Limiting)
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

-- Enable RLS on ai_calls
alter table public.ai_calls enable row level security;

-- Audit Log RLS policies
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

-- Performance Indexes for ai_calls
create index if not exists idx_ai_calls_user_id on public.ai_calls(user_id);
create index if not exists idx_ai_calls_created_at on public.ai_calls(created_at desc);
create index if not exists idx_ai_calls_session_id on public.ai_calls(session_id);

-- 3. Link reports to session_id for double-submit idempotency
alter table public.reports
  add column if not exists session_id uuid references public.triage_sessions(id) on delete set null;

create unique index if not exists idx_reports_idempotent_session
  on public.reports(session_id)
  where session_id is not null;
