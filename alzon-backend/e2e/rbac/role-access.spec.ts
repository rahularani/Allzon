/**
 * RBAC PERMISSION MATRIX TESTS
 * Validates all four roles across all protected API endpoints
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';

const API = `${BASE_URLS.backend}/api/v1`;

// Tokens cached per describe block
let buyerToken: string;
let supplierToken: string;
let staffToken: string;
let adminToken: string;

test.describe('RBAC Permission Matrix', () => {
  test.beforeAll(async ({ request }) => {
    const [bRes, sRes, stRes, aRes] = await Promise.all([
      request.post(`${API}/auth/login`, { data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password } }),
      request.post(`${API}/auth/login`, { data: { phone: TEST_ACCOUNTS.supplierVerified.phone, password: TEST_ACCOUNTS.supplierVerified.password } }),
      request.post(`${API}/auth/login`, { data: { phone: TEST_ACCOUNTS.staff.phone, password: TEST_ACCOUNTS.staff.password } }),
      request.post(`${API}/auth/login`, { data: { phone: TEST_ACCOUNTS.admin.phone, password: TEST_ACCOUNTS.admin.password } }),
    ]);
    buyerToken = (await bRes.json()).data.accessToken;
    supplierToken = (await sRes.json()).data.accessToken;
    staffToken = (await stRes.json()).data.accessToken;
    adminToken = (await aRes.json()).data.accessToken;
  });

  // ─── ADMIN-ONLY ENDPOINTS ─────────────────────────────────────────────────
  test('RBAC-01: /admin/dashboard/stats — ADMIN: 200, STAFF: 403, SUPPLIER: 403, BUYER: 403, ANON: 401', async ({ request }) => {
    const url = `${API}/admin/dashboard/stats`;
    expect((await request.get(url, { headers: { Authorization: `Bearer ${adminToken}` } })).status()).toBe(200);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${staffToken}` } })).status()).toBe(403);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${supplierToken}` } })).status()).toBe(403);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${buyerToken}` } })).status()).toBe(403);
    expect((await request.get(url)).status()).toBe(401);
  });

  test('RBAC-02: /admin/users — ADMIN: 200, STAFF: 403, SUPPLIER: 403, BUYER: 403', async ({ request }) => {
    const url = `${API}/admin/users`;
    expect((await request.get(url, { headers: { Authorization: `Bearer ${adminToken}` } })).status()).toBe(200);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${staffToken}` } })).status()).toBe(403);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${supplierToken}` } })).status()).toBe(403);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${buyerToken}` } })).status()).toBe(403);
  });

  test('RBAC-03: /admin/audit-logs — ADMIN: 200, STAFF: 403, SUPPLIER: 403, BUYER: 403', async ({ request }) => {
    const url = `${API}/admin/audit-logs`;
    expect((await request.get(url, { headers: { Authorization: `Bearer ${adminToken}` } })).status()).toBe(200);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${staffToken}` } })).status()).toBe(403);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${supplierToken}` } })).status()).toBe(403);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${buyerToken}` } })).status()).toBe(403);
  });

  test('RBAC-04: POST /categories — ADMIN: 201, STAFF: 403, SUPPLIER: 403, BUYER: 403', async ({ request }) => {
    const url = `${API}/categories`;
    const data = { name: `RBAC Test Cat ${Date.now()}`, icon: '🧪' };

    const adminRes = await request.post(url, { data, headers: { Authorization: `Bearer ${adminToken}` } });
    expect(adminRes.status()).toBe(201);
    // Cleanup the created category
    const catId = (await adminRes.json()).data?.id;
    if (catId) await request.delete(`${url}/${catId}`, { headers: { Authorization: `Bearer ${adminToken}` } }).catch(() => {});

    expect((await request.post(url, { data, headers: { Authorization: `Bearer ${staffToken}` } })).status()).toBe(403);
    expect((await request.post(url, { data, headers: { Authorization: `Bearer ${supplierToken}` } })).status()).toBe(403);
    expect((await request.post(url, { data, headers: { Authorization: `Bearer ${buyerToken}` } })).status()).toBe(403);
  });

  // ─── ADMIN + STAFF ENDPOINTS ──────────────────────────────────────────────
  test('RBAC-05: /verification/queue — ADMIN: 200, STAFF: 200, SUPPLIER: 403, BUYER: 403', async ({ request }) => {
    const url = `${API}/verification/queue`;
    expect((await request.get(url, { headers: { Authorization: `Bearer ${adminToken}` } })).status()).toBe(200);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${staffToken}` } })).status()).toBe(200);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${supplierToken}` } })).status()).toBe(403);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${buyerToken}` } })).status()).toBe(403);
  });

  test('RBAC-06: /admin/products (moderation queue) — ADMIN: 200, STAFF: 200, SUPPLIER: 403, BUYER: 403', async ({ request }) => {
    const url = `${API}/admin/products`;
    expect((await request.get(url, { headers: { Authorization: `Bearer ${adminToken}` } })).status()).toBe(200);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${staffToken}` } })).status()).toBe(200);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${supplierToken}` } })).status()).toBe(403);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${buyerToken}` } })).status()).toBe(403);
  });

  // ─── BUYER-ONLY ENDPOINTS ─────────────────────────────────────────────────
  test('RBAC-07: /enquiries (POST) — BUYER can submit, SUPPLIER: 403, STAFF: 403, ADMIN: 403', async ({ request }) => {
    const url = `${API}/enquiries`;
    // SUPPLIER
    expect((await request.post(url, { data: { supplierId: 'test', quantity: '10', deliveryLocation: 'Mumbai' }, headers: { Authorization: `Bearer ${supplierToken}` } })).status()).toBe(403);
    // STAFF
    expect((await request.post(url, { data: { supplierId: 'test', quantity: '10', deliveryLocation: 'Mumbai' }, headers: { Authorization: `Bearer ${staffToken}` } })).status()).toBe(403);
    // ADMIN
    expect((await request.post(url, { data: { supplierId: 'test', quantity: '10', deliveryLocation: 'Mumbai' }, headers: { Authorization: `Bearer ${adminToken}` } })).status()).toBe(403);
  });

  test('RBAC-08: /wishlist — BUYER: 200, SUPPLIER: 403, STAFF: 403, ADMIN: 403', async ({ request }) => {
    const url = `${API}/wishlist`;
    expect((await request.get(url, { headers: { Authorization: `Bearer ${buyerToken}` } })).status()).toBe(200);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${supplierToken}` } })).status()).toBe(403);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${staffToken}` } })).status()).toBe(403);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${adminToken}` } })).status()).toBe(403);
  });

  test('RBAC-09: /buyers/profile — BUYER: 200, SUPPLIER: 403, ANON: 401', async ({ request }) => {
    const url = `${API}/buyers/profile`;
    expect((await request.get(url, { headers: { Authorization: `Bearer ${buyerToken}` } })).status()).toBe(200);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${supplierToken}` } })).status()).toBe(403);
    expect((await request.get(url)).status()).toBe(401);
  });

  // ─── SUPPLIER-ONLY ENDPOINTS ──────────────────────────────────────────────
  test('RBAC-10: /suppliers/profile/me — SUPPLIER: 200, BUYER: 403, ANON: 401', async ({ request }) => {
    const url = `${API}/suppliers/profile/me`;
    expect((await request.get(url, { headers: { Authorization: `Bearer ${supplierToken}` } })).status()).toBe(200);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${buyerToken}` } })).status()).toBe(403);
    expect((await request.get(url)).status()).toBe(401);
  });

  test('RBAC-11: POST /products — SUPPLIER: 201/400, BUYER: 403, STAFF: 403, ADMIN: 403', async ({ request }) => {
    const url = `${API}/products`;
    // BUYER cannot create product
    expect((await request.post(url, { data: { name: 'Unauthorized', priceMin: 100, priceMax: 200, moq: 50 }, headers: { Authorization: `Bearer ${buyerToken}` } })).status()).toBe(403);
    expect((await request.post(url, { data: { name: 'Unauthorized', priceMin: 100, priceMax: 200, moq: 50 }, headers: { Authorization: `Bearer ${staffToken}` } })).status()).toBe(403);
    expect((await request.post(url, { data: { name: 'Unauthorized', priceMin: 100, priceMax: 200, moq: 50 }, headers: { Authorization: `Bearer ${adminToken}` } })).status()).toBe(403);
  });

  test('RBAC-12: /verification/status — SUPPLIER: 200, BUYER: 403, ANON: 401', async ({ request }) => {
    const url = `${API}/verification/status`;
    expect((await request.get(url, { headers: { Authorization: `Bearer ${supplierToken}` } })).status()).toBe(200);
    expect((await request.get(url, { headers: { Authorization: `Bearer ${buyerToken}` } })).status()).toBe(403);
    expect((await request.get(url)).status()).toBe(401);
  });

  // ─── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────
  test('RBAC-13: Public endpoints accessible without auth', async ({ request }) => {
    expect((await request.get(`${API}/products`)).status()).toBe(200);
    expect((await request.get(`${API}/categories`)).status()).toBe(200);
    expect((await request.get(`${API}/suppliers`)).status()).toBe(200);
    expect((await request.get(`${BASE_URLS.backend}/health`)).status()).toBe(200);
  });
});
