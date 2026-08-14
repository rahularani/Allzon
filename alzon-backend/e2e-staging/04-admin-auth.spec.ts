import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.staging.config';

test.describe('TEST 04 — ADMIN AUTHENTICATION', () => {
  test('Login using environment-provided admin credentials', async ({ page, request }) => {
    const adminPhone = process.env.STAGING_ADMIN_PHONE;
    const adminPassword = process.env.STAGING_ADMIN_PASSWORD;
    
    if (!adminPhone || !adminPassword) {
      test.skip(true, 'BLOCKED — STAGING_ADMIN_PHONE / STAGING_ADMIN_PASSWORD not configured.');
      return;
    }

    // Try API login to see if the user exists
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: adminPhone, password: adminPassword }
    });
    
    if (res.status() === 401) {
      throw new Error('TEST ENVIRONMENT BLOCKER: Admin account does not exist in staging database or invalid credentials.');
    }
    
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.user.role).toBe('ADMIN');
  });
});
