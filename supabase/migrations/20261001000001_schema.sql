create extension if not exists pgcrypto;
create schema if not exists private;

create type nudge_style as enum ('motivate', 'facts');
create type plan_mode as enum ('review', 'auto');
create type cadence as enum ('daily', 'weekly', 'biweekly');
create type plan_status as enum ('draft', 'locked');
create type assignment_status as enum ('todo', 'done', 'missed', 'claimed', 'expired');
create type swap_status as enum ('pending', 'accepted', 'declined');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '' check (char_length(name) <= 30),
  color text not null default '#ffedd5' check (color ~ '^#[0-9a-fA-F]{6}$'),
  nudge_style nudge_style not null default 'motivate',
  activity_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6}$'),
  plan_mode plan_mode not null default 'review',
  tz text not null default 'Asia/Kathmandu',
  day_ends_at time not null default '22:00',
  digest_sent_for date,
  created_at timestamptz not null default now()
);

create table members (
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  busy_days smallint[] not null default '{}',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (household_id, user_id)
);
create unique index members_one_active_household on members (user_id) where left_at is null;

create table chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default '🧹',
  effort smallint not null check (effort between 1 and 3),
  cadence cadence not null default 'weekly',
  active boolean not null default true,
  created_week date not null,
  created_at timestamptz not null default now()
);

create table plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  week_start date not null,
  status plan_status not null,
  generated_at timestamptz not null default now(),
  lock_at timestamptz not null,
  unique (household_id, week_start)
);

create table plan_approvals (
  plan_id uuid not null references plans on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  approved_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans on delete cascade,
  household_id uuid not null references households on delete cascade,
  chore_id uuid not null references chores on delete cascade,
  user_id uuid not null references profiles,
  day date not null,
  effort smallint not null check (effort between 1 and 3),
  status assignment_status not null default 'todo',
  prev_status assignment_status,
  claimed_by uuid references profiles,
  done_at timestamptz,
  reason jsonb not null default '{}'::jsonb
);
create index assignments_household_day on assignments (household_id, day);

create table swap_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  from_assignment uuid not null references assignments on delete cascade,
  to_assignment uuid not null references assignments on delete cascade,
  from_user uuid not null references profiles,
  to_user uuid not null references profiles,
  status swap_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table effort_ledger (
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  balance integer not null default 0,
  last_covered_by uuid references profiles,
  updated_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table streaks (
  household_id uuid primary key references households on delete cascade,
  current integer not null default 0,
  best integer not null default 0,
  last_settled_day date
);

create table push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references profiles on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table activity (
  id bigint generated always as identity primary key,
  household_id uuid not null references households on delete cascade,
  kind text not null,
  actor uuid references profiles,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_household_recent on activity (household_id, created_at desc);

create table notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles on delete cascade,
  household_id uuid references households on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  skipped boolean not null default false
);
create index notifications_pending on notifications (created_at) where sent_at is null and not skipped;

create table join_attempts (
  user_id uuid not null references profiles on delete cascade,
  at timestamptz not null default now()
);
create index join_attempts_recent on join_attempts (user_id, at);

-- Every new auth user gets a profile row.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();
