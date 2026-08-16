import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../playwright.production.config';

test.describe('TEST 06 — BUYER UI', () => {
  test('Home page components render correctly', async ({ page }) => {
    await page.goto(BASE_URLS.buyer);
    await expect(page.locator('text=India\'s Premier B2B Sourcing Platform')).toBeVisible();
    await expect(page.locator('input[placeholder*="What wholesale products"]')).toBeVisible();
  });

  test('Categories page displays wholesale categories', async ({ page }) => {
    await page.goto(`${BASE_URLS.buyer}/categories`);
    // The actual heading in CategoriesPage.tsx is "Explore Wholesale Industry Sectors"
    // (not "All Wholesale Categories" — that was a stale test expectation).
    // The section label above the heading reads "All Categories".
    await expect(page.getByRole('heading', { name: 'Explore Wholesale Industry Sectors' })).toBeVisible();
  });

  test('Search page performs queries', async ({ page }) => {
    await page.goto(`${BASE_URLS.buyer}/products?q=cotton`);
    // The search input is in the Navbar with a different placeholder.
    // The product listing page heading shows the search query when `q` is set.
    // Verify the page loaded and displays search results heading.
    await expect(page.getByRole('heading', { name: /Search results for/ })).toBeVisible();
  });
});
