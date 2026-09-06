-- Integration checks only create temporary notification rows, rolled back at the end.
-- No matches/members are changed and no HTTP/Push request is sent.
begin;
set local role service_role;
do $test$
declare
  member uuid;
  team uuid;
  invitation text := encode(sha256(convert_to(gen_random_uuid()::text, 'UTF8')), 'hex');
  capability text := encode(sha256(convert_to(gen_random_uuid()::text, 'UTF8')), 'hex');
  device uuid;
  retried uuid;
  claimed integer;
  job_key text := 'test:' || gen_random_uuid()::text;
  endpoint text := 'https://web.push.apple.com/TEST-NOT-SENT-' || gen_random_uuid()::text;
begin
  select id, team_id into member, team from public.team_members where status = 'active' limit 1;
  if member is null then raise exception 'Test requires one active member'; end if;
  insert into public.push_invites(token_hash, member_id) values(invitation, member);
  device := public.redeem_push_invite(invitation, capability, endpoint, '{"p256dh":"test","auth":"test"}');
  retried := public.redeem_push_invite(invitation, capability, endpoint, '{"p256dh":"test","auth":"test"}');
  if device <> retried then raise exception 'Enrollment retry was not idempotent'; end if;
  begin
    perform public.redeem_push_invite(invitation, repeat('b',64), endpoint, '{}');
    raise exception 'Used invitation was accepted by a different device';
  exception when raise_exception then
    if sqlerrm <> 'INVALID_INVITE' then raise; end if;
  end;
  if (select captain_verified from public.push_devices where id = device) then
    raise exception 'Ordinary invitation gained captain verification';
  end if;
  insert into public.push_deliveries(event_key, device_id, team_id, kind, expires_at)
  values(job_key, device, team, 'create_match', now() + interval '1 hour');
  insert into public.push_deliveries(event_key, device_id, team_id, kind, expires_at)
  values(job_key, device, team, 'create_match', now() + interval '1 hour')
  on conflict(event_key,device_id) do nothing;
  if (select count(*) from public.push_deliveries where event_key = job_key) <> 1 then
    raise exception 'Delivery deduplication failed';
  end if;
  select count(*) into claimed from public.claim_push_deliveries(20) where event_key = job_key;
  if claimed <> 1 then raise exception 'Job not claimed'; end if;
  select count(*) into claimed from public.claim_push_deliveries(20) where event_key = job_key;
  if claimed <> 0 then raise exception 'Job claimed twice inside lease'; end if;
end;
$test$;
rollback;
select 'Enrollment, replay protection, captain isolation, deduplication and lease checks passed; test data rolled back' as result;
