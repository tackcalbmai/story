-- Applied to Supabase project Story as migration: create_story_playtest_events
create table public.story_playtest_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id uuid not null,
  event_name text not null check (
    event_name in (
      'phase',
      'start',
      'recorder_sequence_complete',
      'order_attempt',
      'first_choice',
      'sound_toggle'
    )
  ),
  scene text not null check (
    scene in (
      'gate',
      'intro',
      'ticket',
      'bag-place',
      'bag-move',
      'led',
      'recorder-controls',
      'evidence',
      'order',
      'recording',
      'voice-match',
      'end'
    )
  ),
  detail jsonb not null default '{}'::jsonb check (
    jsonb_typeof(detail) = 'object'
    and octet_length(detail::text) <= 2048
  ),
  version text not null default 'workprint-01'
);

alter table public.story_playtest_events enable row level security;
alter table public.story_playtest_events force row level security;
revoke all on table public.story_playtest_events from anon, authenticated;
grant insert, select on table public.story_playtest_events to service_role;
grant usage, select on sequence public.story_playtest_events_id_seq to service_role;

create policy "deny public playtest access"
on public.story_playtest_events
for all
to anon, authenticated
using (false)
with check (false);

create index story_playtest_events_session_created_idx
  on public.story_playtest_events (session_id, created_at desc);

create index story_playtest_events_created_idx
  on public.story_playtest_events (created_at desc);

comment on table public.story_playtest_events is
  'Anonymous, content-free interaction events for the Between Stations workprint.';
