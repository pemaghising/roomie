-- RLS policies evaluate private.is_member() as the calling role, so authenticated needs
-- USAGE on the schema and EXECUTE on that one helper. The schema is not exposed through the
-- API (not in db.schemas), so it still cannot be called via PostgREST.
grant usage on schema private to authenticated;
grant execute on function private.is_member(uuid) to authenticated;
