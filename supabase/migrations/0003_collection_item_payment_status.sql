alter table public.collection_items
  add column if not exists paid_at timestamptz,
  add column if not exists paid_by uuid references public.profiles(id) on delete set null,
  add column if not exists payment_note text;

alter table public.collection_items
  drop constraint if exists collection_items_status_check;

alter table public.collection_items
  add constraint collection_items_status_check
  check (status in ('unpaid', 'partial', 'paid', 'overpaid', 'waived'));

create index if not exists idx_collection_items_paid_at on public.collection_items (paid_at);
create index if not exists idx_collection_items_paid_by on public.collection_items (paid_by);
