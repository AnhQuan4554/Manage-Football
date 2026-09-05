-- Match-owned collections must be removed atomically with the match.
-- Participants, lineups, slots, collection items and notification jobs already cascade.
-- Albums keep their media and are detached by the existing SET NULL relationship.
alter table public.collections
  drop constraint collections_match_id_fkey,
  add constraint collections_match_id_fkey
    foreign key (match_id) references public.matches(id) on delete cascade;

-- Only records explicitly deleted through the old UI are historical soft deletes.
delete from public.matches
where status = 'cancelled'
  and cancelled_reason = 'Đã xoá từ giao diện';
