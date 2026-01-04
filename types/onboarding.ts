/**
 * Onboarding Types
 *
 * Complete type definitions for the multi-step onboarding flow.
 * This includes all three sections: Profile Basics, Preferences, and Vibe & Lifestyle.
 */

// ============================================================================
// Core Onboarding Structure
// ============================================================================

export type OnboardingStepId =
  // Section 1: Profile Basics
  | 'intro' | 'name' | 'age' | 'gender' | 'ethnicity' | 'work' | 'photo'
  // Section 2: Preferences
  | 'preferences-intro' | 'preferences-gender' | 'preferences-age-range' | 'preferences-kids' | 'preferences-dealbreakers'
  // Section 3: Vibe & Lifestyle
  | 'vibe-intro' | 'vibe-kids' | 'vibe-smoking' | 'vibe-religion' | 'vibe-interests'
  | 'complete'

export type OnboardingSectionId = 'profile-basics' | 'preferences' | 'vibe-lifestyle'

export interface OnboardingStep {
  id: OnboardingStepId
  section: OnboardingSectionId
  title: string
  subtitle?: string
  path: string
  order: number
  isIntro?: boolean
  required: boolean
}

export interface OnboardingSection {
  id: OnboardingSectionId
  title: string
  description: string
  steps: OnboardingStep[]
  order: number
}

// ============================================================================
// Section 1: Profile Basics Data
// ============================================================================

export interface ProfileBasicsData {
  first_name: string
  last_name: string
  birthdate: string // ISO date format: YYYY-MM-DD
  age?: number // Calculated from birthdate
  gender: string
  gender_visibility: boolean
  ethnicity: string[]
  ethnicity_visibility: boolean
  work: string
  work_visibility: boolean
  photo_uploaded: boolean
}

// ============================================================================
// Section 2: Preferences Data
// ============================================================================

export interface PreferencesData {
  looking_for_gender: string[] // ['women', 'men', 'non-binary'] or ['everyone']
  age_min: number
  age_max: number
  kids_preference: string // 'wants_kids' | 'no_kids' | 'open' | 'has_kids' | 'prefer_not_to_say'
  dealbreakers: UserDealbreaker[]
}

export interface UserDealbreaker {
  dealbreaker_id: number
  criteria: string // The specific criterion selected (e.g., 'must_not_smoke', 'no_preference')
  dealbreaker?: DealbreakerDefinition
}

// ============================================================================
// Section 3: Vibe & Lifestyle Data
// ============================================================================

export interface VibeLifestyleData {
  kids_view: string
  kids_view_visibility: boolean
  smoking: string
  smoking_visibility: boolean
  religion: string
  religion_visibility: boolean
  interests: number[] // Array of interest IDs
}

// ============================================================================
// Complete Onboarding State
// ============================================================================

export interface OnboardingState {
  currentStep: number // 0-based index across all steps
  currentSection: OnboardingSectionId
  totalSteps: number
  profileBasics: ProfileBasicsData
  preferences: PreferencesData
  vibeLifestyle: VibeLifestyleData
  completed: boolean
  errors: Record<string, string>
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AttributeOption {
  id: number
  value: string
  label: string
  category?: string
}

export interface AttributeKey {
  id: number
  key: string
  label: string
  data_type: 'string' | 'number' | 'boolean' | 'array'
  category: 'profile_basics' | 'vibe_lifestyle'
  options: AttributeOption[] | null
}

export interface AttributesResponse {
  success: boolean
  data: AttributeKey[]
}

export interface Interest {
  id: number
  name: string
  category: string
  category_id: number
}

export interface InterestCategory {
  category: string
  category_id: number
  interests: Interest[]
}

export interface InterestsResponse {
  success: boolean
  data: Interest[]
}

export interface DealbreakerDefinition {
  id: number
  name: string
  description: string
  category: string
  criteria_options: DealbreakerCriterion[]
}

export interface DealbreakerCriterion {
  value: string
  label: string
}

export interface DealbreakersResponse {
  success: boolean
  data: DealbreakerDefinition[]
}

// ============================================================================
// API Request Types
// ============================================================================

export interface UpdateProfileRequest {
  first_name?: string
  last_name?: string
  birthdate?: string
  gender?: string
  ethnicity?: string
  description?: string
}

export interface UpdateAttributesRequest {
  attributes: {
    attribute_key_id: number
    value: string | number | boolean
    is_visible_on_profile: boolean
  }[]
}

export interface UpdatePreferencesRequest {
  looking_for_gender?: string[]
  age_min?: number
  age_max?: number
  kids_preference?: string
  max_distance?: number
}

export interface UpdateInterestsRequest {
  interest_ids: number[]
}

export interface CreateDealbreakerRequest {
  dealbreaker_id: number
  criteria: string
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface RadioOption {
  value: string
  label: string
  icon?: string
  description?: string
}

export interface ChipOption {
  value: string
  label: string
}

export interface AgeRange {
  min: number
  max: number
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export interface StepValidation {
  [key: string]: (state: OnboardingState) => ValidationResult
}

// ============================================================================
// Helper Types
// ============================================================================

export type OnboardingProgress = {
  current: number
  total: number
  percentage: number
  sectionProgress: {
    [key in OnboardingSectionId]: {
      current: number
      total: number
      completed: boolean
    }
  }
}
