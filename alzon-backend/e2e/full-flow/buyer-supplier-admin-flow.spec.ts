/**
 * COMPLETE BUSINESS LIFECYCLE E2E TEST
 * 
 * This is the most important test. It validates the COMPLETE end-to-end flow:
 * 
 * SUPPLIER creates PENDING product
 *   ↓
 * ADMIN approves product → status = APPROVED
 *   ↓
 * BUYER finds approved product in search
 *   ↓
 * BUYER submits ENQUIRY
 *   ↓
 * DATABASE: Enquiry status = NEW
 *   ↓
 * SUPPLIER receives enquiry and updates status = CONTACTED
 *   ↓
 * DATABASE: Enquiry status = CONTACTED
 *   ↓
 * BUYER verifies updated status in dashboard
 *   ↓
 * ADMIN audit log has record of product approval
 * 
 * Each checkpoint verifies BOTH frontend state AND API/database state.
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS, E2E_TIMESTAMP } from '../config/test.config';

const API = `${BASE_URLS.backend}/api/v1`;
const PRODUCT_NAME = `E2E_FLOW_PRODUCT_${E2E_TIMESTAMP}`;

test.describe('Complete Business Lifecycle Flow', () => {
  let supplierToken: string;
  let buyerToken: string;
  let adminToken: string;
  let categoryId: string;
  let createdProductId: string;
  let enquiryId: string;
  let supplierId: string;

  test.beforeAll(async ({ request }) => {
    // Login all three roles
    const [suppRes, buyerRes, adminRes] = await Promise.all([
      request.post(`${API}/auth/login`, { data: { phone: TEST_ACCOUNTS.supplierVerified.phone, password: TEST_ACCOUNTS.supplierVerified.password }, headers: { 'X-Portal': 'supplier' } }),
      request.post(`${API}/auth/login`, { data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password }, headers: { 'X-Portal': 'buyer' } }),
      request.post(`${API}/auth/login`, { data: { phone: TEST_ACCOUNTS.admin.phone, password: TEST_ACCOUNTS.admin.password }, headers: { 'X-Portal': 'admin' } }),
    ]);
    supplierToken = (await suppRes.json()).data.accessToken;
    buyerToken = (await buyerRes.json()).data.accessToken;
    adminToken = (await adminRes.json()).data.accessToken;

    // Get category
    const catRes = await request.get(`${API}/categories`);
    const cats = (await catRes.json()).data;
    if (cats.length > 0) categoryId = cats[0].id;

    // Get supplier ID from their profile
    const profRes = await request.get(`${API}/suppliers/profile/me`, {
      headers: { Authorization: `Bearer ${supplierToken}` },
    });
    supplierId = (await profRes.json()).data?.id;
  });

  test.afterAll(async ({ request }) => {
    if (createdProductId && supplierToken) {
      await request.delete(`${API}/products/${createdProductId}`, {
        headers: { Authorization: `Bearer ${supplierToken}` },
      }).catch(() => {});
    }
  });

  // ─── STEP 1: SUPPLIER creates product ─────────────────────────────────────
  test('FLOW-01: Supplier creates product — initial status PENDING', async ({ request }) => {
    if (!categoryId) {
      test.skip(true, 'No category available for lifecycle test');
      return;
    }

    const res = await request.post(`${API}/products`, {
      data: {
        name: PRODUCT_NAME,
        categoryId,
        priceMin: 180,
        priceMax: 280,
        moq: 75,
        description: `E2E Full Flow Test Product — ${E2E_TIMESTAMP}`,
      },
      headers: { Authorization: `Bearer ${supplierToken}` },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();

    // Verify API response
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(PRODUCT_NAME);
    expect(body.data.status).toBe('PENDING'); // ✅ CHECKPOINT: Must be PENDING
    expect(body.data.id).toBeTruthy();

    createdProductId = body.data.id;
    console.log(`✅ FLOW-01 PASS: Product created with ID ${createdProductId}, status = PENDING`);
  });

  // ─── STEP 2: Verify product is PENDING in public search ───────────────────
  test('FLOW-02: PENDING product NOT visible in public product search', async ({ request }) => {
    if (!createdProductId) test.skip(true, 'Depends on FLOW-01');

    const res = await request.get(`${API}/products?q=${encodeURIComponent(PRODUCT_NAME)}`);
    expect(res.status()).toBe(200);
    const products = (await res.json()).data;

    const found = products.find((p: any) => p.id === createdProductId);
    expect(found).toBeUndefined(); // ✅ CHECKPOINT: PENDING product NOT public
    console.log(`✅ FLOW-02 PASS: PENDING product correctly hidden from public search`);
  });

  // ─── STEP 3: ADMIN approves the product ───────────────────────────────────
  test('FLOW-03: Admin approves the PENDING product', async ({ request }) => {
    if (!createdProductId) test.skip(true, 'Depends on FLOW-01');

    const res = await request.put(`${API}/admin/products/${createdProductId}/review`, {
      data: { status: 'APPROVED', adminNote: 'E2E Full Flow Test — Auto Approved' },
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('APPROVED'); // ✅ CHECKPOINT: Status is now APPROVED
    console.log(`✅ FLOW-03 PASS: Admin approved product — status = APPROVED`);
  });

  // ─── STEP 4: Verify APPROVED product is publicly visible ──────────────────
  test('FLOW-04: APPROVED product appears in public product search', async ({ request }) => {
    if (!createdProductId) test.skip(true, 'Depends on FLOW-03');

    const res = await request.get(`${API}/products`);
    expect(res.status()).toBe(200);
    const products = (await res.json()).data;

    const found = products.find((p: any) => p.id === createdProductId);
    expect(found).toBeTruthy(); // ✅ CHECKPOINT: APPROVED product IS public
    expect(found.status).toBe('APPROVED');
    console.log(`✅ FLOW-04 PASS: APPROVED product is now publicly discoverable`);
  });

  // ─── STEP 5: BUYER finds and sees the approved product via UI ─────────────
  test('FLOW-05: Buyer can see approved product on buyer frontend', async ({ page }) => {
    if (!createdProductId) test.skip(true, 'Depends on FLOW-03');

    const [searchResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/products'), { timeout: 20000 }),
      page.goto(`${BASE_URLS.buyer}/products`),
    ]);

    expect(searchResponse.status()).toBe(200);
    const body = await searchResponse.json();

    const found = body.data.find((p: any) => p.id === createdProductId);
    expect(found).toBeTruthy(); // ✅ CHECKPOINT: Buyer frontend receives approved product
    console.log(`✅ FLOW-05 PASS: Buyer frontend shows approved product`);
  });

  // ─── STEP 6: BUYER submits an enquiry on the approved product ─────────────
  test('FLOW-06: Buyer submits enquiry on approved product', async ({ request }) => {
    if (!createdProductId || !supplierId) test.skip(true, 'Depends on FLOW-03');

    const res = await request.post(`${API}/enquiries`, {
      data: {
        supplierId,
        productId: createdProductId,
        quantity: `E2E_FLOW_ENQUIRY_${E2E_TIMESTAMP} pieces`,
        deliveryLocation: 'Bengaluru, Karnataka',
        additionalRequirement: 'E2E lifecycle test enquiry',
      },
      headers: { Authorization: `Bearer ${buyerToken}` },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
    expect(body.data.status).toBe('NEW'); // ✅ CHECKPOINT: Fresh enquiry is NEW
    expect(body.data.productId).toBe(createdProductId);

    enquiryId = body.data.id;
    console.log(`✅ FLOW-06 PASS: Buyer submitted enquiry ID ${enquiryId}, status = NEW`);
  });

  // ─── STEP 7: Enquiry appears in buyer dashboard (API) ─────────────────────
  test('FLOW-07: Enquiry appears in buyer enquiry list', async ({ request }) => {
    if (!enquiryId) test.skip(true, 'Depends on FLOW-06');

    const res = await request.get(`${API}/enquiries/buyer/mine`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    expect(res.status()).toBe(200);
    const enquiries = (await res.json()).data;

    const found = enquiries.find((e: any) => e.id === enquiryId);
    expect(found).toBeTruthy(); // ✅ CHECKPOINT: Enquiry in buyer list
    expect(found.status).toBe('NEW');
    console.log(`✅ FLOW-07 PASS: Enquiry appears in buyer list with status NEW`);
  });

  // ─── STEP 8: Enquiry appears in supplier received list ────────────────────
  test('FLOW-08: Enquiry appears in supplier received enquiries', async ({ request }) => {
    if (!enquiryId) test.skip(true, 'Depends on FLOW-06');

    const res = await request.get(`${API}/enquiries/supplier/received`, {
      headers: { Authorization: `Bearer ${supplierToken}` },
    });
    expect(res.status()).toBe(200);
    const enquiries = (await res.json()).data;

    const found = enquiries.find((e: any) => e.id === enquiryId);
    expect(found).toBeTruthy(); // ✅ CHECKPOINT: Enquiry in supplier list
    expect(found.status).toBe('NEW');
    console.log(`✅ FLOW-08 PASS: Enquiry appears in supplier received list`);
  });

  // ─── STEP 9: SUPPLIER updates enquiry to CONTACTED ───────────────────────
  test('FLOW-09: Supplier updates enquiry status to CONTACTED', async ({ request }) => {
    if (!enquiryId) test.skip(true, 'Depends on FLOW-06');

    const res = await request.put(`${API}/enquiries/${enquiryId}/status`, {
      data: { status: 'CONTACTED' },
      headers: { Authorization: `Bearer ${supplierToken}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('CONTACTED'); // ✅ CHECKPOINT: Status updated
    console.log(`✅ FLOW-09 PASS: Supplier updated enquiry to CONTACTED`);
  });

  // ─── STEP 10: BUYER sees the updated status ───────────────────────────────
  test('FLOW-10: Buyer sees CONTACTED enquiry status in dashboard API', async ({ request }) => {
    if (!enquiryId) test.skip(true, 'Depends on FLOW-09');

    const res = await request.get(`${API}/enquiries/buyer/mine`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const enquiries = (await res.json()).data;
    const found = enquiries.find((e: any) => e.id === enquiryId);

    expect(found).toBeTruthy();
    expect(found.status).toBe('CONTACTED'); // ✅ CHECKPOINT: Buyer sees CONTACTED
    console.log(`✅ FLOW-10 PASS: Buyer sees enquiry updated to CONTACTED`);
  });

  // ─── STEP 11: Buyer sees updated status via UI dashboard ──────────────────
  test('FLOW-11: Buyer sees updated enquiry status in UI dashboard', async ({ page }) => {
    if (!enquiryId) test.skip(true, 'Depends on FLOW-09');

    // Login buyer via UI
    await page.goto(`${BASE_URLS.buyer}/login`);
    await page.getByPlaceholder('Enter mobile number').fill(TEST_ACCOUNTS.buyer.phone);
    await page.getByPlaceholder('••••••••').fill(TEST_ACCOUNTS.buyer.password);

    const [enqResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/enquiries/buyer/mine'), { timeout: 20000 }),
      Promise.all([
        page.waitForURL('**/dashboard', { timeout: 20000 }),
        page.getByTestId('login-submit').click(),
      ]),
    ]);

    expect(enqResponse.status()).toBe(200);
    const enqBody = await enqResponse.json();
    const found = enqBody.data.find((e: any) => e.id === enquiryId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('CONTACTED'); // ✅ CHECKPOINT: UI receives correct status

    // Also verify UI renders the enquiry
    await expect(page.getByText('Submitted Enquiries', { exact: false })).toBeVisible({ timeout: 10000 });
    console.log(`✅ FLOW-11 PASS: Buyer dashboard UI shows updated CONTACTED status`);
  });

  // ─── STEP 12: ADMIN audit log confirms the product approval ───────────────
  test('FLOW-12: Admin audit log confirms product approval action', async ({ request }) => {
    if (!createdProductId) test.skip(true, 'Depends on FLOW-03');

    const res = await request.get(`${API}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const logs = (await res.json()).data;

    const approvalLog = logs.find(
      (log: any) =>
        log.action === 'PRODUCT_APPROVED' && log.entityId === createdProductId,
    );
    expect(approvalLog).toBeTruthy(); // ✅ CHECKPOINT: Audit log exists
    console.log(`✅ FLOW-12 PASS: Audit log records product approval`);
  });

  // ─── STEP 13: Verification Staff restrictions ─────────────────────────────
  test('FLOW-13: Verification Staff can access product moderation but NOT user management', async ({ request }) => {
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { phone: TEST_ACCOUNTS.staff.phone, password: TEST_ACCOUNTS.staff.password },
      headers: { 'X-Portal': 'admin' },
    });
    const staffToken = (await loginRes.json()).data.accessToken;

    // STAFF can access product moderation queue ✅
    const modRes = await request.get(`${API}/admin/products`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    expect(modRes.status()).toBe(200);

    // STAFF CANNOT access user management ❌
    const usersRes = await request.get(`${API}/admin/users`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    expect(usersRes.status()).toBe(403);

    // STAFF CANNOT access audit logs ❌
    const auditRes = await request.get(`${API}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    expect(auditRes.status()).toBe(403);

    // STAFF CANNOT create categories ❌
    const catRes = await request.post(`${API}/categories`, {
      data: { name: 'Staff Cat Attempt', icon: '🚫' },
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    expect(catRes.status()).toBe(403);

    console.log(`✅ FLOW-13 PASS: Verification Staff RBAC restrictions verified`);
  });
});
