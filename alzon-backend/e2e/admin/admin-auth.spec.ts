/**
 * ADMIN AUTHENTICATION TESTS
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';
import { checkFrontend } from '../helpers/api';

test.describe('Admin Authentication', () => {
  test.beforeAll(async () => {
    const up = await checkFrontend(BASE_URLS.admin);
    if (!up) test.skip(true, 'Admin frontend not available');
  });

  test('ADM-AUTH-01: Admin console loads with ALLZON branding', async ({ page }) => {
    await page.goto(BASE_URLS.admin);
    await expect(page).toHaveTitle(/ALLZON|Admin/i, { timeout: 15000 });
    const logo = page.locator('img[alt*="ALLZON"]').first();
    await expect(logo).toBeVisible({ timeout: 10000 });
  });

  test('ADM-AUTH-02: Valid admin login via API returns ADMIN role', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.admin.phone, password: TEST_ACCOUNTS.admin.password },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.user.role).toBe('ADMIN');
  });

  test('ADM-AUTH-03: Valid staff login via API returns VERIFICATION_STAFF role', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.staff.phone, password: TEST_ACCOUNTS.staff.password },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.user.role).toBe('VERIFICATION_STAFF');
  });

  test('ADM-AUTH-04: Admin UI login navigates to dashboard', async ({ page }) => {
    await page.goto(`${BASE_URLS.admin}/login`);
    await page.locator('input[placeholder*="9000000001"]').fill(TEST_ACCOUNTS.admin.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.admin.password);

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/login'), { timeout: 20000 }),
      page.getByTestId('login-submit').click(),
    ]);

    expect(response.status()).toBe(200);
    await page.waitForURL('**/dashboard', { timeout: 20000 });
  });

  test('ADM-AUTH-05: BUYER role rejected by admin console', async ({ page }) => {
    await page.goto(`${BASE_URLS.admin}/login`);
    await page.locator('input[placeholder*="9000000001"]').fill(TEST_ACCOUNTS.buyer.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.buyer.password);

    await page.getByTestId('login-submit').click();

    // Should show error — BUYER cannot access admin console
    await expect(page.getByText('Access denied', { exact: false })).toBeVisible({ timeout: 10000 });
    // Should NOT navigate to dashboard
    expect(page.url()).not.toContain('/dashboard');
  });

  test('ADM-AUTH-06: Admin dashboard redirects to login when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE_URLS.admin}/dashboard`);
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});
