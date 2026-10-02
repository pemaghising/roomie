-- User-triggered ticks make concurrent runs routine: make digest, streak and plan insertion idempotent.
create or replace function srv_queue_digest(p_household uuid, p_day date) returns void
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare r record;
begin
  -- claim the day first; a concurrent run that lost the race queues nothing
  update households set digest_sent_for = p_day where id = p_household and digest_sent_for is distinct from p_day;
  if not found then return; end if;
  for r in
    select a.user_id, jsonb_agg(c.name order by a.effort desc) as chores
    from assignments a join chores c on c.id = a.chore_id
    join members m on m.household_id = a.household_id and m.user_id = a.user_id and m.left_at is null
    where a.household_id = p_household and a.day = p_day and a.status = 'todo'
    group by a.user_id
    having count(*) > 0
  loop
    perform private.notify(r.user_id, p_household, 'digest', jsonb_build_object('chores', r.chores));
  end loop;
end $$;

create or replace function srv_set_streak(p_household uuid, p_current int, p_best int, p_day date, p_kept boolean) returns void
language plpgsql security definer set search_path = public, private, pg_temp as $$
begin
  update streaks set current = p_current, best = p_best, last_settled_day = p_day
  where household_id = p_household and (last_settled_day is null or last_settled_day < p_day);
  if found and p_kept and p_current > 1 then
    perform private.notify_household(p_household, 'day_kept', jsonb_build_object('streak', p_current));
    perform private.log(p_household, 'day_kept', null, jsonb_build_object('streak', p_current));
  end if;
end $$;

create or replace function srv_insert_plan(p_household uuid, p_week date, p_status plan_status, p_assignments jsonb,
                                p_consume boolean, p_only_if_new boolean) returns uuid
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  pid uuid;
  zone text;
  existed boolean;
begin
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

-- create or replace keeps existing grants; re-assert them anyway.
do $$
declare f text;
begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'srv\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
