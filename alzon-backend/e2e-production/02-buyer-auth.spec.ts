import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 02 — BUYER AUTHENTICATION', () => {
  test('Redirect to login when accessing dashboard unauthenticated', async ({ page }) => {
    await page.goto(`${BASE_URLS.buyer}/dashboard`);
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('Login with invalid credentials returns error', async ({ page }) => {
    await page.goto(`${BASE_URLS.buyer}/login`);
    await page.locator('input[placeholder*="Enter mobile"]').fill('9999999999');
    await page.locator('input[type="password"]').fill('WrongPassword123');
    await page.getByTestId('login-submit').click();
    
    // The error div does not have role="alert" — it's a styled <div> rendered
    // conditionally when `error` state is set. We locate it by its error text,
    // which the backend returns as "Invalid phone number or password".
    const errorText = page.getByText('Invalid phone number or password');
    await expect(errorText).toBeVisible();
  });
});
