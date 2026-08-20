create extension if not exists pgcrypto;

drop function if exists public.set_updated_at();
drop function if exists public.update_updated_at_column();

do $$
declare r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('drop table if exists public.%I cascade', r.tablename);
  end loop;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  cover_url text,
  slogan text,
  description text,
  area text,
  home_pitch text,
  public_enabled boolean not null default true,
  theme_color text not null default '#d41478',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  full_name text,
  avatar_url text,
  date_of_birth date,
  auth_provider text not null default 'email',
  status text not null default 'active' check (status in ('active', 'inactive', 'pending', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  role text not null default 'member' check (role in ('owner', 'captain', 'deputy', 'member', 'treasurer')),
  jersey_number integer check (jersey_number between 0 and 99),
  full_name text,
  nickname text,
  phone text,
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive', 'removed')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guest_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  nickname text,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.formations (
  code text primary key,
  name text not null,
  slots_json jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  opponent_name text not null,
  match_date_time timestamptz not null,
  venue_name text not null,
  address text,
  pitch_cost numeric(12, 0) not null default 0 check (pitch_cost >= 0),
  opponent_contribution numeric(12, 0) not null default 0 check (opponent_contribution >= 0),
  note text,
  status text not null default 'draft' check (status in ('draft', 'open', 'lineup_ready', 'completed', 'cancelled')),
  cancelled_reason text,
  published_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  membership_id uuid references public.team_members(id) on delete set null,
  guest_id uuid references public.guest_players(id) on delete set null,
  participant_name text not null,
  response text not null default 'unknown' check (response in ('unknown', 'going', 'not_going')),
  chargeable boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (membership_id is not null or guest_id is not null),
  unique (match_id, membership_id),
  unique (match_id, guest_id)
);

create table public.lineups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  formation_code text not null references public.formations(code) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'published')),
  version integer not null default 1,
  created_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lineup_slots (
  id uuid primary key default gen_random_uuid(),
  lineup_id uuid not null references public.lineups(id) on delete cascade,
  slot_key text not null,
  participant_id uuid not null references public.match_participants(id) on delete cascade,
  x numeric(8, 3) not null,
  y numeric(8, 3) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lineup_id, slot_key),
  unique (lineup_id, participant_id)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  match_id uuid unique references public.matches(id) on delete set null,
  type text not null check (type in ('match', 'shirt', 'party', 'other')),
  title text not null,
  total_amount numeric(12, 0) not null default 0 check (total_amount >= 0),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'cancelled')),
  rounding_step integer not null default 1000 check (rounding_step > 0),
  note text,
  due_date date,
  closed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  membership_id uuid references public.team_members(id) on delete set null,
  guest_id uuid references public.guest_players(id) on delete set null,
  participant_name text not null,
  amount_due numeric(12, 0) not null default 0 check (amount_due >= 0),
  amount_paid numeric(12, 0) not null default 0 check (amount_paid >= 0),
  status text not null default 'unpaid' check (status in ('unpaid', 'partial', 'paid', 'waived')),
  chargeable boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (membership_id is not null or guest_id is not null)
);

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  title text not null,
  cover_url text,
  visibility text not null default 'team_only' check (visibility in ('public', 'team_only')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  url text not null,
  storage_key text,
  thumbnail_url text,
  caption text,
  status text not null default 'active' check (status in ('active', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  match_id uuid references public.matches(id) on delete cascade,
  channel text not null check (channel in ('zalo', 'pwa')),
  event_type text not null,
  status text not null default 'pending' check (status in ('not_sent', 'pending', 'sent', 'failed')),
  external_ref text,
  payload jsonb not null default '{}'::jsonb,
  error text,
  retry_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_team_members_team_id on public.team_members (team_id);
create index if not exists idx_team_members_user_id on public.team_members (user_id);
create index if not exists idx_join_requests_team_id on public.join_requests (team_id);
create index if not exists idx_join_requests_user_id on public.join_requests (user_id);
create index if not exists idx_guest_players_team_id on public.guest_players (team_id);
create index if not exists idx_matches_team_datetime on public.matches (team_id, match_date_time);
create index if not exists idx_match_participants_match_id on public.match_participants (match_id);
create index if not exists idx_lineups_match_id on public.lineups (match_id);
create index if not exists idx_lineup_slots_lineup_id on public.lineup_slots (lineup_id);
create index if not exists idx_collections_team_id on public.collections (team_id);
create index if not exists idx_collection_items_collection_id on public.collection_items (collection_id);
create index if not exists idx_albums_team_id on public.albums (team_id);
create index if not exists idx_media_album_id on public.media (album_id);
create index if not exists idx_notification_jobs_team_id on public.notification_jobs (team_id);
create index if not exists idx_audit_logs_team_id on public.audit_logs (team_id);

do $$
declare t text;
begin
  foreach t in array array[
    'teams',
    'profiles',
    'team_members',
    'join_requests',
    'guest_players',
    'formations',
    'matches',
    'match_participants',
    'lineups',
    'lineup_slots',
    'collections',
    'collection_items',
    'albums',
    'media',
    'notification_jobs'
  ]
  loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'teams',
    'profiles',
    'team_members',
    'join_requests',
    'guest_players',
    'formations',
    'matches',
    'match_participants',
    'lineups',
    'lineup_slots',
    'collections',
    'collection_items',
    'albums',
    'media',
    'notification_jobs',
    'audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists allow_all on public.%I', t);
    execute format(
      'create policy allow_all on public.%I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
