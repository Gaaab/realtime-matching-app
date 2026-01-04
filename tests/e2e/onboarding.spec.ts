/**
 * Onboarding Flow E2E Tests
 *
 * Comprehensive end-to-end tests for the 18-step onboarding flow
 * covering all three sections: Profile Basics, Preferences, and Vibe & Lifestyle
 */

import { test, expect } from '@playwright/test';
import {
  IntroPage,
  NamePage,
  AgePage,
  GenderPage,
  EthnicityPage,
  WorkPage,
  PhotoPage,
  PreferencesIntroPage,
  PreferencesGenderPage,
  PreferencesAgeRangePage,
  PreferencesKidsPage,
  PreferencesDealbreakersPage,
  VibeIntroPage,
  VibeKidsPage,
  VibeSmokingPage,
  VibeReligionPage,
  VibeInterestsPage,
  CompletePage
} from '../page-objects/onboarding.page';
import {
  validOnboardingData,
  minimalOnboardingData,
  underageUserData,
  expectedProgressPercentages,
  stepRoutes
} from '../fixtures/onboarding';
import { mockOnboardingFlow } from '../utils/api-mocks';
import { setAuthToken } from '../utils/auth-helpers';

test.describe('Onboarding Flow - Complete Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication - mock logged-in user
    await page.goto('/');
    await setAuthToken(page, 'mock-jwt-token-test-user');

    // Mock all onboarding API endpoints
    await mockOnboardingFlow(page);
  });

  test('should display intro screen and navigate to name step', async ({ page }) => {
    const introPage = new IntroPage(page);

    await introPage.goto();

    // Verify intro content is displayed
    await introPage.verifyIntroContent();

    // Click "Let's do it" button
    await introPage.clickLetsDoIt();

    // Verify navigation to name page
    await expect(page).toHaveURL(stepRoutes.name);
  });

  test('should complete Section 1 (Profile Basics) flow', async ({ page }) => {
    const data = validOnboardingData;

    // Step 1: Intro
    const introPage = new IntroPage(page);
    await introPage.goto();
    await introPage.clickLetsDoIt();

    // Step 2: Name
    const namePage = new NamePage(page);
    await expect(page).toHaveURL(stepRoutes.name);
    await namePage.submitAndContinue(data.firstName, data.lastName);

    // Step 3: Age
    const agePage = new AgePage(page);
    await expect(page).toHaveURL(stepRoutes.age);
    await agePage.submitAndContinue(data.birthdate);

    // Step 4: Gender
    const genderPage = new GenderPage(page);
    await expect(page).toHaveURL(stepRoutes.gender);
    await genderPage.submitAndContinue(data.gender);

    // Step 5: Ethnicity
    const ethnicityPage = new EthnicityPage(page);
    await expect(page).toHaveURL(stepRoutes.ethnicity);
    await ethnicityPage.submitAndContinue(data.ethnicity);

    // Step 6: Work
    const workPage = new WorkPage(page);
    await expect(page).toHaveURL(stepRoutes.work);
    await workPage.submitAndContinue(data.work);

    // Step 7: Photo (skip for now)
    const photoPage = new PhotoPage(page);
    await expect(page).toHaveURL(stepRoutes.photo);
    await photoPage.skip();

    // Verify we've completed Section 1 and moved to Section 2
    await expect(page).toHaveURL(stepRoutes.preferencesIntro);
  });

  test('should complete Section 2 (Preferences) flow', async ({ page }) => {
    const data = validOnboardingData;

    // Navigate directly to preferences section
    const preferencesIntroPage = new PreferencesIntroPage(page);
    await preferencesIntroPage.goto();

    // Step 8: Preferences Intro
    await preferencesIntroPage.clickContinue();

    // Step 9: Gender Preference
    const preferencesGenderPage = new PreferencesGenderPage(page);
    await expect(page).toHaveURL(stepRoutes.preferencesGender);
    await preferencesGenderPage.submitAndContinue(data.lookingForGender);

    // Step 10: Age Range
    const ageRangePage = new PreferencesAgeRangePage(page);
    await expect(page).toHaveURL(stepRoutes.preferencesAgeRange);
    await ageRangePage.submitAndContinue(data.ageMin, data.ageMax);

    // Step 11: Kids Preference (skip)
    const kidsPage = new PreferencesKidsPage(page);
    await expect(page).toHaveURL(stepRoutes.preferencesKids);
    await kidsPage.skip();

    // Step 12: Dealbreakers (skip)
    const dealbreakersPage = new PreferencesDealbreakersPage(page);
    await expect(page).toHaveURL(stepRoutes.preferencesDealbreakers);
    await dealbreakersPage.skip();

    // Verify we've completed Section 2 and moved to Section 3
    await expect(page).toHaveURL(stepRoutes.vibeIntro);
  });

  test('should complete Section 3 (Vibe & Lifestyle) flow', async ({ page }) => {
    const data = validOnboardingData;

    // Navigate directly to vibe section
    const vibeIntroPage = new VibeIntroPage(page);
    await vibeIntroPage.goto();

    // Step 13: Vibe Intro
    await vibeIntroPage.clickContinue();

    // Step 14: Kids View (skip)
    const vibeKidsPage = new VibeKidsPage(page);
    await expect(page).toHaveURL(stepRoutes.vibeKids);
    await vibeKidsPage.skip();

    // Step 15: Smoking (skip)
    const vibeSmokingPage = new VibeSmokingPage(page);
    await expect(page).toHaveURL(stepRoutes.vibeSmoking);
    await vibeSmokingPage.skip();

    // Step 16: Religion (skip)
    const vibeReligionPage = new VibeReligionPage(page);
    await expect(page).toHaveURL(stepRoutes.vibeReligion);
    await vibeReligionPage.skip();

    // Step 17: Interests (skip)
    const vibeInterestsPage = new VibeInterestsPage(page);
    await expect(page).toHaveURL(stepRoutes.vibeInterests);
    await vibeInterestsPage.skip();

    // Step 18: Complete
    const completePage = new CompletePage(page);
    await expect(page).toHaveURL(stepRoutes.complete);
    await completePage.verifyCompletion();
  });

  test('should show correct progress bar percentage at each step', async ({ page }) => {
    const introPage = new IntroPage(page);
    await introPage.goto();

    // Verify progress at intro (step 1)
    await introPage.verifyProgressBar(expectedProgressPercentages.intro);

    // Navigate to name page
    const namePage = new NamePage(page);
    await namePage.goto();
    await namePage.verifyProgressBar(expectedProgressPercentages.name);

    // Navigate to age page
    const agePage = new AgePage(page);
    await agePage.goto();
    await agePage.verifyProgressBar(expectedProgressPercentages.age);

    // Navigate to gender page
    const genderPage = new GenderPage(page);
    await genderPage.goto();
    await genderPage.verifyProgressBar(expectedProgressPercentages.gender);

    // Navigate to preferences gender page
    const preferencesGenderPage = new PreferencesGenderPage(page);
    await preferencesGenderPage.goto();
    await preferencesGenderPage.verifyProgressBar(expectedProgressPercentages.preferencesGender);

    // Navigate to complete page
    const completePage = new CompletePage(page);
    await completePage.goto();
    // Complete page doesn't show progress bar, so just verify we're there
    await expect(page).toHaveURL(stepRoutes.complete);
  });

  test('should allow going back to previous steps', async ({ page }) => {
    // Start at age page
    const agePage = new AgePage(page);
    await agePage.goto();
    await expect(page).toHaveURL(stepRoutes.age);

    // Click back button
    await agePage.clickBack();

    // Verify we're on the name page
    await expect(page).toHaveURL(stepRoutes.name);

    // Click back again
    const namePage = new NamePage(page);
    await namePage.clickBack();

    // Verify we're on the intro page
    await expect(page).toHaveURL(stepRoutes.intro);
  });

  test('should handle optional fields with skip buttons', async ({ page }) => {
    // Test ethnicity skip
    const ethnicityPage = new EthnicityPage(page);
    await ethnicityPage.goto();
    await ethnicityPage.skip();
    await expect(page).toHaveURL(stepRoutes.work);

    // Test work skip
    const workPage = new WorkPage(page);
    await workPage.skip();
    await expect(page).toHaveURL(stepRoutes.photo);

    // Test photo skip
    const photoPage = new PhotoPage(page);
    await photoPage.skip();
    await expect(page).toHaveURL(stepRoutes.preferencesIntro);

    // Test kids preference skip
    const kidsPage = new PreferencesKidsPage(page);
    await kidsPage.goto();
    await kidsPage.skip();
    await expect(page).toHaveURL(stepRoutes.preferencesDealbreakers);
  });

  test('should complete full onboarding and redirect to dashboard', async ({ page }) => {
    const data = minimalOnboardingData;

    // Complete all required steps in sequence
    const introPage = new IntroPage(page);
    await introPage.goto();
    await introPage.clickLetsDoIt();

    // Section 1: Profile Basics
    const namePage = new NamePage(page);
    await namePage.submitAndContinue(data.firstName, data.lastName);

    const agePage = new AgePage(page);
    await agePage.submitAndContinue(data.birthdate);

    const genderPage = new GenderPage(page);
    await genderPage.submitAndContinue(data.gender);

    // Skip optional fields
    const ethnicityPage = new EthnicityPage(page);
    await ethnicityPage.skip();

    const workPage = new WorkPage(page);
    await workPage.skip();

    const photoPage = new PhotoPage(page);
    await photoPage.skip();

    // Section 2: Preferences
    const preferencesIntroPage = new PreferencesIntroPage(page);
    await preferencesIntroPage.clickContinue();

    const preferencesGenderPage = new PreferencesGenderPage(page);
    await preferencesGenderPage.submitAndContinue(data.lookingForGender);

    const ageRangePage = new PreferencesAgeRangePage(page);
    await ageRangePage.submitAndContinue(data.ageMin, data.ageMax);

    // Skip optional fields
    const kidsPage = new PreferencesKidsPage(page);
    await kidsPage.skip();

    const dealbreakersPage = new PreferencesDealbreakersPage(page);
    await dealbreakersPage.skip();

    // Section 3: Vibe & Lifestyle
    const vibeIntroPage = new VibeIntroPage(page);
    await vibeIntroPage.clickContinue();

    // Skip all vibe fields
    const vibeKidsPage = new VibeKidsPage(page);
    await vibeKidsPage.skip();

    const vibeSmokingPage = new VibeSmokingPage(page);
    await vibeSmokingPage.skip();

    const vibeReligionPage = new VibeReligionPage(page);
    await vibeReligionPage.skip();

    const vibeInterestsPage = new VibeInterestsPage(page);
    await vibeInterestsPage.skip();

    // Complete onboarding
    const completePage = new CompletePage(page);
    await expect(page).toHaveURL(stepRoutes.complete);
    await completePage.verifyCompletion();

    // Click "Start Exploring" and verify redirect to dashboard
    await completePage.startExploring();
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Onboarding Flow - Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setAuthToken(page, 'mock-jwt-token-test-user');
    await mockOnboardingFlow(page);
  });

  test('should show validation error for empty name fields', async ({ page }) => {
    const namePage = new NamePage(page);
    await namePage.goto();

    // Try to continue without filling fields
    await namePage.clickContinue();

    // Verify error message is displayed
    await expect(namePage.errorMessage).toBeVisible();
  });

  test('should show validation error for underage user', async ({ page }) => {
    const agePage = new AgePage(page);
    await agePage.goto();

    // Fill in underage birthdate
    await agePage.fillBirthdate(underageUserData.birthdate);
    await agePage.clickContinue();

    // Verify underage error is displayed
    await agePage.verifyUnderageError();

    // Verify we're still on the age page
    await expect(page).toHaveURL(stepRoutes.age);
  });

  test('should show validation error when no gender selected', async ({ page }) => {
    const genderPage = new GenderPage(page);
    await genderPage.goto();

    // Try to continue without selecting gender
    await genderPage.clickContinue();

    // Verify error message is displayed
    await expect(genderPage.errorMessage).toBeVisible();
  });

  test('should show validation error when no preference gender selected', async ({ page }) => {
    const preferencesGenderPage = new PreferencesGenderPage(page);
    await preferencesGenderPage.goto();

    // Try to continue without selecting any gender preference
    await preferencesGenderPage.clickContinue();

    // Verify error message or disabled button
    await expect(preferencesGenderPage.errorMessage).toBeVisible();
  });
});

test.describe('Onboarding Flow - Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setAuthToken(page, 'mock-jwt-token-test-user');
    await mockOnboardingFlow(page);
  });

  test('should track progress through all 18 steps', async ({ page }) => {
    const steps = [
      { page: new IntroPage(page), expectedStep: 1, expectedTotal: 18 },
      { page: new NamePage(page), expectedStep: 2, expectedTotal: 18 },
      { page: new AgePage(page), expectedStep: 3, expectedTotal: 18 },
      { page: new GenderPage(page), expectedStep: 4, expectedTotal: 18 },
      { page: new EthnicityPage(page), expectedStep: 5, expectedTotal: 18 },
      { page: new WorkPage(page), expectedStep: 6, expectedTotal: 18 },
      { page: new PhotoPage(page), expectedStep: 7, expectedTotal: 18 },
      { page: new PreferencesIntroPage(page), expectedStep: 8, expectedTotal: 18 },
      { page: new PreferencesGenderPage(page), expectedStep: 9, expectedTotal: 18 },
      { page: new PreferencesAgeRangePage(page), expectedStep: 10, expectedTotal: 18 },
      { page: new PreferencesKidsPage(page), expectedStep: 11, expectedTotal: 18 },
      { page: new PreferencesDealbreakersPage(page), expectedStep: 12, expectedTotal: 18 },
      { page: new VibeIntroPage(page), expectedStep: 13, expectedTotal: 18 },
      { page: new VibeKidsPage(page), expectedStep: 14, expectedTotal: 18 },
      { page: new VibeSmokingPage(page), expectedStep: 15, expectedTotal: 18 },
      { page: new VibeReligionPage(page), expectedStep: 16, expectedTotal: 18 },
      { page: new VibeInterestsPage(page), expectedStep: 17, expectedTotal: 18 },
    ];

    for (const { page: stepPage, expectedStep, expectedTotal } of steps) {
      await stepPage.goto();
      const progress = await stepPage.getCurrentStep();

      expect(progress.current).toBe(expectedStep);
      expect(progress.total).toBe(expectedTotal);
    }
  });

  test('should calculate correct progress percentages', async ({ page }) => {
    // Test a few key milestone steps
    const milestones = [
      { page: new IntroPage(page), expected: expectedProgressPercentages.intro },
      { page: new GenderPage(page), expected: expectedProgressPercentages.gender },
      { page: new PreferencesGenderPage(page), expected: expectedProgressPercentages.preferencesGender },
      { page: new VibeInterestsPage(page), expected: expectedProgressPercentages.vibeInterests },
    ];

    for (const { page: stepPage, expected } of milestones) {
      await stepPage.goto();
      const percentage = await stepPage.getProgressPercentage();
      expect(percentage).toBe(expected);
    }
  });
});

test.describe('Onboarding Flow - Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setAuthToken(page, 'mock-jwt-token-test-user');
    await mockOnboardingFlow(page);
  });

  test('should allow direct navigation to any step', async ({ page }) => {
    // Test direct navigation to various steps
    const steps = [
      { route: stepRoutes.name, PageClass: NamePage },
      { route: stepRoutes.gender, PageClass: GenderPage },
      { route: stepRoutes.preferencesGender, PageClass: PreferencesGenderPage },
      { route: stepRoutes.vibeReligion, PageClass: VibeReligionPage },
    ];

    for (const { route, PageClass } of steps) {
      const stepPage = new PageClass(page);
      await stepPage.goto();
      await expect(page).toHaveURL(route);
    }
  });

  test('should maintain state when navigating back and forth', async ({ page }) => {
    const data = validOnboardingData;

    // Fill name page
    const namePage = new NamePage(page);
    await namePage.goto();
    await namePage.fillName(data.firstName, data.lastName);
    await namePage.clickContinue();

    // Go to age page and back
    const agePage = new AgePage(page);
    await expect(page).toHaveURL(stepRoutes.age);
    await agePage.clickBack();

    // Verify name inputs still have values
    await expect(namePage.firstNameInput).toHaveValue(data.firstName);
    await expect(namePage.lastNameInput).toHaveValue(data.lastName);
  });

  test('should sync step state on page refresh', async ({ page }) => {
    // Navigate to a specific step
    const genderPage = new GenderPage(page);
    await genderPage.goto();
    await expect(page).toHaveURL(stepRoutes.gender);

    // Verify progress bar shows correct step
    const progressBefore = await genderPage.getCurrentStep();
    expect(progressBefore.current).toBe(4); // Gender is step 4

    // Refresh the page
    await page.reload();

    // Verify progress is still correct after refresh
    const progressAfter = await genderPage.getCurrentStep();
    expect(progressAfter.current).toBe(4);
  });
});

test.describe('Onboarding Flow - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setAuthToken(page, 'mock-jwt-token-test-user');
    await mockOnboardingFlow(page);
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    const namePage = new NamePage(page);
    await namePage.goto();

    // Verify form inputs have proper labels
    await expect(namePage.firstNameInput).toHaveAttribute('aria-label', /first name/i);
    await expect(namePage.lastNameInput).toHaveAttribute('aria-label', /last name/i);
  });

  test('should be keyboard navigable', async ({ page }) => {
    const namePage = new NamePage(page);
    await namePage.goto();

    // Tab to first input
    await page.keyboard.press('Tab');
    await expect(namePage.firstNameInput).toBeFocused();

    // Tab to last name input
    await page.keyboard.press('Tab');
    await expect(namePage.lastNameInput).toBeFocused();
  });

  test('should show focus indicators on interactive elements', async ({ page }) => {
    const genderPage = new GenderPage(page);
    await genderPage.goto();

    // Focus on continue button
    await genderPage.continueButton.focus();

    // Verify button has focus (this depends on your CSS implementation)
    // Most accessibility frameworks add focus-visible class
    const isFocused = await genderPage.continueButton.evaluate((el) => {
      return el === document.activeElement;
    });
    expect(isFocused).toBeTruthy();
  });
});

test.describe('Onboarding Flow - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setAuthToken(page, 'mock-jwt-token-test-user');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure for profile update
    await page.route('**/api/v1/auth/profile', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Internal server error',
            code: 'SERVER_ERROR'
          }
        })
      });
    });

    const namePage = new NamePage(page);
    await namePage.goto();
    await namePage.fillName('Jane', 'Doe');
    await namePage.clickContinue();

    // Verify error message is displayed
    await expect(namePage.errorMessage).toBeVisible();

    // Verify we're still on the name page
    await expect(page).toHaveURL(stepRoutes.name);
  });

  test('should recover from network errors', async ({ page }) => {
    let callCount = 0;

    // Mock API to fail first time, succeed second time
    await page.route('**/api/v1/auth/profile', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.abort('failed');
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { first_name: 'Jane', last_name: 'Doe' }
          })
        });
      }
    });

    const namePage = new NamePage(page);
    await namePage.goto();
    await namePage.fillName('Jane', 'Doe');

    // First attempt - should fail
    await namePage.clickContinue();
    await expect(namePage.errorMessage).toBeVisible();

    // Second attempt - should succeed
    await namePage.clickContinue();
    await expect(page).toHaveURL(stepRoutes.age);
  });
});
