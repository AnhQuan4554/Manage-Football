create table if not exists public.opponents (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  contact_name text,
  phone text,
  note text,
  last_played_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, name)
);

create index if not exists idx_opponents_team_id on public.opponents (team_id);
create index if not exists idx_opponents_name on public.opponents (team_id, name);

alter table public.matches
  add column if not exists opponent_id uuid references public.opponents(id) on delete set null;

create index if not exists idx_matches_opponent_id on public.matches (opponent_id);
