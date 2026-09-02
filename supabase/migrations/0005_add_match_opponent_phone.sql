alter table public.matches
  add column if not exists opponent_phone text;
