import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 11 — ENQUIRIES UI', () => {
  test('Enquiry page redirects to login when unauthenticated', async ({ page }) => {
    // The buyer app routes the enquiry form at /enquiry (singular).
    // There is no /enquiries route — that was a stale test path.
    // EnquiryPage.tsx has a useEffect guard: if (!user) navigate('/login').
    await page.goto(`${BASE_URLS.buyer}/enquiry`);
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});
