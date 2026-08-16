create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'captain', 'treasurer', 'member')),
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  joined_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  opponent_name text not null,
  start_time timestamptz not null,
  location text,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  pitch_cost numeric not null default 0,
  opponent_fee numeric not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.match_attendances (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  member_id uuid not null references public.team_members(id) on delete cascade,
  status text not null default 'unknown' check (status in ('going', 'absent', 'maybe', 'unknown')),
  note text,
  unique(match_id, member_id)
);

create table if not exists public.fund_transactions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  member_id uuid references public.team_members(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount >= 0),
  title text not null,
  note text,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.team_members enable row level security;
alter table public.matches enable row level security;
alter table public.match_attendances enable row level security;
alter table public.fund_transactions enable row level security;

-- TODO: Tighten RLS after production role rules are finalized.
-- Suggested rule: users can read rows for teams where they have active team_members membership.
-- Mutations should be restricted to owner/captain/treasurer according to the feature.
