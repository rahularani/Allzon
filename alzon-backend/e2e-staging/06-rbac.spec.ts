import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.staging.config';
import { TEST_ACCOUNTS } from '../e2e/config/test.config';

test.describe('TEST 07 — RBAC', () => {
  let buyerToken = '';
  let supplierToken = '';

  test.beforeAll(async ({ request }) => {
    // Get Buyer Token
    const buyerRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password }
    });
    if (buyerRes.status() === 200) {
      buyerToken = (await buyerRes.json()).data.accessToken;
    }

    // Get Supplier Token
    const supRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.supplierVerified.phone, password: TEST_ACCOUNTS.supplierVerified.password }
    });
    if (supRes.status() === 200) {
      supplierToken = (await supRes.json()).data.accessToken;
    }
  });

  test('Buyer attempting supplier APIs returns 403', async ({ request }) => {
    test.skip(!buyerToken, 'Buyer login failed');
    const res = await request.get(`${BASE_URLS.backend}/api/v1/suppliers/dashboard/stats`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    expect(res.status()).toBe(403);
  });

  test('Buyer attempting admin APIs returns 403', async ({ request }) => {
    test.skip(!buyerToken, 'Buyer login failed');
    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    expect(res.status()).toBe(403);
  });

  test('Supplier attempting buyer APIs returns 403', async ({ request }) => {
    test.skip(!supplierToken, 'Supplier login failed');
    const res = await request.get(`${BASE_URLS.backend}/api/v1/enquiries/buyer/mine`, {
      headers: { Authorization: `Bearer ${supplierToken}` }
    });
    expect(res.status()).toBe(403);
  });
});
