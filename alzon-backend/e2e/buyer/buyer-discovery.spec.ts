/**
 * BUYER DISCOVERY TESTS
 * Tests homepage, category browsing, product search, product detail
 */

import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../config/test.config';
import { createApiClient } from '../helpers/api';

test.describe('Buyer Discovery', () => {
  test('BUY-DISC-01: Homepage loads categories from API', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error' && !text.includes('HMR') && !text.includes('401')) {
        errors.push(text);
      }
    });

    const [catResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/categories') && r.request().method() === 'GET', { timeout: 20000 }),
      page.goto(BASE_URLS.buyer),
    ]);

    expect(catResponse.status()).toBe(200);
    const catBody = await catResponse.json();
    expect(Array.isArray(catBody.data)).toBe(true);

    // Verify categories appear on page
    await expect(page.getByText('Explore Wholesale Markets', { exact: false })).toBeVisible({ timeout: 10000 });
    console.log(`Homepage console errors: ${errors.length}`);
    expect(errors.length).toBe(0);
  });

  test('BUY-DISC-02: Homepage loads products from API', async ({ page }) => {
    const [prodResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/products'), { timeout: 20000 }),
      page.goto(BASE_URLS.buyer),
    ]);

    expect(prodResponse.status()).toBe(200);
    const body = await prodResponse.json();
    // Should return array (may be empty in fresh DB, but array is correct)
    expect(body).toHaveProperty('data');
  });

  test('BUY-DISC-03: Search navigates to product listing page', async ({ page }) => {
    await page.goto(BASE_URLS.buyer);

    const searchInput = page.locator('input[placeholder*="wholesale"]').first();
    await searchInput.fill('Cotton T-Shirt');

    const searchBtn = page.getByRole('button', { name: /search wholesale/i });
    await searchBtn.click();

    await page.waitForURL(/\/products\?q=/, { timeout: 10000 });
    expect(page.url()).toContain('/products?q=Cotton');
  });

  test('BUY-DISC-04: Product listing page loads and renders results', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/products'), { timeout: 20000 }),
      page.goto(`${BASE_URLS.buyer}/products`),
    ]);

    expect(response.status()).toBe(200);
    await expect(page.locator('body')).not.toContainText('Loading products', { timeout: 15000 });
  });

  test('BUY-DISC-05: Categories page loads all categories', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/categories') && r.request().method() === 'GET', { timeout: 20000 }),
      page.goto(`${BASE_URLS.buyer}/categories`),
    ]);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('BUY-DISC-06: Supplier directory loads with API data', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/suppliers') && r.request().method() === 'GET', { timeout: 20000 }),
      page.goto(`${BASE_URLS.buyer}/suppliers`),
    ]);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
  });

  test('BUY-DISC-07: Public product API returns approved products', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/products`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    // Verify all returned products are APPROVED
    for (const product of body.data) {
      expect(product.status).toBe('APPROVED');
    }
  });

  test('BUY-DISC-08: Invalid product ID returns appropriate response', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/products/nonexistent-product-99999`);
    expect([404, 400]).toContain(res.status());
  });

  test('BUY-DISC-09: Public categories API returns category tree', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/categories`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      expect(body.data[0]).toHaveProperty('name');
      expect(body.data[0]).toHaveProperty('slug');
    }
  });

  test('BUY-DISC-10: Responsive layout - Mobile 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URLS.buyer);

    // Page should load without horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 390;
    // Allow a small margin for scrollbar
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
    
    // Main content should be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('BUY-DISC-11: Responsive layout - Tablet 1024x768', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(BASE_URLS.buyer);
    await expect(page.locator('body')).toBeVisible();
    
    // Search bar should be accessible on tablet
    const searchInput = page.locator('input[placeholder*="wholesale"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('BUY-DISC-12: Responsive layout - Desktop 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URLS.buyer);
    
    await expect(page.getByText('India\'s Premier B2B Sourcing Platform', { exact: false })).toBeVisible({ timeout: 10000 });
  });
});
