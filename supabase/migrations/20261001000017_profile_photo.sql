-- Profile photos. A public 'avatars' bucket where each person can only write inside their own folder (<user id>/...),
-- one RPC that records the file path on the profile, and get_state returning each roommate's photo path.
alter table profiles add column avatar_path text
  check (avatar_path is null or (char_length(avatar_path) <= 120 and avatar_path !~ '\.\.'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy avatars_select_own on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create function set_avatar(p_path text default null)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
begin
  if p_path is not null and (p_path !~ ('^' || me::text || '/[A-Za-z0-9._-]{1,80}$') or p_path ~ '\.\.') then
    raise exception 'invalid_input';
  end if;
  update profiles set avatar_path = p_path where id = me;
end $$;
revoke all on function public.set_avatar(text) from public, anon;
grant execute on function public.set_avatar(text) to authenticated;

-- get_state: identical to 20261001000013 except members now carry avatar_path (the profile already does, via to_jsonb).
create or replace function get_state() returns jsonb
language plpgsql stable security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := auth.uid();
  h uuid;
  today date;
  zone text;
begin
  if me is null then raise exception 'not_authenticated'; end if;
  select household_id into h from members where user_id = me and left_at is null;
  if h is null then
    return jsonb_build_object('profile', (select to_jsonb(p) from profiles p where p.id = me), 'household', null);
  end if;
  select (now() at time zone x.tz)::date, x.tz into today, zone from households x where x.id = h;
  return jsonb_build_object(
    'profile', (select to_jsonb(p) from profiles p where p.id = me),
    'household', (select to_jsonb(x) from households x where x.id = h),
    'members', (select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', m.user_id, 'name', p.name, 'color', p.color, 'role', m.role, 'busy_days', m.busy_days, 'avatar_path', p.avatar_path)
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
    'pantry', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id, 'owner_id', i.owner_id, 'name', i.name, 'rule', i.rule, 'stock', i.stock, 'created_at', i.created_at)
        order by lower(i.name)), '[]'::jsonb)
      from pantry_items i where i.household_id = h and i.archived_at is null),
    -- open requests, plus this week's completed ones (their effort counts toward the completer's fair share)
    'restocks', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id, 'item_id', r.item_id, 'name', r.name, 'effort', r.effort, 'requested_by', r.requested_by,
        'claimed_by', r.claimed_by, 'status', r.status, 'done_by', r.done_by,
        'done_day', (r.done_at at time zone zone)::date, 'created_at', r.created_at)
        order by r.created_at), '[]'::jsonb)
      from restock_requests r
      where r.household_id = h and (r.status = 'open'
        or (r.status = 'done' and (r.done_at at time zone zone)::date >= today - extract(dow from today)::int))),
    -- private to the two people: my live asks either way, and my own asks answered in the last day.
    -- A pending ask is live only while it can still be answered meaningfully: under 24 h old, the item still
    -- active, still ask-first and still the addressee's, and both people still in the household.
    'asks', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', k.id, 'item_id', k.item_id, 'from_user', k.from_user, 'to_user', k.to_user, 'status', k.status, 'created_at', k.created_at)
        order by k.created_at), '[]'::jsonb)
      from pantry_asks k join pantry_items i on i.id = k.item_id and i.archived_at is null
      where k.household_id = h and (
        (k.status = 'pending' and k.created_at > now() - interval '24 hours' and me in (k.from_user, k.to_user)
          and i.owner_id = k.to_user and i.rule = 'ask_first'
          and exists (select 1 from members m where m.household_id = h and m.user_id = k.from_user and m.left_at is null)
          and exists (select 1 from members m where m.household_id = h and m.user_id = k.to_user and m.left_at is null))
        or (k.status <> 'pending' and k.from_user = me and k.answered_at > now() - interval '24 hours'))),
    'today', today
  );
end $$;
revoke execute on function get_state() from public, anon;
grant execute on function get_state() to authenticated;

