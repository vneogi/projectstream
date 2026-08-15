-- Run this in Supabase SQL Editor after creating a project
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  abstract text,
  content text not null,
  subject_id text not null,
  subject_slug text not null,
  subject_name text not null,
  topics text[] default '{}',
  author_name text,
  author_school text,
  language text default 'en',
  status text not null default 'draft' check (status in ('draft', 'published')),
  source_message_id text unique,
  source_from text,
  file_path text,
  file_name text,
  file_mime text,
  file_size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migrations for existing projects:
alter table posts add column if not exists abstract text;
alter table posts add column if not exists source_message_id text;
alter table posts add column if not exists source_from text;
alter table posts add column if not exists file_path text;
alter table posts add column if not exists file_name text;
alter table posts add column if not exists file_mime text;
alter table posts add column if not exists file_size bigint;

create unique index if not exists posts_source_message_id_uidx
  on posts (source_message_id)
  where source_message_id is not null;

create index if not exists posts_status_idx on posts (status);
create index if not exists posts_subject_slug_idx on posts (subject_slug);
create index if not exists posts_created_at_idx on posts (created_at desc);

create index if not exists posts_search_idx on posts
  using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,'')));

insert into posts (title, slug, excerpt, content, subject_id, subject_slug, subject_name, topics, author_name, status)
values
(
  'Welcome to Project STEAM',
  'welcome-to-project-steam',
  'A student-led library of STEM notes, experiments, and ideas — free for everyone.',
  'Project STEAM is built so students across India and the world can share what they learn. Content arrives by email, gets reviewed, categorized, and published here.\n\nIf you are a student: keep sending clear notes, diagrams, and honest explanations. If you are a teacher or parent: help us keep quality high and language simple.\n\nTogether we can close the gap between students who have access to great resources and those who do not.',
  'general-stem',
  'general-stem',
  'General STEM',
  array['welcome', 'community'],
  'Project STEAM team',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Storage: create a PRIVATE bucket named "materials" in the
-- Supabase Dashboard → Storage → New bucket → Public: OFF
--
-- Then run the policies below so only the service role
-- (your server) can read/write. Students never get direct
-- public URLs — downloads go through /api/download/[postId]
-- after Google/GitHub login.
-- ============================================================

-- Optional: if you use SQL to create the bucket (Dashboard is easier):
-- insert into storage.buckets (id, name, public)
-- values ('materials', 'materials', false)
-- on conflict (id) do nothing;

-- Deny public access (default for private buckets). No anon SELECT policies.
