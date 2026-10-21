// Backend tests: the shared chore and pantry logic, the tick function, the demo seed and the database (RLS + RPCs).
// The Expo app runs its own suite from apps/mobile.
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    env: loadEnv(mode, process.cwd(), ''),
    include: ['supabase/functions/_shared/**/*.test.ts', 'supabase/functions/tick/**/*.test.ts', 'supabase/seed/**/*.test.ts', 'tests/db/**/*.test.ts'],
    testTimeout: 20_000,
  },
}));
