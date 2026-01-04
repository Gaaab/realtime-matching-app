/**
 * useAttributes Composable
 *
 * Fetches and manages profile attribute options from the API.
 * Provides type-safe access to gender, ethnicity, work, smoking, religion, and kids options.
 */

import type { AttributeKey, AttributesResponse, AttributeOption } from '~/types/onboarding'

export const useAttributes = () => {
  const api = useApi()

  // Cache for attributes to avoid repeated API calls
  const attributes = useState<AttributeKey[]>('profile-attributes', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all attribute options from API
   */
  const fetchAttributes = async (): Promise<boolean> => {
    // Return cached data if already loaded
    if (attributes.value.length > 0) {
      return true
    }

    try {
      loading.value = true
      error.value = null

      const response = await api.get<AttributesResponse>('/profile/attributes')

      if (response.success && response.data) {
        attributes.value = response.data
        return true
      }

      error.value = 'Failed to load attributes'
      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to load attributes'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Get attribute by key
   */
  const getAttributeByKey = (key: string): AttributeKey | undefined => {
    return attributes.value.find(attr => attr.key === key)
  }

  /**
   * Get attribute options by key
   */
  const getAttributeOptions = (key: string): AttributeOption[] => {
    const attribute = getAttributeByKey(key)
    return attribute?.options || []
  }

  // ============================================================================
  // Specific Attribute Getters
  // ============================================================================

  /**
   * Gender identity options
   */
  const genderOptions = computed(() => {
    const baseOptions = [
      { id: 1, value: 'woman', label: 'Woman' },
      { id: 2, value: 'man', label: 'Man' },
      { id: 3, value: 'non-binary', label: 'Non-binary' },
      { id: 4, value: 'more', label: 'More' }
    ]

    const apiOptions = getAttributeOptions('gender')
    return apiOptions.length > 0 ? apiOptions : baseOptions
  })

  /**
   * Extended gender options (shown in "More" modal)
   */
  const extendedGenderOptions = computed(() => {
    const options = [
      { id: 10, value: 'agender', label: 'Agender' },
      { id: 11, value: 'bigender', label: 'Bigender' },
      { id: 12, value: 'genderqueer', label: 'Genderqueer' },
      { id: 13, value: 'intersex', label: 'Intersex' },
      { id: 14, value: 'trans_woman', label: 'Trans woman' },
      { id: 15, value: 'trans_man', label: 'Trans man' },
      { id: 16, value: 'two_spirit', label: 'Two Spirit' },
      { id: 17, value: 'questioning', label: 'Questioning' },
      { id: 18, value: 'prefer_not_to_say', label: 'Prefer not to say' },
      { id: 19, value: 'other', label: 'Other' }
    ]

    const apiOptions = getAttributeOptions('gender_extended')
    return apiOptions.length > 0 ? apiOptions : options
  })

  /**
   * Ethnicity options
   */
  const ethnicityOptions = computed(() => {
    const options = [
      { id: 20, value: 'indigenous_australian', label: 'Indigenous Australian' },
      { id: 21, value: 'anglo_european', label: 'Anglo/European' },
      { id: 22, value: 'asian', label: 'Asian' },
      { id: 23, value: 'middle_eastern_north_african', label: 'Middle Eastern/North African' },
      { id: 24, value: 'hispanic_latino', label: 'Hispanic/Latino' },
      { id: 25, value: 'pacific_islander', label: 'Pacific Islander' },
      { id: 26, value: 'black_african', label: 'Black/African descent' },
      { id: 27, value: 'mixed_other', label: 'Mixed/Other' },
      { id: 28, value: 'prefer_not_to_say', label: 'Prefer not to say' }
    ]

    const apiOptions = getAttributeOptions('ethnicity')
    return apiOptions.length > 0 ? apiOptions : options
  })

  /**
   * Work/Occupation options
   */
  const workOptions = computed(() => {
    const options = [
      { id: 30, value: 'self_employed', label: 'Self-employed' },
      { id: 31, value: 'trades_construction', label: 'Trades and construction' },
      { id: 32, value: 'corporate_professional', label: 'Corporate/professional' },
      { id: 33, value: 'government_public_service', label: 'Government/public service' },
      { id: 34, value: 'student', label: 'Student' },
      { id: 35, value: 'defence_military', label: 'Defence/military' },
      { id: 36, value: 'emergency_services', label: 'Emergency services' },
      { id: 37, value: 'health_care', label: 'Health and care' },
      { id: 38, value: 'not_working', label: 'Not currently working' },
      { id: 39, value: 'other', label: 'Other' }
    ]

    const apiOptions = getAttributeOptions('work')
    return apiOptions.length > 0 ? apiOptions : options
  })

  /**
   * Kids view options
   */
  const kidsViewOptions = computed(() => {
    const options = [
      { id: 40, value: 'want_kids', label: 'Want kids' },
      { id: 41, value: 'no_kids', label: "Don't want kids" },
      { id: 42, value: 'open_to_kids', label: 'Open to kids' },
      { id: 43, value: 'has_kids', label: 'Already have kids' },
      { id: 44, value: 'prefer_not_to_say', label: 'Prefer not to say' }
    ]

    const apiOptions = getAttributeOptions('kids_view')
    return apiOptions.length > 0 ? apiOptions : options
  })

  /**
   * Kids preference options (for matching)
   */
  const kidsPreferenceOptions = computed(() => {
    const options = [
      { id: 50, value: 'wants_kids', label: 'Wants kids' },
      { id: 51, value: 'no_kids', label: "Doesn't want kids" },
      { id: 52, value: 'open_to_kids', label: 'Open to kids' },
      { id: 53, value: 'has_kids', label: 'Has kids already' },
      { id: 54, value: 'prefer_not_to_say', label: 'Prefer not to say' }
    ]

    const apiOptions = getAttributeOptions('kids_preference')
    return apiOptions.length > 0 ? apiOptions : options
  })

  /**
   * Smoking options
   */
  const smokingOptions = computed(() => {
    const options = [
      { id: 60, value: 'non_smoker', label: "I don't smoke" },
      { id: 61, value: 'occasionally', label: 'Occasionally' },
      { id: 62, value: 'smoker', label: 'I smoke' },
      { id: 63, value: 'prefer_not_to_say', label: 'Prefer not to say' }
    ]

    const apiOptions = getAttributeOptions('smoking')
    return apiOptions.length > 0 ? apiOptions : options
  })

  /**
   * Religion/Spirituality options
   */
  const religionOptions = computed(() => {
    const options = [
      { id: 70, value: 'not_religious', label: 'Not religious or spiritual' },
      { id: 71, value: 'spiritual', label: 'Spiritual' },
      { id: 72, value: 'christian', label: 'Christian' },
      { id: 73, value: 'hindu', label: 'Hindu' },
      { id: 74, value: 'islam', label: 'Islam' },
      { id: 75, value: 'other', label: 'Other' },
      { id: 76, value: 'prefer_not_to_say', label: 'Prefer not to say' }
    ]

    const apiOptions = getAttributeOptions('religion')
    return apiOptions.length > 0 ? apiOptions : options
  })

  /**
   * Gender preference options (for matching)
   */
  const genderPreferenceOptions = computed(() => {
    const options = [
      { id: 80, value: 'women', label: 'Women' },
      { id: 81, value: 'men', label: 'Men' },
      { id: 82, value: 'non-binary', label: 'Non-binary' },
      { id: 83, value: 'everyone', label: 'Everyone' }
    ]

    const apiOptions = getAttributeOptions('looking_for_gender')
    return apiOptions.length > 0 ? apiOptions : options
  })

  /**
   * Get attribute key ID by key name
   */
  const getAttributeKeyId = (key: string): number | undefined => {
    return getAttributeByKey(key)?.id
  }

  // ============================================================================
  // Return Public API
  // ============================================================================

  return {
    // State
    attributes: readonly(attributes),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    fetchAttributes,
    getAttributeByKey,
    getAttributeOptions,
    getAttributeKeyId,

    // Specific Options
    genderOptions,
    extendedGenderOptions,
    ethnicityOptions,
    workOptions,
    kidsViewOptions,
    kidsPreferenceOptions,
    smokingOptions,
    religionOptions,
    genderPreferenceOptions
  }
}
