/**
 * SUPPLIER ENQUIRY MANAGEMENT TESTS
 * Tests receiving enquiries and updating status
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS, E2E_TIMESTAMP } from '../config/test.config';

test.describe('Supplier Enquiry Management', () => {
  let supplierToken: string;
  let buyerToken: string;
  let testEnquiryId: string;
  let productId: string;
  let supplierId: string;

  test.beforeAll(async ({ request }) => {
    // Login supplier
    const suppRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.supplierVerified.phone, password: TEST_ACCOUNTS.supplierVerified.password },
    });
    supplierToken = (await suppRes.json()).data.accessToken;

    // Login buyer
    const buyerRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    buyerToken = (await buyerRes.json()).data.accessToken;

    // Get an approved product belonging to this supplier
    const prodRes = await request.get(`${BASE_URLS.backend}/api/v1/products`, {
      params: { limit: 20 },
    });
    const products = (await prodRes.json()).data;
    if (products.length > 0) {
      productId = products[0].id;
      supplierId = products[0].supplierId || products[0].supplier?.id;
    }
  });

  test('SUPP-ENQ-01: Buyer enquiry appears in supplier received list', async ({ request }) => {
    if (!productId || !supplierId) {
      test.skip(true, 'No products for enquiry test');
      return;
    }

    // Create an enquiry as buyer
    const enqRes = await request.post(`${BASE_URLS.backend}/api/v1/enquiries`, {
      data: {
        supplierId,
        productId,
        quantity: `E2E_SUPP_TEST_${E2E_TIMESTAMP} pieces`,
        deliveryLocation: 'Chennai, Tamil Nadu',
      },
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    expect(enqRes.status()).toBe(201);
    testEnquiryId = (await enqRes.json()).data.id;

    // Check supplier received enquiries
    const receivedRes = await request.get(`${BASE_URLS.backend}/api/v1/enquiries/supplier/received`, {
      headers: { Authorization: `Bearer ${supplierToken}` },
    });
    expect(receivedRes.status()).toBe(200);
    const enquiries = (await receivedRes.json()).data;
    expect(Array.isArray(enquiries)).toBe(true);

    const found = enquiries.find((e: any) => e.id === testEnquiryId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('NEW');
  });

  test('SUPP-ENQ-02: Supplier can update enquiry status to CONTACTED', async ({ request }) => {
    if (!testEnquiryId) {
      test.skip(true, 'Depends on SUPP-ENQ-01');
      return;
    }

    const updateRes = await request.put(`${BASE_URLS.backend}/api/v1/enquiries/${testEnquiryId}/status`, {
      data: { status: 'CONTACTED' },
      headers: { Authorization: `Bearer ${supplierToken}` },
    });
    expect(updateRes.status()).toBe(200);
    const body = await updateRes.json();
    expect(body.data.status).toBe('CONTACTED');
  });

  test('SUPP-ENQ-03: Buyer sees updated enquiry status', async ({ request }) => {
    if (!testEnquiryId) {
      test.skip(true, 'Depends on SUPP-ENQ-01 and SUPP-ENQ-02');
      return;
    }

    const res = await request.get(`${BASE_URLS.backend}/api/v1/enquiries/buyer/mine`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    expect(res.status()).toBe(200);
    const enquiries = (await res.json()).data;
    const found = enquiries.find((e: any) => e.id === testEnquiryId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('CONTACTED');
  });

  test('SUPP-ENQ-04: Buyer CANNOT update enquiry status (403)', async ({ request }) => {
    if (!testEnquiryId) {
      test.skip(true, 'Depends on SUPP-ENQ-01');
      return;
    }
    const res = await request.put(`${BASE_URLS.backend}/api/v1/enquiries/${testEnquiryId}/status`, {
      data: { status: 'RESPONDED' },
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('SUPP-ENQ-05: Supplier enquiry list visible in supplier UI', async ({ page }) => {
    await page.goto(`${BASE_URLS.supplier}/login`);
    await page.locator('input[placeholder*="9000000004"]').fill(TEST_ACCOUNTS.supplierVerified.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.supplierVerified.password);

    const [enqResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/enquiries/supplier/received'), { timeout: 20000 }),
      Promise.all([
        page.waitForURL('**/dashboard', { timeout: 20000 }),
        page.getByTestId('login-submit').click(),
      ]),
    ]);

    expect(enqResponse.status()).toBe(200);

    // Click Buyer Enquiries tab
    await page.getByText('Buyer Enquiries', { exact: true }).first().click();
    await expect(page.getByText('Buyer Enquiries', { exact: true })).toBeVisible({ timeout: 10000 });
  });
});
