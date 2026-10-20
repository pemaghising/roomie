-- Review fixes for the Sunday fold (26):
-- * srv_insert_plan skips a chore's day when any plan in the home already has it, so the folded Monday weeks and
--   the redeployed Sunday tick can't both assign it.
-- * the Sunday check constraint goes: it also fires on updates to old rows (locking a leftover draft would throw),
--   and the fold already covers the one writer that sent Monday weeks.
-- * get_restock: "I'll get it" in one step, claimed by the caller, without telling the house it was requested.
-- * update_chore cleans names the same way the other name RPCs do.

alter table plans drop constraint if exists plans_week_starts_sunday;

create or replace function srv_insert_plan(p_household uuid, p_week date, p_status plan_status, p_assignments jsonb,
                                p_consume boolean, p_only_if_new boolean) returns uuid
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  pid uuid;
  zone text;
  existed boolean;
begin
  -- weeks start on Sunday: an older tick build still sends Monday, so fold any day back to its Sunday
  p_week := p_week - extract(dow from p_week)::int;
  select tz into zone from households where id = p_household;
  select id into pid from plans where household_id = p_household and week_start = p_week for update;
  existed := pid is not null;
  if existed and p_only_if_new then return pid; end if; -- a concurrent run already planned this week
  if not existed then
    insert into plans (household_id, week_start, status, lock_at)
    values (p_household, p_week, p_status, ((p_week - 1) + time '18:00') at time zone zone)
    returning id into pid;
  end if;
  -- the subqueries see the pre-statement snapshot: chores already in the plan are skipped, a new chore's own rows all insert
  insert into assignments (plan_id, household_id, chore_id, user_id, day, effort, reason)
  select pid, p_household, (x->>'choreId')::uuid, (x->>'userId')::uuid, (x->>'day')::date, (x->>'effort')::smallint, x->'reason'
  from jsonb_array_elements(p_assignments) x
  where not exists (select 1 from assignments a where a.plan_id = pid and a.chore_id = (x->>'choreId')::uuid)
    -- and never the same chore on the same day twice, whichever plan already holds it (folded Monday weeks)
    and not exists (select 1 from assignments a where a.household_id = p_household and a.chore_id = (x->>'choreId')::uuid
                     and a.day = (x->>'day')::date and a.status <> 'expired');
  if p_consume then
    update effort_ledger set balance = balance - greatest(-3, least(3, balance)), updated_at = now()
    where household_id = p_household;
  end if;
  if not existed and p_week > (now() at time zone zone)::date then
    perform private.notify_household(p_household, case when p_status = 'draft' then 'plan_ready' else 'plan_locked' end, '{}'::jsonb);
    perform private.log(p_household, case when p_status = 'draft' then 'plan_ready' else 'plan_locked' end, null);
  end if;
  return pid;
end $$;

revoke all on function public.srv_insert_plan(uuid, date, plan_status, jsonb, boolean, boolean) from public, anon, authenticated;
grant execute on function public.srv_insert_plan(uuid, date, plan_status, jsonb, boolean, boolean) to service_role;

create or replace function get_restock(p_item uuid)
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
    return r.id;
  end if;
  insert into restock_requests (household_id, item_id, name, effort, requested_by, claimed_by)
  values (h, it.id, it.name, 1, me, me) returning id into rid;
  if it.stock = 'in_stock' then update pantry_items set stock = 'low', updated_at = now() where id = it.id; end if;
  perform private.log(h, 'restock_requested', me, jsonb_build_object('actor', private.name(me), 'item', it.name));
  return rid;
exception when unique_violation then
  raise exception 'already_requested';
end $$;

revoke all on function public.get_restock(uuid) from public, anon;
grant execute on function public.get_restock(uuid) to authenticated;

create or replace function update_chore(p_id uuid, p_name text, p_icon text, p_effort smallint, p_cadence cadence)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
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
exception when unique_violation then
  raise exception 'duplicate_item';
end $$;
