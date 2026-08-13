import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.smoke.config';

test.describe('Staging Environment Smoke Tests', () => {

  test('Backend is healthy', async ({ request }) => {
    const response = await request.get(`${BASE_URLS.backend}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.status).toBe('ok');
    expect(body.data.db).toBe('connected');
  });

  test('Buyer Frontend loads and accesses API', async ({ page }) => {
    await page.goto(BASE_URLS.buyer);
    // Expect the main page to load
    await expect(page.locator('text=ALLZON')).toBeVisible();
    
    // Check if it can navigate to login
    await page.goto(`${BASE_URLS.buyer}/login`);
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Supplier Frontend loads', async ({ page }) => {
    await page.goto(BASE_URLS.supplier);
    await expect(page.locator('text=ALLZON')).toBeVisible();
  });

  test('Admin Frontend loads', async ({ page }) => {
    await page.goto(BASE_URLS.admin);
    await expect(page.locator('text=Admin')).toBeVisible();
  });

  // Basic API connectivity check
  test('API root endpoint returns expected metadata', async ({ request }) => {
    const response = await request.get(`${BASE_URLS.backend}/api/v1`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.name).toContain('ALLZON');
  });

});
