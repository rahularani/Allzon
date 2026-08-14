import { defineConfig, devices } from '@playwright/test';
import { TEST_ACCOUNTS } from './e2e/config/test.config';

export const BASE_URLS = {
  backend: process.env.STAGING_BACKEND_URL || 'https://allzon-backend.onrender.com',
  buyer: process.env.STAGING_BUYER_URL || 'https://allzon.vercel.app',
  supplier: process.env.STAGING_SUPPLIER_URL || 'https://allzon-jemi.vercel.app',
  admin: process.env.STAGING_ADMIN_URL || 'https://allzon-8vdj.vercel.app',
};

export default defineConfig({
  testDir: './e2e-staging',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/staging-results.json' }],
  ],
  outputDir: 'test-results/staging',
  use: {
    baseURL: BASE_URLS.buyer,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'staging',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
