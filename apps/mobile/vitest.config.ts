// Pure-logic tests only (no React Native). Run from the repo root: npx vitest run --config native/vitest.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: { alias: { '@domain': fileURLToPath(new URL('../../supabase/functions/_shared/domain', import.meta.url)) } },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
