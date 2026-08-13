/**
 * ADMIN VERIFICATION QUEUE TESTS
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';

test.describe('Admin Verification Queue', () => {
  let adminToken: string;
  let staffToken: string;

  test.beforeAll(async ({ request }) => {
    const adminRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.admin.phone, password: TEST_ACCOUNTS.admin.password },
    });
    adminToken = (await adminRes.json()).data.accessToken;

    const staffRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.staff.phone, password: TEST_ACCOUNTS.staff.password },
    });
    staffToken = (await staffRes.json()).data.accessToken;
  });

  test('ADM-VER-01: Admin can access verification queue', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/verification/queue`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('ADM-VER-02: VERIFICATION_STAFF can access verification queue', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/verification/queue`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('ADM-VER-03: BUYER cannot access verification queue (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    const token = (await loginRes.json()).data.accessToken;

    const res = await request.get(`${BASE_URLS.backend}/api/v1/verification/queue`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('ADM-VER-04: SUPPLIER cannot access verification queue (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.supplierVerified.phone, password: TEST_ACCOUNTS.supplierVerified.password },
    });
    const token = (await loginRes.json()).data.accessToken;

    const res = await request.get(`${BASE_URLS.backend}/api/v1/verification/queue`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });
});
