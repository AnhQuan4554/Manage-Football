alter table public.matches
  add column if not exists home_score integer not null default 0 check (home_score >= 0),
  add column if not exists away_score integer not null default 0 check (away_score >= 0);
