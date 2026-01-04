/**
 * Onboarding Test Fixtures
 *
 * Mock data and test fixtures for onboarding flow tests
 */

/**
 * Valid onboarding profile data for a complete flow
 */
export const validOnboardingData = {
  // Profile Basics
  firstName: 'Jane',
  lastName: 'Smith',
  birthdate: '1995-06-15', // 28 years old
  gender: 'Woman',
  ethnicity: ['Asian', 'White'],
  work: 'Software Engineer',

  // Preferences
  lookingForGender: ['Men', 'Non-binary'],
  ageMin: 25,
  ageMax: 35,
  kidsPreference: 'Open to kids',

  // Vibe & Lifestyle
  kidsView: 'Want kids someday',
  smoking: 'Non-smoker',
  religion: 'Spiritual',
  interests: ['Hiking', 'Photography', 'Music']
};

/**
 * Minimal required data (only required fields)
 */
export const minimalOnboardingData = {
  firstName: 'John',
  lastName: 'Doe',
  birthdate: '1990-01-01',
  gender: 'Man',
  lookingForGender: ['Women'],
  ageMin: 22,
  ageMax: 40
};

/**
 * Underage user data (should fail validation)
 */
export const underageUserData = {
  firstName: 'Teen',
  lastName: 'User',
  birthdate: '2010-01-01', // Under 18
  gender: 'Non-binary'
};

/**
 * Test user with all optional fields filled
 */
export const completeOnboardingData = {
  firstName: 'Sarah',
  lastName: 'Johnson',
  birthdate: '1992-03-20',
  gender: 'Woman',
  ethnicity: ['Black', 'Hispanic'],
  work: 'Marketing Manager',
  lookingForGender: ['Everyone'],
  ageMin: 28,
  ageMax: 45,
  kidsPreference: 'Have kids',
  dealbreakers: {
    smoking: 'Must be non-smoker',
    religion: 'Must share my faith'
  },
  kidsView: 'Have kids',
  smoking: 'Non-smoker',
  religion: 'Christian',
  interests: ['Travel', 'Yoga', 'Cooking', 'Reading', 'Art']
};

/**
 * Mock API response for successful profile update
 */
export const mockProfileUpdateResponse = {
  success: true,
  data: {
    id: 1,
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    birthdate: '1995-06-15',
    age: 28,
    gender: 'Woman',
    onboarding_completed: false,
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2024-12-14T00:00:00Z'
  },
  message: 'Profile updated successfully'
};

/**
 * Mock API response for successful attributes update
 */
export const mockAttributesUpdateResponse = {
  success: true,
  data: {
    attributes: [
      {
        id: 1,
        user_id: 1,
        attribute_key_id: 1,
        value: 'Software Engineer',
        is_visible_on_profile: true
      }
    ]
  },
  message: 'Attributes updated successfully'
};

/**
 * Mock API response for successful preferences update
 */
export const mockPreferencesUpdateResponse = {
  success: true,
  data: {
    id: 1,
    user_id: 1,
    looking_for_gender: ['men', 'non-binary'],
    age_min: 25,
    age_max: 35,
    kids_preference: 'open-to-kids',
    distance_max: 50
  },
  message: 'Preferences updated successfully'
};

/**
 * Mock API response for successful interests update
 */
export const mockInterestsUpdateResponse = {
  success: true,
  data: {
    interests: [
      { id: 1, name: 'Hiking', category: 'Outdoors' },
      { id: 2, name: 'Photography', category: 'Arts' },
      { id: 3, name: 'Music', category: 'Entertainment' }
    ]
  },
  message: 'Interests updated successfully'
};

/**
 * Mock API response for successful dealbreaker creation
 */
export const mockDealbreakerCreateResponse = {
  success: true,
  data: {
    id: 1,
    user_id: 1,
    dealbreaker_id: 1,
    criteria: 'must-be-non-smoker',
    created_at: '2024-12-14T00:00:00Z'
  },
  message: 'Dealbreaker created successfully'
};

/**
 * Mock API response for onboarding completion
 */
export const mockOnboardingCompleteResponse = {
  success: true,
  data: {
    id: 1,
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    onboarding_completed: true,
    onboarding_completed_at: '2024-12-14T10:30:00Z'
  },
  message: 'Onboarding completed successfully'
};

/**
 * Mock API error response for validation failure
 */
export const mockValidationErrorResponse = {
  success: false,
  error: {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    fields: {
      first_name: ['First name is required'],
      last_name: ['Last name is required']
    }
  }
};

/**
 * Expected progress percentages for each step
 */
export const expectedProgressPercentages = {
  intro: 6,          // Step 1 of 18
  name: 11,          // Step 2 of 18
  age: 17,           // Step 3 of 18
  gender: 22,        // Step 4 of 18
  ethnicity: 28,     // Step 5 of 18
  work: 33,          // Step 6 of 18
  photo: 39,         // Step 7 of 18
  preferencesIntro: 44,     // Step 8 of 18
  preferencesGender: 50,    // Step 9 of 18
  preferencesAgeRange: 56,  // Step 10 of 18
  preferencesKids: 61,      // Step 11 of 18
  preferencesDealbreakers: 67, // Step 12 of 18
  vibeIntro: 72,            // Step 13 of 18
  vibeKids: 78,             // Step 14 of 18
  vibeSmoking: 83,          // Step 15 of 18
  vibeReligion: 89,         // Step 16 of 18
  vibeInterests: 94,        // Step 17 of 18
  complete: 100             // Step 18 of 18
};

/**
 * Onboarding section titles for verification
 */
export const sectionTitles = {
  profileBasics: 'Profile Basics',
  preferences: 'Preferences',
  vibeLifestyle: 'Vibe & Lifestyle'
};

/**
 * Step titles for verification
 */
export const stepTitles = {
  intro: "Let's set up the essentials",
  name: 'Start with your name',
  age: "What's your age?",
  gender: 'How do you identify?',
  ethnicity: 'How do you describe your ethnicity?',
  work: 'What do you do for work?',
  photo: 'Your first impression starts here',
  preferencesIntro: 'Shape your preferences',
  preferencesGender: 'Who do you want to meet?',
  preferencesAgeRange: 'Set your age range',
  preferencesKids: "What's your preference on kids?",
  preferencesDealbreakers: "What's a Deal Breaker for you?",
  vibeIntro: 'Your Vibe & Lifestyle',
  vibeKids: "What's your view on kids?",
  vibeSmoking: "What's your stance on smoking?",
  vibeReligion: 'Do you follow a spiritual or religious path?',
  vibeInterests: 'What are you into?',
  complete: "You're all set!"
};

/**
 * Expected routes for each step
 */
export const stepRoutes = {
  intro: '/onboarding',
  name: '/onboarding/name',
  age: '/onboarding/age',
  gender: '/onboarding/gender',
  ethnicity: '/onboarding/ethnicity',
  work: '/onboarding/work',
  photo: '/onboarding/photo',
  preferencesIntro: '/onboarding/preferences',
  preferencesGender: '/onboarding/preferences/gender',
  preferencesAgeRange: '/onboarding/preferences/age-range',
  preferencesKids: '/onboarding/preferences/kids',
  preferencesDealbreakers: '/onboarding/preferences/dealbreakers',
  vibeIntro: '/onboarding/vibe',
  vibeKids: '/onboarding/vibe/kids',
  vibeSmoking: '/onboarding/vibe/smoking',
  vibeReligion: '/onboarding/vibe/religion',
  vibeInterests: '/onboarding/vibe/interests',
  complete: '/onboarding/complete'
};
