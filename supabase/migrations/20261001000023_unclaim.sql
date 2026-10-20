-- Undo on the "…is yours" toast (frame H3): hand a claimed chore back to the shared pool.
-- Only the claimer can, only while it is still claimed (not yet done), and only while the pool is open.
create function unclaim_assignment(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  a assignments;
begin
  select * into a from assignments where id = p_id and household_id = h for update;
  if not found or a.claimed_by is distinct from me then raise exception 'not_allowed'; end if;
  if a.status = 'missed' then return; end if; -- replay
  if a.status <> 'claimed' or private.day_ended(h, a.day + 1) then raise exception 'not_allowed'; end if;
  update assignments set status = 'missed', claimed_by = null where id = a.id;
end $$;

revoke all on function public.unclaim_assignment(uuid) from public, anon;
grant execute on function public.unclaim_assignment(uuid) to authenticated;
