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
  is_emergency boolean default false
);

-- Enable RLS
alter table public.reports enable row level security;

-- Create policies for reports
create policy "Users can view their own reports." on reports
  for select using (auth.uid() = user_id);

create policy "Users can insert their own reports." on reports
  for insert with check (auth.uid() = user_id);

-- Create storage bucket for symptoms
insert into storage.buckets (id, name, public) values ('symptoms', 'symptoms', true);

-- Enable RLS for storage
create policy "Authenticated users can upload symptoms"
  on storage.objects for insert
  with check (bucket_id = 'symptoms' and auth.role() = 'authenticated');

create policy "Images are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'symptoms');
