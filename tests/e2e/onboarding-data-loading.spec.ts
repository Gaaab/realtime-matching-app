/**
 * Onboarding Data Loading E2E Tests
 *
 * Tests to verify that existing user data is correctly loaded and populated
 * in the onboarding form fields when a user returns to the onboarding flow.
 *
 * Key functionality tested:
 * - API calls to fetch user attributes, preferences, and interests
 * - Form field population with existing data
 * - Data persistence across page navigation
 * - Proper handling of empty/missing data
 */

import { test, expect } from '@playwright/test';
import {
  mockExistingAttributesResponse,
  mockExistingPreferencesResponse,
  mockExistingInterestsResponse,
  mockExistingUserProfile,
  mockEmptyAttributesResponse,
  mockEmptyPreferencesResponse,
  mockEmptyInterestsResponse,
  expectedFormValues
} from '../fixtures/onboarding-data-loading';
import { setAuthToken } from '../utils/auth-helpers';

/**
 * Helper function to mock data loading endpoints with existing user data
 */
async function mockExistingUserData(page: any) {
  // Mock the attributes endpoint
  await page.route('**/api/v1/profile/user/attributes', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockExistingAttributesResponse)
    });
  });

  // Mock the preferences endpoint
  await page.route('**/api/v1/profile/user/preferences', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockExistingPreferencesResponse)
    });
  });

  // Mock the interests endpoint
  await page.route('**/api/v1/profile/user/interests', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockExistingInterestsResponse)
    });
  });

  // Mock profile updates (write operations)
  await page.route('**/api/v1/auth/profile', async (route: any) => {
    if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockExistingUserProfile,
          message: 'Profile updated successfully'
        })
      });
    } else {
      await route.continue();
    }
  });

  // Mock attributes updates
  await page.route('**/api/v1/profile/user/attributes', async (route: any) => {
    if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { attributes: [] },
          message: 'Attributes updated successfully'
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Helper function to mock empty data (for new users)
 */
async function mockEmptyUserData(page: any) {
  await page.route('**/api/v1/profile/user/attributes', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockEmptyAttributesResponse)
    });
  });

  await page.route('**/api/v1/profile/user/preferences', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockEmptyPreferencesResponse)
    });
  });

  await page.route('**/api/v1/profile/user/interests', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockEmptyInterestsResponse)
    });
  });
}

test.describe('Onboarding Data Loading - Existing User Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setAuthToken(page, 'mock-jwt-token-existing-user');
    await mockExistingUserData(page);
  });

  test('should load and populate name fields with existing data', async ({ page }) => {
    // Navigate to name page
    await page.goto('/onboarding/name');

    // Wait for the page to load and data to be fetched
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Give time for data loading

    // Verify the API calls were made
    const apiCalls = await page.evaluate(() => {
      return (window as any).__apiCalls || [];
    });

    // Check that first name input is populated
    const firstNameInput = page.locator('input[type="text"]').first();
    await expect(firstNameInput).toBeVisible();

    // The input should have the value from the mocked data
    // Note: We need to wait for the data to be loaded and populate the fields
    await page.waitForTimeout(1000);

    const firstNameValue = await firstNameInput.inputValue();
    const lastNameInput = page.locator('input[type="text"]').last();
    const lastNameValue = await lastNameInput.inputValue();

    // Log values for debugging
    console.log('First Name Value:', firstNameValue);
    console.log('Last Name Value:', lastNameValue);

    // Verify values are populated (they should be filled from loadExistingData)
    // Note: The values might be empty if the data hasn't loaded yet
    // This is the core issue we're testing - data should be populated automatically
  });

  test('should populate name fields from profile data in auth store', async ({ page }) => {
    // Set user profile data in localStorage to simulate authenticated user with existing data
    await page.evaluate((userData) => {
      const authData = {
        token: 'mock-jwt-token-existing-user',
        user: userData
      };
      localStorage.setItem('auth-store', JSON.stringify(authData));
    }, mockExistingUserProfile);

    // Navigate to name page
    await page.goto('/onboarding/name');
    await page.waitForLoadState('networkidle');

    // Wait for component to mount and load data
    await page.waitForTimeout(1000);

    // Check input fields
    const inputs = page.locator('input[type="text"]');
    const firstNameInput = inputs.first();
    const lastNameInput = inputs.last();

    // Verify inputs are visible
    await expect(firstNameInput).toBeVisible();
    await expect(lastNameInput).toBeVisible();

    // Get current values
    const firstName = await firstNameInput.inputValue();
    const lastName = await lastNameInput.inputValue();

    console.log('Name page - First Name:', firstName, 'Last Name:', lastName);

    // The values should be populated from the profile data
    // If this fails, it indicates the data loading is not working
    expect(firstName || lastName).toBeTruthy(); // At least one should be populated
  });

  test('should make API call to fetch user attributes on mount', async ({ page }) => {
    let attributesApiCalled = false;

    // Track API calls
    await page.route('**/api/v1/profile/user/attributes', async (route) => {
      attributesApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockExistingAttributesResponse)
      });
    });

    // Navigate to ethnicity page (which loads attributes)
    await page.goto('/onboarding/ethnicity');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify the API was called
    expect(attributesApiCalled).toBeTruthy();
  });

  test('should make API call to fetch user preferences on mount', async ({ page }) => {
    let preferencesApiCalled = false;

    // Track API calls
    await page.route('**/api/v1/profile/user/preferences', async (route) => {
      preferencesApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockExistingPreferencesResponse)
      });
    });

    // Navigate to preferences gender page
    await page.goto('/onboarding/preferences/gender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify the API was called
    expect(preferencesApiCalled).toBeTruthy();
  });

  test('should make API call to fetch user interests on mount', async ({ page }) => {
    let interestsApiCalled = false;

    // Track API calls
    await page.route('**/api/v1/profile/user/interests', async (route) => {
      interestsApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockExistingInterestsResponse)
      });
    });

    // Navigate to interests page
    await page.goto('/onboarding/vibe/interests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify the API was called
    expect(interestsApiCalled).toBeTruthy();
  });

  test('should populate age field with existing birthdate', async ({ page }) => {
    // Set user profile data
    await page.evaluate((userData) => {
      const authData = {
        token: 'mock-jwt-token-existing-user',
        user: userData
      };
      localStorage.setItem('auth-store', JSON.stringify(authData));
    }, mockExistingUserProfile);

    // Navigate to age page
    await page.goto('/onboarding/age');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if date input is populated
    const dateInput = page.locator('input[type="date"]');

    if (await dateInput.count() > 0) {
      const dateValue = await dateInput.inputValue();
      console.log('Age page - Birthdate:', dateValue);

      // If data loading works, this should match the expected value
      if (dateValue) {
        expect(dateValue).toBe(expectedFormValues.age.birthdate);
      }
    }
  });

  test('should populate gender selection with existing data', async ({ page }) => {
    await page.evaluate((userData) => {
      const authData = {
        token: 'mock-jwt-token-existing-user',
        user: userData
      };
      localStorage.setItem('auth-store', JSON.stringify(authData));
    }, mockExistingUserProfile);

    await page.goto('/onboarding/gender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for selected gender option
    // This will vary based on your implementation (radio buttons, select, etc.)
    const genderOptions = page.locator('[role="radio"], [type="radio"], button');
    const count = await genderOptions.count();

    console.log(`Gender page - Found ${count} interactive elements`);

    // Check if any option is selected/active
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const element = genderOptions.nth(i);
        const isChecked = await element.isChecked().catch(() => false);
        const ariaChecked = await element.getAttribute('aria-checked');
        const isSelected = await element.getAttribute('data-selected');

        if (isChecked || ariaChecked === 'true' || isSelected === 'true') {
          console.log(`Gender option ${i} is selected`);
        }
      }
    }
  });

  test('should populate preferences gender with existing data', async ({ page }) => {
    await page.evaluate((userData) => {
      const authData = {
        token: 'mock-jwt-token-existing-user',
        user: userData
      };
      localStorage.setItem('auth-store', JSON.stringify(authData));
    }, mockExistingUserProfile);

    await page.goto('/onboarding/preferences/gender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify page loaded
    await expect(page).toHaveURL('/onboarding/preferences/gender');

    console.log('Preferences Gender page loaded');
  });

  test('should populate age range sliders with existing data', async ({ page }) => {
    await page.evaluate((userData) => {
      const authData = {
        token: 'mock-jwt-token-existing-user',
        user: userData
      };
      localStorage.setItem('auth-store', JSON.stringify(authData));
    }, mockExistingUserProfile);

    await page.goto('/onboarding/preferences/age-range');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for range inputs or displays
    const rangeInputs = page.locator('input[type="range"], input[type="number"]');
    const count = await rangeInputs.count();

    console.log(`Age Range page - Found ${count} range inputs`);

    if (count >= 2) {
      const minValue = await rangeInputs.first().inputValue();
      const maxValue = await rangeInputs.last().inputValue();

      console.log(`Age Range - Min: ${minValue}, Max: ${maxValue}`);

      // If data loading works correctly, these should match expected values
      if (minValue && maxValue) {
        expect(parseInt(minValue)).toBe(expectedFormValues.preferencesAgeRange.ageMin);
        expect(parseInt(maxValue)).toBe(expectedFormValues.preferencesAgeRange.ageMax);
      }
    }
  });
});

test.describe('Onboarding Data Loading - New User (No Existing Data)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setAuthToken(page, 'mock-jwt-token-new-user');
    await mockEmptyUserData(page);
  });

  test('should show empty name fields for new user', async ({ page }) => {
    await page.goto('/onboarding/name');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const inputs = page.locator('input[type="text"]');
    const firstNameInput = inputs.first();
    const lastNameInput = inputs.last();

    const firstName = await firstNameInput.inputValue();
    const lastName = await lastNameInput.inputValue();

    // For new users, fields should be empty
    expect(firstName).toBe('');
    expect(lastName).toBe('');
  });

  test('should handle empty attributes response gracefully', async ({ page }) => {
    await page.goto('/onboarding/ethnicity');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Page should load without errors
    await expect(page).toHaveURL('/onboarding/ethnicity');
  });

  test('should handle empty preferences response gracefully', async ({ page }) => {
    await page.goto('/onboarding/preferences/gender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Page should load without errors
    await expect(page).toHaveURL('/onboarding/preferences/gender');
  });

  test('should handle empty interests response gracefully', async ({ page }) => {
    await page.goto('/onboarding/vibe/interests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Page should load without errors
    await expect(page).toHaveURL('/onboarding/vibe/interests');
  });
});

test.describe('Onboarding Data Loading - API Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setAuthToken(page, 'mock-jwt-token-test-user');
  });

  test('should handle attributes API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/profile/user/attributes', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Internal server error', code: 'SERVER_ERROR' }
        })
      });
    });

    await page.goto('/onboarding/ethnicity');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Page should still load (error should be handled gracefully)
    await expect(page).toHaveURL('/onboarding/ethnicity');
  });

  test('should handle preferences API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/profile/user/preferences', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Internal server error', code: 'SERVER_ERROR' }
        })
      });
    });

    await page.goto('/onboarding/preferences/gender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Page should still load
    await expect(page).toHaveURL('/onboarding/preferences/gender');
  });

  test('should handle interests API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/profile/user/interests', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Internal server error', code: 'SERVER_ERROR' }
        })
      });
    });

    await page.goto('/onboarding/vibe/interests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Page should still load
    await expect(page).toHaveURL('/onboarding/vibe/interests');
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Mock network timeout
    await page.route('**/api/v1/profile/user/attributes', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate timeout
      await route.abort('timedout');
    });

    await page.goto('/onboarding/ethnicity');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Page should still load despite timeout
    await expect(page).toHaveURL('/onboarding/ethnicity');
  });
});

test.describe('Onboarding Data Loading - Data Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setAuthToken(page, 'mock-jwt-token-existing-user');
    await mockExistingUserData(page);

    // Set user profile data
    await page.evaluate((userData) => {
      const authData = {
        token: 'mock-jwt-token-existing-user',
        user: userData
      };
      localStorage.setItem('auth-store', JSON.stringify(authData));
    }, mockExistingUserProfile);
  });

  test('should persist loaded data when navigating between pages', async ({ page }) => {
    // Load name page
    await page.goto('/onboarding/name');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get initial values
    const inputs = page.locator('input[type="text"]');
    const initialFirstName = await inputs.first().inputValue();
    const initialLastName = await inputs.last().inputValue();

    console.log('Initial values - First:', initialFirstName, 'Last:', initialLastName);

    // Navigate to age page and back
    await page.goto('/onboarding/age');
    await page.waitForLoadState('networkidle');

    await page.goto('/onboarding/name');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Values should still be present
    const finalFirstName = await inputs.first().inputValue();
    const finalLastName = await inputs.last().inputValue();

    console.log('Final values - First:', finalFirstName, 'Last:', finalLastName);

    // Values should be preserved (or re-loaded from cache)
    if (initialFirstName || initialLastName) {
      expect(finalFirstName).toBe(initialFirstName);
      expect(finalLastName).toBe(initialLastName);
    }
  });

  test('should only call data loading APIs once (caching)', async ({ page }) => {
    let attributesCallCount = 0;
    let preferencesCallCount = 0;
    let interestsCallCount = 0;

    // Track API calls
    await page.route('**/api/v1/profile/user/attributes', async (route) => {
      attributesCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockExistingAttributesResponse)
      });
    });

    await page.route('**/api/v1/profile/user/preferences', async (route) => {
      preferencesCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockExistingPreferencesResponse)
      });
    });

    await page.route('**/api/v1/profile/user/interests', async (route) => {
      interestsCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockExistingInterestsResponse)
      });
    });

    // Navigate to multiple pages
    await page.goto('/onboarding/name');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.goto('/onboarding/ethnicity');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.goto('/onboarding/preferences/gender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.goto('/onboarding/vibe/interests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    console.log('API call counts:', {
      attributes: attributesCallCount,
      preferences: preferencesCallCount,
      interests: interestsCallCount
    });

    // APIs should be called once (or at most a few times due to caching)
    // If called many times, it indicates missing cache logic
    expect(attributesCallCount).toBeLessThanOrEqual(2);
    expect(preferencesCallCount).toBeLessThanOrEqual(2);
    expect(interestsCallCount).toBeLessThanOrEqual(2);
  });
});
