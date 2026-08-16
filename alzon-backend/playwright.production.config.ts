import { defineConfig, devices } from '@playwright/test';

export const BASE_URLS = {
  backend: process.env.STAGING_BACKEND_URL || 'https://allzon-backend-znpw.onrender.com',
  buyer: process.env.STAGING_BUYER_URL || 'https://allzonb2b-51ow.vercel.app',
  supplier: process.env.STAGING_SUPPLIER_URL || 'https://allzonb2b-szsk.vercel.app',
  admin: process.env.STAGING_ADMIN_URL || 'https://allzonb2b.vercel.app',
};

export default defineConfig({
  testDir: './e2e-production',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/production-results.json' }],
  ],
  outputDir: 'test-results/production',
  use: {
    baseURL: BASE_URLS.buyer,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'production',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
