/**
 * BUYER NOTIFICATIONS TESTS
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';

test.describe('Buyer Notifications', () => {
  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    accessToken = (await loginRes.json()).data.accessToken;
  });

  test('BUY-NOTIF-01: Notifications API returns list for authenticated buyer', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // data.notifications should be an array
    const notifications = body.data?.notifications ?? body.data;
    expect(Array.isArray(notifications)).toBe(true);
  });

  test('BUY-NOTIF-02: Unauthenticated notifications returns 401', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/notifications`);
    expect(res.status()).toBe(401);
  });

  test('BUY-NOTIF-03: Notifications section visible in buyer dashboard', async ({ page }) => {
    await page.goto(`${BASE_URLS.buyer}/login`);
    await page.locator('input[placeholder*="9000000003"]').fill(TEST_ACCOUNTS.buyer.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.buyer.password);

    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 20000 }),
      page.getByTestId('login-submit').click(),
    ]);

    // Click notifications tab
    const notifTab = page.getByText('Notifications', { exact: false }).first();
    await notifTab.click();

    await expect(page.getByText('Notifications', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });
});
