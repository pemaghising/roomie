-- R5c Edit chore, and R9 Notifications: what each person wants to hear about.

create or replace function update_chore(p_id uuid, p_name text, p_icon text, p_effort smallint, p_cadence cadence)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  h uuid := private.my_household();
begin
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 40
     or p_effort is null or p_effort not between 1 and 3
     or p_cadence is null
     or char_length(coalesce(p_icon, '')) > 16 then
    raise exception 'invalid_input';
  end if;
  -- the new effort and cadence shape next week's plan; this week's assignments keep theirs
  update chores set name = trim(p_name), icon = coalesce(p_icon, icon), effort = p_effort, cadence = p_cadence
  where id = p_id and household_id = h and active;
  if not found then raise exception 'not_allowed'; end if;
exception when unique_violation then
  raise exception 'duplicate_item';
end $$;

revoke all on function public.update_chore(uuid, text, text, smallint, cadence) from public, anon;
grant execute on function public.update_chore(uuid, text, text, smallint, cadence) to authenticated;

-- chores: reminders and the morning digest · pool: a chore up for grabs · pantry: restocks · recap: Sunday summary (on the phone)
alter table profiles add column notify jsonb not null default '{"chores": true, "pool": true, "pantry": true, "recap": false}'::jsonb
  check (jsonb_typeof(notify) = 'object');

create or replace function set_notify(p_notify jsonb)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare k text;
begin
  if p_notify is null or jsonb_typeof(p_notify) <> 'object' then raise exception 'invalid_input'; end if;
  for k in select jsonb_object_keys(p_notify) loop
    if k not in ('chores', 'pool', 'pantry', 'recap') or jsonb_typeof(p_notify -> k) <> 'boolean' then raise exception 'invalid_input'; end if;
  end loop;
  update profiles set notify = notify || p_notify where id = private.me();
end $$;

revoke all on function public.set_notify(jsonb) from public, anon;
grant execute on function public.set_notify(jsonb) to authenticated;

-- notifications someone switched off are never handed to the sender
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
    and coalesce((p.notify ->> case n.kind when 'pool' then 'pool' when 'restock' then 'pantry' else 'chores' end)::boolean, true)
$$;

revoke all on function public.srv_pending_notifications() from public, anon, authenticated;
grant execute on function public.srv_pending_notifications() to service_role;
