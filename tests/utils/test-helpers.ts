/**
 * General Test Helper Utilities
 *
 * Provides common utilities and helper functions for E2E tests
 * including screenshots, waiting, form helpers, and more.
 */

import { Page, expect, Locator } from '@playwright/test';

/**
 * Wait for an element to be visible and ready
 * @param page - Playwright page instance
 * @param selector - Element selector
 * @param timeout - Optional timeout in milliseconds
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<Locator> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  return element;
}

/**
 * Fill form field with validation
 * @param page - Playwright page instance
 * @param selector - Input selector
 * @param value - Value to fill
 */
export async function fillField(page: Page, selector: string, value: string) {
  const field = await waitForElement(page, selector);
  await field.clear();
  await field.fill(value);
  // Verify the value was set
  await expect(field).toHaveValue(value);
}

/**
 * Click element and wait for navigation
 * @param page - Playwright page instance
 * @param selector - Element selector
 */
export async function clickAndWaitForNavigation(page: Page, selector: string) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click(selector)
  ]);
}

/**
 * Wait for API request to complete
 * @param page - Playwright page instance
 * @param urlPattern - URL pattern to match
 * @param action - Action to perform that triggers the request
 */
export async function waitForAPIRequest(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>
) {
  const [response] = await Promise.all([
    page.waitForResponse(urlPattern),
    action()
  ]);
  return response;
}

/**
 * Take screenshot with custom name
 * @param page - Playwright page instance
 * @param name - Screenshot name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true
  });
}

/**
 * Scroll element into view
 * @param page - Playwright page instance
 * @param selector - Element selector
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Wait for loading spinner to disappear
 * @param page - Playwright page instance
 */
export async function waitForLoadingToFinish(page: Page) {
  try {
    await page.waitForSelector('[data-testid="loading-spinner"]', {
      state: 'hidden',
      timeout: 15000
    });
  } catch {
    // No loading spinner present, continue
  }
}

/**
 * Check if element exists without throwing
 * @param page - Playwright page instance
 * @param selector - Element selector
 * @returns boolean indicating if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get element text content
 * @param page - Playwright page instance
 * @param selector - Element selector
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  const element = await waitForElement(page, selector);
  return (await element.textContent()) || '';
}

/**
 * Upload file to input
 * @param page - Playwright page instance
 * @param selector - File input selector
 * @param filePath - Path to file
 */
export async function uploadFile(page: Page, selector: string, filePath: string) {
  const fileInput = page.locator(selector);
  await fileInput.setInputFiles(filePath);
}

/**
 * Select dropdown option
 * @param page - Playwright page instance
 * @param selector - Select element selector
 * @param value - Option value
 */
export async function selectOption(page: Page, selector: string, value: string) {
  await page.selectOption(selector, value);
  await expect(page.locator(selector)).toHaveValue(value);
}

/**
 * Check/uncheck checkbox
 * @param page - Playwright page instance
 * @param selector - Checkbox selector
 * @param checked - Whether to check or uncheck
 */
export async function setCheckbox(page: Page, selector: string, checked: boolean) {
  const checkbox = page.locator(selector);
  if (checked) {
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  } else {
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  }
}

/**
 * Wait for element count
 * @param page - Playwright page instance
 * @param selector - Element selector
 * @param count - Expected count
 */
export async function waitForElementCount(
  page: Page,
  selector: string,
  count: number
) {
  await expect(page.locator(selector)).toHaveCount(count);
}

/**
 * Verify form validation error
 * @param page - Playwright page instance
 * @param fieldName - Field name (data-testid)
 * @param expectedError - Expected error message
 */
export async function verifyValidationError(
  page: Page,
  fieldName: string,
  expectedError: string
) {
  const errorSelector = `[data-testid="${fieldName}-error"]`;
  await waitForElement(page, errorSelector);
  await expect(page.locator(errorSelector)).toContainText(expectedError);
}

/**
 * Verify toast/notification message
 * @param page - Playwright page instance
 * @param message - Expected message
 * @param type - Toast type (success, error, info, warning)
 */
export async function verifyToast(
  page: Page,
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'success'
) {
  const toastSelector = `[data-testid="toast-${type}"]`;
  await waitForElement(page, toastSelector);
  await expect(page.locator(toastSelector)).toContainText(message);
}

/**
 * Clear all form fields
 * @param page - Playwright page instance
 * @param formSelector - Form selector
 */
export async function clearForm(page: Page, formSelector: string) {
  const inputs = page.locator(`${formSelector} input[type="text"], ${formSelector} input[type="email"], ${formSelector} input[type="password"], ${formSelector} textarea`);
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    await inputs.nth(i).clear();
  }
}

/**
 * Wait for network idle
 * @param page - Playwright page instance
 */
export async function waitForNetworkIdle(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Hover over element
 * @param page - Playwright page instance
 * @param selector - Element selector
 */
export async function hoverElement(page: Page, selector: string) {
  await page.locator(selector).hover();
}

/**
 * Double click element
 * @param page - Playwright page instance
 * @param selector - Element selector
 */
export async function doubleClick(page: Page, selector: string) {
  await page.locator(selector).dblclick();
}

/**
 * Right click element
 * @param page - Playwright page instance
 * @param selector - Element selector
 */
export async function rightClick(page: Page, selector: string) {
  await page.locator(selector).click({ button: 'right' });
}

/**
 * Press keyboard key
 * @param page - Playwright page instance
 * @param key - Key to press
 */
export async function pressKey(page: Page, key: string) {
  await page.keyboard.press(key);
}

/**
 * Type text with delay (simulate human typing)
 * @param page - Playwright page instance
 * @param selector - Input selector
 * @param text - Text to type
 * @param delay - Delay between keystrokes in ms
 */
export async function typeWithDelay(
  page: Page,
  selector: string,
  text: string,
  delay: number = 50
) {
  await page.locator(selector).type(text, { delay });
}

/**
 * Get all elements matching selector
 * @param page - Playwright page instance
 * @param selector - Element selector
 */
export async function getAllElements(page: Page, selector: string): Promise<Locator[]> {
  const elements = page.locator(selector);
  const count = await elements.count();
  const result: Locator[] = [];
  for (let i = 0; i < count; i++) {
    result.push(elements.nth(i));
  }
  return result;
}

/**
 * Wait for specific URL pattern
 * @param page - Playwright page instance
 * @param pattern - URL pattern (string or regex)
 */
export async function waitForURL(page: Page, pattern: string | RegExp) {
  await page.waitForURL(pattern);
}

/**
 * Reload page and wait for load
 * @param page - Playwright page instance
 */
export async function reloadPage(page: Page) {
  await page.reload({ waitUntil: 'networkidle' });
}

/**
 * Go back in browser history
 * @param page - Playwright page instance
 */
export async function goBack(page: Page) {
  await page.goBack({ waitUntil: 'networkidle' });
}

/**
 * Go forward in browser history
 * @param page - Playwright page instance
 */
export async function goForward(page: Page) {
  await page.goForward({ waitUntil: 'networkidle' });
}

/**
 * Check if page has specific class
 * @param page - Playwright page instance
 * @param selector - Element selector
 * @param className - Class name to check
 */
export async function hasClass(
  page: Page,
  selector: string,
  className: string
): Promise<boolean> {
  const element = page.locator(selector);
  const classes = await element.getAttribute('class');
  return classes?.includes(className) || false;
}

/**
 * Wait for element to have specific text
 * @param page - Playwright page instance
 * @param selector - Element selector
 * @param text - Expected text
 */
export async function waitForText(page: Page, selector: string, text: string) {
  await expect(page.locator(selector)).toContainText(text);
}

/**
 * Get viewport size
 * @param page - Playwright page instance
 */
export async function getViewportSize(page: Page) {
  return page.viewportSize();
}

/**
 * Set viewport size
 * @param page - Playwright page instance
 * @param width - Viewport width
 * @param height - Viewport height
 */
export async function setViewportSize(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
}

/**
 * Wait for animation to complete
 * @param page - Playwright page instance
 * @param duration - Animation duration in ms
 */
export async function waitForAnimation(page: Page, duration: number = 500) {
  await page.waitForTimeout(duration);
}
