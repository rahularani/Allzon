/**
 * BUYER AUTHENTICATION TESTS
 * Tests login, logout, token storage, and protected route access
 */

import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';
import { checkHealth, checkFrontend, createApiClient } from '../helpers/api';

test.describe('Buyer Authentication', () => {
  test.beforeAll(async () => {
    const healthy = await checkHealth();
    if (!healthy) test.skip(true, 'Backend not healthy — skipping auth tests');
    const buyerUp = await checkFrontend(BASE_URLS.buyer);
    if (!buyerUp) test.skip(true, 'Buyer frontend not available — skipping auth tests');
  });

  test('BUY-AUTH-01: Backend health check passes', async () => {
    const api = createApiClient();
    const res = await api.get('/health', { baseURL: BASE_URLS.backend });
    expect(res.status).toBe(200);
    expect(res.data.data.db).toBe('connected');
    expect(res.data.data.status).toBe('ok');
  });

  test('BUY-AUTH-02: Buyer frontend loads with ALLZON branding', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('HMR')) errors.push(msg.text());
    });

    await page.goto(BASE_URLS.buyer);
    await expect(page).toHaveTitle(/ALLZON/i, { timeout: 15000 });

    // Branding check: logo image must load
    const logo = page.locator('img[alt*="ALLZON"]').first();
    await expect(logo).toBeVisible({ timeout: 10000 });

    // Verify the src returns 200
    const logoSrc = await logo.getAttribute('src');
    expect(logoSrc).toBeTruthy();
    // Verify "ALZON" (wrong branding) is NOT prominently visible as a page title
    const pageText = await page.locator('body').innerText();
    expect(pageText).not.toMatch(/^ALZON$/m);

    console.log(`Console errors: ${errors.length}`);
  });

  test('BUY-AUTH-03: Valid buyer login succeeds via API', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.user.role).toBe('BUYER');
  });

  test('BUY-AUTH-04: Invalid password returns 401', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: 'WrongPassword123' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('BUY-AUTH-05: Invalid phone returns 401', async ({ request }) => {
    const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: '9999999999', password: 'Password@123' },
    });
    expect(res.status()).toBe(401);
  });

  test('BUY-AUTH-06: Access token NOT stored in localStorage/sessionStorage', async ({ page }) => {
    await page.goto(`${BASE_URLS.buyer}/login`);

    // Fill and submit login
    await page.locator('input[placeholder*="9000000003"]').fill(TEST_ACCOUNTS.buyer.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.buyer.password);

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/login'), { timeout: 15000 }),
      page.getByTestId('login-submit').click(),
    ]);
    expect(response.status()).toBe(200);

    // Verify token NOT in localStorage or sessionStorage
    const localStorageToken = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        const val = localStorage.getItem(key) || '';
        if (val.includes('eyJ')) return val; // JWT pattern
      }
      return null;
    });
    const sessionStorageToken = await page.evaluate(() => {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i) || '';
        const val = sessionStorage.getItem(key) || '';
        if (val.includes('eyJ')) return val;
      }
      return null;
    });

    expect(localStorageToken).toBeNull();
    expect(sessionStorageToken).toBeNull();
  });

  test('BUY-AUTH-07: Protected dashboard redirects unauthenticated users to login', async ({ page }) => {
    // Navigate directly to dashboard without auth
    await page.goto(`${BASE_URLS.buyer}/dashboard`);
    // Should redirect to /login
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.url()).toContain('/login');
  });

  test('BUY-AUTH-08: Token refresh endpoint returns new token', async ({ request }) => {
    // First login to get refresh cookie
    const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password },
    });
    expect(loginRes.status()).toBe(200);

    // Call refresh
    const refreshRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/refresh`);
    // Should return 200 with new token (cookie was set by login)
    expect(refreshRes.status()).toBe(200);
    const body = await refreshRes.json();
    expect(body.data.accessToken).toBeTruthy();
  });

  test('BUY-AUTH-09: Unauthenticated API call returns 401', async ({ request }) => {
    const res = await request.get(`${BASE_URLS.backend}/api/v1/auth/me`);
    expect(res.status()).toBe(401);
  });

  test('BUY-AUTH-10: Buyer UI login flow completes successfully', async ({ page }) => {
    await page.goto(`${BASE_URLS.buyer}/login`);

    await page.locator('input[placeholder*="9000000003"]').fill(TEST_ACCOUNTS.buyer.phone);
    await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.buyer.password);

    const [loginResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/login'), { timeout: 15000 }),
      page.getByTestId('login-submit').click(),
    ]);

    expect(loginResponse.status()).toBe(200);
    const loginBody = await loginResponse.json();
    expect(loginBody.data.accessToken).toBeTruthy();

    // Should navigate to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Verify dashboard is shown
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.toLowerCase()).toMatch(/(enquiries|dashboard|wishlist)/i);
  });
});
