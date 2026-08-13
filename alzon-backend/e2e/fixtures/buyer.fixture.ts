import { Page } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';
import { authedClient, apiLogin } from '../helpers/api';

/**
 * Login a buyer via UI and return access token acquired from API calls intercepted
 */
export async function loginBuyerViaUI(page: Page) {
  await page.goto(`${BASE_URLS.buyer}/login`);
  // The login page pre-fills buyer credentials
  // Clear and fill phone
  const phoneInput = page.locator('input[placeholder*="9000000003"]').first();
  await phoneInput.fill(TEST_ACCOUNTS.buyer.phone);
  
  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill(TEST_ACCOUNTS.buyer.password);

  await page.locator('button[type="submit"]').click();
  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: 20000 });
}

/**
 * Login a buyer via API (faster, for non-UI tests)
 */
export async function apiBuyerLogin() {
  return apiLogin(TEST_ACCOUNTS.buyer.phone, TEST_ACCOUNTS.buyer.password);
}

export async function getBuyerApiClient() {
  const { accessToken } = await apiBuyerLogin();
  return authedClient(accessToken);
}
