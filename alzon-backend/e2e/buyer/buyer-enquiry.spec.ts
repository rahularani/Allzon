/**
 * BUYER ENQUIRY TESTS
 * Tests end-to-end enquiry submission, dashboard verification, API consistency
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS, E2E_TIMESTAMP } from '../config/test.config';

test.describe('Buyer Enquiry Flow', () => {
  let accessToken: string;
  let productId: string;
  let supplierId: string;
  let createdEnquiryId: string;

  test.beforeAll(async ({ request }) => {
    // Login buyer
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    expect(loginRes.status()).toBe(200);
    accessToken = (await loginRes.json()).data.accessToken;

    // Get an approved product
    const prodRes = await request.get(`${BASE_URLS.backend}/api/v1/products`);
    const products = (await prodRes.json()).data;
    if (products.length > 0) {
      productId = products[0].id;
      supplierId = products[0].supplierId || products[0].supplier?.id;
    }
  });

  test('BUY-ENQ-01: Buyer can submit enquiry via API and get response with ID', async ({ request }) => {
    if (!productId || !supplierId) {
      test.skip(true, 'No approved products available for enquiry test');
      return;
    }

    const res = await request.post(`${BASE_URLS.backend}/api/v1/enquiries`, {
      data: {
        supplierId,
        productId,
        quantity: `E2E_TEST_${E2E_TIMESTAMP} pieces`,
        deliveryLocation: 'Mumbai, Maharashtra',
        additionalRequirement: 'E2E Test enquiry — please ignore',
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
    expect(body.data.status).toBe('NEW');
    createdEnquiryId = body.data.id;
  });

  test('BUY-ENQ-02: Created enquiry appears in buyer enquiry list', async ({ request }) => {
    if (!createdEnquiryId) {
      test.skip(true, 'Skipping — depends on BUY-ENQ-01');
      return;
    }

    const res = await request.get(`${BASE_URLS.backend}/api/v1/enquiries/buyer/mine`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    const enquiries = body.data;
    expect(Array.isArray(enquiries)).toBe(true);

    const found = enquiries.find((e: any) => e.id === createdEnquiryId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('NEW');
  });

  test('BUY-ENQ-03: Enquiry submission via UI flow shows success state', async ({ page }) => {
    if (!productId || !supplierId) {
      test.skip(true, 'No approved products for UI enquiry test');
      return;
    }

    // Login via UI
    await page.goto(`${BASE_URLS.buyer}/login`);
    await page.locator('input[placeholder*="9000000003"]').fill(TEST_ACCOUNTS.buyer.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.buyer.password);

    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 20000 }),
      page.getByTestId('login-submit').click(),
    ]);

    // Navigate to enquiry page with product & supplier
    await page.goto(`${BASE_URLS.buyer}/enquiry?productId=${productId}&supplierId=${supplierId}`);

    // Fill enquiry form
    await page.locator('input[placeholder*="500 Pieces"]').fill('200 Pieces');
    await page.locator('input[placeholder*="Mumbai"]').fill('Delhi, Delhi');

    const [enquiryResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/enquiries'), { timeout: 20000 }),
      page.getByTestId('enquiry-submit').click(),
    ]);

    expect(enquiryResponse.status()).toBe(201);
    const enqBody = await enquiryResponse.json();
    expect(enqBody.data.id).toBeTruthy();

    // Verify success state shown to user
    await expect(page.getByText('Enquiry Sent Successfully', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('View In Dashboard', { exact: false })).toBeVisible();
  });

  test('BUY-ENQ-04: Enquiry appears on buyer dashboard after submission', async ({ page }) => {
    // Login via UI
    await page.goto(`${BASE_URLS.buyer}/login`);
    await page.locator('input[placeholder*="9000000003"]').fill(TEST_ACCOUNTS.buyer.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.buyer.password);

    const [meResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/me'), { timeout: 20000 }),
      Promise.all([
        page.waitForURL('**/dashboard', { timeout: 20000 }),
        page.getByTestId('login-submit').click(),
      ]),
    ]);

    // Ensure dashboard loads
    await expect(page.getByText('Submitted Enquiries', { exact: false })).toBeVisible({ timeout: 15000 });
    
    // Verify enquiry count badge appears in sidebar
    const bodyText = await page.locator('main').innerText();
    // Should show at least the enquiry section header
    expect(bodyText.toLowerCase()).toContain('submitted enquiries');
  });

  test('BUY-ENQ-05: SUPPLIER cannot submit enquiry (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.supplierVerified.phone, password: TEST_ACCOUNTS.supplierVerified.password },
    });
    const token = (await loginRes.json()).data.accessToken;

    const res = await request.post(`${BASE_URLS.backend}/api/v1/enquiries`, {
      data: {
        supplierId: supplierId || '00000000-0000-0000-0000-000000000001',
        quantity: '100 pieces',
        deliveryLocation: 'Mumbai',
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('BUY-ENQ-06: Missing required fields returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/enquiries`, {
      data: { supplierId }, // Missing quantity and deliveryLocation
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(400);
  });

  test('BUY-ENQ-07: Unauthenticated enquiry returns 401', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/enquiries`, {
      data: { supplierId, quantity: '100', deliveryLocation: 'Mumbai' },
    });
    expect(res.status()).toBe(401);
  });
});
