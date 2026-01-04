/**
 * Onboarding Data Loading Test Fixtures
 *
 * Mock API responses for testing existing user data population in onboarding forms
 */

/**
 * Mock API response for /profile/user/attributes with existing data
 */
export const mockExistingAttributesResponse = {
  success: true,
  data: [
    {
      id: 1,
      user_id: 1,
      attribute_key_id: 1,
      attribute_key: { name: 'ethnicity' },
      value: 'Asian',
      raw_value: '["Asian", "White"]',
      is_visible_on_profile: true,
      created_at: '2024-12-01T00:00:00Z'
    },
    {
      id: 2,
      user_id: 1,
      attribute_key_id: 2,
      attribute_key: { name: 'work' },
      value: 'Software Engineer',
      raw_value: 'Software Engineer',
      is_visible_on_profile: true,
      created_at: '2024-12-01T00:00:00Z'
    },
    {
      id: 3,
      user_id: 1,
      attribute_key_id: 3,
      attribute_key: { name: 'smoking' },
      value: 'Non-smoker',
      raw_value: 'Non-smoker',
      is_visible_on_profile: true,
      created_at: '2024-12-01T00:00:00Z'
    },
    {
      id: 4,
      user_id: 1,
      attribute_key_id: 4,
      attribute_key: { name: 'religion' },
      value: 'Spiritual',
      raw_value: 'Spiritual',
      is_visible_on_profile: true,
      created_at: '2024-12-01T00:00:00Z'
    },
    {
      id: 5,
      user_id: 1,
      attribute_key_id: 5,
      attribute_key: { name: 'kids_view' },
      value: 'Want kids someday',
      raw_value: 'Want kids someday',
      is_visible_on_profile: true,
      created_at: '2024-12-01T00:00:00Z'
    }
  ]
}

/**
 * Mock API response for /profile/user/preferences with existing data
 */
export const mockExistingPreferencesResponse = {
  success: true,
  data: {
    id: 1,
    user_id: 1,
    looking_for_gender: 'men',
    age_min: 25,
    age_max: 35,
    kids_preference: 'Open to kids',
    distance_max: 50,
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2024-12-14T00:00:00Z'
  }
}

/**
 * Mock API response for /profile/user/interests with existing data
 */
export const mockExistingInterestsResponse = {
  success: true,
  data: [
    { interest_id: 1, name: 'Hiking', category: 'Outdoors' },
    { interest_id: 5, name: 'Photography', category: 'Arts' },
    { interest_id: 12, name: 'Music', category: 'Entertainment' }
  ]
}

/**
 * Mock existing user profile data (stored in auth)
 */
export const mockExistingUserProfile = {
  id: 1,
  email: 'jane.smith@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  date_of_birth: '1995-06-15',
  age: 28,
  gender: 'Woman',
  onboarding_completed: false,
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-14T00:00:00Z',
  profile: {
    first_name: 'Jane',
    last_name: 'Smith',
    date_of_birth: '1995-06-15',
    gender: 'Woman',
    attributes: {
      ethnicity: 'Asian',
      occupation: 'Software Engineer',
      smoking: 'Non-smoker',
      religion: 'Spiritual',
      children: 'Want kids someday'
    },
    preferences: {
      preferred_gender: ['men'],
      min_age: 25,
      max_age: 35
    },
    interests: [
      { id: 1, name: 'Hiking' },
      { id: 5, name: 'Photography' },
      { id: 12, name: 'Music' }
    ]
  }
}

/**
 * Mock empty API responses (for new users with no existing data)
 */
export const mockEmptyAttributesResponse = {
  success: true,
  data: []
}

export const mockEmptyPreferencesResponse = {
  success: true,
  data: null
}

export const mockEmptyInterestsResponse = {
  success: true,
  data: []
}

/**
 * Expected form field values after data loading
 */
export const expectedFormValues = {
  name: {
    firstName: 'Jane',
    lastName: 'Smith'
  },
  age: {
    birthdate: '1995-06-15'
  },
  gender: {
    gender: 'Woman'
  },
  ethnicity: {
    ethnicity: ['Asian', 'White']
  },
  work: {
    work: 'Software Engineer'
  },
  preferencesGender: {
    lookingForGender: ['men']
  },
  preferencesAgeRange: {
    ageMin: 25,
    ageMax: 35
  },
  vibeKids: {
    kidsView: 'Want kids someday'
  },
  vibeSmoking: {
    smoking: 'Non-smoker'
  },
  vibeReligion: {
    religion: 'Spiritual'
  },
  vibeInterests: {
    interests: [1, 5, 12]
  }
}
