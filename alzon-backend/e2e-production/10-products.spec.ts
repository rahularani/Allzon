import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 10 — PRODUCTS API', () => {
  test('Fetch public products list successfully', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/products`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
