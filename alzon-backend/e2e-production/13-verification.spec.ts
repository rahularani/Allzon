import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 13 — VERIFICATION API', () => {
  test('Unauthenticated access to verification queue is rejected', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/verification/queue`);
    expect([400, 401]).toContain(res.status());
  });
});
