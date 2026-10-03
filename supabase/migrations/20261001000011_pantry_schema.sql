-- Milestone 2: the pantry. Items (shared or personal), restock requests (the chores pool) and asks.
-- Writes only through the security-definer RPCs in 20261001000012; clients get read-only RLS.

create type pantry_rule as enum ('ask_first', 'do_not_touch');
create type stock_level as enum ('in_stock', 'low', 'out');
create type restock_status as enum ('open', 'done', 'cancelled');
create type ask_status as enum ('pending', 'yes', 'no');

create table pantry_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_id uuid references profiles, -- null = shared
  name text not null check (char_length(name) between 1 and 40),
  rule pantry_rule,
  stock stock_level not null default 'in_stock',
  archived_at timestamptz,
  created_by uuid not null references profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((owner_id is null) = (rule is null))
);
-- one active "milk" per shelf: the shared shelf, or each person's own
create unique index pantry_items_unique_name on pantry_items
  (household_id, coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name))
  where archived_at is null;

create table restock_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  item_id uuid references pantry_items on delete set null, -- null = free text from the FAB
  name text not null check (char_length(name) between 1 and 40), -- snapshot of the item name
  effort smallint not null check (effort between 1 and 3),
  requested_by uuid not null references profiles,
  claimed_by uuid references profiles,
  status restock_status not null default 'open',
  done_by uuid references profiles,
  done_at timestamptz,
  stale_noted_at timestamptz, -- set when the morning digest has mentioned it (once, after 48 h open)
  created_at timestamptz not null default now()
);
create unique index restock_one_open_per_item on restock_requests (item_id) where status = 'open' and item_id is not null;
create index restock_requests_household on restock_requests (household_id, status);

create table pantry_asks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  item_id uuid not null references pantry_items on delete cascade,
  from_user uuid not null references profiles,
  to_user uuid not null references profiles, -- the item's owner
  status ask_status not null default 'pending',
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create unique index pantry_asks_one_pending on pantry_asks (item_id, from_user) where status = 'pending';

alter table pantry_items enable row level security;
alter table restock_requests enable row level security;
alter table pantry_asks enable row level security;

-- Read-only policies; there are deliberately no insert/update/delete policies.
create policy pantry_items_read on pantry_items for select using (private.is_member(household_id));
create policy restock_requests_read on restock_requests for select using (private.is_member(household_id));
-- asks are private to the two people involved
create policy pantry_asks_read_own on pantry_asks for select
  using (auth.uid() in (from_user, to_user) and private.is_member(household_id));

-- M1's default-privilege revoke already covers new tables; re-assert it for these three.
revoke insert, update, delete, truncate on pantry_items, restock_requests, pantry_asks from anon, authenticated;

-- realtime is only a "something changed" signal; asks are not broadcast (fetched via get_state)
alter publication supabase_realtime add table pantry_items, restock_requests;
