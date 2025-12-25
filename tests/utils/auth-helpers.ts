/**
 * Authentication Helper Functions for E2E Tests
 *
 * Provides reusable authentication utilities for Playwright tests
 * including login, logout, and session management.
 */

import { Page, expect } from '@playwright/test';
import type { UserCredentials } from '../fixtures/users';

/**
 * Login helper - navigates to login page and authenticates user
 * @param page - Playwright page instance
 * @param credentials - User credentials (email and password)
 */
export async function login(page: Page, credentials: UserCredentials) {
  // Navigate to login page
  await page.goto('/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Fill in login form
  await page.fill('[data-testid="email-input"]', credentials.email);
  await page.fill('[data-testid="password-input"]', credentials.password);

  // Submit form
  await page.click('[data-testid="login-button"]');

  // Wait for navigation after successful login
  await page.waitForURL(/\/(dashboard|home|matches)/);

  // Verify we're logged in by checking for user-specific elements
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
}

/**
 * Quick login using API/storage state (faster for non-auth tests)
 * @param page - Playwright page instance
 * @param credentials - User credentials
 */
export async function loginViaAPI(page: Page, credentials: UserCredentials) {
  // Make API request to login endpoint
  const response = await page.request.post('/api/v1/auth/login', {
    data: {
      email: credentials.email,
      password: credentials.password
    }
  });

  expect(response.ok()).toBeTruthy();

  const data = await response.json();

  // Store authentication token in local storage
  await page.goto('/');
  await page.evaluate((token) => {
    localStorage.setItem('auth_token', token);
  }, data.token);

  // Reload page to apply authentication
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/**
 * Logout helper - logs out the current user
 * @param page - Playwright page instance
 */
export async function logout(page: Page) {
  // Click user menu to reveal logout option
  await page.click('[data-testid="user-menu"]');

  // Click logout button
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to login/home page
  await page.waitForURL(/\/(login|home|$)/);

  // Verify we're logged out
  await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
}

/**
 * Register a new user
 * @param page - Playwright page instance
 * @param registrationData - Registration form data
 */
export async function register(page: Page, registrationData: any) {
  await page.goto('/register');

  // Fill registration form
  await page.fill('[data-testid="email-input"]', registrationData.email);
  await page.fill('[data-testid="password-input"]', registrationData.password);
  await page.fill('[data-testid="password-confirmation-input"]', registrationData.passwordConfirmation);
  await page.fill('[data-testid="name-input"]', registrationData.name);
  await page.fill('[data-testid="age-input"]', registrationData.age.toString());
  await page.selectOption('[data-testid="gender-select"]', registrationData.gender);

  if (registrationData.termsAccepted) {
    await page.check('[data-testid="terms-checkbox"]');
  }

  // Submit form
  await page.click('[data-testid="register-button"]');
}

/**
 * Check if user is authenticated
 * @param page - Playwright page instance
 * @returns boolean indicating authentication status
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get authentication token from storage
 * @param page - Playwright page instance
 * @returns authentication token or null
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    return localStorage.getItem('auth_token');
  });
}

/**
 * Set authentication token in storage
 * @param page - Playwright page instance
 * @param token - Authentication token
 */
export async function setAuthToken(page: Page, token: string) {
  await page.evaluate((token) => {
    localStorage.setItem('auth_token', token);
  }, token);
}

/**
 * Clear authentication state
 * @param page - Playwright page instance
 */
export async function clearAuthState(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Wait for authentication to complete
 * @param page - Playwright page instance
 */
export async function waitForAuth(page: Page) {
  await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
}

/**
 * Setup authenticated user context for tests
 * This can be used in beforeEach hooks
 * @param page - Playwright page instance
 * @param credentials - User credentials
 */
export async function setupAuthenticatedUser(page: Page, credentials: UserCredentials) {
  await clearAuthState(page);
  await loginViaAPI(page, credentials);
}
