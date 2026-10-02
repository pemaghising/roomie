-- Final-review fixes (I4, I5, M4). Never edit earlier migrations; replace functions here.

-- I5: debt/credit reasons come from a member's private balance. Only the member themselves sees them.
create or replace function get_state() returns jsonb
language plpgsql stable security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := auth.uid();
  h uuid;
  today date;
begin
  if me is null then raise exception 'not_authenticated'; end if;
  select household_id into h from members where user_id = me and left_at is null;
  if h is null then
    return jsonb_build_object('profile', (select to_jsonb(p) from profiles p where p.id = me), 'household', null);
  end if;
  select (now() at time zone x.tz)::date into today from households x where x.id = h;
  return jsonb_build_object(
    'profile', (select to_jsonb(p) from profiles p where p.id = me),
    'household', (select to_jsonb(x) from households x where x.id = h),
    'members', (select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', m.user_id, 'name', p.name, 'color', p.color, 'role', m.role, 'busy_days', m.busy_days)
        order by m.joined_at), '[]'::jsonb)
      from members m join profiles p on p.id = m.user_id where m.household_id = h and m.left_at is null),
    'chores', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]'::jsonb)
      from chores c where c.household_id = h and c.active),
    'plans', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', pl.id, 'week_start', pl.week_start, 'status', pl.status, 'lock_at', pl.lock_at,
        'approved_by', (select coalesce(jsonb_agg(a.user_id), '[]'::jsonb) from plan_approvals a where a.plan_id = pl.id))
        order by pl.week_start), '[]'::jsonb)
      from plans pl where pl.household_id = h and pl.week_start >= today - 13),
    'assignments', (select coalesce(jsonb_agg(
        case when a.user_id <> me and a.reason->>'code' in ('debt', 'credit')
             then to_jsonb(a) || jsonb_build_object('reason', null)
             else to_jsonb(a) end
        order by a.day), '[]'::jsonb)
      from assignments a where a.household_id = h and a.day between today - 7 and today + 13),
    'swaps', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
      from swap_requests s where s.household_id = h and s.status = 'pending'),
    'streak', (select to_jsonb(s) from streaks s where s.household_id = h),
    'balance', coalesce((select l.balance from effort_ledger l where l.household_id = h and l.user_id = me), 0),
    'activity', (select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
      from (select * from activity where household_id = h order by created_at desc limit 50) x),
    'today', today
  );
end $$;
revoke execute on function get_state() from public, anon;
grant execute on function get_state() to authenticated;

-- I5: the same reasons must not be readable straight from the table either. The app reads assignments only
-- through get_state; realtime is used only as a "something changed" signal.
revoke select on assignments from anon, authenticated;
grant select (id, plan_id, household_id, chore_id, user_id, day, effort, status, prev_status, claimed_by, done_at)
  on assignments to authenticated;

-- I4: one "up for grabs" notification per member per sweep, listing every chore that went to the pool.
create or replace function srv_sweep_day(p_household uuid, p_day date) returns void
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare n int;
begin
  with swept as (
    update assignments set status = 'missed'
    where household_id = p_household and day = p_day and status = 'todo'
    returning user_id, chore_id
  ), per_member as (
    select m.user_id, jsonb_agg(distinct c.name) as chores
    from members m
    join swept s on s.user_id <> m.user_id
    join chores c on c.id = s.chore_id
    where m.household_id = p_household and m.left_at is null
    group by m.user_id
  ), queued as (
    insert into notifications (user_id, household_id, kind, payload)
    select user_id, p_household, 'pool', jsonb_build_object('chores', chores) from per_member
  )
  select count(*) into n from swept;
  if n > 0 then perform private.log(p_household, 'pool', null, jsonb_build_object('day', p_day)); end if;
end $$;

-- I4: pool pushes don't count toward the 3-a-day cap (tick/push.ts exempts them on the way out too).
create or replace function srv_pending_notifications() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id, 'userId', n.user_id, 'kind', n.kind, 'payload', n.payload, 'style', p.nudge_style,
    'tz', coalesce(h.tz, 'Asia/Kathmandu'),
    'sentToday', (select count(*) from notifications n2
                  where n2.user_id = n.user_id and not n2.skipped and n2.kind <> 'pool'
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

-- M4: a day must end in the evening, otherwise the whole day is swept in the early morning.
alter table households add constraint households_day_ends_at_evening
  check (day_ends_at between '18:00' and '23:59:59');

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
