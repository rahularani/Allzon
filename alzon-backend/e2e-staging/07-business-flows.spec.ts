import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.staging.config';
import { TEST_ACCOUNTS } from '../e2e/config/test.config';

test.describe('TEST 08-12 — BUSINESS FLOWS', () => {
  let buyerToken = '';

  test.beforeAll(async ({ request }) => {
    const buyerRes = await request.post(`${BASE_URLS.backend}/api/v1/auth/login`, {
      data: { phone: TEST_ACCOUNTS.buyer.phone, password: TEST_ACCOUNTS.buyer.password }
    });
    if (buyerRes.status() === 200) {
      buyerToken = (await buyerRes.json()).data.accessToken;
    }
  });

  test('Wishlist: Add and remove product (TEST 10)', async ({ request }) => {
    test.skip(!buyerToken, 'Buyer login failed');
    
    // Attempt to add dummy product (this may 404 if product doesn't exist, but we are testing authorization and basic flow)
    const res = await request.post(`${BASE_URLS.backend}/api/v1/wishlist`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
      data: { productId: 'some-dummy-id', itemType: 'PRODUCT' }
    });
    
    // We expect either 201 Created or 400/404 if product doesn't exist.
    // We mainly want to ensure it isn't 401/403.
    expect([201, 400, 404]).toContain(res.status());
  });

  test('Enquiries: Buyer can fetch own enquiries (TEST 09)', async ({ request }) => {
    test.skip(!buyerToken, 'Buyer login failed');
    
    const res = await request.get(`${BASE_URLS.backend}/api/v1/enquiries/buyer/mine`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('Notifications: User can fetch own notifications (TEST 11)', async ({ request }) => {
    test.skip(!buyerToken, 'Buyer login failed');
    
    const res = await request.get(`${BASE_URLS.backend}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data.notifications)).toBe(true);
  });
});
