-- Defence in depth: clients never write tables directly (all writes go through RPCs),
-- so remove the write grants Supabase gives anon/authenticated by default; RLS stays on too.
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke insert, update, delete, truncate on tables from anon, authenticated;

revoke execute on function public.get_state() from public, anon;
grant execute on function public.get_state() to authenticated;
alter default privileges in schema private revoke execute on functions from public;

alter table members add constraint members_busy_days_valid
  check (busy_days <@ '{0,1,2,3,4,5,6}'::smallint[]);

-- No function body references unqualified objects in private, so pin to public + pg_temp.
alter function public.get_state() set search_path = public, pg_temp;
alter function private.is_member(uuid) set search_path = public, pg_temp;
alter function private.handle_new_user() set search_path = public, pg_temp;
