import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 12 — WISHLIST UI', () => {
  test('Wishlist redirects to login when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE_URLS.buyer}/dashboard?section=wishlist`);
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});
