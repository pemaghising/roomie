// Dev only: signs in a dev-project account without email and writes its session for native/scripts/compare.py --session.
// Usage: npx vite-node scripts/make-session.ts <email> <out.json> [--fresh]   (--fresh deletes and recreates the account)
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const [email, out] = process.argv.slice(2);
const fresh = process.argv.includes('--fresh');
const admin = createClient(env.SUPABASE_TEST_URL, env.SUPABASE_TEST_SERVICE_KEY, { auth: { persistSession: false } });

if (fresh) {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const old = data.users.find((u) => u.email === email);
  if (old) await admin.auth.admin.deleteUser(old.id);
  await admin.auth.admin.createUser({ email, email_confirm: true });
}
const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
if (link.error) throw link.error;
const anon = createClient(env.SUPABASE_TEST_URL, env.SUPABASE_TEST_ANON_KEY, { auth: { persistSession: false } });
const { data, error } = await anon.auth.verifyOtp({ type: 'magiclink', token_hash: link.data.properties.hashed_token });
if (error || !data.session) throw error ?? new Error('no session');
const nameArg = process.argv.find((a) => a.startsWith('--name='));
if (nameArg) await anon.rpc('update_profile', { p_name: nameArg.slice(7) });
const ref = new URL(env.SUPABASE_TEST_URL).hostname.split('.')[0];
writeFileSync(out, JSON.stringify({ key: `sb-${ref}-auth-token`, value: data.session }));
console.log(`session for ${email} → ${out}`);
