/**
 * SUPPLIER VERIFICATION TESTS
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';

test.describe('Supplier Verification', () => {
  let supplierToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.supplierVerified.phone, password: TEST_ACCOUNTS.supplierVerified.password },
    });
    supplierToken = (await res.json()).data.accessToken;
  });

  test('SUPP-VER-01: Supplier can check own verification status', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/verification/status`, {
      headers: { Authorization: `Bearer ${supplierToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('verificationStatus');
    // ABC Garments is seeded as VERIFIED
    expect(body.data.verificationStatus).toBe('VERIFIED');
  });

  test('SUPP-VER-02: BUYER cannot access verification status (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    const token = (await loginRes.json()).data.accessToken;

    const res = await request.get(`${BASE_URLS.backend}/api/v1/verification/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('SUPP-VER-03: Verification docs tab visible in supplier UI', async ({ page }) => {
    await page.goto(`${BASE_URLS.supplier}/login`);
    await page.locator('input[placeholder*="9000000004"]').fill(TEST_ACCOUNTS.supplierVerified.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.supplierVerified.password);

    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 20000 }),
      page.getByTestId('login-submit').click(),
    ]);

    await page.getByText('Verification Docs', { exact: false }).first().click();
    await expect(page.getByText('Verification Docs', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('SUPP-VER-04: Unauthenticated verification status returns 401', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/verification/status`);
    expect(res.status()).toBe(401);
  });
});
