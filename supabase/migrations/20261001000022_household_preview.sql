-- Look up a home by invite code before joining (frames J1 → J3 "No home with that code" / J4 "Aman and Priya are here").
-- Shares join_household's attempt budget, so it can't be used to guess codes faster.
create function household_preview(p_code text)
returns jsonb language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h households;
begin
  perform pg_advisory_xact_lock(hashtext('join:' || me::text));
  if (select count(*) from join_attempts where user_id = me and at > now() - interval '10 minutes') >= 10 then
    raise exception 'rate_limited';
  end if;
  insert into join_attempts (user_id) values (me);
  select * into h from households where invite_code = normalize_code(p_code);
  if h.id is null then return null; end if;
  return jsonb_build_object(
    'name', h.name,
    'members', (select coalesce(jsonb_agg(p.name order by m.joined_at), '[]'::jsonb)
                from members m join profiles p on p.id = m.user_id
                where m.household_id = h.id and m.left_at is null),
    'full', (select count(*) >= 8 from members m where m.household_id = h.id and m.left_at is null));
end $$;

revoke all on function public.household_preview(text) from public, anon;
grant execute on function public.household_preview(text) to authenticated;
