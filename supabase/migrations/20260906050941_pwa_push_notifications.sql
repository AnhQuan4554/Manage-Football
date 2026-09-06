-- Isolated notification data. Existing prototype auth/data policies are unchanged.
-- Filename matches the version recorded by the remote migration tool.
create table public.push_devices (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.team_members(id) on delete cascade,
  token_hash text not null unique check (length(token_hash) = 64),
  endpoint text not null unique,
  keys jsonb not null,
  captain_verified boolean not null default false,
  enabled boolean not null default true,
  revoked_at timestamptz,
  last_test_at timestamptz,
  created_at timestamptz not null default now()
);
create index push_devices_member_idx on public.push_devices(member_id);

create table public.push_invites (
  token_hash text primary key check (length(token_hash) = 64),
  member_id uuid not null references public.team_members(id) on delete cascade,
  captain_verified boolean not null default false,
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz,
  device_id uuid references public.push_devices(id) on delete set null
);
create index push_invites_member_idx on public.push_invites(member_id);
create index push_invites_device_idx on public.push_invites(device_id);

create table public.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  device_id uuid not null references public.push_devices(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  match_id uuid references public.matches(id) on delete cascade,
  kind text not null check (kind in ('new_match', 'match_today', 'create_match')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  expires_at timestamptz not null,
  lease_token uuid,
  sent_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  unique(event_key, device_id)
);
create index push_deliveries_due_idx on public.push_deliveries(available_at) where status in ('pending', 'processing');
create index push_deliveries_device_idx on public.push_deliveries(device_id);
create index push_deliveries_team_idx on public.push_deliveries(team_id);
create index push_deliveries_match_idx on public.push_deliveries(match_id);

alter table public.push_devices enable row level security;
alter table public.push_invites enable row level security;
alter table public.push_deliveries enable row level security;
-- Override the legacy default privileges explicitly: endpoints and tokens are private.
revoke all on public.push_devices, public.push_invites, public.push_deliveries from public, anon, authenticated;
grant select, insert, update, delete on public.push_devices, public.push_invites, public.push_deliveries to service_role;

-- Server-only, security INVOKER: atomic one-time enrollment and safe retry after lost response.
create function public.redeem_push_invite(
  invite_hash text, device_hash text, push_endpoint text, push_keys jsonb
) returns uuid language plpgsql set search_path = '' as $$
declare invitation public.push_invites; device uuid;
begin
  select * into invitation from public.push_invites where token_hash = invite_hash for update;
  if not found then raise exception 'INVALID_INVITE'; end if;
  if invitation.used_at is not null then
    select id into device from public.push_devices
    where id = invitation.device_id and token_hash = device_hash and endpoint = push_endpoint and revoked_at is null;
    if device is not null then return device; end if;
    raise exception 'INVALID_INVITE';
  end if;
  if invitation.expires_at <= now() or not exists (
    select 1 from public.team_members where id = invitation.member_id and status = 'active'
  ) then raise exception 'INVALID_INVITE'; end if;
  insert into public.push_devices(member_id, token_hash, endpoint, keys, captain_verified)
  values (invitation.member_id, device_hash, push_endpoint, push_keys, invitation.captain_verified)
  returning id into device;
  update public.push_invites set used_at = now(), device_id = device where token_hash = invite_hash;
  return device;
end;
$$;
revoke all on function public.redeem_push_invite(text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.redeem_push_invite(text,text,text,jsonb) to service_role;

create function public.claim_push_deliveries(batch_size integer default 20)
returns setof public.push_deliveries language sql set search_path = '' as $$
  update public.push_deliveries set
    status = 'processing', attempts = attempts + 1,
    available_at = now() + interval '2 minutes', lease_token = gen_random_uuid()
  where id in (
    select id from public.push_deliveries
    where status in ('pending','processing') and available_at <= now()
      and attempts < 5 and expires_at > now()
    order by available_at limit least(greatest(batch_size, 1), 20)
    for update skip locked
  )
  returning *;
$$;
revoke all on function public.claim_push_deliveries(integer) from public, anon, authenticated;
grant execute on function public.claim_push_deliveries(integer) to service_role;

-- Only enabled once the matching production app and secrets have been deployed.
create extension if not exists pg_cron;
create extension if not exists pg_net;
create schema if not exists push_private;
revoke all on schema push_private from public, anon, authenticated;

create function push_private.dispatch() returns void
language plpgsql set search_path = '' as $$
declare app_url text; secret text;
begin
  select decrypted_secret into app_url from vault.decrypted_secrets where name = 'pinkstorm_push_app_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'pinkstorm_push_cron_secret';
  if app_url is null or secret is null then return; end if;
  perform net.http_post(
    url := app_url || '/api/notifications/cron',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || secret),
    body := '{}'::jsonb, timeout_milliseconds := 60000
  );
end;
$$;
revoke all on function push_private.dispatch() from public, anon, authenticated;

-- The 17:00 tick is included. Other ticks recover transient send failures.
select cron.schedule('pinkstorm-push-dispatch', '*/5 * * * *', 'select push_private.dispatch();');
select cron.schedule('pinkstorm-push-cleanup', '20 20 * * *', $job$
  delete from public.push_invites where expires_at < now() - interval '7 days';
  delete from public.push_deliveries where expires_at < now() - interval '7 days';
  delete from cron.job_run_details
    where jobid in (select jobid from cron.job where jobname like 'pinkstorm-push-%')
      and end_time < now() - interval '7 days';
$job$);
