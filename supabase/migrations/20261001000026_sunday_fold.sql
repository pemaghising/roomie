-- Until the tick function is redeployed, the live build plans Monday-first weeks. Rather than refuse them
-- (which would leave new homes with no plan), srv_insert_plan files them under their Sunday. Chores already in
-- that week's plan are skipped as before, so nothing doubles.

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
  -- the subquery sees the pre-statement snapshot: chores already in the plan are skipped, a new chore's own rows all insert
  insert into assignments (plan_id, household_id, chore_id, user_id, day, effort, reason)
  select pid, p_household, (x->>'choreId')::uuid, (x->>'userId')::uuid, (x->>'day')::date, (x->>'effort')::smallint, x->'reason'
  from jsonb_array_elements(p_assignments) x
  where not exists (select 1 from assignments a where a.plan_id = pid and a.chore_id = (x->>'choreId')::uuid);
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
