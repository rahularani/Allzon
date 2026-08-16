import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 16 — API CONTRACT', () => {
  test('Categories endpoint structure and fields', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/categories`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      const cat = body.data[0];
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('slug');
    }
  });
});
