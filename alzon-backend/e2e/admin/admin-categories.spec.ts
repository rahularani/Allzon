/**
 * ADMIN CATEGORIES TESTS
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS, E2E_TIMESTAMP } from '../config/test.config';

test.describe('Admin Category Management', () => {
  let adminToken: string;
  let staffToken: string;
  let createdCategoryId: string;

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

  test.afterAll(async ({ request }) => {
    if (createdCategoryId && adminToken) {
      await request.delete(`${BASE_URLS.backend}/api/v1/categories/${createdCategoryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    }
  });

  test('ADM-CAT-01: Admin can create a category', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/categories`, {
      data: {
        name: `E2E Category ${E2E_TIMESTAMP}`,
        icon: '🧪',
      },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toContain(`E2E Category`);
    createdCategoryId = body.data.id;
  });

  test('ADM-CAT-02: Created category appears in public category list', async ({ request }) => {
    if (!createdCategoryId) {
      test.skip(true, 'Depends on ADM-CAT-01');
      return;
    }

    const res = await request.get(`${BASE_URLS.backend}/api/v1/categories`);
    expect(res.status()).toBe(200);
    const cats = (await res.json()).data;
    const found = cats.find((c: any) => c.id === createdCategoryId);
    expect(found).toBeTruthy();
  });

  test('ADM-CAT-03: Admin can update a category', async ({ request }) => {
    if (!createdCategoryId) {
      test.skip(true, 'Depends on ADM-CAT-01');
      return;
    }

    const res = await request.put(`${BASE_URLS.backend}/api/v1/categories/${createdCategoryId}`, {
      data: { name: `E2E Category Updated ${E2E_TIMESTAMP}` },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.name).toContain('Updated');
  });

  test('ADM-CAT-04: VERIFICATION_STAFF cannot create a category (403)', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/categories`, {
      data: { name: `Staff Category Attempt ${E2E_TIMESTAMP}`, icon: '🚫' },
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('ADM-CAT-05: BUYER cannot create a category (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    const token = (await loginRes.json()).data.accessToken;

    const res = await request.post(`${BASE_URLS.backend}/api/v1/categories`, {
      data: { name: 'Unauthorized category', icon: '🚫' },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('ADM-CAT-06: Admin can delete a category', async ({ request }) => {
    if (!createdCategoryId) {
      test.skip(true, 'Depends on ADM-CAT-01');
      return;
    }

    const res = await request.delete(`${BASE_URLS.backend}/api/v1/categories/${createdCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    createdCategoryId = ''; // Already deleted — skip afterAll cleanup
  });
});
