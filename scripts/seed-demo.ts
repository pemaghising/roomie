// Wipes every login on the dev project and seeds the demo household from supabase/seed/demo.ts.
// Usage: npx vite-node scripts/seed-demo.ts <owner-email>
// Reads SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_KEY from .env.local. Never prints either.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { buildDemoHousehold } from '../supabase/seed/demo.ts';
import { addDays, localParts } from '../supabase/functions/_shared/domain/time.ts';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const ownerEmail = process.argv[2];
if (!ownerEmail?.includes('@')) throw new Error('usage: seed-demo.ts <owner-email>');

const db = createClient(env.SUPABASE_TEST_URL, env.SUPABASE_TEST_SERVICE_KEY, { auth: { persistSession: false } });
const must = <T>(r: { data: T; error: unknown }, what: string): T => {
  if (r.error) throw new Error(`${what}: ${(r.error as { message?: string }).message ?? r.error}`);
  return r.data;
};

async function wipeLogins() {
  for (;;) {
    const { users } = must(await db.auth.admin.listUsers({ page: 1, perPage: 200 }), 'list users');
    if (!users.length) return;
    for (const u of users) must(await db.auth.admin.deleteUser(u.id), `delete user ${u.id}`);
  }
}

async function emptyAvatars() {
  const files = (await db.storage.from('avatars').list('', { limit: 1000 })).data ?? [];
  for (const dir of files) {
    const inner = (await db.storage.from('avatars').list(dir.name, { limit: 1000 })).data ?? [];
    const paths = inner.length ? inner.map((f) => `${dir.name}/${f.name}`) : [dir.name];
    await db.storage.from('avatars').remove(paths);
  }
}

const tz = 'Asia/Kathmandu';
const today = localParts(new Date(), tz).date;
const seed = buildDemoHousehold(today, ownerEmail);

await wipeLogins();
await emptyAvatars();

const ids: Record<string, string> = {};
for (const m of seed.members) {
  const { user } = must(await db.auth.admin.createUser({ email: m.email, email_confirm: true }), `create ${m.name}`);
  ids[m.name] = user!.id;
  must(await db.from('profiles').update({ name: m.name, color: m.color, nudge_style: 'motivate' }).eq('id', user!.id), `profile ${m.name}`);
}
const owner = ids[seed.members[0].name];

const household = must(await db.from('households').insert({ name: seed.household.name, invite_code: 'A3F92K', tz }).select('id').single(), 'household');
const h = household.id as string;
must(await db.from('members').insert(seed.members.map((m) => ({ household_id: h, user_id: ids[m.name], role: m.role, busy_days: m.busyDays }))), 'members');
must(await db.from('effort_ledger').insert(seed.members.map((m) => ({ household_id: h, user_id: ids[m.name], balance: 0 }))), 'ledger');

const chores = must(await db.from('chores').insert(seed.chores.map((c) => ({
  household_id: h, name: c.name, icon: c.icon, effort: c.effort, cadence: c.cadence, created_week: addDays(seed.weekStart, -14),
}))).select('id, name, effort'), 'chores') as { id: string; name: string; effort: number }[];
const chore = Object.fromEntries(chores.map((c) => [c.name, c]));

// The plan locked on Saturday 18:00 Kathmandu (12:15 UTC) before the week began.
const plan = must(await db.from('plans').insert({
  household_id: h, week_start: seed.weekStart, status: 'locked', lock_at: `${addDays(seed.weekStart, -1)}T12:15:00Z`,
}).select('id').single(), 'plan');
must(await db.from('assignments').insert(seed.assignments.map((a) => ({
  plan_id: plan.id, household_id: h, chore_id: chore[a.chore].id, user_id: ids[a.member], day: a.day,
  effort: chore[a.chore].effort, status: a.status, done_at: a.status === 'done' ? `${a.day}T12:15:00Z` : null,
}))), 'assignments');

must(await db.from('streaks').upsert({ household_id: h, current: seed.streakDays, best: seed.streakDays, last_settled_day: addDays(today, -1) }), 'streak');

const items = must(await db.from('pantry_items').insert(seed.pantry.map((p) => ({
  household_id: h, owner_id: p.shared ? null : ids[p.owner!], name: p.name, rule: p.shared ? null : p.tag, stock: p.status,
  icon: p.icon, created_by: p.shared ? owner : ids[p.owner!],
}))).select('id, name'), 'pantry') as { id: string; name: string }[];
const milk = items.find((i) => i.name === 'Milk')!;
must(await db.from('restock_requests').insert({
  household_id: h, item_id: milk.id, name: 'Milk', effort: 1, requested_by: ids.Aman, claimed_by: ids.Priya,
}), 'restock');

console.log(`Seeded "${seed.household.name}" for ${ownerEmail}: ${seed.members.length} members, ${seed.chores.length} chores, ` +
  `${seed.assignments.length} assignments this week (from ${seed.weekStart}), ${seed.pantry.length} pantry items, streak ${seed.streakDays}.`);
