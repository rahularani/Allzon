import { Page, expect } from '@playwright/test';

/**
 * Wait for a network response matching a URL pattern
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  trigger: () => Promise<void>,
): Promise<any> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (resp) =>
        (typeof urlPattern === 'string'
          ? resp.url().includes(urlPattern)
          : urlPattern.test(resp.url())),
      { timeout: 20000 }
    ),
    trigger(),
  ]);
  return response;
}

/**
 * Assert no critical console errors during page lifecycle
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      // Ignore known Vite HMR noise
      const text = msg.text();
      if (!text.includes('[HMR]') && !text.includes('WebSocket')) {
        errors.push(text);
      }
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`[PageError] ${err.message}`);
  });
  return errors;
}

/**
 * Assert page has loaded (no blank / infinite spinner)
 */
export async function assertPageLoaded(page: Page, minContentSelector = 'body') {
  await expect(page.locator(minContentSelector)).not.toBeEmpty({ timeout: 15000 });
}

/**
 * Assert that an element with given text is visible
 */
export async function assertTextVisible(page: Page, text: string) {
  await expect(page.getByText(text, { exact: false })).toBeVisible({ timeout: 10000 });
}

/**
 * Assert that a response returned the expected HTTP status
 */
export function assertStatus(statusCode: number, expected: number, label: string) {
  if (statusCode !== expected) {
    throw new Error(`${label}: expected HTTP ${expected}, got ${statusCode}`);
  }
}
