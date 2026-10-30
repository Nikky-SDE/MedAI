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
  for update using (auth.uid() = id);

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
  for update using (auth.uid() = user_id);

create policy "Users can delete their own reports." on reports
  for delete using (auth.uid() = user_id);

-- Create storage bucket for symptoms (idempotent)
insert into storage.buckets (id, name, public) 
values ('symptoms', 'symptoms', true)
on conflict (id) do nothing;

-- Enable RLS for storage
create policy "Authenticated users can upload symptoms"
  on storage.objects for insert
  with check (bucket_id = 'symptoms' and auth.role() = 'authenticated');

create policy "Images are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'symptoms');

create policy "Authenticated users can delete symptom photos"
  on storage.objects for delete
  using (bucket_id = 'symptoms' and auth.role() = 'authenticated');

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
