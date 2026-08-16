import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.staging.config';

test.describe('TEST 01 & 15 — INFRASTRUCTURE & CORS', () => {
  test('Backend /health returns 200 with production env', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.db).toBe('connected');
    expect(body.data.env).toBe('production');
  });

  test('Buyer URL returns 200', async ({ request }) => {
    const res = await request.get(BASE_URLS.buyer);
    expect(res.status()).toBe(200);
  });

  test('Supplier URL returns 200', async ({ request }) => {
    const res = await request.get(BASE_URLS.supplier);
    expect(res.status()).toBe(200);
  });

  test('Admin URL returns 200', async ({ request }) => {
    const res = await request.get(BASE_URLS.admin);
    expect(res.status()).toBe(200);
  });

  test('CORS allows buyer origin', async ({ request }) => {
    const res = await request.fetch(`${BASE_URLS.backend}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: BASE_URLS.buyer,
        'Access-Control-Request-Method': 'GET',
      },
    });
    // In Express cors middleware, a preflight OPTIONS returns 204
    expect(res.status()).toBe(204);
    const headers = res.headers();
    expect(headers['access-control-allow-origin']).toBe(BASE_URLS.buyer);
  });
});
