-- Kudos: a roommate sends another a small cheer (an emoji from a short fixed list).
--
-- NOT YET APPLIED OR TESTED. Try it on a staging project or a Supabase branch before `db push`.
--
-- No new table: a cheer is an activity row (kind 'kudos', so the whole house sees it in the feed) plus one push to the recipient.
-- One cheer per sender and recipient every 10 minutes keeps it warm instead of a stream of pings.
create function send_kudos(p_to uuid, p_emoji text)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
begin
  if p_to = me or p_emoji not in ('🙌', '👏', '🔥', '💪', '❤️', '🎉') then raise exception 'invalid_input'; end if;
  if not exists (select 1 from members where household_id = h and user_id = p_to and left_at is null) then raise exception 'not_allowed'; end if;
  if exists (
    select 1 from activity
    where household_id = h and kind = 'kudos' and actor = me and payload ->> 'to' = p_to::text and created_at > now() - interval '10 minutes'
  ) then raise exception 'rate_limited'; end if;

  perform private.log(h, 'kudos', me, jsonb_build_object('actor', private.name(me), 'to', p_to, 'emoji', p_emoji));
  perform private.notify(p_to, h, 'kudos', jsonb_build_object('actor', private.name(me), 'emoji', p_emoji));
end $$;

revoke all on function public.send_kudos(uuid, text) from public, anon;
grant execute on function public.send_kudos(uuid, text) to authenticated;
