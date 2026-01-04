/**
 * Onboarding Page Object Models
 *
 * Page objects for the 18-step onboarding flow.
 * Follows the Page Object Model pattern for better test maintainability.
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Onboarding Page
 * Common functionality shared across all onboarding steps
 */
export class BaseOnboardingPage {
  readonly page: Page;
  readonly progressBar: Locator;
  readonly progressText: Locator;
  readonly progressPercentage: Locator;
  readonly backButton: Locator;
  readonly continueButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.progressBar = page.locator('.h-2.bg-gray-200 .bg-gradient-to-r');
    this.progressText = page.locator('text=/Step \\d+ of \\d+/');
    this.progressPercentage = page.locator('text=/\\d+%/');
    this.backButton = page.locator('button', { hasText: 'Back' });
    this.continueButton = page.locator('button', { hasText: /Continue|Start Exploring/i });
    this.errorMessage = page.locator('.bg-red-50');
  }

  async clickBack() {
    await this.backButton.click();
  }

  async clickContinue() {
    await this.continueButton.click();
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getProgressPercentage(): Promise<number> {
    const text = await this.progressPercentage.textContent();
    return parseInt(text?.replace('%', '') || '0');
  }

  async getCurrentStep(): Promise<{ current: number; total: number }> {
    const text = await this.progressText.textContent();
    const match = text?.match(/Step (\d+) of (\d+)/);
    return {
      current: parseInt(match?.[1] || '0'),
      total: parseInt(match?.[2] || '0')
    };
  }

  async verifyProgressBar(expectedPercentage: number) {
    const width = await this.progressBar.evaluate((el) =>
      getComputedStyle(el).width
    );
    const percentage = await this.getProgressPercentage();
    expect(percentage).toBe(expectedPercentage);
  }
}

/**
 * Intro Page - Step 1
 */
export class IntroPage extends BaseOnboardingPage {
  readonly letsDoItButton: Locator;

  constructor(page: Page) {
    super(page);
    this.letsDoItButton = page.locator('button', { hasText: "Let's do it" });
  }

  async goto() {
    await this.page.goto('/onboarding');
    await this.waitForLoad();
  }

  async clickLetsDoIt() {
    await this.letsDoItButton.click();
    await this.page.waitForURL('/onboarding/name');
  }

  async verifyIntroContent() {
    await expect(this.page.locator('h1, h2')).toContainText(/set up the essentials/i);
    await expect(this.letsDoItButton).toBeVisible();
  }
}

/**
 * Name Page - Step 2
 */
export class NamePage extends BaseOnboardingPage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByLabel('First name');
    this.lastNameInput = page.getByLabel('Last name');
  }

  async goto() {
    await this.page.goto('/onboarding/name');
    await this.waitForLoad();
  }

  async fillName(firstName: string, lastName: string) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
  }

  async submitAndContinue(firstName: string, lastName: string) {
    await this.fillName(firstName, lastName);
    await this.clickContinue();
    await this.page.waitForURL('/onboarding/age');
  }
}

/**
 * Age Page - Step 3
 */
export class AgePage extends BaseOnboardingPage {
  readonly birthdateInput: Locator;

  constructor(page: Page) {
    super(page);
    this.birthdateInput = page.locator('input[type="date"]');
  }

  async goto() {
    await this.page.goto('/onboarding/age');
    await this.waitForLoad();
  }

  async fillBirthdate(birthdate: string) {
    await this.birthdateInput.fill(birthdate);
  }

  async submitAndContinue(birthdate: string) {
    await this.fillBirthdate(birthdate);
    await this.clickContinue();
    await this.page.waitForURL('/onboarding/gender');
  }

  async verifyUnderageError() {
    await expect(this.errorMessage).toContainText(/at least 18/i);
  }
}

/**
 * Gender Page - Step 4
 */
export class GenderPage extends BaseOnboardingPage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/onboarding/gender');
    await this.waitForLoad();
  }

  async selectGender(gender: 'Woman' | 'Man' | 'Non-binary' | 'More') {
    const option = this.page.locator('button', { hasText: gender });
    await option.click();
  }

  async submitAndContinue(gender: 'Woman' | 'Man' | 'Non-binary') {
    await this.selectGender(gender);
    await this.clickContinue();
    await this.page.waitForURL('/onboarding/ethnicity');
  }
}

/**
 * Ethnicity Page - Step 5
 */
export class EthnicityPage extends BaseOnboardingPage {
  readonly skipButton: Locator;

  constructor(page: Page) {
    super(page);
    this.skipButton = page.locator('button', { hasText: 'Skip' });
  }

  async goto() {
    await this.page.goto('/onboarding/ethnicity');
    await this.waitForLoad();
  }

  async selectEthnicity(ethnicities: string[]) {
    for (const ethnicity of ethnicities) {
      const chip = this.page.locator('button', { hasText: ethnicity });
      await chip.click();
    }
  }

  async skip() {
    await this.skipButton.click();
    await this.page.waitForURL('/onboarding/work');
  }

  async submitAndContinue(ethnicities: string[]) {
    await this.selectEthnicity(ethnicities);
    await this.clickContinue();
    await this.page.waitForURL('/onboarding/work');
  }
}

/**
 * Work Page - Step 6
 */
export class WorkPage extends BaseOnboardingPage {
  readonly workInput: Locator;
  readonly skipButton: Locator;

  constructor(page: Page) {
    super(page);
    this.workInput = page.getByLabel(/work|occupation/i);
    this.skipButton = page.locator('button', { hasText: 'Skip' });
  }

  async goto() {
    await this.page.goto('/onboarding/work');
    await this.waitForLoad();
  }

  async fillWork(work: string) {
    await this.workInput.fill(work);
  }

  async skip() {
    await this.skipButton.click();
    await this.page.waitForURL('/onboarding/photo');
  }

  async submitAndContinue(work: string) {
    await this.fillWork(work);
    await this.clickContinue();
    await this.page.waitForURL('/onboarding/photo');
  }
}

/**
 * Photo Page - Step 7
 */
export class PhotoPage extends BaseOnboardingPage {
  readonly uploadInput: Locator;
  readonly skipButton: Locator;

  constructor(page: Page) {
    super(page);
    this.uploadInput = page.locator('input[type="file"]');
    this.skipButton = page.locator('button', { hasText: 'Skip' });
  }

  async goto() {
    await this.page.goto('/onboarding/photo');
    await this.waitForLoad();
  }

  async uploadPhoto(filePath: string) {
    await this.uploadInput.setInputFiles(filePath);
  }

  async skip() {
    await this.skipButton.click();
    await this.page.waitForURL('/onboarding/preferences');
  }
}

/**
 * Preferences Intro Page - Step 8
 */
export class PreferencesIntroPage extends BaseOnboardingPage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/onboarding/preferences');
    await this.waitForLoad();
  }

  async clickContinue() {
    await super.clickContinue();
    await this.page.waitForURL('/onboarding/preferences/gender');
  }
}

/**
 * Preferences Gender Page - Step 9
 */
export class PreferencesGenderPage extends BaseOnboardingPage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/onboarding/preferences/gender');
    await this.waitForLoad();
  }

  async selectGenderPreference(genders: string[]) {
    for (const gender of genders) {
      const option = this.page.locator('button', { hasText: gender });
      await option.click();
    }
  }

  async submitAndContinue(genders: string[]) {
    await this.selectGenderPreference(genders);
    await this.clickContinue();
    await this.page.waitForURL('/onboarding/preferences/age-range');
  }
}

/**
 * Preferences Age Range Page - Step 10
 */
export class PreferencesAgeRangePage extends BaseOnboardingPage {
  readonly minAgeSlider: Locator;
  readonly maxAgeSlider: Locator;

  constructor(page: Page) {
    super(page);
    this.minAgeSlider = page.locator('input[type="range"]').first();
    this.maxAgeSlider = page.locator('input[type="range"]').last();
  }

  async goto() {
    await this.page.goto('/onboarding/preferences/age-range');
    await this.waitForLoad();
  }

  async setAgeRange(min: number, max: number) {
    await this.minAgeSlider.fill(min.toString());
    await this.maxAgeSlider.fill(max.toString());
  }

  async submitAndContinue(min: number, max: number) {
    await this.setAgeRange(min, max);
    await this.clickContinue();
    await this.page.waitForURL('/onboarding/preferences/kids');
  }
}

/**
 * Preferences Kids Page - Step 11
 */
export class PreferencesKidsPage extends BaseOnboardingPage {
  readonly skipButton: Locator;

  constructor(page: Page) {
    super(page);
    this.skipButton = page.locator('button', { hasText: 'Skip' });
  }

  async goto() {
    await this.page.goto('/onboarding/preferences/kids');
    await this.waitForLoad();
  }

  async selectKidsPreference(preference: string) {
    const option = this.page.locator('button', { hasText: preference });
    await option.click();
  }

  async skip() {
    await this.skipButton.click();
    await this.page.waitForURL('/onboarding/preferences/dealbreakers');
  }
}

/**
 * Preferences Dealbreakers Page - Step 12
 */
export class PreferencesDealbreakersPage extends BaseOnboardingPage {
  readonly skipButton: Locator;

  constructor(page: Page) {
    super(page);
    this.skipButton = page.locator('button', { hasText: 'Skip' });
  }

  async goto() {
    await this.page.goto('/onboarding/preferences/dealbreakers');
    await this.waitForLoad();
  }

  async expandDealbreaker(dealbreaker: 'Smoking' | 'Religion') {
    const card = this.page.locator('button', { hasText: dealbreaker });
    await card.click();
  }

  async selectDealbreakerOption(option: string) {
    const optionButton = this.page.locator('button', { hasText: option });
    await optionButton.click();
  }

  async skip() {
    await this.skipButton.click();
    await this.page.waitForURL('/onboarding/vibe');
  }
}

/**
 * Vibe Intro Page - Step 13
 */
export class VibeIntroPage extends BaseOnboardingPage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/onboarding/vibe');
    await this.waitForLoad();
  }

  async clickContinue() {
    await super.clickContinue();
    await this.page.waitForURL('/onboarding/vibe/kids');
  }
}

/**
 * Vibe Kids Page - Step 14
 */
export class VibeKidsPage extends BaseOnboardingPage {
  readonly skipButton: Locator;

  constructor(page: Page) {
    super(page);
    this.skipButton = page.locator('button', { hasText: 'Skip' });
  }

  async goto() {
    await this.page.goto('/onboarding/vibe/kids');
    await this.waitForLoad();
  }

  async selectKidsView(view: string) {
    const option = this.page.locator('button', { hasText: view });
    await option.click();
  }

  async skip() {
    await this.skipButton.click();
    await this.page.waitForURL('/onboarding/vibe/smoking');
  }
}

/**
 * Vibe Smoking Page - Step 15
 */
export class VibeSmokingPage extends BaseOnboardingPage {
  readonly skipButton: Locator;

  constructor(page: Page) {
    super(page);
    this.skipButton = page.locator('button', { hasText: 'Skip' });
  }

  async goto() {
    await this.page.goto('/onboarding/vibe/smoking');
    await this.waitForLoad();
  }

  async selectSmokingStance(stance: string) {
    const option = this.page.locator('button', { hasText: stance });
    await option.click();
  }

  async skip() {
    await this.skipButton.click();
    await this.page.waitForURL('/onboarding/vibe/religion');
  }
}

/**
 * Vibe Religion Page - Step 16
 */
export class VibeReligionPage extends BaseOnboardingPage {
  readonly skipButton: Locator;

  constructor(page: Page) {
    super(page);
    this.skipButton = page.locator('button', { hasText: 'Skip' });
  }

  async goto() {
    await this.page.goto('/onboarding/vibe/religion');
    await this.waitForLoad();
  }

  async selectReligion(religion: string) {
    const option = this.page.locator('button', { hasText: religion });
    await option.click();
  }

  async skip() {
    await this.skipButton.click();
    await this.page.waitForURL('/onboarding/vibe/interests');
  }
}

/**
 * Vibe Interests Page - Step 17
 */
export class VibeInterestsPage extends BaseOnboardingPage {
  readonly skipButton: Locator;

  constructor(page: Page) {
    super(page);
    this.skipButton = page.locator('button', { hasText: 'Skip' });
  }

  async goto() {
    await this.page.goto('/onboarding/vibe/interests');
    await this.waitForLoad();
  }

  async selectInterests(interests: string[]) {
    for (const interest of interests) {
      const chip = this.page.locator('button', { hasText: interest });
      await chip.click();
    }
  }

  async skip() {
    await this.skipButton.click();
    await this.page.waitForURL('/onboarding/complete');
  }

  async submitAndContinue(interests: string[]) {
    await this.selectInterests(interests);
    await this.clickContinue();
    await this.page.waitForURL('/onboarding/complete');
  }
}

/**
 * Complete Page - Step 18
 */
export class CompletePage {
  readonly page: Page;
  readonly startExploringButton: Locator;
  readonly successIcon: Locator;
  readonly completionMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startExploringButton = page.locator('button', { hasText: 'Start Exploring' });
    this.successIcon = page.locator('svg', { has: page.locator('path[d*="M5 13l4 4L19 7"]') });
    this.completionMessage = page.locator('text=/You\'re all set/i');
  }

  async goto() {
    await this.page.goto('/onboarding/complete');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyCompletion() {
    await expect(this.completionMessage).toBeVisible();
    await expect(this.startExploringButton).toBeVisible();
  }

  async startExploring() {
    await this.startExploringButton.click();
    await this.page.waitForURL('/dashboard');
  }
}
