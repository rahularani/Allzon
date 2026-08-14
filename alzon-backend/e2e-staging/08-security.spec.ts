import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.staging.config';
import { TEST_ACCOUNTS } from '../e2e/config/test.config';

test.describe('TEST 13-14 — SECURITY & DOCUMENTS', () => {
  test('Private documents cannot be accessed publicly (TEST 13)', async ({ request }) => {
    // Check endpoints that return/modify private documents
    const res1 = await request.get(`${BASE_URLS.backend}/api/v1/verification/status`);
    expect(res1.status()).toBe(401);
  });

  test('Cloudinary configuration check (TEST 14)', async ({ request }) => {
    // Attempt dummy uploads unauthenticated to see if protected
    const resLogo = await request.post(`${BASE_URLS.backend}/api/v1/suppliers/profile/logo`);
    expect(resLogo.status()).toBe(401);

    const resProductImages = await request.post(`${BASE_URLS.backend}/api/v1/products/some-id/images`);
    expect(resProductImages.status()).toBe(401);

    const resVerificationDocs = await request.post(`${BASE_URLS.backend}/api/v1/verification/documents`);
    expect(resVerificationDocs.status()).toBe(401);
  });
});
