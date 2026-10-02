-- Helpers live in the private schema (not exposed through the API).
create function private.is_member(h uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where household_id = h and user_id = auth.uid() and left_at is null)
$$;

alter table profiles enable row level security;
alter table households enable row level security;
alter table members enable row level security;
alter table chores enable row level security;
alter table plans enable row level security;
alter table plan_approvals enable row level security;
alter table assignments enable row level security;
alter table swap_requests enable row level security;
alter table effort_ledger enable row level security;
alter table streaks enable row level security;
alter table push_subscriptions enable row level security;
alter table activity enable row level security;
alter table notifications enable row level security;
alter table join_attempts enable row level security;

-- Read-only policies. There are deliberately NO insert/update/delete policies:
-- every write goes through a security-definer RPC (Task 8).
create policy profiles_read on profiles for select using (
  id = auth.uid() or exists (
    select 1 from members a join members b on a.household_id = b.household_id
    where a.user_id = auth.uid() and a.left_at is null and b.user_id = profiles.id
  )
);
create policy households_read on households for select using (private.is_member(id));
create policy members_read on members for select using (private.is_member(household_id));
create policy chores_read on chores for select using (private.is_member(household_id));
create policy plans_read on plans for select using (private.is_member(household_id));
create policy approvals_read on plan_approvals for select using (
  exists (select 1 from plans p where p.id = plan_id and private.is_member(p.household_id))
);
create policy assignments_read on assignments for select using (private.is_member(household_id));
create policy swaps_read on swap_requests for select using (private.is_member(household_id));
create policy streaks_read on streaks for select using (private.is_member(household_id));
create policy activity_read on activity for select using (private.is_member(household_id));
-- Private by design: only you can ever read your effort balance, subscriptions and notifications.
create policy ledger_read_own on effort_ledger for select using (user_id = auth.uid());
create policy push_read_own on push_subscriptions for select using (user_id = auth.uid());
create policy notifications_read_own on notifications for select using (user_id = auth.uid());

alter publication supabase_realtime add table
  households, members, chores, plans, plan_approvals, assignments, swap_requests, streaks, activity;

create function get_state() returns jsonb
language plpgsql stable security definer set search_path = public, private as $$
declare
  me uuid := auth.uid();
  h uuid;
  today date;
begin
  if me is null then raise exception 'not_authenticated'; end if;
  select household_id into h from members where user_id = me and left_at is null;
  if h is null then
    return jsonb_build_object('profile', (select to_jsonb(p) from profiles p where p.id = me), 'household', null);
  end if;
  select (now() at time zone x.tz)::date into today from households x where x.id = h;
  return jsonb_build_object(
    'profile', (select to_jsonb(p) from profiles p where p.id = me),
    'household', (select to_jsonb(x) from households x where x.id = h),
    'members', (select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', m.user_id, 'name', p.name, 'color', p.color, 'role', m.role, 'busy_days', m.busy_days)
        order by m.joined_at), '[]'::jsonb)
      from members m join profiles p on p.id = m.user_id where m.household_id = h and m.left_at is null),
    'chores', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]'::jsonb)
      from chores c where c.household_id = h and c.active),
    'plans', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', pl.id, 'week_start', pl.week_start, 'status', pl.status, 'lock_at', pl.lock_at,
        'approved_by', (select coalesce(jsonb_agg(a.user_id), '[]'::jsonb) from plan_approvals a where a.plan_id = pl.id))
        order by pl.week_start), '[]'::jsonb)
      from plans pl where pl.household_id = h and pl.week_start >= today - 13),
    'assignments', (select coalesce(jsonb_agg(to_jsonb(a) order by a.day), '[]'::jsonb)
      from assignments a where a.household_id = h and a.day between today - 7 and today + 13),
    'swaps', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
      from swap_requests s where s.household_id = h and s.status = 'pending'),
    'streak', (select to_jsonb(s) from streaks s where s.household_id = h),
    'balance', coalesce((select l.balance from effort_ledger l where l.household_id = h and l.user_id = me), 0),
    'activity', (select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
      from (select * from activity where household_id = h order by created_at desc limit 50) x),
    'today', today
  );
end $$;

revoke all on all functions in schema private from public, anon, authenticated;
