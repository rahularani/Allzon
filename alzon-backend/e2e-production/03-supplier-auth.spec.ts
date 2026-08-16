import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 03 — SUPPLIER AUTHENTICATION', () => {
  test('Redirect to login when accessing supplier dashboard unauthenticated', async ({ page }) => {
    await page.goto(`${BASE_URLS.supplier}/dashboard`);
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('Login with invalid credentials returns error', async ({ page }) => {
    await page.goto(`${BASE_URLS.supplier}/login`);
    await page.locator('input[placeholder*="Enter mobile"]').fill('9999999999');
    await page.locator('input[type="password"]').fill('WrongPassword123');
    await page.locator('button[type="submit"]').click();
    
    const errorBlock = page.locator('div[style*="background: rgb(254, 226, 226)"], div[style*="background:#FEE2E2"]');
    await expect(errorBlock).toBeVisible();
    await expect(errorBlock).toContainText('Invalid phone number or password');
  });
});
