create extension if not exists pg_cron with schema extensions;

create or replace function public.complete_past_matches(reference_time timestamptz default now())
returns integer
language plpgsql
set search_path = public
as $$
declare
  completed_count integer;
begin
  update public.matches
  set
    status = 'completed',
    completed_at = coalesce(completed_at, match_date_time),
    updated_at = now()
  where status in ('draft', 'open', 'lineup_ready')
    and match_date_time < reference_time;

  get diagnostics completed_count = row_count;
  return completed_count;
end;
$$;

revoke all on function public.complete_past_matches(timestamptz) from public;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'complete-past-matches-weekly') then
    perform cron.unschedule('complete-past-matches-weekly');
  end if;
end;
$$;

select cron.schedule(
  'complete-past-matches-weekly',
  '5 0 * * 3',
  $$select public.complete_past_matches(now());$$
);