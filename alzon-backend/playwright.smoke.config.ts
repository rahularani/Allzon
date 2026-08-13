import { defineConfig, devices } from '@playwright/test';

// Use environment variables for the staging URLs, falling back to localhost for local testing
export const BASE_URLS = {
  backend: process.env.STAGING_BACKEND_URL || 'http://localhost:3000',
  buyer: process.env.STAGING_BUYER_URL || 'http://localhost:5173',
  supplier: process.env.STAGING_SUPPLIER_URL || 'http://localhost:5174',
  admin: process.env.STAGING_ADMIN_URL || 'http://localhost:5175',
};

export default defineConfig({
  testDir: './e2e-smoke',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'smoke',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
