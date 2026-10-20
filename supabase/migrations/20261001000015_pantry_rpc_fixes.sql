-- Task 4 fix round 1: complete_restock lock order and the concurrent-complete error code.

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
  if r.requested_by <> me then
    perform private.notify(r.requested_by, r.household_id, 'restock_done', jsonb_build_object('actor', private.name(me), 'item', r.name));
  end if;
end $$;

revoke all on function public.complete_restock(uuid) from public, anon;
grant execute on function public.complete_restock(uuid) to authenticated;

-- M1 invariant: private helpers are not executable by client roles.
revoke all on function private.clean_name(text) from public, anon, authenticated;
