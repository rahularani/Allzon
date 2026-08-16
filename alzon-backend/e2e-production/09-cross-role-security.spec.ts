import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 09 — CROSS-ROLE SECURITY', () => {
  test('Accessing protected admin API without auth returns 401/400', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/admin/dashboard/stats`);
    // Expected 401 or 400 (if X-Portal header missing)
    expect([400, 401]).toContain(res.status());
  });

  test('Accessing protected supplier API without auth returns 401/400', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/products/supplier/mine`);
    expect([400, 401]).toContain(res.status());
  });
});
