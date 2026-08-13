import { defineConfig, devices } from '@playwright/test';

export const BASE_URLS = {
  backend: 'http://localhost:3000',
  buyer: 'http://localhost:5173',
  supplier: 'http://localhost:5174',
  admin: 'http://localhost:5175',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: BASE_URLS.buyer,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'buyer',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URLS.buyer },
      testMatch: '**/buyer/**/*.spec.ts',
    },
    {
      name: 'supplier',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URLS.supplier },
      testMatch: '**/supplier/**/*.spec.ts',
    },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URLS.admin },
      testMatch: '**/admin/**/*.spec.ts',
    },
    {
      name: 'rbac',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URLS.backend },
      testMatch: '**/rbac/**/*.spec.ts',
    },
    {
      name: 'full-flow',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URLS.buyer },
      testMatch: '**/full-flow/**/*.spec.ts',
    },
  ],
});
