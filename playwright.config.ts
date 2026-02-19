import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './vue/tests/e2e',
  fullyParallel: false,  // Run serially to avoid rate limiting
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,  // Single worker to avoid rate limiting on login endpoint
  reporter: 'list',

  // Global setup/teardown for test data management
  globalSetup: './vue/tests/e2e/infrastructure/global-setup.ts',
  globalTeardown: './vue/tests/e2e/infrastructure/global-teardown.ts',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_BACKEND_URL: 'http://localhost:5000',
    },
  },
});
