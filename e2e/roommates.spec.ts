import { expect, type Page, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { admin, cleanup } from '../tests/db/helpers';

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const storageKey = `sb-${new URL(process.env.VITE_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`;
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
const userIds: string[] = [];
let householdId: string | undefined;

test.afterAll(async () => {
  await cleanup({ userIds, householdIds: householdId ? [householdId] : [] });
});

/** Creates a confirmed user and signs the page in by planting the password-grant session where supabase-js persists it. */
async function newUser(page: Page, name: string) {
  const email = `${name}-${Date.now()}@roomie.test`;
  const password = `pw-${crypto.randomUUID()}`;
  const { data: created, error } = await admin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  userIds.push(created.user.id);
  const { data, error: signInError } = await createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, opts)
    .auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [storageKey, JSON.stringify(data.session)]);
  await page.goto('/');
  return created.user.id;
}

test('two roommates: create, join, miss, claim, cover — and the ledger stays private', async ({ browser }) => {
  const aarav = await (await browser.newContext()).newPage();
  const priya = await (await browser.newContext()).newPage();

  // Aarav creates the home
  const aUserId = await newUser(aarav, 'aarav');
  await aarav.getByLabel('Your name').fill('Aarav');
  await aarav.getByRole('button', { name: 'Continue' }).click();
  await aarav.getByRole('button', { name: /create a home/i }).click();
  await aarav.getByLabel('Home name').fill('E2E Flat');
  await aarav.getByRole('button', { name: 'Continue' }).click();
  await aarav.getByRole('button', { name: 'Continue' }).click(); // keep the suggested chores
  await aarav.getByRole('checkbox', { name: 'Monday' }).check({ force: true }); // the real input is visually hidden under the pill
  await aarav.getByRole('button', { name: 'Continue' }).click();
  const code = (await aarav.locator('.code-big').textContent())!.trim();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);
  const { data: hh } = await admin().from('households').select('id').eq('invite_code', code).single();
  householdId = hh!.id;
  await aarav.getByRole('button', { name: 'Done' }).click();
  await expect(aarav.getByRole('heading', { name: 'Hello, Aarav.' })).toBeVisible();

  // Priya joins with the code (typed messily on purpose)
  await newUser(priya, 'priya');
  await priya.getByLabel('Your name').fill('Priya');
  await priya.getByRole('button', { name: 'Continue' }).click();
  await priya.getByRole('button', { name: /join with a code/i }).click();
  await priya.getByLabel('Household code').fill(code.toLowerCase());
  await priya.getByRole('button', { name: 'Continue' }).click();
  await priya.getByRole('button', { name: 'Continue' }).click();
  await expect(priya.getByRole('heading', { name: 'Hello, Priya.' })).toBeVisible();

  // Simulate the day ending: one of Aarav's chores today becomes missed
  // Priya joined after this week's plan was made, so every chore this week is Aarav's — names are unique for her.
  const { data: missed } = await admin().from('assignments').select('id, chore_id, effort')
    .eq('household_id', householdId!).eq('user_id', aUserId).eq('status', 'todo').limit(1).single();
  await admin().from('assignments').update({ status: 'missed', day: today() }).eq('id', missed!.id);
  const { data: chore } = await admin().from('chores').select('name').eq('id', missed!.chore_id).single();

  // Priya claims and covers it
  // a direct deep link: Guard must not bounce it to / while the persisted cache is being confirmed
  await priya.goto('/chores');
  await expect(priya).toHaveURL(/\/chores$/);
  await priya.getByRole('button', { name: `Claim ${chore!.name}` }).click();
  await priya.getByRole('region', { name: 'My tasks' }).getByRole('button', { name: `Mark ${chore!.name} done` }).click();
  await expect(priya.getByRole('dialog', { name: 'Thanks for covering.' })).toBeVisible();
  await priya.getByRole('button', { name: 'Close' }).click();

  // Aarav sees his private balance; Priya sees hers — neither sees the other's
  await aarav.reload();
  await aarav.getByRole('link', { name: 'Profile' }).click();
  await expect(aarav.getByText(new RegExp(`pick up ${missed!.effort} extra point`))).toBeVisible();
  await priya.getByRole('link', { name: 'Profile' }).click();
  await expect(priya.getByText(/ahead — next week will be a little lighter/)).toBeVisible();
  await expect(priya.getByText(/pick up .* extra point/)).toHaveCount(0);
});
