begin;
-- Fixtures are isolated by random IDs and are always rolled back.
select set_config('request.jwt.claim.sub', '', true),
       set_config('request.jwt.claims', '{}', true),
       set_config('test.user_id', gen_random_uuid()::text, true),
       set_config('test.team_id', gen_random_uuid()::text, true),
       set_config('test.member_id', gen_random_uuid()::text, true),
       set_config('test.match_id', gen_random_uuid()::text, true),
       set_config('test.collection_id', gen_random_uuid()::text, true),
       set_config('test.item_id', gen_random_uuid()::text, true);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
values (current_setting('test.user_id')::uuid,
        current_setting('test.user_id') || '@permission-test.invalid',
        '{"role":"admin"}', '{"provider":"google"}');
insert into public.teams (id, name, slug)
values (current_setting('test.team_id')::uuid, 'Permission fixture', current_setting('test.team_id'));
insert into public.team_members (id, team_id, full_name, status)
values (current_setting('test.member_id')::uuid, current_setting('test.team_id')::uuid, 'Fixture', 'active');
insert into public.matches (id, team_id, opponent_name, match_date_time, venue_name)
values (current_setting('test.match_id')::uuid, current_setting('test.team_id')::uuid, 'Fixture', now(), 'Fixture');
insert into public.collections (id, team_id, match_id, type, title)
values (current_setting('test.collection_id')::uuid, current_setting('test.team_id')::uuid,
        current_setting('test.match_id')::uuid, 'match', 'Fixture');
insert into public.collection_items (id, collection_id, membership_id, participant_name, amount_due)
values (current_setting('test.item_id')::uuid, current_setting('test.collection_id')::uuid,
        current_setting('test.member_id')::uuid, 'Fixture', 1000);

-- Temporary invoker helpers assert actual denied writes, not just policy names.
create function pg_temp.assert_write_denied(statement text) returns void language plpgsql as $$
declare affected integer;
begin
  begin
    execute statement;
    get diagnostics affected = row_count;
    if affected > 0 then raise exception 'Unauthorized write succeeded: %', statement; end if;
  exception when insufficient_privilege then
    return;
  end;
end $$;
create function pg_temp.assert_viewer() returns void language plpgsql as $$
begin
  if not exists(select 1 from public.teams where id = current_setting('test.team_id')::uuid)
     or not exists(select 1 from public.collection_items where id = current_setting('test.item_id')::uuid) then
    raise exception 'Public reading failed';
  end if;
  perform pg_temp.assert_write_denied(
    format('insert into public.teams(name,slug) values (%L,%L)', 'Forbidden', gen_random_uuid()::text));
  perform pg_temp.assert_write_denied(
    format('update public.teams set name=%L where id=%L::uuid', 'Forbidden', current_setting('test.team_id')));
  perform pg_temp.assert_write_denied(
    format('delete from public.teams where id=%L::uuid', current_setting('test.team_id')));
  perform pg_temp.assert_write_denied(
    format('update public.team_members set full_name=%L where id=%L::uuid', 'Forbidden', current_setting('test.member_id')));
  perform pg_temp.assert_write_denied(
    format('update public.matches set home_score=99 where id=%L::uuid', current_setting('test.match_id')));
  perform pg_temp.assert_write_denied(
    format('update public.collection_items set amount_paid=1000,status=%L where id=%L::uuid', 'paid', current_setting('test.item_id')));
end $$;
grant execute on function pg_temp.assert_write_denied(text), pg_temp.assert_viewer() to anon, authenticated;

set local role anon;
select pg_temp.assert_viewer();
do $$
declare t text;
begin
  foreach t in array array['teams','team_members','guest_players','formations','matches',
    'match_participants','lineups','lineup_slots','collections','collection_items','albums','media','opponents']
  loop
    if to_regclass(format('public.%I',t)) is null then continue; end if;
    if not has_table_privilege('anon',format('public.%I',t),'SELECT')
       or has_table_privilege('anon',format('public.%I',t),'INSERT')
       or has_table_privilege('anon',format('public.%I',t),'UPDATE')
       or has_table_privilege('anon',format('public.%I',t),'DELETE')
       or has_table_privilege('anon',format('public.%I',t),'TRUNCATE') then
      raise exception 'Wrong guest grants on %',t;
    end if;
  end loop;
  foreach t in array array['audit_logs','join_requests','notification_jobs','push_devices','push_invites','push_deliveries'] loop
    if has_table_privilege('anon',format('public.%I',t),'SELECT') then
      raise exception 'Internal table exposed: %',t;
    end if;
  end loop;
end $$;
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.user_id'), true);
set local role authenticated;
select pg_temp.assert_viewer();
do $$ begin
  if (select role from public.profiles where id=auth.uid()) <> 'member' then
    raise exception 'Metadata incorrectly promoted the account';
  end if;
end $$;
select pg_temp.assert_write_denied(format('update public.profiles set role=%L where id=%L::uuid',
  'admin',current_setting('test.user_id')));
reset role;

update public.profiles set role='admin',status='active' where id=current_setting('test.user_id')::uuid;
set local role authenticated;
do $$
declare new_id uuid; affected integer;
begin
  insert into public.teams(name,slug) values('Admin fixture',gen_random_uuid()::text) returning id into new_id;
  update public.teams set name='Admin updated' where id=new_id;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Admin update failed'; end if;
  delete from public.teams where id=new_id;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Admin delete failed'; end if;
  update public.collection_items set amount_paid=1000,status='paid',paid_by=auth.uid()
    where id=current_setting('test.item_id')::uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Admin payment failed'; end if;
  update public.collection_items set amount_paid=0,status='unpaid',paid_by=null
    where id=current_setting('test.item_id')::uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Admin payment undo failed'; end if;
  update public.matches set home_score=1 where id=current_setting('test.match_id')::uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Admin match update failed'; end if;
end $$;
reset role;

update public.profiles set status='blocked' where id=current_setting('test.user_id')::uuid;
set local role authenticated;
select pg_temp.assert_viewer();
reset role;
update public.profiles set status='inactive' where id=current_setting('test.user_id')::uuid;
set local role authenticated;
select pg_temp.assert_viewer();
reset role;
update public.profiles set status='pending' where id=current_setting('test.user_id')::uuid;
set local role authenticated;
select pg_temp.assert_viewer();
reset role;
-- Revocation uses the database, even with the same user identity/token.
update public.profiles set role='member',status='active' where id=current_setting('test.user_id')::uuid;
set local role authenticated;
select pg_temp.assert_viewer();
reset role;

do $$
declare t text; policy_count integer;
begin
  foreach t in array array['teams','team_members','guest_players','formations','matches',
    'match_participants','lineups','lineup_slots','collections','collection_items','albums','media','opponents']
  loop
    if to_regclass(format('public.%I',t)) is null then continue; end if;
    select count(*) into policy_count from pg_policies
      where schemaname='public' and tablename=t and policyname in ('admin_insert','admin_update','admin_delete');
    if policy_count<>3 then raise exception 'Missing write policies on %',t; end if;
    if exists(select 1 from pg_policies where schemaname='public' and tablename=t and cmd='ALL') then
      raise exception 'Permissive ALL policy remains on %',t;
    end if;
  end loop;
end $$;
rollback;
select 'PASS: public read; guest/member denied writes; active admin CRUD/payment; blocked/inactive/pending/revoked denied; fixtures rolled back' as result;
