import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 15 — REFRESH PERSISTENCE', () => {
  test('Unauthenticated reload keeps redirect to login', async ({ page }) => {
    await page.goto(`${BASE_URLS.buyer}/dashboard`);
    await page.waitForURL('**/login');
    await page.reload();
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});
