import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './vue/tests/e2e',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: 'list',

  globalSetup: './vue/tests/e2e/infrastructure/global-setup.ts',
  globalTeardown: './vue/tests/e2e/infrastructure/global-teardown.ts',

  use: {
    baseURL,
    trace: 'on',
    video: 'on',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
