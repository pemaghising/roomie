-- The activity feed records everything that changes the house: pantry items added, flagged, back in stock or
-- removed; "I'll get it" and "can't get it after all"; requests called off; chores edited or removed.
-- Each function is its latest version (000016, 000012, 000020, 000027, 000005) plus its log line.
-- Asks stay private between the two people and personal stock levels stay off the feed.

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
  if it.owner_id is null and p_stock <> 'in_stock' and p_stock <> it.stock then
    perform private.log(h, 'item_flagged', me, jsonb_build_object('actor', private.name(me), 'item', it.name, 'stock', p_stock));
  end if;
  if p_stock = 'in_stock' then
    select * into r from restock_requests where item_id = it.id and status = 'open' for update;
    if not found then
      if it.owner_id is null and it.stock <> 'in_stock' then
        perform private.log(h, 'item_back', me, jsonb_build_object('actor', private.name(me), 'item', it.name));
      end if;
      return;
    end if;
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
      perform private.log(h, 'item_back', me, jsonb_build_object('actor', private.name(me), 'item', it.name));
      if r.claimed_by is not null then
        perform private.notify(r.claimed_by, r.household_id, 'restock_closed', jsonb_build_object('item', it.name));
      end if;
    end if;
  end if;
end $$;

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
  perform private.log(h, 'item_removed', me, jsonb_build_object('actor', private.name(me), 'item', it.name, 'shared', it.owner_id is null));
  if r.claimed_by is not null and r.claimed_by <> me then
    perform private.notify(r.claimed_by, r.household_id, 'restock_closed', jsonb_build_object('item', r.name));
  end if;
end $$;

create or replace function public.claim_restock(p_id uuid)
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
  perform private.log(h, 'restock_claimed', me, jsonb_build_object('actor', private.name(me), 'item', r.name));
end $$;

create or replace function public.unclaim_restock(p_id uuid)
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
  perform private.log(h, 'restock_unclaimed', me, jsonb_build_object('actor', private.name(me), 'item', r.name));
end $$;

create or replace function public.cancel_restock(p_id uuid)
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
  perform private.log(h, 'restock_cancelled', me, jsonb_build_object('actor', private.name(me), 'item', r.name));
  if r.claimed_by is not null and r.claimed_by <> me then
    perform private.notify(r.claimed_by, r.household_id, 'restock_closed', jsonb_build_object('item', r.name));
  end if;
end $$;

-- "I'll get it": one entry saying who is getting what, whether or not anyone had asked for it yet
create or replace function public.get_restock(p_item uuid)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  it pantry_items;
  r restock_requests;
  rid uuid;
begin
  select * into it from pantry_items where id = p_item and household_id = h and archived_at is null for update;
  if not found or it.owner_id is not null then raise exception 'not_allowed'; end if; -- shared items only
  select * into r from restock_requests where item_id = it.id and status = 'open' for update;
  if found then
    if r.claimed_by = me then return r.id; end if; -- replay
    if r.claimed_by is not null then raise exception 'already_claimed'; end if;
    update restock_requests set claimed_by = me where id = r.id;
    perform private.log(h, 'restock_claimed', me, jsonb_build_object('actor', private.name(me), 'item', it.name));
    return r.id;
  end if;
  insert into restock_requests (household_id, item_id, name, effort, requested_by, claimed_by)
  values (h, it.id, it.name, 1, me, me) returning id into rid;
  if it.stock = 'in_stock' then update pantry_items set stock = 'low', updated_at = now() where id = it.id; end if;
  perform private.log(h, 'restock_claimed', me, jsonb_build_object('actor', private.name(me), 'item', it.name));
  return rid;
exception when unique_violation then
  raise exception 'already_requested';
end $$;

create or replace function public.add_pantry_item(p_name text, p_owner_personal boolean, p_rule pantry_rule default null, p_icon text default null)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  n text := private.clean_name(p_name);
  personal boolean := coalesce(p_owner_personal, false);
  iid uuid;
begin
  if not personal and p_rule is not null then raise exception 'invalid_input'; end if;
  insert into pantry_items (household_id, owner_id, name, rule, icon, created_by)
  values (h, case when personal then me end, n, case when personal then coalesce(p_rule, 'ask_first'::pantry_rule) end, nullif(trim(p_icon), ''), me)
  returning id into iid;
  perform private.log(h, 'item_added', me, jsonb_build_object('actor', private.name(me), 'item', n, 'shared', not personal));
  return iid;
exception when unique_violation then
  raise exception 'duplicate_item';
end $$;

create or replace function public.archive_chore(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  n text;
begin
  update chores set active = false where id = p_id and household_id = h returning name into n;
  if not found then raise exception 'not_allowed'; end if;
  delete from assignments where chore_id = p_id and status = 'todo' and day > private.today(h);
  perform private.log(h, 'chore_removed', me, jsonb_build_object('actor', private.name(me), 'chore', n));
end $$;

create or replace function public.update_chore(p_id uuid, p_name text, p_icon text, p_effort smallint, p_cadence cadence)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  n text := private.clean_name(p_name);
begin
  if char_length(coalesce(n, '')) not between 1 and 40
     or p_effort is null or p_effort not between 1 and 3
     or p_cadence is null
     or char_length(coalesce(p_icon, '')) > 16 then
    raise exception 'invalid_input';
  end if;
  update chores set name = n, icon = coalesce(p_icon, icon), effort = p_effort, cadence = p_cadence
  where id = p_id and household_id = h and active;
  if not found then raise exception 'not_allowed'; end if;
  perform private.log(h, 'chore_edited', me, jsonb_build_object('actor', private.name(me), 'chore', n));
exception when unique_violation then
  raise exception 'duplicate_item';
end $$;
