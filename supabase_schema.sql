-- Departments
create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique
);

insert into departments (name, code) values
('Computer Systems Engineering', 'CSE'),
('Electrical Engineering', 'EE'),
('Civil Engineering', 'CE'),
('Mechanical Engineering', 'ME'),
('Electronic Engineering', 'ECE'),
('Software Engineering', 'SE'),
('Telecommunication Engineering', 'TE'),
('Petroleum Engineering', 'PE'),
('Industrial Engineering', 'IE'),
('Metallurgy & Materials Engineering', 'MME');

-- Batches (years)
create table batches (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  label text not null
);

insert into batches (year, label) values
(2018, '18-Batch'), (2019, '19-Batch'), (2020, '20-Batch'),
(2021, '21-Batch'), (2022, '22-Batch'), (2023, '23-Batch'),
(2024, '24-Batch'), (2025, '25-Batch');

-- Users profile (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  student_id text,
  department_id uuid references departments(id),
  batch_id uuid references batches(id),
  role text default 'student', -- 'student' | 'admin'
  avatar_url text,
  contribution_count integer default 0,
  created_at timestamptz default now()
);

-- Subjects
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  department_id uuid references departments(id),
  semester integer, -- 1 to 8
  is_custom boolean default false,
  is_approved boolean default true,
  created_by_user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Resources (past papers + notes + handouts)
create table resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null, -- 'past_paper' | 'notes' | 'handout'
  exam_type text, -- 'mid' | 'final' | 'quiz' | 'assignment' | 'other'
  department_id uuid references departments(id),
  batch_id uuid references batches(id),
  subject_id uuid references subjects(id),
  semester integer,
  year integer, -- exam year for past papers
  file_url text not null,
  file_name text,
  file_size bigint,
  uploaded_by uuid references profiles(id),
  download_count integer default 0,
  is_verified boolean default false,
  is_approved boolean default false, -- admin must approve
  description text,
  tags text[],
  is_old_batch boolean default false,
  old_batch_subject_name text,
  created_at timestamptz default now()
);

-- Junction table for multi-subject linking
create table resource_subjects (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references resources(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  unique(resource_id, subject_id)
);

-- Ratings
create table ratings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references resources(id) on delete cascade,
  user_id uuid references profiles(id),
  rating integer check (rating between 1 and 5),
  created_at timestamptz default now(),
  unique(resource_id, user_id)
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references resources(id) on delete cascade,
  user_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- AI Chat history
create table ai_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  messages jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  message text not null,
  is_read boolean default false,
  link text,
  created_at timestamptz default now()
);

-- RLS Enablement
alter table departments enable row level security;
alter table batches enable row level security;
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table resources enable row level security;
alter table resource_subjects enable row level security;
alter table ratings enable row level security;
alter table comments enable row level security;
alter table ai_chats enable row level security;
alter table notifications enable row level security;

-- Basic Policies (Update these as per your specific auth requirements)
create policy "Public view access" on departments for select using (true);
create policy "Public view access" on batches for select using (true);
create policy "Public view access" on subjects for select using (true);
create policy "Public view access" on resource_subjects for select using (true);

create policy "Public view access for approved resources" on resources for select using (is_approved = true);
create policy "Users can upload resources" on resources for insert with check (auth.uid() = uploaded_by);
create policy "Users can link resources" on resource_subjects for insert with check (true);
create policy "Admins can view all resources" on resources for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "Admins can update resources" on resources for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "Admins can delete resources" on resources for delete using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "Users can view profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view ratings" on ratings for select using (true);
create policy "Users can insert ratings" on ratings for insert with check (auth.uid() = user_id);

create policy "Users can view comments" on comments for select using (true);
create policy "Users can insert comments" on comments for insert with check (auth.uid() = user_id);

create policy "Users can manage own chats" on ai_chats for all using (auth.uid() = user_id);
create policy "Users can view own notifications" on notifications for select using (auth.uid() = user_id);

-- RPC Function to increment download count safely
create or replace function increment_download_count(row_id uuid)
returns void as $$
begin
  update resources
  set download_count = download_count + 1
  where id = row_id;
end;
$$ language plpgsql;
