/**
 * ADMIN AUDIT LOG TESTS
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';

test.describe('Admin Audit Logs', () => {
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

  test('ADM-AUDIT-01: Admin can access audit logs', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('ADM-AUDIT-02: VERIFICATION_STAFF cannot access audit logs (403)', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('ADM-AUDIT-03: BUYER cannot access audit logs (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    const token = (await loginRes.json()).data.accessToken;

    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('ADM-AUDIT-04: Audit logs contain expected fields', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    if (body.data.length > 0) {
      const log = body.data[0];
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('entity');
      expect(log).toHaveProperty('entityId');
      expect(log).toHaveProperty('createdAt');
    }
  });
});
