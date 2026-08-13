/**
 * SUPPLIER PRODUCT MANAGEMENT TESTS
 * Tests product creation, initial PENDING status, and listing
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS, E2E_TIMESTAMP } from '../config/test.config';

const TEST_PRODUCT_NAME = `E2E_PRODUCT_${E2E_TIMESTAMP}`;
let createdProductId: string | null = null;
let supplierAccessToken: string;
let categoryId: string;

test.describe('Supplier Product Management', () => {
  test.beforeAll(async ({ request }) => {
    // Login supplier
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: {
        phone: TEST_ACCOUNTS.supplierVerified.phone,
        password: TEST_ACCOUNTS.supplierVerified.password,
      },
    });
    expect(loginRes.status()).toBe(200);
    supplierAccessToken = (await loginRes.json()).data.accessToken;

    // Get a category
    const catRes = await request.get(`${BASE_URLS.backend}/api/v1/categories`);
    const cats = (await catRes.json()).data;
    if (cats.length > 0) {
      categoryId = cats[0].id;
    }
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: delete the test product if it was created
    if (createdProductId && supplierAccessToken) {
      await request.delete(`${BASE_URLS.backend}/api/v1/products/${createdProductId}`, {
        headers: { Authorization: `Bearer ${supplierAccessToken}` },
      });
    }
  });

  test('SUPP-PROD-01: Supplier can create a product — initial status is PENDING', async ({ request }) => {
    if (!categoryId) {
      test.skip(true, 'No categories available for product creation test');
      return;
    }

    const res = await request.post(`${BASE_URLS.backend}/api/v1/products`, {
      data: {
        name: TEST_PRODUCT_NAME,
        categoryId,
        priceMin: 150,
        priceMax: 250,
        moq: 100,
        description: 'E2E Test product — automated test, please ignore or delete',
      },
      headers: { Authorization: `Bearer ${supplierAccessToken}` },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
    expect(body.data.name).toBe(TEST_PRODUCT_NAME);
    expect(body.data.status).toBe('PENDING');

    createdProductId = body.data.id;
  });

  test('SUPP-PROD-02: Created product appears in supplier product list', async ({ request }) => {
    if (!createdProductId) {
      test.skip(true, 'Depends on SUPP-PROD-01');
      return;
    }

    const res = await request.get(`${BASE_URLS.backend}/api/v1/products/supplier/mine`, {
      headers: { Authorization: `Bearer ${supplierAccessToken}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    const products = body.data;
    expect(Array.isArray(products)).toBe(true);

    const found = products.find((p: any) => p.id === createdProductId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('PENDING');
  });

  test('SUPP-PROD-03: PENDING product does NOT appear in public product search', async ({ request }) => {
    if (!createdProductId) {
      test.skip(true, 'Depends on SUPP-PROD-01');
      return;
    }

    const res = await request.get(
      `${BASE_URLS.backend}/api/v1/products?q=${encodeURIComponent(TEST_PRODUCT_NAME)}`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    const products = body.data;

    const found = products.find((p: any) => p.id === createdProductId);
    expect(found).toBeUndefined(); // PENDING product must not be publicly visible
  });

  test('SUPP-PROD-04: BUYER cannot create a product (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    const token = (await loginRes.json()).data.accessToken;

    const res = await request.post(`${BASE_URLS.backend}/api/v1/products`, {
      data: { name: 'Unauthorized product', priceMin: 100, priceMax: 200, moq: 50 },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('SUPP-PROD-05: Supplier product list loads in UI dashboard', async ({ page }) => {
    await page.goto(`${BASE_URLS.supplier}/login`);
    await page.locator('input[placeholder*="9000000004"]').fill(TEST_ACCOUNTS.supplierVerified.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.supplierVerified.password);

    const [prodResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/products/supplier/mine'), { timeout: 20000 }),
      Promise.all([
        page.waitForURL('**/dashboard', { timeout: 20000 }),
        page.locator('button[type="submit"]').click(),
      ]),
    ]);

    expect(prodResponse.status()).toBe(200);
    
    // Click My Products tab
    await page.getByText('My Products', { exact: false }).first().click();
    await expect(page.getByText('My Products', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('SUPP-PROD-06: Product creation via supplier UI dashboard', async ({ page }) => {
    if (!categoryId) {
      test.skip(true, 'No categories available for UI product creation test');
      return;
    }

    await page.goto(`${BASE_URLS.supplier}/login`);
    await page.locator('input[placeholder*="9000000004"]').fill(TEST_ACCOUNTS.supplierVerified.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.supplierVerified.password);

    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 20000 }),
      page.locator('button[type="submit"]').click(),
    ]);

    // Click Add New Product tab
    await page.getByText('Add New Product', { exact: false }).first().click();

    // Fill product form
    const uiProductName = `E2E_UI_PRODUCT_${E2E_TIMESTAMP}`;
    const nameInput = page.locator('input[placeholder*="Bio-washed"], input[placeholder*="Cotton"], input[placeholder*="product name"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(uiProductName);
    
    // Price Min input
    const priceMinInput = page.locator('input[placeholder*="120"], input[placeholder*="Min Price"]').first();
    await priceMinInput.fill('200');
    
    // Price Max
    const priceMaxInput = page.locator('input[placeholder*="150"], input[placeholder*="Max Price"]').first();
    await priceMaxInput.fill('300');

    // MOQ
    const moqInput = page.locator('input[placeholder*="100"], input[placeholder*="Minimum Order"]').first();
    await moqInput.fill('100');

    // Desc
    const descInput = page.locator('textarea[placeholder*="fabric"]').first();
    await descInput.fill('Premium quality cotton product for E2E tests.');

    const [submitResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/products') && r.request().method() === 'POST', { timeout: 20000 }),
      page.getByTestId('add-product-submit').click(),
    ]);

    expect(submitResponse.status()).toBe(201);
    const body = await submitResponse.json();
    expect(body.data.status).toBe('PENDING');

    // Cleanup this UI-created product
    if (supplierAccessToken && body.data.id) {
      const api = await import('../helpers/api');
      const client = api.authedClient(supplierAccessToken);
      await client.delete(`/products/${body.data.id}`).catch(() => {});
    }
  });
});
