-- ───────── private helpers (not callable through the API) ─────────
create function private.me() returns uuid language plpgsql stable as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  return auth.uid();
end $$;

create function private.my_household() returns uuid
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare h uuid;
begin
  select household_id into h from members where user_id = private.me() and left_at is null;
  if h is null then raise exception 'not_member'; end if;
  return h;
end $$;

create function private.today(h uuid) returns date
language sql stable security definer set search_path = public, pg_temp as $$
  select (now() at time zone tz)::date from households where id = h
$$;

create function private.day_ended(h uuid, d date) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select d < (now() at time zone tz)::date
      or (d = (now() at time zone tz)::date and (now() at time zone tz)::time >= day_ends_at)
  from households where id = h
$$;

create function private.name(u uuid) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(nullif(name, ''), 'A roommate') from profiles where id = u
$$;

create function private.log(h uuid, k text, actor uuid, p jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = public, pg_temp as $$
  insert into activity (household_id, kind, actor, payload) values (h, k, actor, p)
$$;

create function private.notify(u uuid, h uuid, k text, p jsonb) returns void
language sql security definer set search_path = public, pg_temp as $$
  insert into notifications (user_id, household_id, kind, payload) values (u, h, k, p)
$$;

create function private.notify_household(h uuid, k text, p jsonb, except_user uuid default null) returns void
language sql security definer set search_path = public, pg_temp as $$
  insert into notifications (user_id, household_id, kind, payload)
  select user_id, h, k, p from members
  where household_id = h and left_at is null and user_id is distinct from except_user
$$;

create function private.valid_days(d smallint[]) returns smallint[] language plpgsql immutable as $$
begin
  if d is null then return '{}'; end if;
  if exists (select 1 from unnest(d) x where x < 0 or x > 6) then raise exception 'invalid_input'; end if;
  return (select coalesce(array_agg(distinct x order by x), '{}') from unnest(d) x);
end $$;

create function private.gen_code() returns text language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, 6)
$$;

-- Leaving (or being removed): future chores go to the claim pool, pending swaps are cancelled.
create function private.depart(h uuid, u uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare was_owner boolean;
begin
  select role = 'owner' into was_owner from members where household_id = h and user_id = u and left_at is null;
  update members set left_at = now(), role = 'member' where household_id = h and user_id = u and left_at is null;
  update assignments set status = 'missed'
    where household_id = h and user_id = u and status = 'todo' and day >= private.today(h);
  update swap_requests set status = 'declined'
    where household_id = h and status = 'pending' and (from_user = u or to_user = u);
  if was_owner then
    update members set role = 'owner'
    where household_id = h and user_id = (
      select user_id from members where household_id = h and left_at is null order by joined_at limit 1);
  end if;
  perform private.log(h, 'left', u, jsonb_build_object('actor', private.name(u)));
end $$;

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_member(uuid) to authenticated;

-- ───────── client RPCs ─────────
create function normalize_code(c text) returns text language sql immutable as $$
  select upper(right(regexp_replace(coalesce(c, ''), '[^A-Za-z0-9]', '', 'g'), 6))
$$;

create function update_profile(p_name text default null, p_color text default null, p_nudge nudge_style default null)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
begin
  if p_name is not null and char_length(trim(p_name)) not between 1 and 30 then raise exception 'invalid_input'; end if;
  if p_color is not null and p_color !~ '^#[0-9a-fA-F]{6}$' then raise exception 'invalid_input'; end if;
  update profiles set
    name = coalesce(trim(p_name), name),
    color = coalesce(p_color, color),
    nudge_style = coalesce(p_nudge, nudge_style)
  where id = private.me();
end $$;

create function create_household(p_name text, p_busy smallint[], p_chores jsonb)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid;
  code text;
  wk date := ((now() at time zone 'Asia/Kathmandu')::date - extract(dow from now() at time zone 'Asia/Kathmandu')::int);
  c jsonb;
begin
  if exists (select 1 from members where user_id = me and left_at is null) then raise exception 'already_member'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 40 then raise exception 'invalid_input'; end if;
  loop
    code := private.gen_code();
    exit when not exists (select 1 from households where invite_code = code);
  end loop;
  insert into households (name, invite_code) values (trim(p_name), code) returning id into h;
  insert into members (household_id, user_id, role, busy_days) values (h, me, 'owner', private.valid_days(p_busy));
  for c in select * from jsonb_array_elements(coalesce(p_chores, '[]'::jsonb)) loop
    if char_length(trim(coalesce(c->>'name', ''))) not between 1 and 40 or (c->>'effort')::int not between 1 and 3 then
      raise exception 'invalid_input';
    end if;
    insert into chores (household_id, name, icon, effort, cadence, created_week)
    values (h, trim(c->>'name'), coalesce(c->>'icon', '🧹'), (c->>'effort')::smallint,
            coalesce((c->>'cadence')::cadence, 'weekly'), wk);
  end loop;
  insert into effort_ledger (household_id, user_id) values (h, me);
  insert into streaks (household_id) values (h);
  perform private.log(h, 'created', me, jsonb_build_object('actor', private.name(me)));
  return h;
end $$;

create function join_household(p_code text, p_busy smallint[])
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid;
begin
  if (select count(*) from join_attempts where user_id = me and at > now() - interval '10 minutes') >= 10 then
    raise exception 'rate_limited';
  end if;
  insert into join_attempts (user_id) values (me);
  if exists (select 1 from members where user_id = me and left_at is null) then raise exception 'already_member'; end if;
  select id into h from households where invite_code = normalize_code(p_code);
  perform 1 from households where id = h for update; -- serialise concurrent joins (no-op when h is null)
  if h is null then return null; end if; -- no exception, so the attempt above is kept for rate limiting
  if (select count(*) from members where household_id = h and left_at is null) >= 8 then raise exception 'household_full'; end if;
  insert into members (household_id, user_id, busy_days) values (h, me, private.valid_days(p_busy))
  on conflict (household_id, user_id) do update
    set left_at = null, busy_days = excluded.busy_days, joined_at = now(), role = 'member';
  insert into effort_ledger (household_id, user_id) values (h, me) on conflict do nothing;
  perform private.log(h, 'joined', me, jsonb_build_object('actor', private.name(me)));
  perform private.notify_household(h, 'joined', jsonb_build_object('actor', private.name(me)), me);
  return h;
end $$;

create function complete_assignment(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  a assignments;
  chore_name text;
begin
  select * into a from assignments where id = p_id and household_id = h for update;
  if not found then raise exception 'not_allowed'; end if;
  select name into chore_name from chores where id = a.chore_id;
  -- idempotent: repeating a completion you already made is a no-op
  if a.status = 'done' and (a.claimed_by = me or (a.claimed_by is null and a.user_id = me)) then return; end if;

  if a.status in ('todo', 'missed') and a.user_id = me then
    update assignments set status = 'done', prev_status = a.status, done_at = now() where id = a.id;
    perform private.log(h, 'completed', me, jsonb_build_object('actor', private.name(me), 'chore', chore_name));
  elsif a.status = 'claimed' and a.claimed_by = me then
    update assignments set status = 'done', prev_status = 'claimed', done_at = now() where id = a.id;
    update effort_ledger set balance = balance + a.effort, last_covered_by = me, updated_at = now()
      where household_id = h and user_id = a.user_id;
    update effort_ledger set balance = balance - a.effort, updated_at = now()
      where household_id = h and user_id = me;
    perform private.log(h, 'covered', me, jsonb_build_object('actor', private.name(me), 'chore', chore_name));
    perform private.notify(a.user_id, h, 'covered',
      jsonb_build_object('actor', private.name(me), 'chore', chore_name, 'effort', a.effort));
  else
    raise exception 'not_allowed';
  end if;
end $$;

create function undo_complete(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  a assignments;
  back assignment_status;
begin
  select * into a from assignments where id = p_id and household_id = h for update;
  if not found or a.status <> 'done' or not (a.claimed_by = me or (a.claimed_by is null and a.user_id = me)) then
    raise exception 'not_allowed';
  end if;
  if a.done_at < now() - interval '10 minutes' then raise exception 'undo_expired'; end if;
  if a.prev_status = 'claimed' then
    back := 'claimed';
    update effort_ledger set balance = balance - a.effort, updated_at = now() where household_id = h and user_id = a.user_id;
    update effort_ledger set balance = balance + a.effort, updated_at = now() where household_id = h and user_id = me;
  elsif a.prev_status = 'missed' or private.day_ended(h, a.day) then
    back := 'missed';
  else
    back := 'todo';
  end if;
  update assignments set status = back, prev_status = null, done_at = null where id = a.id;
end $$;

create function claim_assignment(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  a assignments;
begin
  select * into a from assignments where id = p_id and household_id = h for update;
  if not found then raise exception 'not_allowed'; end if;
  if a.status = 'claimed' or (a.status = 'done' and a.claimed_by is not null) then raise exception 'already_claimed'; end if;
  if a.status <> 'missed' or a.user_id = me then raise exception 'not_allowed'; end if;
  update assignments set status = 'claimed', claimed_by = me where id = a.id;
  perform private.log(h, 'claimed', me, jsonb_build_object(
    'actor', private.name(me), 'chore', (select name from chores where id = a.chore_id)));
end $$;

create function approve_plan(p_plan uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  st plan_status;
begin
  select status into st from plans where id = p_plan and household_id = h;
  if not found then raise exception 'not_allowed'; end if;
  if st <> 'draft' then raise exception 'plan_locked'; end if;
  insert into plan_approvals (plan_id, user_id) values (p_plan, me) on conflict do nothing;
end $$;

create function request_swap(p_from uuid, p_to uuid)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  a1 assignments;
  a2 assignments;
  sid uuid;
begin
  select * into a1 from assignments where id = p_from and household_id = h for update;
  select * into a2 from assignments where id = p_to and household_id = h for update;
  if a1.id is null or a2.id is null or a1.user_id <> me or a2.user_id = me
     or a1.status <> 'todo' or a2.status <> 'todo'
     or a1.day < private.today(h) or a2.day < private.today(h)
     or exists (select 1 from swap_requests where from_assignment = a1.id and status = 'pending') then
    raise exception 'swap_unavailable';
  end if;
  insert into swap_requests (household_id, from_assignment, to_assignment, from_user, to_user)
  values (h, a1.id, a2.id, me, a2.user_id) returning id into sid;
  perform private.notify(a2.user_id, h, 'swap_request', jsonb_build_object(
    'actor', private.name(me),
    'chore', (select name from chores where id = a2.chore_id),
    'offered', (select name from chores where id = a1.chore_id)));
  return sid;
end $$;

create function respond_swap(p_swap uuid, p_accept boolean)
returns boolean language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  s swap_requests;
  a1 assignments;
  a2 assignments;
  delta int;
begin
  select * into s from swap_requests where id = p_swap and household_id = h and to_user = me and status = 'pending' for update;
  if not found then raise exception 'swap_unavailable'; end if;
  select * into a1 from assignments where id = s.from_assignment for update;
  select * into a2 from assignments where id = s.to_assignment for update;
  if not p_accept or a1.status <> 'todo' or a2.status <> 'todo' or a1.user_id <> s.from_user or a2.user_id <> s.to_user then
    update swap_requests set status = 'declined' where id = s.id;
    perform private.notify(s.from_user, h, 'swap_answer', jsonb_build_object('actor', private.name(me), 'accepted', false));
    return false;
  end if;
  update assignments set user_id = s.to_user, reason = jsonb_build_object('code', 'swap', 'withUserId', s.from_user) where id = a1.id;
  update assignments set user_id = s.from_user, reason = jsonb_build_object('code', 'swap', 'withUserId', s.to_user) where id = a2.id;
  delta := a2.effort - a1.effort; -- what the requester takes on
  update effort_ledger set balance = balance - delta, updated_at = now() where household_id = h and user_id = s.from_user;
  update effort_ledger set balance = balance + delta, updated_at = now() where household_id = h and user_id = s.to_user;
  update swap_requests set status = 'accepted' where id = s.id;
  update swap_requests set status = 'declined'
    where status = 'pending' and id <> s.id
      and (from_assignment in (a1.id, a2.id) or to_assignment in (a1.id, a2.id));
  perform private.notify(s.from_user, h, 'swap_answer', jsonb_build_object('actor', private.name(me), 'accepted', true));
  perform private.log(h, 'swapped', me, jsonb_build_object('actor', private.name(me), 'with', private.name(s.from_user)));
  return true;
end $$;

create function add_chore(p_name text, p_icon text, p_effort smallint, p_cadence cadence)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  cid uuid;
begin
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 40 or p_effort not between 1 and 3 then
    raise exception 'invalid_input';
  end if;
  insert into chores (household_id, name, icon, effort, cadence, created_week)
  values (h, trim(p_name), coalesce(p_icon, '🧹'), p_effort, p_cadence, ((private.today(h))::date - extract(dow from private.today(h))::int))
  returning id into cid;
  perform private.log(h, 'chore_added', me, jsonb_build_object('actor', private.name(me), 'chore', trim(p_name)));
  return cid;
end $$;

create function archive_chore(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare h uuid := private.my_household();
begin
  update chores set active = false where id = p_id and household_id = h;
  if not found then raise exception 'not_allowed'; end if;
  delete from assignments where chore_id = p_id and status = 'todo' and day > private.today(h);
end $$;

create function update_busy_days(p_days smallint[])
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
begin
  update members set busy_days = private.valid_days(p_days)
  where household_id = private.my_household() and user_id = private.me();
end $$;

create function update_household(p_name text default null, p_plan_mode plan_mode default null, p_day_ends_at time default null)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
begin
  if p_name is not null and char_length(trim(p_name)) not between 1 and 40 then raise exception 'invalid_input'; end if;
  update households set
    name = coalesce(trim(p_name), name),
    plan_mode = coalesce(p_plan_mode, plan_mode),
    day_ends_at = coalesce(p_day_ends_at, day_ends_at)
  where id = private.my_household();
end $$;

create function rotate_invite_code()
returns text language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  h uuid := private.my_household();
  code text;
begin
  if not exists (select 1 from members where household_id = h and user_id = private.me() and role = 'owner' and left_at is null) then
    raise exception 'not_allowed';
  end if;
  loop
    code := private.gen_code();
    exit when not exists (select 1 from households where invite_code = code);
  end loop;
  update households set invite_code = code where id = h;
  return code;
end $$;

create function remove_member(p_user uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
begin
  if p_user = me or not exists (select 1 from members where household_id = h and user_id = me and role = 'owner' and left_at is null)
     or not exists (select 1 from members where household_id = h and user_id = p_user and left_at is null) then
    raise exception 'not_allowed';
  end if;
  perform private.depart(h, p_user);
end $$;

create function leave_household()
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
begin
  perform private.depart(private.my_household(), private.me());
end $$;

create function save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
begin
  insert into push_subscriptions (endpoint, user_id, p256dh, auth) values (p_endpoint, private.me(), p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;
end $$;

create function delete_push_subscription(p_endpoint text)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
begin
  delete from push_subscriptions where endpoint = p_endpoint and user_id = private.me();
end $$;

create function mark_activity_seen()
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
begin
  update profiles set activity_seen_at = now() where id = private.me();
end $$;

-- Client RPCs are for signed-in users only (functions default to PUBLIC execute).
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
