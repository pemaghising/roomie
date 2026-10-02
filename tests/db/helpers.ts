import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_TEST_URL;
const anon = process.env.SUPABASE_TEST_ANON_KEY;
const service = process.env.SUPABASE_TEST_SERVICE_KEY;
export const hasDb = Boolean(url && anon && service);

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
export const admin = (): SupabaseClient => createClient(url!, service!, opts);

export async function makeUser(name: string): Promise<{ id: string; client: SupabaseClient }> {
  const email = `${name.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}@roomie.test`;
  const password = `pw-${crypto.randomUUID()}`;
  const { data, error } = await admin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const client = createClient(url!, anon!, opts);
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  await admin().from('profiles').update({ name }).eq('id', data.user.id);
  return { id: data.user.id, client };
}

const code = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

/** Creates a household directly (service role), bypassing RPCs — for tests that only need rows. */
export async function seedHousehold(ownerId: string, extraMemberIds: string[] = []): Promise<string> {
  const db = admin();
  const { data: h, error } = await db.from('households').insert({ name: 'Test flat', invite_code: code() }).select('id').single();
  if (error) throw error;
  await db.from('members').insert([
    { household_id: h.id, user_id: ownerId, role: 'owner' },
    ...extraMemberIds.map((user_id) => ({ household_id: h.id, user_id, role: 'member' })),
  ]);
  await db.from('effort_ledger').insert([ownerId, ...extraMemberIds].map((user_id) => ({ household_id: h.id, user_id })));
  await db.from('streaks').insert({ household_id: h.id });
  return h.id;
}

export interface SeedRow { userId: string; day: string; effort?: number; status?: string; choreName?: string }

/** Creates a locked plan with one chore per row; returns assignment ids in row order. */
export async function seedPlan(householdId: string, weekStart: string, rows: SeedRow[]): Promise<string[]> {
  const db = admin();
  const { data: plan, error } = await db.from('plans')
    .insert({ household_id: householdId, week_start: weekStart, status: 'locked', lock_at: new Date().toISOString() })
    .select('id').single();
  if (error) throw error;
  const ids: string[] = [];
  for (const r of rows) {
    const { data: chore } = await db.from('chores')
      .insert({ household_id: householdId, name: r.choreName ?? 'Bathroom', effort: r.effort ?? 1, created_week: weekStart })
      .select('id').single();
    const { data: a, error: e } = await db.from('assignments').insert({
      plan_id: plan.id, household_id: householdId, chore_id: chore!.id, user_id: r.userId,
      day: r.day, effort: r.effort ?? 1, status: r.status ?? 'todo',
    }).select('id').single();
    if (e) throw e;
    ids.push(a.id);
  }
  return ids;
}
