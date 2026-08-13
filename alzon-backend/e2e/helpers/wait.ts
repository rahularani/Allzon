import { Page } from '@playwright/test';

/**
 * Wait until a loading indicator disappears
 */
export async function waitForLoadingToFinish(page: Page, loadingText = 'Loading') {
  try {
    // Wait for any loading text to appear and then disappear
    await page.waitForFunction(
      (text) => !document.body.innerText.includes(text),
      loadingText,
      { timeout: 20000 }
    );
  } catch {
    // If loading never appeared or already finished, continue
  }
}

/**
 * Retry a function up to maxAttempts with delay
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('retry exhausted');
}

/**
 * Short sleep utility
 */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
