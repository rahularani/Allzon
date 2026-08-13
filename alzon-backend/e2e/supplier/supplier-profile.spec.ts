/**
 * SUPPLIER PROFILE TESTS
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';

test.describe('Supplier Profile', () => {
  let supplierToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.supplierVerified.phone, password: TEST_ACCOUNTS.supplierVerified.password },
    });
    supplierToken = (await res.json()).data.accessToken;
  });

  test('SUPP-PROF-01: Supplier can fetch own profile', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/suppliers/profile/me`, {
      headers: { Authorization: `Bearer ${supplierToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.businessName).toBeTruthy();
    expect(body.data.verificationStatus).toBeTruthy();
  });

  test('SUPP-PROF-02: Public supplier directory lists suppliers', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/suppliers`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('SUPP-PROF-03: Public supplier profile accessible by slug', async ({ request }) => {
    // Get ABC Garments profile using their slug
    const suppRes = await request.get(`${BASE_URLS.backend}/api/v1/suppliers/profile/me`, {
      headers: { Authorization: `Bearer ${supplierToken}` },
    });
    const profile = (await suppRes.json()).data;
    const slug = profile.slug;

    const pubRes = await request.get(`${BASE_URLS.backend}/api/v1/suppliers/${slug}`);
    expect(pubRes.status()).toBe(200);
    const body = await pubRes.json();
    expect(body.data.businessName).toBe(profile.businessName);
  });

  test('SUPP-PROF-04: Invalid supplier slug returns 404', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/suppliers/nonexistent-supplier-xyz-99999`);
    expect([404, 400]).toContain(res.status());
  });

  test('SUPP-PROF-05: Supplier dashboard shows profile info', async ({ page }) => {
    await page.goto(`${BASE_URLS.supplier}/login`);
    await page.locator('input[placeholder*="9000000004"]').fill(TEST_ACCOUNTS.supplierVerified.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.supplierVerified.password);

    const [profileResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/suppliers/profile/me'), { timeout: 20000 }),
      Promise.all([
        page.waitForURL('**/dashboard', { timeout: 20000 }),
        page.getByTestId('login-submit').click(),
      ]),
    ]);

    expect(profileResponse.status()).toBe(200);
    const profileBody = await profileResponse.json();
    expect(profileBody.data.businessName).toBe(TEST_ACCOUNTS.supplierVerified.businessName);

    // Business name should appear in sidebar
    await expect(page.getByTestId('supplier-business-name')).toBeVisible({ timeout: 10000 });
  });
});
