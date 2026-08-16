import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 17 — DATABASE INTEGRITY', () => {
  test('Prisma DB raw query connection succeeds through health endpoint', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.db).toBe('connected');
  });
});
