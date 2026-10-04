-- Public viewing with active, database-assigned global admins managing business data.
-- No business rows or account roles are changed by this migration.
do $$
declare t text; p record;
begin
  foreach t in array array[
    'teams', 'team_members', 'guest_players', 'formations', 'matches',
    'match_participants', 'lineups', 'lineup_slots', 'collections',
    'collection_items', 'albums', 'media', 'opponents'
  ] loop
    if to_regclass(format('public.%I', t)) is null then continue; end if;
    execute format('alter table public.%I enable row level security', t);
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy public_read on public.%I for select to anon, authenticated using (true)', t
    );
    -- profiles RLS exposes only the caller's own row. No definer function or JWT role cache.
    execute format(
      'create policy admin_insert on public.%I for insert to authenticated with check
       ((select exists(select 1 from public.profiles where id = (select auth.uid())
         and role = ''admin'' and status = ''active'')))', t
    );
    execute format(
      'create policy admin_update on public.%I for update to authenticated using
       ((select exists(select 1 from public.profiles where id = (select auth.uid())
         and role = ''admin'' and status = ''active'')))
       with check
       ((select exists(select 1 from public.profiles where id = (select auth.uid())
         and role = ''admin'' and status = ''active'')))', t
    );
    execute format(
      'create policy admin_delete on public.%I for delete to authenticated using
       ((select exists(select 1 from public.profiles where id = (select auth.uid())
         and role = ''admin'' and status = ''active'')))', t
    );
  end loop;

  -- Internal records are not part of the public app. Server/DB jobs retain service privileges.
  foreach t in array array['join_requests', 'notification_jobs', 'audit_logs'] loop
    if to_regclass(format('public.%I', t)) is null then continue; end if;
    execute format('alter table public.%I enable row level security', t);
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format(
      'create policy admin_read on public.%I for select to authenticated using
       ((select exists(select 1 from public.profiles where id = (select auth.uid())
         and role = ''admin'' and status = ''active'')))', t
    );
  end loop;

  -- Older local baselines may expose a bulk-update function not present on the linked project.
  if to_regprocedure('public.complete_past_matches()') is not null then
    revoke all on function public.complete_past_matches() from public, anon, authenticated;
    grant execute on function public.complete_past_matches() to service_role;
  end if;
end $$;

-- New objects owned by this migration role must opt in to public access.
alter default privileges in schema public revoke all on tables from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

comment on column public.profiles.role is
  'Global admin for all teams when status=active. Assigned in DB only; enforced by API and business-table RLS.';
