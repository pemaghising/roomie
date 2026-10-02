import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL ?? 'http://localhost', import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'anon', {
  // implicit flow: OAuth and magic-link redirects land as URL tokens the SPA picks up (the e2e test signs in this way)
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
