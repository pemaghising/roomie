-- Fix round 1: rate-limit race, push validation/takeover, orphaned households, pool close, input validation, lock order, code entropy.

create or replace function private.valid_days(d smallint[]) returns smallint[] language plpgsql immutable as $$
begin
  if d is null then return '{}'; end if;
  if array_position(d, null) is not null then raise exception 'invalid_input'; end if;
  if exists (select 1 from unnest(d) x where x < 0 or x > 6) then raise exception 'invalid_input'; end if;
  return (select coalesce(array_agg(distinct x order by x), '{}') from unnest(d) x);
end $$;

-- pgcrypto may live in public or extensions depending on how it was installed; both are on the path.
create or replace function private.gen_code() returns text language sql volatile
set search_path = public, extensions, pg_temp as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + (get_byte(gen_random_bytes(1), 0) % 32), 1), '')
  from generate_series(1, 6)
$$;

create or replace function private.depart(h uuid, u uuid) returns void
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare was_owner boolean; code text;
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
  if not exists (select 1 from members where household_id = h and left_at is null) then
    -- empty household: the old invite code must stop working
    loop
      code := private.gen_code();
      exit when not exists (select 1 from households where invite_code = code);
    end loop;
    update households set invite_code = code where id = h;
  end if;
  perform private.log(h, 'left', u, jsonb_build_object('actor', private.name(u)));
end $$;

create or replace function create_household(p_name text, p_busy smallint[], p_chores jsonb)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid;
  code text;
  wk date := ((now() at time zone 'Asia/Kathmandu')::date - extract(dow from now() at time zone 'Asia/Kathmandu')::int);
  c jsonb;
  chores_in jsonb := coalesce(p_chores, '[]'::jsonb);
begin
  if exists (select 1 from members where user_id = me and left_at is null) then raise exception 'already_member'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 40 then raise exception 'invalid_input'; end if;
  if jsonb_typeof(chores_in) <> 'array' or jsonb_array_length(chores_in) > 30 then raise exception 'invalid_input'; end if;
  for c in select * from jsonb_array_elements(chores_in) loop
    if jsonb_typeof(c) <> 'object'
       or char_length(trim(coalesce(c->>'name', ''))) not between 1 and 40
       or not coalesce(c->>'effort' ~ '^[1-3]$', false)
       or (c->>'cadence' is not null and c->>'cadence' <> all (enum_range(null::cadence)::text[]))
       or char_length(coalesce(c->>'icon', '')) > 16 then
      raise exception 'invalid_input';
    end if;
  end loop;
  loop
    code := private.gen_code();
    exit when not exists (select 1 from households where invite_code = code);
  end loop;
  insert into households (name, invite_code) values (trim(p_name), code) returning id into h;
  insert into members (household_id, user_id, role, busy_days) values (h, me, 'owner', private.valid_days(p_busy));
  for c in select * from jsonb_array_elements(chores_in) loop
    insert into chores (household_id, name, icon, effort, cadence, created_week)
    values (h, trim(c->>'name'), coalesce(c->>'icon', '🧹'), (c->>'effort')::smallint,
            coalesce((c->>'cadence')::cadence, 'weekly'), wk);
  end loop;
  insert into effort_ledger (household_id, user_id) values (h, me);
  insert into streaks (household_id) values (h);
  perform private.log(h, 'created', me, jsonb_build_object('actor', private.name(me)));
  return h;
end $$;

create or replace function join_household(p_code text, p_busy smallint[])
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid;
begin
  perform pg_advisory_xact_lock(hashtext('join:' || me::text)); -- serialise per user so the rate limit can't be raced
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
  update members set role = 'owner'
    where household_id = h and user_id = me
      and not exists (select 1 from members where household_id = h and role = 'owner' and left_at is null);
  insert into effort_ledger (household_id, user_id) values (h, me) on conflict do nothing;
  perform private.log(h, 'joined', me, jsonb_build_object('actor', private.name(me)));
  perform private.notify_household(h, 'joined', jsonb_build_object('actor', private.name(me)), me);
  return h;
end $$;

create or replace function claim_assignment(p_id uuid)
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
  -- the claim pool closes at day_ends_at on the following day (tick.ts poolClosed)
  if private.day_ended(h, a.day + 1) then raise exception 'not_allowed'; end if;
  update assignments set status = 'claimed', claimed_by = me where id = a.id;
  perform private.log(h, 'claimed', me, jsonb_build_object(
    'actor', private.name(me), 'chore', (select name from chores where id = a.chore_id)));
end $$;

create or replace function request_swap(p_from uuid, p_to uuid)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  a1 assignments;
  a2 assignments;
  sid uuid;
begin
  -- lock in id order so two opposite swaps can't deadlock
  perform 1 from assignments where id in (p_from, p_to) and household_id = h order by id for update;
  select * into a1 from assignments where id = p_from and household_id = h;
  select * into a2 from assignments where id = p_to and household_id = h;
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

create or replace function respond_swap(p_swap uuid, p_accept boolean)
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
  perform 1 from assignments where id in (s.from_assignment, s.to_assignment) order by id for update;
  select * into a1 from assignments where id = s.from_assignment;
  select * into a2 from assignments where id = s.to_assignment;
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

create or replace function add_chore(p_name text, p_icon text, p_effort smallint, p_cadence cadence)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  cid uuid;
begin
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 40
     or p_effort is null or p_effort not between 1 and 3
     or p_cadence is null
     or char_length(coalesce(p_icon, '')) > 16 then
    raise exception 'invalid_input';
  end if;
  insert into chores (household_id, name, icon, effort, cadence, created_week)
  values (h, trim(p_name), coalesce(p_icon, '🧹'), p_effort, p_cadence, ((private.today(h))::date - extract(dow from private.today(h))::int))
  returning id into cid;
  perform private.log(h, 'chore_added', me, jsonb_build_object('actor', private.name(me), 'chore', trim(p_name)));
  return cid;
end $$;

create or replace function save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
begin
  if p_endpoint is null or p_endpoint !~ '^https://' or char_length(p_endpoint) > 1024
     or p_p256dh is null or p_p256dh !~ '^[A-Za-z0-9_-]{80,100}={0,2}$'
     or p_auth is null or p_auth !~ '^[A-Za-z0-9_-]{16,32}={0,2}$' then
    raise exception 'invalid_input';
  end if;
  -- an endpoint owned by someone else is left alone (silently), never moved
  insert into push_subscriptions (endpoint, user_id, p256dh, auth) values (p_endpoint, private.me(), p_p256dh, p_auth)
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth
    where push_subscriptions.user_id = excluded.user_id;
end $$;
