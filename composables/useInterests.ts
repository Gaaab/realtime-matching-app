/**
 * useInterests Composable
 *
 * Fetches and manages interest options from the API.
 * Provides categorized interests for user selection.
 */

import type { Interest, InterestCategory, InterestsResponse } from '~/types/onboarding'

export const useInterests = () => {
  const api = useApi()

  // Cache for interests to avoid repeated API calls
  const interests = useState<Interest[]>('profile-interests', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all interests from API
   */
  const fetchInterests = async (): Promise<boolean> => {
    // Return cached data if already loaded
    if (interests.value.length > 0) {
      return true
    }

    try {
      loading.value = true
      error.value = null

      const response = await api.get<InterestsResponse>('/profile/interests')

      if (response.success && response.data) {
        interests.value = response.data
        return true
      }

      error.value = 'Failed to load interests'
      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to load interests'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Group interests by category
   */
  const categorizedInterests = computed<InterestCategory[]>(() => {
    if (interests.value.length === 0) {
      return getDefaultInterests()
    }

    const grouped = interests.value.reduce((acc, interest) => {
      const category = interest.category || 'Other'

      if (!acc[category]) {
        acc[category] = {
          category,
          category_id: interest.category_id || 0,
          interests: []
        }
      }

      acc[category].interests.push(interest)

      return acc
    }, {} as Record<string, InterestCategory>)

    // Sort categories by category_id
    return Object.values(grouped).sort((a, b) => a.category_id - b.category_id)
  })

  /**
   * Get interests by category name
   */
  const getInterestsByCategory = (category: string): Interest[] => {
    return interests.value.filter(interest => interest.category === category)
  }

  /**
   * Get interest by ID
   */
  const getInterestById = (id: number): Interest | undefined => {
    return interests.value.find(interest => interest.id === id)
  }

  /**
   * Get category by category ID
   */
  const getCategoryById = (categoryId: number): InterestCategory | undefined => {
    return categorizedInterests.value.find(cat => cat.category_id === categoryId)
  }

  /**
   * Default interests (fallback if API fails)
   */
  const getDefaultInterests = (): InterestCategory[] => {
    return [
      {
        category: 'Outdoors',
        category_id: 1,
        interests: [
          { id: 1, name: 'Hiking', category: 'Outdoors', category_id: 1 },
          { id: 2, name: 'Camping', category: 'Outdoors', category_id: 1 },
          { id: 3, name: 'Surfing', category: 'Outdoors', category_id: 1 },
          { id: 4, name: 'Cycling', category: 'Outdoors', category_id: 1 },
          { id: 5, name: 'Running', category: 'Outdoors', category_id: 1 },
          { id: 6, name: 'Rock climbing', category: 'Outdoors', category_id: 1 },
          { id: 7, name: 'Beach', category: 'Outdoors', category_id: 1 },
          { id: 8, name: 'Fishing', category: 'Outdoors', category_id: 1 },
          { id: 9, name: 'Kayaking', category: 'Outdoors', category_id: 1 }
        ]
      },
      {
        category: 'Food & Drink',
        category_id: 2,
        interests: [
          { id: 51, name: 'Coffee', category: 'Food & Drink', category_id: 2 },
          { id: 52, name: 'Wine', category: 'Food & Drink', category_id: 2 },
          { id: 53, name: 'Craft beer', category: 'Food & Drink', category_id: 2 },
          { id: 54, name: 'Cooking', category: 'Food & Drink', category_id: 2 },
          { id: 55, name: 'Baking', category: 'Food & Drink', category_id: 2 },
          { id: 56, name: 'Foodie', category: 'Food & Drink', category_id: 2 },
          { id: 57, name: 'BBQ', category: 'Food & Drink', category_id: 2 },
          { id: 58, name: 'Brunch', category: 'Food & Drink', category_id: 2 },
          { id: 59, name: 'Cocktails', category: 'Food & Drink', category_id: 2 }
        ]
      },
      {
        category: 'Entertainment',
        category_id: 3,
        interests: [
          { id: 101, name: 'Movies', category: 'Entertainment', category_id: 3 },
          { id: 102, name: 'Music', category: 'Entertainment', category_id: 3 },
          { id: 103, name: 'Concerts', category: 'Entertainment', category_id: 3 },
          { id: 104, name: 'Festivals', category: 'Entertainment', category_id: 3 },
          { id: 105, name: 'Gaming', category: 'Entertainment', category_id: 3 },
          { id: 106, name: 'Reading', category: 'Entertainment', category_id: 3 },
          { id: 107, name: 'Podcasts', category: 'Entertainment', category_id: 3 }
        ]
      },
      {
        category: 'Social & Lifestyle',
        category_id: 4,
        interests: [
          { id: 151, name: 'Yoga', category: 'Social & Lifestyle', category_id: 4 },
          { id: 152, name: 'Gym', category: 'Social & Lifestyle', category_id: 4 },
          { id: 153, name: 'Meditation', category: 'Social & Lifestyle', category_id: 4 },
          { id: 154, name: 'Dancing', category: 'Social & Lifestyle', category_id: 4 },
          { id: 155, name: 'Volunteering', category: 'Social & Lifestyle', category_id: 4 },
          { id: 156, name: 'Sports', category: 'Social & Lifestyle', category_id: 4 },
          { id: 157, name: 'Fashion', category: 'Social & Lifestyle', category_id: 4 }
        ]
      },
      {
        category: 'Travel',
        category_id: 5,
        interests: [
          { id: 201, name: 'Travel', category: 'Travel', category_id: 5 },
          { id: 202, name: 'Road trips', category: 'Travel', category_id: 5 },
          { id: 203, name: 'Backpacking', category: 'Travel', category_id: 5 },
          { id: 204, name: 'Adventure', category: 'Travel', category_id: 5 },
          { id: 205, name: 'Beach holidays', category: 'Travel', category_id: 5 },
          { id: 206, name: 'City breaks', category: 'Travel', category_id: 5 },
          { id: 207, name: 'Van life', category: 'Travel', category_id: 5 }
        ]
      },
      {
        category: 'Creative',
        category_id: 6,
        interests: [
          { id: 251, name: 'Photography', category: 'Creative', category_id: 6 },
          { id: 252, name: 'Art', category: 'Creative', category_id: 6 },
          { id: 253, name: 'Writing', category: 'Creative', category_id: 6 },
          { id: 254, name: 'Music production', category: 'Creative', category_id: 6 },
          { id: 255, name: 'DIY', category: 'Creative', category_id: 6 },
          { id: 256, name: 'Crafts', category: 'Creative', category_id: 6 },
          { id: 257, name: 'Design', category: 'Creative', category_id: 6 }
        ]
      }
    ]
  }

  /**
   * Get all categories (names only)
   */
  const categories = computed(() => {
    return categorizedInterests.value.map(cat => cat.category)
  })

  /**
   * Get total interest count
   */
  const totalInterests = computed(() => interests.value.length)

  // ============================================================================
  // Return Public API
  // ============================================================================

  return {
    // State
    interests: readonly(interests),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    categorizedInterests,
    categories,
    totalInterests,

    // Methods
    fetchInterests,
    getInterestsByCategory,
    getInterestById,
    getCategoryById
  }
}
