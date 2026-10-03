-- Milestone 2 final fixes: one open free-text request per name, claimer credit on "In stock",
-- no restock_done to someone who left, removal tells the claimer, and an index for get_state's asks.

-- One open free-text request per name. Older duplicates are cancelled first, keeping the oldest
-- (status only, as cancel_restock does). request_restock's unique_violation handler covers the whole
-- function body, so a race on this index is reported as already_requested too.
update restock_requests r set status = 'cancelled'
where r.status = 'open' and r.item_id is null and exists (
  select 1 from restock_requests o
  where o.household_id = r.household_id and lower(o.name) = lower(r.name)
    and o.status = 'open' and o.item_id is null and (o.created_at, o.id) < (r.created_at, r.id));
create unique index restock_one_open_free_text on restock_requests (household_id, lower(name))
  where status = 'open' and item_id is null;

create index pantry_asks_household on pantry_asks (household_id);

-- In stock closes the open request. When the caller had claimed it, they bought it: done with credit,
-- exactly as complete_restock. Otherwise it is cancelled and the claimer is told. Lock order: item, then request.
create or replace function public.set_item_stock(p_id uuid, p_stock stock_level)
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
    select * into r from restock_requests where item_id = it.id and status = 'open' for update;
    if not found then return; end if;
    if r.claimed_by = me then
      -- no ledger change for anyone (as complete_restock)
      update restock_requests set status = 'done', done_by = me, done_at = now() where id = r.id;
      perform private.log(r.household_id, 'restocked', me, jsonb_build_object('actor', private.name(me), 'item', r.name));
      if r.requested_by <> me and exists (
        select 1 from members where household_id = r.household_id and user_id = r.requested_by and left_at is null) then
        perform private.notify(r.requested_by, r.household_id, 'restock_done', jsonb_build_object('actor', private.name(me), 'item', r.name));
      end if;
    else
      -- it's back: the open request is no longer needed
      update restock_requests set status = 'cancelled' where id = r.id;
      if r.claimed_by is not null then
        perform private.notify(r.claimed_by, r.household_id, 'restock_closed', jsonb_build_object('item', it.name));
      end if;
    end if;
  end if;
end $$;

-- As 000015, plus restock_done only reaches a requester who is still a member.
-- Lock order is item, then request: the same as set_item_stock and remove_pantry_item, so they cannot deadlock.
-- Effort counts toward the completer's fair share for the week (get_state / weekTotals); no ledger change for anyone.
create or replace function public.complete_restock(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  item uuid;
  r restock_requests;
begin
  select item_id into item from restock_requests where id = p_id and household_id = h;
  if item is not null then
    perform 1 from pantry_items where id = item and household_id = h for update;
  end if;
  select * into r from restock_requests where id = p_id and household_id = h for update;
  if not found then raise exception 'not_allowed'; end if;
  if r.status = 'done' and r.done_by = me then return; end if; -- replay
  if r.status = 'done' then raise exception 'already_claimed'; end if; -- a roommate completed it first
  if r.status <> 'open' then raise exception 'not_allowed'; end if;
  if r.claimed_by is not null and r.claimed_by <> me then raise exception 'already_claimed'; end if;
  update restock_requests set status = 'done', done_by = me, done_at = now(), claimed_by = me where id = r.id;
  if r.item_id is not null then
    update pantry_items set stock = 'in_stock', updated_at = now() where id = r.item_id and archived_at is null;
  end if;
  perform private.log(r.household_id, 'restocked', me, jsonb_build_object('actor', private.name(me), 'item', r.name));
  if r.requested_by <> me and exists (
    select 1 from members where household_id = r.household_id and user_id = r.requested_by and left_at is null) then
    perform private.notify(r.requested_by, r.household_id, 'restock_done', jsonb_build_object('actor', private.name(me), 'item', r.name));
  end if;
end $$;

-- As 000012, plus the claimer of the cancelled request is told (as cancel_restock).
create or replace function public.remove_pantry_item(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  it pantry_items;
  r restock_requests;
begin
  select * into it from pantry_items where id = p_id and household_id = h and archived_at is null for update;
  if not found or (it.owner_id is not null and it.owner_id <> me) then raise exception 'not_allowed'; end if;
  update pantry_items set archived_at = now(), updated_at = now() where id = it.id;
  update restock_requests set status = 'cancelled' where item_id = it.id and status = 'open' returning * into r;
  if r.claimed_by is not null and r.claimed_by <> me then
    perform private.notify(r.claimed_by, r.household_id, 'restock_closed', jsonb_build_object('item', r.name));
  end if;
end $$;

revoke all on function public.set_item_stock(uuid, stock_level) from public, anon;
grant execute on function public.set_item_stock(uuid, stock_level) to authenticated;
revoke all on function public.complete_restock(uuid) from public, anon;
grant execute on function public.complete_restock(uuid) to authenticated;
revoke all on function public.remove_pantry_item(uuid) from public, anon;
grant execute on function public.remove_pantry_item(uuid) to authenticated;
