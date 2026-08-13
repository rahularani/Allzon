import { Page } from '@playwright/test';
import { TEST_ACCOUNTS, BASE_URLS } from '../config/test.config';
import { authedClient, apiLogin } from '../helpers/api';

/**
 * Login admin via UI
 */
export async function loginAdminViaUI(page: Page) {
  await page.goto(`${BASE_URLS.admin}/login`);
  
  const phoneInput = page.locator('input[placeholder*="9000000001"]').first();
  await phoneInput.fill(TEST_ACCOUNTS.admin.phone);
  
  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill(TEST_ACCOUNTS.admin.password);
  
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
}

/**
 * Login verification staff via UI
 */
export async function loginStaffViaUI(page: Page) {
  await page.goto(`${BASE_URLS.admin}/login`);
  
  const phoneInput = page.locator('input[placeholder*="9000000001"]').first();
  await phoneInput.fill(TEST_ACCOUNTS.staff.phone);
  
  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill(TEST_ACCOUNTS.staff.password);
  
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
}

export async function apiAdminLogin() {
  return apiLogin(TEST_ACCOUNTS.admin.phone, TEST_ACCOUNTS.admin.password);
}

export async function apiStaffLogin() {
  return apiLogin(TEST_ACCOUNTS.staff.phone, TEST_ACCOUNTS.staff.password);
}

export async function getAdminApiClient() {
  const { accessToken } = await apiAdminLogin();
  return authedClient(accessToken);
}

export async function getStaffApiClient() {
  const { accessToken } = await apiStaffLogin();
  return authedClient(accessToken);
}
