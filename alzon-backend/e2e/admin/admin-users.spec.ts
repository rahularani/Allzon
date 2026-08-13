/**
 * ADMIN USER MANAGEMENT TESTS
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS, E2E_TIMESTAMP } from '../config/test.config';

test.describe('Admin User Management', () => {
  let adminToken: string;
  let testUserId: string;
  let testUserToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.admin.phone, password: TEST_ACCOUNTS.admin.password },
    });
    adminToken = (await res.json()).data.accessToken;

    // Create a throwaway test buyer for suspend/activate tests
    const phone = `8${String(E2E_TIMESTAMP).slice(-9)}`;
    const createRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/register`, {
      data: {
        phone,
        password: 'TestPass@123',
        role: 'BUYER',
      },
    });
    if (createRes.status() === 201) {
      const createBody = await createRes.json();
      testUserId = createBody.data?.user?.id;
      testUserToken = createBody.data?.accessToken;
    }
  });

  test('ADM-USER-01: Admin can list all platform users', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    // Should contain at least the 5 seeded accounts
    expect(body.data.length).toBeGreaterThanOrEqual(5);
  });

  test('ADM-USER-02: Admin can suspend a test user', async ({ request }) => {
    if (!testUserId) {
      test.skip(true, 'No test user created for suspension test');
      return;
    }

    const res = await request.put(`${BASE_URLS.backend}/api/v1/admin/users/${testUserId}/suspend`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('ADM-USER-03: Suspended user cannot login', async ({ request }) => {
    if (!testUserId) {
      test.skip(true, 'Depends on ADM-USER-02');
      return;
    }
    const phone = `8${String(E2E_TIMESTAMP).slice(-9)}`;
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone, password: 'TestPass@123' },
    });
    expect(res.status()).toBe(401);
  });

  test('ADM-USER-04: Admin can reactivate the test user', async ({ request }) => {
    if (!testUserId) {
      test.skip(true, 'Depends on ADM-USER-02');
      return;
    }

    const res = await request.put(`${BASE_URLS.backend}/api/v1/admin/users/${testUserId}/activate`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('ADM-USER-05: BUYER cannot access user management (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    const token = (await loginRes.json()).data.accessToken;

    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('ADM-USER-06: VERIFICATION_STAFF cannot access user management (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.staff.phone, password: TEST_ACCOUNTS.staff.password },
    });
    const token = (await loginRes.json()).data.accessToken;

    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('ADM-USER-07: Admin dashboard stats load correctly', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('totalUsers');
    expect(body.data).toHaveProperty('totalProducts');
    expect(body.data).toHaveProperty('totalEnquiries');
    expect(typeof body.data.totalUsers).toBe('number');
    expect(body.data.totalUsers).toBeGreaterThanOrEqual(5);
  });

  test('ADM-USER-08: VERIFICATION_STAFF cannot access dashboard stats (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.staff.phone, password: TEST_ACCOUNTS.staff.password },
    });
    const token = (await loginRes.json()).data.accessToken;

    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });
});
