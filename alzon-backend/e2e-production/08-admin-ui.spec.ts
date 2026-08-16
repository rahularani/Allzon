import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 08 — ADMIN UI', () => {
  test('Admin login console displays correctly', async ({ page }) => {
    await page.goto(`${BASE_URLS.admin}/login`);
    await expect(page.getByRole('heading', { name: 'Admin & Moderation Console' })).toBeVisible();
  });
});
