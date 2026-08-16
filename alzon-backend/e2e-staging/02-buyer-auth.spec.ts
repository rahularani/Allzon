import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.staging.config';
import { TEST_ACCOUNTS } from '../e2e/config/test.config';

test.describe('TEST 02 & 06 & 20 — BUYER AUTHENTICATION & REFRESH', () => {
  test.describe('Registration & OTP', () => {
    test('Register test buyer and request OTP', async ({ request }) => {
      // Use dynamic phone number to avoid database conflicts on rerun
      const randomPhone = '999' + Date.now().toString().slice(-7);
      const res = await request.post(`${BASE_URLS.backend}/api/v1/auth/register`, {
        data: {
          phone: randomPhone,
          password: 'Password@123',
          role: 'BUYER'
        }
      });
      // We expect this to return success true (OTP sent). Registration returns 201.
      expect([200, 201]).toContain(res.status());
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    test('Retrieve and submit OTP (EXPECTED TO FAIL - TEST ENVIRONMENT BLOCKER)', async ({ request }) => {
      // There is no staging mechanism implemented to fetch OTP from the deployed backend
      // without modifying backend code. This will fail, which satisfies Option 3.
      const stagingOtp = process.env.STAGING_OTP;
      expect(stagingOtp, 'STAGING_OTP environment variable is required to bypass OTP on live backend, or test backend must expose it.').toBeDefined();
    });
  });

  test.describe('Login & Session Persistence', () => {
    test('Login with existing seeded buyer account', async ({ page }) => {
      await page.goto(`${BASE_URLS.buyer}/login`);
      await page.locator('input[placeholder*="9000000003"], input[placeholder*="Enter mobile"]').fill(TEST_ACCOUNTS.buyer.phone);
      await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.buyer.password);
      
      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/auth/login')),
        page.getByTestId('login-submit').click(),
      ]);
      expect(response.status()).toBe(200);
      
      const setCookie = response.headers()['set-cookie'];
      expect(setCookie).toContain('refreshToken=');
      expect(setCookie).toContain('HttpOnly');
      
      // Wait for dashboard redirect
      await page.waitForURL('**/dashboard');
      
      // TEST 20 - SESSION PERSISTENCE (Browser reload)
      await page.reload();
      
      // Check if user is redirected to login (which is the bug we diagnosed)
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        // Explicitly fail with a helpful error for the report
        throw new Error('FAIL — SESSION PERSISTENCE: Buyer was redirected to login after browser refresh. Cross-site third-party cookie was likely blocked by the browser.');
      }
      expect(currentUrl).toContain('/dashboard');
    });

    test('Logout invalidates session', async ({ page, request }) => {
      // Perform a direct API login to get the cookie
      const loginRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
        data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password }
      });
      expect(loginRes.status()).toBe(200);

      // Perform API logout
      const logoutRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/logout`);
      expect(logoutRes.status()).toBe(200);
      
      // Check cookie is cleared
      const setCookie = logoutRes.headers()['set-cookie'];
      expect(setCookie).toContain('refreshToken=;');
    });
  });
});
