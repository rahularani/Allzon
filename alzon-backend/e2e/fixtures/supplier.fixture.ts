import { Page } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';
import { authedClient, apiLogin } from '../helpers/api';

/**
 * Login a supplier (verified) via UI
 */
export async function loginSupplierViaUI(page: Page, phone = TEST_ACCOUNTS.supplierVerified.phone, password = TEST_ACCOUNTS.supplierVerified.password) {
  await page.goto(`${BASE_URLS.supplier}/login`);
  
  const phoneInput = page.locator('input[placeholder*="9000000004"]').first();
  await phoneInput.fill(phone);
  
  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill(password);
  
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
}

/**
 * Login supplier via API
 */
export async function apiSupplierLogin(
  phone = TEST_ACCOUNTS.supplierVerified.phone,
  password = TEST_ACCOUNTS.supplierVerified.password,
) {
  return apiLogin(phone, password);
}

export async function getSupplierApiClient() {
  const { accessToken } = await apiSupplierLogin();
  return authedClient(accessToken);
}

export async function getSupplierPendingApiClient() {
  const { accessToken } = await apiSupplierLogin(
    TEST_ACCOUNTS.supplierPending.phone,
    TEST_ACCOUNTS.supplierPending.password,
  );
  return authedClient(accessToken);
}
