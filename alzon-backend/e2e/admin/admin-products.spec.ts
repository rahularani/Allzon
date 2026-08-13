/**
 * ADMIN PRODUCT MODERATION TESTS
 * Tests approving/rejecting products and verifying public visibility
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS, E2E_TIMESTAMP } from '../config/test.config';

let adminToken: string;
let supplierToken: string;
let testProductId: string;
let categoryId: string;

test.describe('Admin Product Moderation', () => {
  test.beforeAll(async ({ request }) => {
    // Login admin
    const adminRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.admin.phone, password: TEST_ACCOUNTS.admin.password },
    });
    adminToken = (await adminRes.json()).data.accessToken;

    // Login supplier to create a test product
    const suppRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.supplierVerified.phone, password: TEST_ACCOUNTS.supplierVerified.password },
    });
    supplierToken = (await suppRes.json()).data.accessToken;

    // Get category
    const catRes = await request.get(`${BASE_URLS.backend}/api/v1/categories`);
    const cats = (await catRes.json()).data;
    if (cats.length > 0) categoryId = cats[0].id;
  });

  test('ADM-PROD-01: Admin can view product moderation queue', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('ADM-PROD-02: Admin approves a PENDING product → status becomes APPROVED', async ({ request }) => {
    if (!categoryId) {
      test.skip(true, 'No category available for product moderation test');
      return;
    }

    // Create a pending product as supplier
    const createRes = await request.post(`${BASE_URLS.backend}/api/v1/products`, {
      data: {
        name: `E2E_MOD_PRODUCT_${E2E_TIMESTAMP}`,
        categoryId,
        priceMin: 200,
        priceMax: 350,
        moq: 50,
        description: 'E2E moderation test product — please delete after test',
      },
      headers: { Authorization: `Bearer ${supplierToken}` },
    });
    expect(createRes.status()).toBe(201);
    testProductId = (await createRes.json()).data.id;
    expect(testProductId).toBeTruthy();

    // Admin approves
    const approveRes = await request.put(
      `${BASE_URLS.backend}/api/v1/admin/products/${testProductId}/review`,
      {
        data: { status: 'APPROVED', adminNote: 'E2E test approval' },
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    expect(approveRes.status()).toBe(200);
    const body = await approveRes.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('APPROVED');
  });

  test('ADM-PROD-03: APPROVED product appears in public product search', async ({ request }) => {
    if (!testProductId) {
      test.skip(true, 'Depends on ADM-PROD-02');
      return;
    }

    const res = await request.get(`${BASE_URLS.backend}/api/v1/products`);
    expect(res.status()).toBe(200);
    const products = (await res.json()).data;

    const found = products.find((p: any) => p.id === testProductId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('APPROVED');
  });

  test('ADM-PROD-04: Approved product moderation creates audit log entry', async ({ request }) => {
    if (!testProductId) {
      test.skip(true, 'Depends on ADM-PROD-02');
      return;
    }

    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const logs = body.data;
    expect(Array.isArray(logs)).toBe(true);

    const approvalLog = logs.find(
      (log: any) =>
        log.action === 'PRODUCT_APPROVED' && log.entityId === testProductId,
    );
    expect(approvalLog).toBeTruthy();
  });

  test('ADM-PROD-05: Admin rejects a PENDING product → status becomes REJECTED', async ({ request }) => {
    if (!categoryId) {
      test.skip(true, 'No category available');
      return;
    }

    // Create another pending product
    const createRes = await request.post(`${BASE_URLS.backend}/api/v1/products`, {
      data: {
        name: `E2E_REJECT_PRODUCT_${E2E_TIMESTAMP}`,
        categoryId,
        priceMin: 100,
        priceMax: 200,
        moq: 50,
        description: 'E2E reject test product',
      },
      headers: { Authorization: `Bearer ${supplierToken}` },
    });
    expect(createRes.status()).toBe(201);
    const rejectProductId = (await createRes.json()).data.id;

    // Admin rejects
    const rejectRes = await request.put(
      `${BASE_URLS.backend}/api/v1/admin/products/${rejectProductId}/review`,
      {
        data: { status: 'REJECTED', adminNote: 'E2E test rejection — does not meet quality standards' },
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    expect(rejectRes.status()).toBe(200);
    expect((await rejectRes.json()).data.status).toBe('REJECTED');

    // REJECTED product does NOT appear in public search
    const pubRes = await request.get(`${BASE_URLS.backend}/api/v1/products`);
    const products = (await pubRes.json()).data;
    const found = products.find((p: any) => p.id === rejectProductId);
    expect(found).toBeUndefined();

    // Cleanup
    await request.delete(`${BASE_URLS.backend}/api/v1/products/${rejectProductId}`, {
      headers: { Authorization: `Bearer ${supplierToken}` },
    }).catch(() => {});
  });

  test.afterAll(async ({ request }) => {
    // Cleanup approved test product
    if (testProductId && supplierToken) {
      await request.delete(`${BASE_URLS.backend}/api/v1/products/${testProductId}`, {
        headers: { Authorization: `Bearer ${supplierToken}` },
      }).catch(() => {});
    }
  });

  test('ADM-PROD-06: BUYER cannot access admin product moderation (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    const token = (await loginRes.json()).data.accessToken;

    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });
});
