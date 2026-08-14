import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.staging.config';
import { TEST_ACCOUNTS } from '../e2e/config/test.config';

test.describe('TEST 03 & 20 — SUPPLIER AUTHENTICATION & REFRESH', () => {
  test('Login with existing seeded supplier account and test persistence', async ({ page }) => {
    await page.goto(`${BASE_URLS.supplier}/login`);
    await page.locator('input[placeholder*="9000000004"]').fill(TEST_ACCOUNTS.supplierVerified.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.supplierVerified.password);
    
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/login')),
      page.locator('button[type="submit"]').click(),
    ]);
    expect(response.status()).toBe(200);
    
    // Wait for dashboard redirect
    await page.waitForURL('**/dashboard');
    
    // Test persistence
    await page.reload();
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('FAIL — SESSION PERSISTENCE: Supplier was redirected to login after browser refresh.');
    }
    expect(currentUrl).toContain('/dashboard');
  });
});
