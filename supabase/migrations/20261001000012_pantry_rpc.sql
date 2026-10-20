-- Milestone 2: pantry RPCs. Every write is a security-definer RPC scoped to the caller's household.

-- Item and request names: trimmed, inner whitespace collapsed, 1-40 characters.
create function private.clean_name(p text) returns text
language plpgsql immutable set search_path = public, pg_temp as $$
declare n text := btrim(regexp_replace(coalesce(p, ''), '\s+', ' ', 'g')); -- collapse first so tabs/newlines-only is empty
begin
  if char_length(n) not between 1 and 40 then raise exception 'invalid_input'; end if;
  return n;
end $$;

create function add_pantry_item(p_name text, p_owner_personal boolean, p_rule pantry_rule default null)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  n text := private.clean_name(p_name);
  personal boolean := coalesce(p_owner_personal, false);
  iid uuid;
begin
  if not personal and p_rule is not null then raise exception 'invalid_input'; end if;
  insert into pantry_items (household_id, owner_id, name, rule, created_by)
  values (h, case when personal then me end, n, case when personal then coalesce(p_rule, 'ask_first'::pantry_rule) end, me)
  returning id into iid;
  return iid;
exception when unique_violation then
  raise exception 'duplicate_item';
end $$;

create function add_pantry_basics(p_names text[])
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  n text;
begin
  if p_names is null or cardinality(p_names) > 12 then raise exception 'invalid_input'; end if;
  foreach n in array p_names loop
    -- already on the shelf (or a concurrent tap won): skip quietly
    insert into pantry_items (household_id, name, created_by) values (h, private.clean_name(n), me) on conflict do nothing;
  end loop;
end $$;

create function set_item_stock(p_id uuid, p_stock stock_level)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  it pantry_items;
  r restock_requests;
begin
  if p_stock is null then raise exception 'invalid_input'; end if;
  select * into it from pantry_items where id = p_id and household_id = h and archived_at is null for update;
  if not found or (it.owner_id is not null and it.owner_id <> me) then raise exception 'not_allowed'; end if;
  update pantry_items set stock = p_stock, updated_at = now() where id = it.id;
  if p_stock = 'in_stock' then
    -- it's back: anyone's open request on it is no longer needed
    update restock_requests set status = 'cancelled' where item_id = it.id and status = 'open' returning * into r;
    if r.claimed_by is not null and r.claimed_by <> me then
      perform private.notify(r.claimed_by, it.household_id, 'restock_closed', jsonb_build_object('item', it.name));
    end if;
  end if;
end $$;

create function set_item_rule(p_id uuid, p_rule pantry_rule)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
begin
  if p_rule is null then raise exception 'invalid_input'; end if;
  update pantry_items set rule = p_rule, updated_at = now()
  where id = p_id and household_id = h and owner_id = me and archived_at is null;
  if not found then raise exception 'not_allowed'; end if;
end $$;

create function remove_pantry_item(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  it pantry_items;
begin
  select * into it from pantry_items where id = p_id and household_id = h and archived_at is null for update;
  if not found or (it.owner_id is not null and it.owner_id <> me) then raise exception 'not_allowed'; end if;
  update pantry_items set archived_at = now(), updated_at = now() where id = it.id;
  update restock_requests set status = 'cancelled' where item_id = it.id and status = 'open';
end $$;

create function request_restock(p_item uuid default null, p_name text default null, p_effort smallint default 1)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  it pantry_items;
  n text;
  rid uuid;
begin
  if p_effort is null or p_effort not between 1 and 3 then raise exception 'invalid_input'; end if;
  if p_item is not null then
    select * into it from pantry_items where id = p_item and household_id = h and archived_at is null for update;
    if not found or it.owner_id is not null then raise exception 'not_allowed'; end if; -- shared items only
  else
    n := private.clean_name(p_name);
    -- free text that names a shared item links to it
    select * into it from pantry_items
    where household_id = h and owner_id is null and archived_at is null and lower(name) = lower(n) for update;
  end if;
  if it.id is not null and exists (select 1 from restock_requests where item_id = it.id and status = 'open') then
    raise exception 'already_requested';
  end if;
  n := coalesce(it.name, n);
  insert into restock_requests (household_id, item_id, name, effort, requested_by)
  values (coalesce(it.household_id, h), it.id, n, p_effort, me) returning id into rid;
  if it.id is not null and it.stock = 'in_stock' then
    update pantry_items set stock = 'out', updated_at = now() where id = it.id;
  end if;
  perform private.log(h, 'restock_requested', me, jsonb_build_object('actor', private.name(me), 'item', n));
  perform private.notify_household(h, 'restock', jsonb_build_object('actor', private.name(me), 'item', n), me);
  return rid;
exception when unique_violation then
  raise exception 'already_requested'; -- a concurrent request on the same item won
end $$;

create function claim_restock(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  r restock_requests;
begin
  select * into r from restock_requests where id = p_id and household_id = h for update;
  if not found or r.status <> 'open' then raise exception 'not_allowed'; end if;
  if r.claimed_by = me then return; end if; -- replay
  if r.claimed_by is not null then raise exception 'already_claimed'; end if;
  update restock_requests set claimed_by = me where id = r.id;
end $$;

create function unclaim_restock(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  r restock_requests;
begin
  select * into r from restock_requests where id = p_id and household_id = h for update;
  if not found or r.status <> 'open' then raise exception 'not_allowed'; end if;
  if r.claimed_by is null then return; end if; -- replay
  if r.claimed_by <> me then raise exception 'not_allowed'; end if;
  update restock_requests set claimed_by = null where id = r.id;
end $$;

-- Effort counts toward the completer's fair share for the week (get_state / weekTotals); no ledger change for anyone.
create function complete_restock(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  r restock_requests;
begin
  select * into r from restock_requests where id = p_id and household_id = h for update;
  if not found then raise exception 'not_allowed'; end if;
  if r.status = 'done' and r.done_by = me then return; end if; -- replay
  if r.status <> 'open' then raise exception 'not_allowed'; end if;
  if r.claimed_by is not null and r.claimed_by <> me then raise exception 'already_claimed'; end if;
  update restock_requests set status = 'done', done_by = me, done_at = now(), claimed_by = me where id = r.id;
  if r.item_id is not null then
    update pantry_items set stock = 'in_stock', updated_at = now() where id = r.item_id and archived_at is null;
  end if;
  perform private.log(r.household_id, 'restocked', me, jsonb_build_object('actor', private.name(me), 'item', r.name));
  if r.requested_by <> me then
    perform private.notify(r.requested_by, r.household_id, 'restock_done', jsonb_build_object('actor', private.name(me), 'item', r.name));
  end if;
end $$;

create function cancel_restock(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  r restock_requests;
begin
  select * into r from restock_requests where id = p_id and household_id = h for update;
  if not found or r.requested_by <> me then raise exception 'not_allowed'; end if;
  if r.status = 'cancelled' then return; end if; -- replay
  if r.status <> 'open' then raise exception 'not_allowed'; end if;
  update restock_requests set status = 'cancelled' where id = r.id;
  if r.claimed_by is not null and r.claimed_by <> me then
    perform private.notify(r.claimed_by, r.household_id, 'restock_closed', jsonb_build_object('item', r.name));
  end if;
end $$;

create function ask_to_use(p_item uuid)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  it pantry_items;
  aid uuid;
begin
  select * into it from pantry_items where id = p_item and household_id = h and archived_at is null;
  if not found or it.owner_id is null or it.owner_id = me or it.rule <> 'ask_first' then raise exception 'not_allowed'; end if;
  -- an ask nobody answered within 24 h has quietly lapsed (no notification)
  delete from pantry_asks where item_id = it.id and from_user = me and status = 'pending' and created_at <= now() - interval '24 hours';
  select id into aid from pantry_asks where item_id = it.id and from_user = me and status = 'pending';
  if aid is not null then return aid; end if; -- already waiting (double tap, replay)
  insert into pantry_asks (household_id, item_id, from_user, to_user) values (it.household_id, it.id, me, it.owner_id) returning id into aid;
  perform private.notify(it.owner_id, it.household_id, 'ask', jsonb_build_object('actor', private.name(me), 'item', it.name));
  return aid;
exception when unique_violation then
  -- a concurrent double tap inserted first: return its ask (it already notified)
  return (select id from pantry_asks where item_id = p_item and from_user = me and status = 'pending');
end $$;

create function answer_ask(p_ask uuid, p_yes boolean)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  a pantry_asks;
  answer ask_status := case when p_yes then 'yes'::ask_status else 'no'::ask_status end;
begin
  select * into a from pantry_asks where id = p_ask and household_id = h for update;
  if not found or a.to_user <> me or p_yes is null then raise exception 'not_allowed'; end if;
  if a.status = answer then return; end if; -- replay
  if a.status <> 'pending' or a.created_at <= now() - interval '24 hours' then raise exception 'not_allowed'; end if;
  update pantry_asks set status = answer, answered_at = now() where id = a.id;
  perform private.notify(a.from_user, a.household_id, 'ask_answer', jsonb_build_object(
    'actor', private.name(me), 'item', (select name from pantry_items where id = a.item_id), 'accepted', p_yes));
end $$;

-- Leaving also takes your shelf with you and frees anything you claimed from the pool.
create or replace function private.depart(h uuid, u uuid) returns void
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare was_owner boolean; code text;
begin
  select role = 'owner' into was_owner from members where household_id = h and user_id = u and left_at is null;
  update members set left_at = now(), role = 'member' where household_id = h and user_id = u and left_at is null;
  update assignments set status = 'missed'
    where household_id = h and user_id = u and status = 'todo' and day >= private.today(h);
  update swap_requests set status = 'declined'
    where household_id = h and status = 'pending' and (from_user = u or to_user = u);
  update pantry_items set archived_at = now(), updated_at = now()
    where household_id = h and owner_id = u and archived_at is null;
  update restock_requests set claimed_by = null
    where household_id = h and status = 'open' and claimed_by = u;
  if was_owner then
    update members set role = 'owner'
    where household_id = h and user_id = (
      select user_id from members where household_id = h and left_at is null order by joined_at limit 1);
  end if;
  if not exists (select 1 from members where household_id = h and left_at is null) then
    -- empty household: the old invite code must stop working
    loop
      code := private.gen_code();
      exit when not exists (select 1 from households where invite_code = code);
    end loop;
    update households set invite_code = code where id = h;
  end if;
  perform private.log(h, 'left', u, jsonb_build_object('actor', private.name(u)));
end $$;

-- Signed-in users only. Granted one by one: "grant ... on all functions" would also re-grant every srv_* function.
do $$
declare f text;
begin
  foreach f in array array[
    'add_pantry_item(text, boolean, pantry_rule)', 'add_pantry_basics(text[])', 'set_item_stock(uuid, stock_level)',
    'set_item_rule(uuid, pantry_rule)', 'remove_pantry_item(uuid)', 'request_restock(uuid, text, smallint)',
    'claim_restock(uuid)', 'unclaim_restock(uuid)', 'complete_restock(uuid)', 'cancel_restock(uuid)',
    'ask_to_use(uuid)', 'answer_ask(uuid, boolean)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
