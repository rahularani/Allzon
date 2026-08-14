import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.staging.config';
import { TEST_ACCOUNTS } from '../e2e/config/test.config';

test.describe('TEST 05 — INVALID AUTHENTICATION', () => {
  test('Invalid password returns 401', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: 'WrongPassword123' }
    });
    expect(res.status()).toBe(401);
  });

  test('Invalid phone returns 401', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: '9999999999', password: 'Password@123' }
    });
    expect(res.status()).toBe(401);
  });

  test('Missing refresh token returns 401 (EXPECTED BEHAVIOR)', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/refresh`);
    expect(res.status()).toBe(401);
  });

  test('Logged-out user accessing protected API returns 401', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/auth/me`);
    expect(res.status()).toBe(401);
  });
});
