import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 07 — SUPPLIER UI', () => {
  test('Supplier login page displays correct branding', async ({ page }) => {
    await page.goto(`${BASE_URLS.supplier}/login`);
    // Use the unique heading element to avoid strict mode violation.
    // The page has "SUPPLIER PORTAL" in navbar, "Supplier Portal Login" in h1,
    // and "Log In to Supplier Portal" in the button — all matching "Supplier Portal".
    // The h1 heading is the correct branding element to assert.
    await expect(page.getByRole('heading', { name: 'Supplier Portal Login' })).toBeVisible();
    await expect(page.locator('input[placeholder*="Enter mobile"]')).toBeVisible();
  });
});
