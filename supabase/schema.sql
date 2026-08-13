-- Run this in Supabase SQL Editor after creating a project

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  subject_id text not null,
  subject_slug text not null,
  subject_name text not null,
  topics text[] default '{}',
  author_name text,
  author_school text,
  language text default 'en',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_idx on posts (status);
create index if not exists posts_subject_slug_idx on posts (subject_slug);
create index if not exists posts_created_at_idx on posts (created_at desc);

-- Full-text search (optional, for better search at scale)
create index if not exists posts_search_idx on posts
  using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,'')));

-- Seed sample published posts (optional)
insert into posts (title, slug, excerpt, content, subject_id, subject_slug, subject_name, topics, author_name, status)
values
(
  'Welcome to Project_Steam',
  'welcome-to-project-steam',
  'A student-led library of STEM notes, experiments, and ideas — free for everyone.',
  'Project_Steam is built so students across India and the world can share what they learn. Content arrives by email, gets reviewed, categorized, and published here.\n\nIf you are a student: keep sending clear notes, diagrams, and honest explanations. If you are a teacher or parent: help us keep quality high and language simple.\n\nTogether we can close the gap between students who have access to great resources and those who do not.',
  'general-stem',
  'general-stem',
  'General STEM',
  array['welcome', 'community'],
  'Project_Steam team',
  'published'
)
on conflict (slug) do nothing;
