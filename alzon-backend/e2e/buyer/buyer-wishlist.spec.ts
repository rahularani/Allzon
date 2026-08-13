/**
 * BUYER WISHLIST TESTS
 * Tests adding/removing items from wishlist, duplicate prevention
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';
import { getBuyerApiClient } from '../fixtures/buyer.fixture';

test.describe('Buyer Wishlist', () => {
  test('BUY-WISH-01: Buyer can add a product to wishlist via API', async ({ request }) => {
    // Login buyer
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    expect(loginRes.status()).toBe(200);
    const { accessToken } = (await loginRes.json()).data;

    // Get an approved product
    const prodRes = await request.get(`${BASE_URLS.backend}/api/v1/products`);
    expect(prodRes.status()).toBe(200);
    const products = (await prodRes.json()).data;

    if (products.length === 0) {
      test.skip(true, 'No approved products in DB to test wishlist');
      return;
    }

    const productId = products[0].id;
    
    // Get current wishlist count
    const wishlistBefore = await request.get(`${BASE_URLS.backend}/api/v1/wishlist`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const beforeCount = (await wishlistBefore.json()).data?.length ?? 0;

    // Add to wishlist (may fail with 409 if already there — acceptable)
    const addRes = await request.post(`${BASE_URLS.backend}/api/v1/wishlist`, {
      data: { itemType: 'PRODUCT', productId },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200, 201, 409]).toContain(addRes.status());

    // Verify wishlist now has an entry
    const wishlistAfter = await request.get(`${BASE_URLS.backend}/api/v1/wishlist`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(wishlistAfter.status()).toBe(200);
    const afterItems = (await wishlistAfter.json()).data;
    expect(Array.isArray(afterItems)).toBe(true);

    const hasProduct = afterItems.some((item: any) => item.productId === productId || item.product?.id === productId);
    expect(hasProduct).toBe(true);
  });

  test('BUY-WISH-02: Duplicate wishlist item returns 409 Conflict', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    const { accessToken } = (await loginRes.json()).data;

    const prodRes = await request.get(`${BASE_URLS.backend}/api/v1/products`);
    const products = (await prodRes.json()).data;
    if (products.length === 0) {
      test.skip(true, 'No approved products to test duplicate wishlist');
      return;
    }
    const productId = products[0].id;

    // First add
    await request.post(`${BASE_URLS.backend}/api/v1/wishlist`, {
      data: { itemType: 'PRODUCT', productId },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Second add — must return 409
    const dupeRes = await request.post(`${BASE_URLS.backend}/api/v1/wishlist`, {
      data: { itemType: 'PRODUCT', productId },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(dupeRes.status()).toBe(409);
  });

  test('BUY-WISH-03: Unauthenticated wishlist access returns 401', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/wishlist`);
    expect(res.status()).toBe(401);
  });

  test('BUY-WISH-04: Wishlist appears in buyer dashboard', async ({ page }) => {
    // Login via UI
    await page.goto(`${BASE_URLS.buyer}/login`);
    await page.locator('input[placeholder*="9000000003"]').fill(TEST_ACCOUNTS.buyer.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.buyer.password);
    
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 20000 }),
      page.getByTestId('login-submit').click(),
    ]);

    // Click Saved Items tab
    const wishlistTab = page.getByText('Saved Items', { exact: false }).first();
    await wishlistTab.click();

    // Should show wishlist section
    await expect(page.getByText('Saved Wishlist Items', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('BUY-WISH-05: SUPPLIER role cannot access buyer wishlist (403)', async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.supplierVerified.phone, password: TEST_ACCOUNTS.supplierVerified.password },
    });
    const { accessToken } = (await loginRes.json()).data;

    const res = await request.get(`${BASE_URLS.backend}/api/v1/wishlist`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(403);
  });
});
