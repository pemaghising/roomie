/**
 * Demo mode: a pre-filled flat (Rahul, Aman, Priya) that runs entirely in this browser tab.
 * No account, no network, nothing persisted beyond sessionStorage. Planning uses the real domain logic.
 * Entered via /demo, left via the demo bar (both reload the page so auth and the cache start clean).
 */
import { generatePlan } from '@domain/rotation.ts';
import { addDays, dateOfWeekday, type Weekday, weekdayOf, weekStartOf } from '@domain/time.ts';
import type { Cadence, Effort, Reason } from '@domain/types.ts';
import type { ActivityItem, AppState, Assignment, Chore, Member } from '../lib/types';

const FLAG = 'roomie-demo';
const KEY = 'roomie-demo-state';

export const ME = 'demo-rahul';
export const AMAN = 'demo-aman';
export const PRIYA = 'demo-priya';
const HOUSE = 'demo-home';

export function isDemo(): boolean {
  try { return sessionStorage.getItem(FLAG) === '1'; } catch { return false; }
}

export function startDemo() {
  sessionStorage.setItem(FLAG, '1');
  sessionStorage.removeItem(KEY); // always a fresh flat
}

export function exitDemo() {
  sessionStorage.removeItem(FLAG);
  sessionStorage.removeItem(KEY);
}

export const resetDemo = () => sessionStorage.removeItem(KEY);

const localToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const CHORES: Omit<Chore, 'active'>[] = [
  { id: 'c-bath', name: 'Clean bathroom', icon: '🛁', effort: 3, cadence: 'weekly' },
  { id: 'c-kitchen', name: 'Deep clean kitchen', icon: '🧽', effort: 3, cadence: 'weekly' },
  { id: 'c-sweep', name: 'Sweep living room', icon: '🧹', effort: 2, cadence: 'weekly' },
  { id: 'c-laundry', name: 'Do the laundry', icon: '🧺', effort: 2, cadence: 'weekly' },
  { id: 'c-trash', name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily' },
  { id: 'c-plants', name: 'Water the plants', icon: '🪴', effort: 1, cadence: 'weekly' },
];

const MEMBERS: Member[] = [
  { user_id: ME, name: 'Rahul', color: '#dbeafe', role: 'owner', busy_days: [3] },
  { user_id: AMAN, name: 'Aman', color: '#ffedd5', role: 'member', busy_days: [1, 4] },
  { user_id: PRIYA, name: 'Priya', color: '#d1fae5', role: 'member', busy_days: [6] },
];

/** Run the real planner and turn its output into assignment rows. Others' private reasons are hidden, as get_state does. */
function plan(planId: string, weekStart: string, balances: Record<string, number>, history: { choreId: string; userId: string; weekStart: string }[], chores = CHORES, fromDay?: Weekday, existingTotals?: Record<string, number>, idPrefix = planId): Assignment[] {
  const result = generatePlan({
    householdId: HOUSE,
    weekStart,
    members: MEMBERS.map((m) => ({ userId: m.user_id, busyDays: m.busy_days, balance: balances[m.user_id] ?? 0, coveredBy: m.user_id === AMAN ? ME : undefined })),
    chores: chores.map((c) => ({ id: c.id, effort: c.effort, cadence: c.cadence, createdWeek: addDays(weekStart, -14) })),
    history,
    fromDay,
    existingTotals,
  });
  return result.assignments.map((p, i) => ({
    id: `${idPrefix}-${i}`, plan_id: planId, chore_id: p.choreId, user_id: p.userId, day: dateOfWeekday(weekStart, p.day),
    effort: p.effort, status: 'todo', claimed_by: null, done_at: null,
    reason: p.userId !== ME && (p.reason.code === 'debt' || p.reason.code === 'credit') ? null : p.reason,
  }));
}

export function seedState(today = localToday()): AppState {
  const week = weekStartOf(today);
  const next = addDays(week, 7);

  const current = plan('p-cur', week, {}, []).map((a): Assignment => (a.day < today ? { ...a, status: 'done', done_at: `${a.day}T14:00:00Z` } : a));

  // A chore Aman missed during exams, so the "Missed by roommates" pool has something to claim.
  const missed = current.filter((a) => a.user_id === AMAN).sort((x, y) => y.effort - x.effort || x.day.localeCompare(y.day))[0];
  if (missed) Object.assign(missed, { day: addDays(today, -1), status: 'missed', done_at: null });

  // Rahul always has something to tick off today.
  if (!current.some((a) => a.user_id === ME && a.day === today)) {
    const mine = current.find((a) => a.user_id === ME && a.status === 'todo');
    if (mine) mine.day = today;
  }

  const history = current.map((a) => ({ choreId: a.chore_id, userId: a.user_id, weekStart: week }));
  // Rahul covered for Aman last week: Aman owes a little effort next week, Rahul is owed.
  const upcoming = plan('p-next', next, { [AMAN]: 2, [ME]: -2 }, history);

  const theirs = upcoming.find((a) => a.user_id === AMAN && a.effort === 3) ?? upcoming.find((a) => a.user_id === AMAN);
  const mine = upcoming.find((a) => a.user_id === ME && a.chore_id !== theirs?.chore_id && a.effort < (theirs?.effort ?? 9));

  return {
    profile: { id: ME, name: 'Rahul', color: '#dbeafe', nudge_style: 'motivate', activity_seen_at: hoursAgo(20) },
    household: { id: HOUSE, name: 'Apt 4B', invite_code: '381902', plan_mode: 'review', tz: 'Asia/Kathmandu', day_ends_at: '21:00:00' },
    members: MEMBERS.map((m) => ({ ...m, busy_days: [...m.busy_days] })),
    chores: CHORES.map((c) => ({ ...c, active: true })),
    plans: [
      { id: 'p-cur', week_start: week, status: 'locked', lock_at: `${addDays(week, -1)}T12:15:00Z`, approved_by: [ME, AMAN, PRIYA] },
      { id: 'p-next', week_start: next, status: 'draft', lock_at: `${addDays(next, -1)}T12:15:00Z`, approved_by: [PRIYA] },
    ],
    assignments: [...current, ...upcoming],
    swaps: theirs && mine ? [{ id: 'sw-1', from_assignment: theirs.id, to_assignment: mine.id, from_user: AMAN, to_user: ME, status: 'pending' }] : [],
    streak: { current: 3, best: 5, last_settled_day: addDays(today, -1) },
    balance: 0,
    activity: [
      { id: 7, kind: 'completed', actor: PRIYA, payload: { chore: 'Wash dishes' }, created_at: hoursAgo(2) },
      { id: 6, kind: 'pool', actor: null, payload: {}, created_at: hoursAgo(9) },
      { id: 5, kind: 'plan_ready', actor: null, payload: {}, created_at: hoursAgo(26) },
      { id: 4, kind: 'day_kept', actor: null, payload: { streak: 3 }, created_at: hoursAgo(30) },
      { id: 3, kind: 'joined', actor: PRIYA, payload: {}, created_at: hoursAgo(24 * 6) },
      { id: 2, kind: 'joined', actor: AMAN, payload: {}, created_at: hoursAgo(24 * 6 + 3) },
      { id: 1, kind: 'created', actor: ME, payload: {}, created_at: hoursAgo(24 * 7) },
    ],
    today,
  };
}

function load(): AppState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as AppState;
      if (s.today === localToday()) return s;
    }
  } catch { /* fall through to a fresh seed */ }
  const s = seedState();
  save(s);
  return s;
}

function save(s: AppState) {
  try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: the demo still works for this page view */ }
}

export const demoState = (): AppState => load();

let nextActivityId = 1000;
const log = (s: AppState, kind: string, payload: Record<string, unknown>, actor: string | null = ME): ActivityItem[] =>
  [{ id: nextActivityId++, kind, actor, payload, created_at: new Date().toISOString() }, ...s.activity];

const nameOf = (s: AppState, id: string) => s.members.find((m) => m.user_id === id)?.name ?? 'a roommate';
const choreName = (s: AppState, a: Assignment) => s.chores.find((c) => c.id === a.chore_id)?.name ?? 'a chore';

function fail(code: string): never { throw new Error(code); }

function swapPair(s: AppState, fromId: string, toId: string): AppState {
  const from = s.assignments.find((a) => a.id === fromId);
  const to = s.assignments.find((a) => a.id === toId);
  if (!from || !to) fail('unknown');
  return {
    ...s,
    assignments: s.assignments.map((a): Assignment => {
      if (a.id === from.id) return { ...a, user_id: to.user_id, reason: { code: 'swap', withUserId: from.user_id } as Reason };
      if (a.id === to.id) return { ...a, user_id: from.user_id, reason: { code: 'swap', withUserId: to.user_id } as Reason };
      return a;
    }),
  };
}

/** Apply one RPC to the demo flat. Throws Error(code) the way the server reports error codes. */
export function applyDemoRpc(s: AppState, fn: string, args: Record<string, unknown> = {}): { state: AppState; result: unknown } {
  const find = (id: unknown) => s.assignments.find((a) => a.id === id) ?? fail('unknown');
  const set = (id: string, patch: Partial<Assignment>) => s.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a));

  switch (fn) {
    case 'complete_assignment': {
      const a = find(args.p_id);
      const covered = a.status === 'claimed' && a.claimed_by === ME;
      return { state: { ...s, assignments: set(a.id, { status: 'done', done_at: new Date().toISOString() }), activity: log(s, covered ? 'covered' : 'completed', { chore: choreName(s, a) }) }, result: null };
    }
    case 'undo_complete': {
      const a = find(args.p_id);
      return { state: { ...s, assignments: set(a.id, { status: a.claimed_by ? 'claimed' : 'todo', done_at: null }) }, result: null };
    }
    case 'claim_assignment': {
      const a = find(args.p_id);
      if (a.status !== 'missed' || a.user_id === ME) fail('unknown');
      // claiming earns credit (the ledger runs negative when you are owed)
      return { state: { ...s, balance: s.balance - a.effort, assignments: set(a.id, { status: 'claimed', claimed_by: ME }), activity: log(s, 'claimed', { chore: choreName(s, a) }) }, result: null };
    }
    case 'approve_plan':
      return { state: { ...s, plans: s.plans.map((p) => (p.id === args.p_plan && !p.approved_by.includes(ME) ? { ...p, approved_by: [...p.approved_by, ME] } : p)) }, result: null };
    case 'respond_swap': {
      const w = s.swaps.find((x) => x.id === args.p_swap) ?? fail('unknown');
      const rest = { ...s, swaps: s.swaps.filter((x) => x.id !== w.id) };
      if (!args.p_accept) return { state: rest, result: null };
      const swapped = swapPair(rest, w.from_assignment, w.to_assignment);
      return { state: { ...swapped, activity: log(swapped, 'swapped', { with: nameOf(s, w.from_user) }) }, result: null };
    }
    case 'request_swap': {
      const to = find(args.p_to);
      const id = `sw-${Date.now()}`;
      return { state: { ...s, swaps: [...s.swaps, { id, from_assignment: String(args.p_from), to_assignment: to.id, from_user: ME, to_user: to.user_id, status: 'pending' }] }, result: id };
    }
    case 'update_household': {
      if (!s.household) fail('unknown');
      const h = { ...s.household };
      if (typeof args.p_name === 'string') h.name = args.p_name;
      if (args.p_plan_mode === 'review' || args.p_plan_mode === 'auto') h.plan_mode = args.p_plan_mode;
      if (typeof args.p_day_ends_at === 'string') h.day_ends_at = `${args.p_day_ends_at}:00`;
      return { state: { ...s, household: h }, result: null };
    }
    case 'update_profile': {
      const p = { ...s.profile };
      if (typeof args.p_name === 'string') p.name = args.p_name;
      if (typeof args.p_color === 'string') p.color = args.p_color;
      if (args.p_nudge === 'motivate' || args.p_nudge === 'facts') p.nudge_style = args.p_nudge;
      return { state: { ...s, profile: p, members: s.members.map((m) => (m.user_id === ME ? { ...m, name: p.name, color: p.color } : m)) }, result: null };
    }
    case 'update_busy_days':
      return { state: { ...s, members: s.members.map((m) => (m.user_id === ME ? { ...m, busy_days: [...(args.p_days as Weekday[])].sort() } : m)) }, result: null };
    case 'remove_member':
      return { state: { ...s, members: s.members.filter((m) => m.user_id !== args.p_user) }, result: null };
    case 'archive_chore':
      return {
        state: {
          ...s,
          chores: s.chores.map((c) => (c.id === args.p_id ? { ...c, active: false } : c)),
          assignments: s.assignments.filter((a) => !(a.chore_id === args.p_id && a.status === 'todo' && a.day >= s.today)),
        },
        result: null,
      };
    case 'add_chore': {
      const id = `c-${Date.now()}`;
      const chore: Chore = { id, name: String(args.p_name), icon: String(args.p_icon), effort: args.p_effort as Effort, cadence: args.p_cadence as Cadence, active: true };
      const current = s.plans.find((p) => p.status === 'locked' && p.week_start <= s.today && addDays(p.week_start, 7) > s.today);
      let added: Assignment[] = [];
      if (current) {
        const totals: Record<string, number> = {};
        for (const a of s.assignments) if (a.plan_id === current.id) totals[a.user_id] = (totals[a.user_id] ?? 0) + a.effort;
        added = plan(current.id, current.week_start, {}, [], [chore], weekdayOf(s.today), totals, `${current.id}-${id}`);
      }
      return { state: { ...s, chores: [...s.chores, chore], assignments: [...s.assignments, ...added], activity: log(s, 'chore_added', { chore: chore.name }) }, result: id };
    }
    case 'mark_activity_seen':
      return { state: { ...s, profile: { ...s.profile, activity_seen_at: new Date().toISOString() } }, result: null };
    case 'rotate_invite_code':
      if (!s.household) fail('unknown');
      return { state: { ...s, household: { ...s.household, invite_code: String(Math.floor(100000 + Math.random() * 900000)) } }, result: null };
    case 'save_push_subscription':
    case 'delete_push_subscription':
      return { state: s, result: null };
    default:
      fail('unknown'); // create/join/leave belong to real accounts
  }
}

/** The demo's stand-in for supabase.rpc. */
export async function demoRpc(fn: string, args?: Record<string, unknown>): Promise<unknown> {
  if (fn === 'leave_household') { exitDemo(); window.location.replace('/welcome'); return null; } // leaving the demo flat = leaving the demo
  const { state, result } = applyDemoRpc(load(), fn, args);
  save(state);
  if (fn === 'request_swap') scheduleReply(String(result));
  return result;
}

let onExternalChange: (() => void) | null = null;
/** The app registers a refresh callback so simulated roommates' actions show up. */
export const onDemoChange = (cb: () => void) => { onExternalChange = cb; };

/** Roommates are simulated: a swap request gets a friendly yes a few seconds later. */
function scheduleReply(swapId: string) {
  setTimeout(() => {
    const s = load();
    const w = s.swaps.find((x) => x.id === swapId);
    if (!w) return;
    const swapped = swapPair({ ...s, swaps: s.swaps.filter((x) => x.id !== swapId) }, w.from_assignment, w.to_assignment);
    save({ ...swapped, activity: log(swapped, 'swapped', { with: 'you' }, w.to_user) });
    onExternalChange?.();
  }, 4000);
}
