/**
 * SUPPLIER AUTHENTICATION TESTS
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';
import { checkFrontend } from '../helpers/api';

test.describe('Supplier Authentication', () => {
  test.beforeAll(async () => {
    const up = await checkFrontend(BASE_URLS.supplier);
    if (!up) test.skip(true, 'Supplier frontend not available');
  });

  test('SUPP-AUTH-01: Supplier portal loads with ALLZON branding', async ({ page }) => {
    await page.goto(BASE_URLS.supplier);
    await expect(page).toHaveTitle(/ALLZON|Supplier/i, { timeout: 15000 });
    const logo = page.locator('img[alt*="ALLZON"]').first();
    await expect(logo).toBeVisible({ timeout: 10000 });
  });

  test('SUPP-AUTH-02: Valid supplier login succeeds via API', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.supplierVerified.phone, password: TEST_ACCOUNTS.supplierVerified.password },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.user.role).toBe('SUPPLIER');
  });

  test('SUPP-AUTH-03: Supplier UI login navigates to dashboard', async ({ page }) => {
    await page.goto(`${BASE_URLS.supplier}/login`);

    await page.locator('input[placeholder*="9000000004"]').fill(TEST_ACCOUNTS.supplierVerified.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.supplierVerified.password);

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/login'), { timeout: 20000 }),
      page.getByTestId('login-submit').click(),
    ]);

    expect(response.status()).toBe(200);
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    
    // Verify dashboard content
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.toLowerCase()).toMatch(/(supplier console|dashboard overview|my products)/i);
  });

  test('SUPP-AUTH-04: Invalid password returns 401', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.supplierVerified.phone, password: 'WrongPass123' },
    });
    expect(res.status()).toBe(401);
  });

  test('SUPP-AUTH-05: Supplier dashboard accessible after login', async ({ page }) => {
    await page.goto(`${BASE_URLS.supplier}/login`);
    await page.locator('input[placeholder*="9000000004"]').fill(TEST_ACCOUNTS.supplierVerified.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.supplierVerified.password);

    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 20000 }),
      page.getByTestId('login-submit').click(),
    ]);

    // Key dashboard panels should be visible
    await expect(page.getByText('Dashboard Overview', { exact: false }).first()).toBeVisible({ timeout: 15000 });
  });

  test('SUPP-AUTH-06: Supplier dashboard redirects to login when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE_URLS.supplier}/dashboard`);
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('SUPP-AUTH-07: BUYER token cannot access supplier-only endpoints (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    const token = (await loginRes.json()).data.accessToken;

    const res = await request.get(`${BASE_URLS.backend}/api/v1/suppliers/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });
});
