begin;
select set_config('request.jwt.claim.sub', '', true),
       set_config('request.jwt.claims', '{}', true),
       set_config('test.auth_member_id', gen_random_uuid()::text, true),
       set_config('test.auth_other_id', gen_random_uuid()::text, true);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
values
  (current_setting('test.auth_member_id')::uuid, 'auth-role-check@example.invalid',
   '{"full_name":"Auth test","role":"admin","status":"active"}', '{"provider":"email"}'),
  (current_setting('test.auth_other_id')::uuid, 'auth-google-check@example.invalid',
   '{"name":"Google test","role":"admin"}', '{"provider":"google"}');

do $$
begin
  if (select count(*) from public.profiles where id in (
    current_setting('test.auth_member_id')::uuid,
    current_setting('test.auth_other_id')::uuid) and role = 'member') <> 2 then
    raise exception 'New accounts must default to member, ignoring metadata';
  end if;
  if (select auth_provider from public.profiles where id = current_setting('test.auth_other_id')::uuid) <> 'google' then
    raise exception 'Google profile was not synchronized';
  end if;
  if has_function_privilege('authenticated', 'auth_private.sync_user_profile()', 'EXECUTE')
     or has_function_privilege('anon', 'auth_private.sync_user_profile()', 'EXECUTE') then
    raise exception 'Internal auth trigger must not be executable by API roles';
  end if;
end;
$$;

-- Database-assigned role survives subsequent Auth metadata/email updates.
update public.profiles set role = 'admin'
where id = current_setting('test.auth_member_id')::uuid;
update auth.users set email = 'auth-updated@example.invalid',
  raw_user_meta_data = '{"full_name":"Updated","role":"member"}'
where id = current_setting('test.auth_member_id')::uuid;
do $$
begin
  if not exists (select 1 from public.profiles
    where id = current_setting('test.auth_member_id')::uuid
      and role = 'admin' and email = 'auth-updated@example.invalid' and full_name = 'Updated') then
    raise exception 'Auth sync must preserve the DB-assigned role';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', current_setting('test.auth_member_id'), true);
set local role authenticated;
do $$
begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'Authenticated user must see only their profile';
  end if;
  if exists (select 1 from public.profiles where id = current_setting('test.auth_other_id')::uuid) then
    raise exception 'Other account data leaked';
  end if;
  begin
    update public.profiles set role = 'admin'
    where id = current_setting('test.auth_member_id')::uuid;
    raise exception 'API caller could change account role';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set status = 'active'
    where id = current_setting('test.auth_member_id')::uuid;
    raise exception 'API caller could change account status';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.profiles where id = current_setting('test.auth_other_id')::uuid;
    raise exception 'API caller could delete another account';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.profiles (id, role) values (gen_random_uuid(), 'admin');
    raise exception 'API caller could insert an admin profile';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Revocation takes effect from the database immediately.
update public.profiles set role = 'member'
where id = current_setting('test.auth_member_id')::uuid;
set local role authenticated;
do $$
begin
  if (select role from public.profiles where id = (select auth.uid())) <> 'member' then
    raise exception 'Role change was not visible immediately';
  end if;
end;
$$;
reset role;

select set_config('request.jwt.claim.sub', '', true);
set local role anon;
do $$
begin
  if (select count(*) from public.profiles) <> 0 then
    raise exception 'Guest can read account data';
  end if;
  if not has_table_privilege('anon', 'public.matches', 'SELECT')
     or not has_table_privilege('anon', 'public.team_members', 'SELECT')
     or has_table_privilege('anon', 'public.matches', 'INSERT')
     or has_table_privilege('anon', 'public.team_members', 'UPDATE') then
    raise exception 'Guests must only read business data';
  end if;
  perform id from public.teams limit 1;
end;
$$;
reset role;
rollback;
select 'PASS: profile sync, metadata spoofing, RLS isolation, API role protection, DB promotion/revocation, guest access; all fixtures rolled back' as result;

