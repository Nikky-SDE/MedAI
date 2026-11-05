-- ==============================================================================
-- Migration: 001_security_hardening.sql
-- Description: Hardens Supabase Storage and Row Level Security (RLS) policies.
-- - Makes 'symptoms' storage bucket private with per-user folder isolation (<user_id>/...).
-- - Scopes storage insert, select, and delete policies to the owning user.
-- - Enforces WITH CHECK on public.profiles updates.
-- - Enforces WITH CHECK on public.reports updates.
-- - Adds a trigger to prevent modifying immutable columns (user_id, created_at,
--   ai_response, is_emergency) on public.reports.
-- ==============================================================================

-- 1. Hardening Storage Bucket: symptoms
-- Ensure symptoms bucket exists and set to private
insert into storage.buckets (id, name, public)
values ('symptoms', 'symptoms', false)
on conflict (id) do update set public = false;

-- Remove legacy overly-permissive storage policies
drop policy if exists "Authenticated users can upload symptoms" on storage.objects;
drop policy if exists "Images are viewable by everyone" on storage.objects;
drop policy if exists "Authenticated users can delete symptom photos" on storage.objects;
drop policy if exists "Users can upload own symptom photos" on storage.objects;
drop policy if exists "Users can view own symptom photos" on storage.objects;
drop policy if exists "Users can delete own symptom photos" on storage.objects;

-- Strict per-user storage policies: files must be in folder <auth.uid()>/...
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

-- 2. Hardening Profiles RLS
drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. Hardening Reports RLS
drop policy if exists "Users can update their own reports." on public.reports;
create policy "Users can update their own reports." on public.reports
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Trigger to protect immutable report fields from client tampering
create or replace function public.prevent_report_immutable_columns_update()
returns trigger as $$
begin
  -- Prevent altering the owner
  if new.user_id <> old.user_id then
    raise exception 'Security violation: user_id is immutable on reports.';
  end if;

  -- Prevent altering creation timestamp
  if new.created_at <> old.created_at then
    raise exception 'Security violation: created_at is immutable on reports.';
  end if;

  -- Prevent modifying AI-generated clinical diagnosis after generation
  if new.ai_response is distinct from old.ai_response then
    raise exception 'Security violation: ai_response is immutable once generated.';
  end if;

  -- Prevent modifying emergency triage flag after generation
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
