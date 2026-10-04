-- Account roles are independent of team_members.role.
-- Guest business-table policies remain unchanged.
alter table public.profiles
  add column email text,
  add column role text not null default 'member'
    constraint profiles_role_check check (role in ('member', 'admin'));

comment on column public.profiles.role is
  'System account role. Change through the database only; never trust user_metadata for authorization.';

alter table public.profiles enable row level security;
drop policy if exists allow_all on public.profiles;
revoke all on public.profiles from public, anon, authenticated;
-- Anon SELECT returns no rows, so roster lookups fall back to team_members
-- without disclosing account names, emails or roles.
grant select on public.profiles to anon, authenticated;
create policy profiles_read_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create schema if not exists auth_private;
revoke all on schema auth_private from public, anon, authenticated;

-- Auth creates this row even when email confirmation is required.
-- This privileged trigger is not a callable Data API function.
create function auth_private.sync_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and auth.uid() <> new.id then
    raise exception 'Cannot synchronize another account';
  end if;

  insert into public.profiles (id, email, full_name, avatar_url, auth_provider)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_app_meta_data ->> 'provider', 'email')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    auth_provider = excluded.auth_provider;
  -- role and status are never copied from user metadata.
  return new;
end;
$$;
revoke all on function auth_private.sync_user_profile() from public, anon, authenticated;

create trigger sync_auth_user_profile
  after insert or update of email, raw_user_meta_data, raw_app_meta_data on auth.users
  for each row execute function auth_private.sync_user_profile();

insert into public.profiles (id, email, full_name, avatar_url, auth_provider)
select id, email,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  raw_user_meta_data ->> 'avatar_url',
  coalesce(raw_app_meta_data ->> 'provider', 'email')
from auth.users
on conflict (id) do update set email = excluded.email;