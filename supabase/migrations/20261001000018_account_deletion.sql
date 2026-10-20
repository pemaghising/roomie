-- Account deletion (App Store guideline 5.1.1(v): an app that creates accounts must let people delete them).
--
-- NOT YET APPLIED OR TESTED. Try it on a staging project or a Supabase branch before `db push`.
--
-- Several tables reference profiles without a cascade (assignments, swaps, pantry, activity, ledger), so this person's rows are
-- detached or removed first; then the auth user is deleted, which cascades the profile, membership, plan approvals, effort ledger,
-- push subscriptions, notifications and join attempts. Roommates keep the household's shared history and shared pantry items.
-- Not handled here: the person's avatar files in storage (the app removes them first, through the storage API, before calling this).
create function delete_account()
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid;
begin
  if me is null then raise exception 'not_authenticated'; end if;

  -- leave the household the normal way: chores go to the claim pool, ownership passes on, an empty home's invite code is retired
  select household_id into h from members where user_id = me and left_at is null;
  if h is not null then perform private.depart(h, me); end if;

  -- chores and swaps
  delete from swap_requests where from_user = me or to_user = me;
  update assignments set claimed_by = null where claimed_by = me;
  delete from assignments where user_id = me;
  update effort_ledger set last_covered_by = null where last_covered_by = me;
  update activity set actor = null where actor = me;

  -- pantry: personal items and requests go; shared items they added stay, handed to a remaining roommate
  delete from pantry_asks where from_user = me or to_user = me;
  delete from pantry_items where owner_id = me;
  update restock_requests set claimed_by = null where claimed_by = me;
  update restock_requests set done_by = null where done_by = me;
  delete from restock_requests where requested_by = me;
  update pantry_items p
     set created_by = (select m.user_id from members m
                        where m.household_id = p.household_id and m.left_at is null and m.user_id <> me
                        order by m.joined_at limit 1)
   where p.created_by = me
     and exists (select 1 from members m where m.household_id = p.household_id and m.left_at is null and m.user_id <> me);
  delete from pantry_items where created_by = me;

  delete from auth.users where id = me;
end $$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
