-- Run once in Supabase SQL Editor to enable the private Editor usage dashboard.
-- Safe to re-run. Browser roles cannot read or write this table.

create table if not exists usage_events (
  id bigint generated always as identity primary key,
  event_type text not null check (
    event_type in ('page_view', 'search', 'ask', 'article_view', 'download')
  ),
  query_text text,
  post_id uuid references posts(id) on delete set null,
  user_id uuid,
  visitor_hash text,
  result_count integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_created_idx
  on usage_events (created_at desc);
create index if not exists usage_events_type_created_idx
  on usage_events (event_type, created_at desc);
create index if not exists usage_events_post_created_idx
  on usage_events (post_id, created_at desc)
  where post_id is not null;

alter table usage_events enable row level security;
revoke all on table usage_events from anon, authenticated;

-- Suggested retention cleanup (run periodically):
-- delete from usage_events where created_at < now() - interval '180 days';

