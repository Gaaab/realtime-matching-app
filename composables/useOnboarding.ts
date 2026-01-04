/**
 * useOnboarding Composable
 *
 * Central state management for the entire onboarding flow.
 * Manages navigation, validation, API integration, and progress tracking.
 */

import type {
  OnboardingState,
  OnboardingStep,
  OnboardingSection,
  OnboardingStepId,
  OnboardingSectionId,
  OnboardingProgress,
  ValidationResult,
  UpdateProfileRequest,
  UpdateAttributesRequest,
  UpdatePreferencesRequest,
  UpdateInterestsRequest,
  CreateDealbreakerRequest
} from '~/types/onboarding'

// ============================================================================
// Onboarding Flow Configuration
// ============================================================================

const ONBOARDING_STEPS: OnboardingStep[] = [
  // Section 1: Profile Basics
  { id: 'intro', section: 'profile-basics', title: "Let's set up the essentials", path: '/onboarding', order: 0, isIntro: true, required: false },
  { id: 'name', section: 'profile-basics', title: 'Start with your name', path: '/onboarding/name', order: 1, required: true },
  { id: 'age', section: 'profile-basics', title: "What's your age?", path: '/onboarding/age', order: 2, required: true },
  { id: 'gender', section: 'profile-basics', title: 'How do you identify?', path: '/onboarding/gender', order: 3, required: true },
  { id: 'ethnicity', section: 'profile-basics', title: 'How do you describe your ethnicity?', path: '/onboarding/ethnicity', order: 4, required: false },
  { id: 'work', section: 'profile-basics', title: 'What do you do for work?', path: '/onboarding/work', order: 5, required: false },
  { id: 'photo', section: 'profile-basics', title: 'Your first impression starts here', path: '/onboarding/photo', order: 6, required: false },

  // Section 2: Preferences
  { id: 'preferences-intro', section: 'preferences', title: 'Shape your preferences', path: '/onboarding/preferences', order: 7, isIntro: true, required: false },
  { id: 'preferences-gender', section: 'preferences', title: 'Who do you want to meet?', path: '/onboarding/preferences/gender', order: 8, required: true },
  { id: 'preferences-age-range', section: 'preferences', title: 'Set your age range', path: '/onboarding/preferences/age-range', order: 9, required: true },
  { id: 'preferences-kids', section: 'preferences', title: "What's your preference on kids?", path: '/onboarding/preferences/kids', order: 10, required: false },
  { id: 'preferences-dealbreakers', section: 'preferences', title: "What's a Deal Breaker for you?", path: '/onboarding/preferences/dealbreakers', order: 11, required: false },

  // Section 3: Vibe & Lifestyle
  { id: 'vibe-intro', section: 'vibe-lifestyle', title: 'Your Vibe & Lifestyle', path: '/onboarding/vibe', order: 12, isIntro: true, required: false },
  { id: 'vibe-kids', section: 'vibe-lifestyle', title: "What's your view on kids?", path: '/onboarding/vibe/kids', order: 13, required: false },
  { id: 'vibe-smoking', section: 'vibe-lifestyle', title: "What's your stance on smoking?", path: '/onboarding/vibe/smoking', order: 14, required: false },
  { id: 'vibe-religion', section: 'vibe-lifestyle', title: 'Do you follow a spiritual or religious path?', path: '/onboarding/vibe/religion', order: 15, required: false },
  { id: 'vibe-interests', section: 'vibe-lifestyle', title: 'What are you into?', path: '/onboarding/vibe/interests', order: 16, required: false },

  // Completion
  { id: 'complete', section: 'vibe-lifestyle', title: "You're all set!", path: '/onboarding/complete', order: 17, required: false }
]

const ONBOARDING_SECTIONS: OnboardingSection[] = [
  {
    id: 'profile-basics',
    title: 'Profile Basics',
    description: 'A few quick details to help people get to know the real you',
    steps: ONBOARDING_STEPS.filter(s => s.section === 'profile-basics'),
    order: 1
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: "Tell us who you're open to meeting and what you're looking for",
    steps: ONBOARDING_STEPS.filter(s => s.section === 'preferences'),
    order: 2
  },
  {
    id: 'vibe-lifestyle',
    title: 'Vibe & Lifestyle',
    description: 'Share how you live, what you enjoy, and what matters most to you',
    steps: ONBOARDING_STEPS.filter(s => s.section === 'vibe-lifestyle'),
    order: 3
  }
]

// ============================================================================
// Initial State
// ============================================================================

const createInitialState = (): OnboardingState => ({
  currentStep: 0,
  currentSection: 'profile-basics',
  totalSteps: ONBOARDING_STEPS.length,
  profileBasics: {
    first_name: '',
    last_name: '',
    birthdate: '',
    age: undefined,
    gender: '',
    gender_visibility: true,
    ethnicity: [],
    ethnicity_visibility: true,
    work: '',
    work_visibility: true,
    photo_uploaded: false
  },
  preferences: {
    looking_for_gender: [],
    age_min: 20,
    age_max: 30,
    kids_preference: '',
    dealbreakers: []
  },
  vibeLifestyle: {
    kids_view: '',
    kids_view_visibility: true,
    smoking: '',
    smoking_visibility: true,
    religion: '',
    religion_visibility: true,
    interests: []
  },
  completed: false,
  errors: {}
})

// ============================================================================
// Composable
// ============================================================================

export const useOnboarding = () => {
  const api = useApi()
  const router = useRouter()
  const authStore = useAuthStore()

  // State
  const state = useState<OnboardingState>('onboarding-state', createInitialState)
  const loading = ref(false)
  const saving = ref(false)
  const dataLoaded = useState<boolean>('onboarding-data-loaded', () => false)

  // ============================================================================
  // Load Existing User Data
  // ============================================================================

  /**
   * Wait for auth store to be initialized
   */
  const waitForAuthStore = async (): Promise<void> => {
    if (authStore.initialized) return

    // Wait for auth store initialization (max 3 seconds)
    let attempts = 0
    const maxAttempts = 60
    while (!authStore.initialized && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 50))
      attempts++
    }

    if (!authStore.initialized && import.meta.dev) {
      console.warn('[Onboarding] Auth store not initialized after timeout')
    }
  }

  /**
   * Process attributes response and update state
   */
  const processAttributes = (attributes: Array<{
    attribute_key_id: number
    value: string
    raw_value: string
    is_visible_on_profile: boolean
    attribute_key: { name: string }
  }> | null | undefined) => {
    if (!attributes || !Array.isArray(attributes)) return

    for (const attr of attributes) {
      const key = attr.attribute_key?.name
      const value = attr.raw_value || attr.value
      const visibility = attr.is_visible_on_profile

      switch (key) {
        case 'ethnicity':
          try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) {
              state.value.profileBasics.ethnicity = parsed
            } else if (parsed && typeof parsed === 'string') {
              state.value.profileBasics.ethnicity = [parsed]
            } else {
              state.value.profileBasics.ethnicity = value ? [value] : []
            }
          } catch {
            state.value.profileBasics.ethnicity = value && value !== 'null' ? [value] : []
          }
          state.value.profileBasics.ethnicity_visibility = visibility
          break
        case 'work':
        case 'occupation':
          state.value.profileBasics.work = value
          state.value.profileBasics.work_visibility = visibility
          break
        case 'smoking':
          state.value.vibeLifestyle.smoking = value
          state.value.vibeLifestyle.smoking_visibility = visibility
          break
        case 'religion':
          state.value.vibeLifestyle.religion = value
          state.value.vibeLifestyle.religion_visibility = visibility
          break
        case 'kids':
        case 'kids_view':
        case 'children':
          state.value.vibeLifestyle.kids_view = value
          state.value.vibeLifestyle.kids_view_visibility = visibility
          break
      }
    }
  }

  /**
   * Process preferences response and update state
   */
  const processPreferences = (prefs: {
    looking_for_gender?: string
    age_min?: number
    age_max?: number
    kids_preference?: string
  } | null | undefined) => {
    if (!prefs) return

    if (prefs.looking_for_gender) {
      if (prefs.looking_for_gender === 'everyone') {
        state.value.preferences.looking_for_gender = ['everyone']
      } else {
        state.value.preferences.looking_for_gender = [prefs.looking_for_gender]
      }
    }
    if (prefs.age_min !== undefined) {
      state.value.preferences.age_min = prefs.age_min
    }
    if (prefs.age_max !== undefined) {
      state.value.preferences.age_max = prefs.age_max
    }
    if (prefs.kids_preference) {
      state.value.preferences.kids_preference = prefs.kids_preference
    }
  }

  /**
   * Process interests response and update state
   */
  const processInterests = (interests: Array<{ interest_id: number }> | null | undefined) => {
    if (!interests || !Array.isArray(interests)) return
    state.value.vibeLifestyle.interests = interests.map(i => i.interest_id)
  }

  /**
   * Load existing user data from profile, attributes, preferences, and interests
   * Always reloads from API to ensure fresh data
   */
  const loadExistingData = async (): Promise<void> => {
    // Prevent concurrent loads
    if (loading.value) {
      if (import.meta.dev) {
        console.log('[Onboarding] Load already in progress, skipping')
      }
      return
    }

    try {
      loading.value = true

      // Wait for auth store to be initialized
      await waitForAuthStore()

      // 1. Load from auth store profile (basic info) - immediate, no API call
      const profile = authStore.user?.profile
      if (import.meta.dev) {
        console.log('[Onboarding] Auth store profile:', profile)
      }

      if (profile) {
        if (profile.first_name) state.value.profileBasics.first_name = profile.first_name
        if (profile.last_name) state.value.profileBasics.last_name = profile.last_name
        if (profile.date_of_birth) state.value.profileBasics.birthdate = profile.date_of_birth
        if (profile.gender) state.value.profileBasics.gender = profile.gender

        // Also load from nested profile data if available
        if (profile.attributes) {
          if (profile.attributes.ethnicity) state.value.profileBasics.ethnicity = [profile.attributes.ethnicity]
          if (profile.attributes.occupation) state.value.profileBasics.work = profile.attributes.occupation
          if (profile.attributes.smoking) state.value.vibeLifestyle.smoking = profile.attributes.smoking
          if (profile.attributes.religion) state.value.vibeLifestyle.religion = profile.attributes.religion
          if (profile.attributes.children) state.value.vibeLifestyle.kids_view = profile.attributes.children
        }

        if (profile.preferences) {
          if (profile.preferences.preferred_gender) state.value.preferences.looking_for_gender = profile.preferences.preferred_gender
          if (profile.preferences.min_age) state.value.preferences.age_min = profile.preferences.min_age
          if (profile.preferences.max_age) state.value.preferences.age_max = profile.preferences.max_age
        }

        if (profile.interests) {
          state.value.vibeLifestyle.interests = profile.interests.map(i => i.id)
        }
      }

      // 2. Fetch all API data in parallel for better performance
      const [attributesResult, prefsResult, interestsResult] = await Promise.all([
        api.get<Array<{
          attribute_key_id: number
          value: string
          raw_value: string
          is_visible_on_profile: boolean
          attribute_key: { name: string }
        }>>('/profile/user/attributes').catch(err => {
          console.warn('[Onboarding] Failed to load attributes:', err)
          return null
        }),
        api.get<{
          looking_for_gender: string
          age_min: number
          age_max: number
          kids_preference?: string
        }>('/profile/user/preferences').catch(err => {
          console.warn('[Onboarding] Failed to load preferences:', err)
          return null
        }),
        api.get<Array<{
          interest_id: number
        }>>('/profile/user/interests').catch(err => {
          console.warn('[Onboarding] Failed to load interests:', err)
          return null
        })
      ])

      if (import.meta.dev) {
        console.log('[Onboarding] API responses:', {
          attributes: attributesResult,
          preferences: prefsResult,
          interests: interestsResult
        })
      }

      // Process API responses
      if (attributesResult?.data) {
        processAttributes(attributesResult.data)
      }
      if (prefsResult?.data) {
        processPreferences(prefsResult.data)
      }
      if (interestsResult?.data) {
        processInterests(interestsResult.data)
      }

      dataLoaded.value = true

      if (import.meta.dev) {
        console.log('[Onboarding] Final loaded state:', {
          profileBasics: { ...state.value.profileBasics },
          preferences: { ...state.value.preferences },
          vibeLifestyle: { ...state.value.vibeLifestyle }
        })
      }
    } catch (err) {
      console.error('[Onboarding] Failed to load existing data:', err)
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  const currentStepData = computed(() => ONBOARDING_STEPS[state.value.currentStep])

  const currentSectionData = computed(() =>
    ONBOARDING_SECTIONS.find(s => s.id === state.value.currentSection)
  )

  const progress = computed<OnboardingProgress>(() => {
    const current = state.value.currentStep + 1
    const total = state.value.totalSteps
    const percentage = Math.round((current / total) * 100)

    const sectionProgress = ONBOARDING_SECTIONS.reduce((acc, section) => {
      const sectionSteps = section.steps
      const currentStepInSection = sectionSteps.findIndex(
        s => s.id === currentStepData.value?.id
      )

      acc[section.id] = {
        current: currentStepInSection >= 0 ? currentStepInSection + 1 : 0,
        total: sectionSteps.length,
        completed: currentStepInSection === sectionSteps.length - 1
      }

      return acc
    }, {} as OnboardingProgress['sectionProgress'])

    return { current, total, percentage, sectionProgress }
  })

  const canGoBack = computed(() => state.value.currentStep > 0)

  const canGoForward = computed(() => {
    return state.value.currentStep < state.value.totalSteps - 1
  })

  // ============================================================================
  // Navigation Methods
  // ============================================================================

  /**
   * Sync step state without navigation (for use on page mount)
   */
  const syncStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < state.value.totalSteps) {
      state.value.currentStep = stepIndex
      const step = ONBOARDING_STEPS[stepIndex]
      state.value.currentSection = step.section
    }
  }

  /**
   * Sync step state by ID without navigation (for use on page mount)
   */
  const syncStepById = (stepId: OnboardingStepId) => {
    const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === stepId)
    if (stepIndex !== -1) {
      syncStep(stepIndex)
    }
  }

  /**
   * Navigate to a step by index (updates state and navigates)
   */
  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < state.value.totalSteps) {
      state.value.currentStep = stepIndex
      const step = ONBOARDING_STEPS[stepIndex]
      state.value.currentSection = step.section
      router.push(step.path)
    }
  }

  /**
   * Navigate to a step by ID (updates state and navigates)
   */
  const goToStepById = (stepId: OnboardingStepId) => {
    const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === stepId)
    if (stepIndex !== -1) {
      goToStep(stepIndex)
    }
  }

  const next = async () => {
    if (canGoForward.value) {
      const nextIndex = state.value.currentStep + 1
      goToStep(nextIndex)
    }
  }

  const previous = () => {
    if (canGoBack.value) {
      const prevIndex = state.value.currentStep - 1
      goToStep(prevIndex)
    }
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  const validateName = (): ValidationResult => {
    const errors: Record<string, string> = {}

    if (!state.value.profileBasics.first_name.trim()) {
      errors.first_name = 'First name is required'
    }

    if (!state.value.profileBasics.last_name.trim()) {
      errors.last_name = 'Last name is required'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  }

  const validateAge = (): ValidationResult => {
    const errors: Record<string, string> = {}

    if (!state.value.profileBasics.birthdate) {
      errors.birthdate = 'Date of birth is required'
      return { valid: false, errors }
    }

    const birthDate = new Date(state.value.profileBasics.birthdate)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    let calculatedAge = age
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge = age - 1
    }

    state.value.profileBasics.age = calculatedAge

    if (calculatedAge < 18) {
      errors.birthdate = 'You must be at least 18 years old'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  }

  const validateGender = (): ValidationResult => {
    const errors: Record<string, string> = {}

    if (!state.value.profileBasics.gender) {
      errors.gender = 'Please select your gender identity'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  }

  const validatePreferencesGender = (): ValidationResult => {
    const errors: Record<string, string> = {}

    if (state.value.preferences.looking_for_gender.length === 0) {
      errors.looking_for_gender = 'Please select who you want to meet'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  }

  const validateAgeRange = (): ValidationResult => {
    const errors: Record<string, string> = {}

    if (state.value.preferences.age_min < 18) {
      errors.age_min = 'Minimum age must be at least 18'
    }

    if (state.value.preferences.age_max > 100) {
      errors.age_max = 'Maximum age cannot exceed 100'
    }

    if (state.value.preferences.age_min >= state.value.preferences.age_max) {
      errors.age_range = 'Minimum age must be less than maximum age'
    }

    return { valid: Object.keys(errors).length === 0, errors }
  }

  // ============================================================================
  // API Integration Methods
  // ============================================================================

  /**
   * Save basic profile information
   * @param fields - Specific fields to save (defaults to all non-empty fields)
   */
  const saveProfileBasics = async (fields?: Partial<UpdateProfileRequest>): Promise<boolean> => {
    try {
      saving.value = true
      state.value.errors = {}

      // If specific fields provided, use those; otherwise build from state
      const request: UpdateProfileRequest = fields ?? {}

      // Only include non-empty values when building from state
      if (!fields) {
        if (state.value.profileBasics.first_name) {
          request.first_name = state.value.profileBasics.first_name
        }
        if (state.value.profileBasics.last_name) {
          request.last_name = state.value.profileBasics.last_name
        }
        if (state.value.profileBasics.birthdate) {
          request.birthdate = state.value.profileBasics.birthdate
        }
        if (state.value.profileBasics.gender) {
          request.gender = state.value.profileBasics.gender
        }
      }

      const response = await api.put('/auth/profile', request)

      if (response.success && response.data) {
        authStore.setUser(response.data)
        authStore.persistToStorage()
        return true
      }

      return false
    } catch (error: any) {
      state.value.errors.general = error.message || 'Failed to save profile'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Save user attributes (ethnicity, work, kids, smoking, religion)
   */
  const saveAttributes = async (attributes: Array<{
    attribute_key_id: number
    value: string | string[]
    is_visible_on_profile: boolean
  }>): Promise<boolean> => {
    try {
      saving.value = true
      state.value.errors = {}

      const request: UpdateAttributesRequest = {
        attributes: attributes.map(attr => ({
          attribute_key_id: attr.attribute_key_id,
          value: Array.isArray(attr.value) ? JSON.stringify(attr.value) : attr.value,
          is_visible_on_profile: attr.is_visible_on_profile
        }))
      }

      const response = await api.put('/profile/user/attributes', request)

      return response.success
    } catch (error: any) {
      state.value.errors.general = error.message || 'Failed to save attributes'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Save user preferences (looking for gender, age range, kids preference)
   */
  const savePreferences = async (preferences: Partial<UpdatePreferencesRequest>): Promise<boolean> => {
    try {
      saving.value = true
      state.value.errors = {}

      const response = await api.put('/profile/user/preferences', preferences)

      return response.success
    } catch (error: any) {
      state.value.errors.general = error.message || 'Failed to save preferences'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Save user interests
   */
  const saveInterests = async (interestIds: number[]): Promise<boolean> => {
    try {
      saving.value = true
      state.value.errors = {}

      const request: UpdateInterestsRequest = { interest_ids: interestIds }
      const response = await api.put('/profile/user/interests', request)

      return response.success
    } catch (error: any) {
      state.value.errors.general = error.message || 'Failed to save interests'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Save a dealbreaker
   */
  const saveDealbreaker = async (dealbreakerId: number, criteria: string): Promise<boolean> => {
    try {
      saving.value = true
      state.value.errors = {}

      const request: CreateDealbreakerRequest = {
        dealbreaker_id: dealbreakerId,
        criteria
      }

      const response = await api.post('/profile/user/dealbreakers', request)

      return response.success
    } catch (error: any) {
      state.value.errors.general = error.message || 'Failed to save dealbreaker'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Mark onboarding as complete
   */
  const completeOnboarding = async (): Promise<boolean> => {
    try {
      saving.value = true
      state.value.errors = {}

      const response = await api.post('/auth/onboarding/complete', {})

      if (response.success) {
        state.value.completed = true

        // Update user in auth store
        if (response.data) {
          authStore.setUser(response.data)
          authStore.persistToStorage()
        }

        return true
      }

      return false
    } catch (error: any) {
      state.value.errors.general = error.message || 'Failed to complete onboarding'
      return false
    } finally {
      saving.value = false
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  const reset = () => {
    state.value = createInitialState()
  }

  const clearErrors = () => {
    state.value.errors = {}
  }

  // ============================================================================
  // Return Public API
  // ============================================================================

  return {
    // State (mutable - pages need to update form values)
    state,
    loading: readonly(loading),
    saving: readonly(saving),
    dataLoaded: readonly(dataLoaded),

    // Computed
    currentStep: currentStepData,
    currentSection: currentSectionData,
    progress,
    canGoBack,
    canGoForward,

    // Data Loading
    loadExistingData,

    // Navigation
    goToStep,
    goToStepById,
    syncStep,
    syncStepById,
    next,
    previous,

    // Validation
    validateName,
    validateAge,
    validateGender,
    validatePreferencesGender,
    validateAgeRange,

    // API Methods
    saveProfileBasics,
    saveAttributes,
    savePreferences,
    saveInterests,
    saveDealbreaker,
    completeOnboarding,

    // Utilities
    reset,
    clearErrors,

    // Configuration (read-only)
    allSteps: ONBOARDING_STEPS,
    allSections: ONBOARDING_SECTIONS
  }
}
