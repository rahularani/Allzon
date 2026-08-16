import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 14 — NOTIFICATIONS API', () => {
  test('Unauthenticated access to notifications list is rejected', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/notifications`);
    expect([400, 401]).toContain(res.status());
  });
});
