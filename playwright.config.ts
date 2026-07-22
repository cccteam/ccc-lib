/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

const PORT = 4300;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'html',
  outputDir: './test-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx ng serve showcase-app --port ${PORT} --no-hmr`,
    url: `http://localhost:${PORT}/grid-showcase`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
