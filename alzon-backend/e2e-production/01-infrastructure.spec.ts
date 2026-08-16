import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 01 — INFRASTRUCTURE', () => {
  test('Backend health and db connected', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.db).toBe('connected');
  });

  test('Buyer, Supplier, Admin pages load successfully', async ({ page }) => {
    for (const url of [BASE_URLS.buyer, BASE_URLS.supplier, BASE_URLS.admin]) {
      const response = await page.goto(url);
      expect(response?.status()).toBe(200);
    }
  });

  test('CORS handles origin checks correctly', async ({ request }) => {
    const res = await request.fetch(`${BASE_URLS.backend}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: BASE_URLS.buyer,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization,X-Portal',
      },
    });
    expect(res.status()).toBe(204);
    expect(res.headers()['access-control-allow-origin']).toBe(BASE_URLS.buyer);
    expect(res.headers()['access-control-allow-credentials']).toBe('true');
  });
});
