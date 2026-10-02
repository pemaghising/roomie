import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

Object.assign(process.env, loadEnv('test', process.cwd(), ''));

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  use: { baseURL: 'http://localhost:5173', ...devices['Pixel 7'], trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: true },
});
