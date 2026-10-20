-- Service-role-only functions used by the tick Edge Function.
create function srv_snapshots(p_household uuid default null) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(snap), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', h.id,
      'tz', h.tz,
      'planMode', h.plan_mode,
      'dayEndsAt', h.day_ends_at::text,
      'activeMembers', (select count(*) from members m where m.household_id = h.id and m.left_at is null),
      'plans', (select coalesce(jsonb_agg(jsonb_build_object(
          'id', p.id, 'weekStart', p.week_start, 'status', p.status,
          -- ISO with Z: a Postgres "+00" string parses as NaN in JS and the plan would never lock
          'lockAt', to_char(p.lock_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'approvals', (select count(*) from plan_approvals pa
                        join members m on m.user_id = pa.user_id and m.household_id = h.id and m.left_at is null
                        where pa.plan_id = p.id))), '[]'::jsonb)
        from plans p where p.household_id = h.id and p.week_start >= ((now() at time zone h.tz)::date - extract(dow from now() at time zone h.tz)::int)),
      -- one entry per date (today and 3 back), including dates with zero assignments, so the streak can settle empty days
      'days', (select coalesce(jsonb_agg(jsonb_build_object('date', d.day, 'statuses', d.statuses) order by d.day), '[]'::jsonb)
        from (select gs::date as day,
                     coalesce((select jsonb_agg(a.status) from assignments a where a.household_id = h.id and a.day = gs::date), '[]'::jsonb) as statuses
              from generate_series(((now() at time zone h.tz)::date - 3)::timestamp, ((now() at time zone h.tz)::date)::timestamp, interval '1 day') gs) d),
      'streak', coalesce((select jsonb_build_object('current', s.current, 'best', s.best, 'lastSettledDay', s.last_settled_day)
                 from streaks s where s.household_id = h.id),
                 jsonb_build_object('current', 0, 'best', 0, 'lastSettledDay', null)),
      'digestSentFor', h.digest_sent_for
    ) as snap
    from households h
    where (p_household is null or h.id = p_household)
      and exists (select 1 from members m where m.household_id = h.id and m.left_at is null)
  ) x
$$;

create function srv_plan_inputs(p_household uuid, p_week date) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'members', (select coalesce(jsonb_agg(jsonb_build_object(
        'userId', m.user_id, 'busyDays', m.busy_days, 'balance', coalesce(l.balance, 0), 'coveredBy', l.last_covered_by)
        order by m.joined_at), '[]'::jsonb)
      from members m left join effort_ledger l on l.household_id = m.household_id and l.user_id = m.user_id
      where m.household_id = p_household and m.left_at is null),
    'chores', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'effort', c.effort, 'cadence', c.cadence, 'createdWeek', c.created_week) order by c.created_at), '[]'::jsonb)
      from chores c where c.household_id = p_household and c.active),
    'history', (select coalesce(jsonb_agg(jsonb_build_object(
        'choreId', a.chore_id, 'userId', coalesce(a.claimed_by, a.user_id), 'weekStart', p.week_start)), '[]'::jsonb)
      from assignments a join plans p on p.id = a.plan_id
      where a.household_id = p_household and p.week_start between p_week - 28 and p_week - 7),
    'existingTotals', (select coalesce(jsonb_object_agg(t.user_id, t.pts), '{}'::jsonb) from (
        select a.user_id, sum(a.effort) as pts from assignments a join plans p on p.id = a.plan_id
        where p.household_id = p_household and p.week_start = p_week and a.status <> 'expired'
        group by a.user_id) t)
  )
$$;

create function srv_insert_plan(p_household uuid, p_week date, p_status plan_status, p_assignments jsonb,
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
  insert into assignments (plan_id, household_id, chore_id, user_id, day, effort, reason)
  select pid, p_household, (x->>'choreId')::uuid, (x->>'userId')::uuid, (x->>'day')::date, (x->>'effort')::smallint, x->'reason'
  from jsonb_array_elements(p_assignments) x;
  if p_consume then
    -- the debt clamp (+-3) lives here: only the clamped amount carried into the plan is consumed from the ledger
    update effort_ledger set balance = balance - greatest(-3, least(3, balance)), updated_at = now()
    where household_id = p_household;
  end if;
  if not existed and p_week > (now() at time zone zone)::date then
    perform private.notify_household(p_household, case when p_status = 'draft' then 'plan_ready' else 'plan_locked' end, '{}'::jsonb);
    perform private.log(p_household, case when p_status = 'draft' then 'plan_ready' else 'plan_locked' end, null);
  end if;
  return pid;
end $$;

create function srv_lock_plan(p_plan uuid) returns void
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare h uuid;
begin
  update plans set status = 'locked' where id = p_plan and status = 'draft' returning household_id into h;
  if h is not null then
    perform private.notify_household(h, 'plan_locked', '{}'::jsonb);
    perform private.log(h, 'plan_locked', null);
  end if;
end $$;

create function srv_sweep_day(p_household uuid, p_day date) returns void
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare r record;
begin
  for r in
    update assignments set status = 'missed'
    where household_id = p_household and day = p_day and status = 'todo'
    returning user_id, chore_id
  loop
    perform private.notify_household(p_household, 'pool',
      jsonb_build_object('chore', (select name from chores where id = r.chore_id)), r.user_id);
  end loop;
  if found then perform private.log(p_household, 'pool', null, jsonb_build_object('day', p_day)); end if;
end $$;

create function srv_expire_day(p_household uuid, p_day date) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  with gone as (
    update assignments set status = 'expired'
    where household_id = p_household and day = p_day and status in ('todo', 'missed', 'claimed')
    returning user_id, effort
  ), owed as (select user_id, sum(effort) as pts from gone group by user_id)
  update effort_ledger l set balance = l.balance + owed.pts, updated_at = now()
  from owed where l.household_id = p_household and l.user_id = owed.user_id;
end $$;

create function srv_set_streak(p_household uuid, p_current int, p_best int, p_day date, p_kept boolean) returns void
language plpgsql security definer set search_path = public, private, pg_temp as $$
begin
  update streaks set current = p_current, best = p_best, last_settled_day = p_day where household_id = p_household;
  if p_kept and p_current > 1 then
    perform private.notify_household(p_household, 'day_kept', jsonb_build_object('streak', p_current));
    perform private.log(p_household, 'day_kept', null, jsonb_build_object('streak', p_current));
  end if;
end $$;

-- Only members with at least one chore today get a digest (the group-by yields no row for the rest).
create function srv_queue_digest(p_household uuid, p_day date) returns void
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare r record;
begin
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
  update households set digest_sent_for = p_day where id = p_household;
end $$;

create function srv_pending_notifications() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id, 'userId', n.user_id, 'kind', n.kind, 'payload', n.payload, 'style', p.nudge_style,
    'tz', coalesce(h.tz, 'Asia/Kathmandu'),
    'sentToday', (select count(*) from notifications n2
                  where n2.user_id = n.user_id and not n2.skipped
                    and n2.sent_at >= (date_trunc('day', now() at time zone coalesce(h.tz, 'Asia/Kathmandu')) at time zone coalesce(h.tz, 'Asia/Kathmandu'))),
    'subscriptions', (select coalesce(jsonb_agg(jsonb_build_object(
        'endpoint', s.endpoint, 'keys', jsonb_build_object('p256dh', s.p256dh, 'auth', s.auth))), '[]'::jsonb)
      from push_subscriptions s where s.user_id = n.user_id)
  ) order by n.id), '[]'::jsonb)
  from notifications n
  join profiles p on p.id = n.user_id
  left join households h on h.id = n.household_id
  where n.sent_at is null and not n.skipped and n.created_at > now() - interval '2 days'
$$;

create function srv_mark_notification(p_id bigint, p_skipped boolean) returns void
language sql security definer set search_path = public, pg_temp as $$
  update notifications set sent_at = now(), skipped = p_skipped where id = p_id
$$;

create function srv_delete_subscription(p_endpoint text) returns void
language sql security definer set search_path = public, pg_temp as $$
  delete from push_subscriptions where endpoint = p_endpoint
$$;

-- Supabase default privileges grant execute on new public functions to anon/authenticated; lock every srv_* down.
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
