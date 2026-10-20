-- Tick for the pantry: stale restock requests in the morning digest; restock pushes are exempt from the daily cap.

create or replace function srv_queue_digest(p_household uuid, p_day date) returns void
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare r record; stale jsonb;
begin
  -- claim the day first; a concurrent run that lost the race queues nothing
  update households set digest_sent_for = p_day where id = p_household and digest_sent_for is distinct from p_day;
  if not found then return; end if;
  -- restock requests open for more than 48 h are mentioned in one morning digest, then never again
  with noted as (
    update restock_requests set stale_noted_at = now()
    where household_id = p_household and status = 'open' and stale_noted_at is null and created_at < now() - interval '48 hours'
    returning name
  )
  select coalesce(jsonb_agg(name order by name), '[]'::jsonb) into stale from noted;
  for r in
    select m.user_id, coalesce((
      select jsonb_agg(c.name order by a.effort desc)
      from assignments a join chores c on c.id = a.chore_id
      where a.household_id = p_household and a.user_id = m.user_id and a.day = p_day and a.status = 'todo'), '[]'::jsonb) as chores
    from members m where m.household_id = p_household and m.left_at is null
  loop
    continue when jsonb_array_length(r.chores) = 0 and jsonb_array_length(stale) = 0;
    perform private.notify(r.user_id, p_household, 'digest', jsonb_build_object('chores', r.chores)
      || case when jsonb_array_length(stale) > 0 then jsonb_build_object('stale', stale) else '{}'::jsonb end);
  end loop;
end $$;

-- pool and restock pushes don't count toward the 3-a-day cap (tick/push.ts exempts them on the way out too).
create or replace function srv_pending_notifications() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id, 'userId', n.user_id, 'kind', n.kind, 'payload', n.payload, 'style', p.nudge_style,
    'tz', coalesce(h.tz, 'Asia/Kathmandu'),
    'sentToday', (select count(*) from notifications n2
                  where n2.user_id = n.user_id and not n2.skipped and n2.kind not in ('pool', 'restock')
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
