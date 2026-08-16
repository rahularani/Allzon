import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';
import axios from 'axios';

test.describe('TEST 05 — SESSION ISOLATION', () => {
  // Test A: API-level cookie isolation & cross-portal rejection
  //
  // Security invariants tested:
  // 1. Admin login succeeds with correct portal header → 200
  // 2. Cross-portal refresh (no valid buyer token + buyer header) is REJECTED → 401
  // 3. Cross-portal login (admin creds + buyer portal) is REJECTED → 401
  //    (loginHandler validates user.role against portal)

  test('Cookie isolation & Cross-cookie rejection', async () => {
    const adminPhone = process.env.STAGING_ADMIN_PHONE || '8056666653';
    const adminPassword = process.env.STAGING_ADMIN_PASSWORD || 'Allzon@2026';

    // Step 1: Login as admin — verify 200 and get access token
    const loginRes = await axios.post(
      `${BASE_URLS.backend}/api/v1/auth/login`,
      { phone: adminPhone, password: adminPassword },
      { headers: { 'X-Portal': 'admin' } }
    );
    expect(loginRes.status).toBe(200);
    expect(loginRes.data.data.accessToken).toBeTruthy();
    expect(loginRes.data.data.user.role).toMatch(/^(ADMIN|VERIFICATION_STAFF)$/);

    // Step 2: Attempt refresh with buyer portal header but no valid buyer cookie → 401
    try {
      await axios.post(
        `${BASE_URLS.backend}/api/v1/auth/refresh`,
        {},
        { headers: { 'X-Portal': 'buyer' } }
      );
      // Should not reach here
      expect(true, 'Refresh without token should have been rejected').toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(401);
    }

    // Step 3: Cross-portal login — admin user on buyer portal MUST be rejected.
    // This is a critical security boundary: portal role guards in loginHandler
    // check (portal === 'buyer' && user.role !== 'BUYER') → 401.
    //
    // We use validateStatus to prevent axios from throwing on non-2xx,
    // so we can directly assert the status code without try/catch ambiguity.
    const crossPortalRes = await axios.post(
      `${BASE_URLS.backend}/api/v1/auth/login`,
      { phone: adminPhone, password: adminPassword },
      {
        headers: { 'X-Portal': 'buyer' },
        validateStatus: () => true, // Don't throw on any status
      }
    );
    // SECURITY ASSERTION: Admin user must NOT be able to login on buyer portal
    expect(
      crossPortalRes.status,
      `SECURITY: Admin user logged in on buyer portal with status ${crossPortalRes.status}. ` +
      `Expected 401. Response: ${JSON.stringify(crossPortalRes.data)}`
    ).toBe(401);
  });

  test('Three simultaneous browser pages reload isolation', async ({ browser }) => {
    const adminPhone = process.env.STAGING_ADMIN_PHONE || '8056666653';
    const adminPassword = process.env.STAGING_ADMIN_PASSWORD || 'Allzon@2026';

    // Use separate browser contexts to avoid cookie contamination
    const adminContext = await browser.newContext();
    const buyerContext = await browser.newContext();
    const supplierContext = await browser.newContext();

    try {
      // Step 1: Login admin in its own isolated context
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${BASE_URLS.admin}/login`);
      await adminPage.locator('input[placeholder*="Enter mobile"]').fill(adminPhone);
      await adminPage.locator('input[type="password"]').fill(adminPassword);

      await Promise.all([
        adminPage.waitForURL('**/dashboard'),
        adminPage.getByTestId('login-submit').click(),
      ]);

      // Verify admin dashboard loaded
      await expect(adminPage.getByText('ADMIN & MODERATION CONSOLE')).toBeVisible();

      // Step 2: In a SEPARATE context, access buyer dashboard — should redirect to login
      const buyerPage = await buyerContext.newPage();
      await buyerPage.goto(`${BASE_URLS.buyer}/dashboard`);
      await buyerPage.waitForURL('**/login');
      expect(buyerPage.url()).toContain('/login');

      // Step 3: In a SEPARATE context, access supplier dashboard — should redirect to login
      const supplierPage = await supplierContext.newPage();
      await supplierPage.goto(`${BASE_URLS.supplier}/dashboard`);
      await supplierPage.waitForURL('**/login');
      expect(supplierPage.url()).toContain('/login');

      // Step 4: Reload admin — should still be authenticated
      await adminPage.reload();
      await expect(adminPage.getByText('ADMIN & MODERATION CONSOLE')).toBeVisible();
    } finally {
      await adminContext.close();
      await buyerContext.close();
      await supplierContext.close();
    }
  });
});
