import type {
  Icebreaker,
  IcebreakersByCategory,
  IcebreakerMessage,
  IcebreakersState
} from '~/types/icebreaker'
import type { Message } from '~/types/chat'

/**
 * Icebreakers Composable
 *
 * Provides methods for fetching and managing icebreaker conversation starters.
 * Icebreakers help users start conversations with their matches by providing
 * suggested prompts based on shared interests and categories.
 *
 * @example
 * ```ts
 * const {
 *   fetchIcebreakers,
 *   fetchMatchIcebreakers,
 *   sendIcebreaker,
 *   icebreakersByCategory,
 *   loading
 * } = useIcebreakers()
 *
 * // Fetch all icebreakers (public endpoint, can cache)
 * await fetchIcebreakers()
 *
 * // Fetch personalized icebreakers for a match
 * await fetchMatchIcebreakers(matchId)
 *
 * // Send an icebreaker as a message
 * const message = await sendIcebreaker(matchId, icebreakerId)
 * ```
 */
export const useIcebreakers = () => {
  const api = useApi()

  // ============================================================================
  // REACTIVE STATE
  // ============================================================================

  /** All available icebreakers (from public endpoint) */
  const icebreakers = ref<Icebreaker[]>([])

  /** Icebreakers personalized for current match */
  const matchIcebreakers = ref<Icebreaker[]>([])

  /** Current match ID for which match icebreakers were fetched */
  const currentMatchId = ref<number | null>(null)

  /** Loading state */
  const loading = ref(false)

  /** Sending state (for individual icebreaker send operations) */
  const sending = ref(false)

  /** Error message */
  const error = ref<string | null>(null)

  /** Last time icebreakers were fetched (for cache management) */
  const lastFetchedAt = ref<string | null>(null)

  /** Cache duration in milliseconds (15 minutes) */
  const CACHE_DURATION_MS = 15 * 60 * 1000

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================

  /**
   * Group icebreakers by category for UI display
   * Returns icebreakers organized by category with category metadata
   */
  const icebreakersByCategory = computed<IcebreakersByCategory[]>(() => {
    const grouped = new Map<number, IcebreakersByCategory>()

    for (const icebreaker of icebreakers.value) {
      if (!grouped.has(icebreaker.category_id)) {
        grouped.set(icebreaker.category_id, {
          category_id: icebreaker.category_id,
          category: icebreaker.category,
          icon_url: icebreaker.icon_url,
          icebreakers: []
        })
      }
      grouped.get(icebreaker.category_id)!.icebreakers.push(icebreaker)
    }

    // Sort by category_id for consistent ordering
    return Array.from(grouped.values()).sort(
      (a, b) => a.category_id - b.category_id
    )
  })

  /**
   * Group match icebreakers by category for UI display
   */
  const matchIcebreakersByCategory = computed<IcebreakersByCategory[]>(() => {
    const grouped = new Map<number, IcebreakersByCategory>()

    for (const icebreaker of matchIcebreakers.value) {
      if (!grouped.has(icebreaker.category_id)) {
        grouped.set(icebreaker.category_id, {
          category_id: icebreaker.category_id,
          category: icebreaker.category,
          icon_url: icebreaker.icon_url,
          icebreakers: []
        })
      }
      grouped.get(icebreaker.category_id)!.icebreakers.push(icebreaker)
    }

    return Array.from(grouped.values()).sort(
      (a, b) => a.category_id - b.category_id
    )
  })

  /**
   * Get unique categories from icebreakers
   */
  const categories = computed(() => {
    const uniqueCategories = new Map<number, { id: number; name: string; icon_url: string | null }>()

    for (const icebreaker of icebreakers.value) {
      if (!uniqueCategories.has(icebreaker.category_id)) {
        uniqueCategories.set(icebreaker.category_id, {
          id: icebreaker.category_id,
          name: icebreaker.category,
          icon_url: icebreaker.icon_url
        })
      }
    }

    return Array.from(uniqueCategories.values()).sort((a, b) => a.id - b.id)
  })

  /**
   * Check if cache is still valid
   */
  const isCacheValid = computed(() => {
    if (!lastFetchedAt.value) return false
    const elapsed = Date.now() - new Date(lastFetchedAt.value).getTime()
    return elapsed < CACHE_DURATION_MS
  })

  /**
   * Check if we have icebreakers loaded
   */
  const hasIcebreakers = computed(() => icebreakers.value.length > 0)

  /**
   * Check if we have match icebreakers loaded for current match
   */
  const hasMatchIcebreakers = computed(() => matchIcebreakers.value.length > 0)

  // ============================================================================
  // API METHODS
  // ============================================================================

  /**
   * Fetch all available icebreakers (public endpoint)
   *
   * This endpoint does not require authentication and returns all active
   * icebreaker prompts grouped by category. Results can be cached locally.
   *
   * @param forceRefresh - If true, bypasses cache and fetches fresh data
   * @returns Array of icebreaker objects
   */
  const fetchIcebreakers = async (forceRefresh = false): Promise<Icebreaker[]> => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid.value && hasIcebreakers.value) {
      return icebreakers.value
    }

    try {
      loading.value = true
      error.value = null

      // Public endpoint - no auth required
      const response = await api.get<Icebreaker[]>('/match/icebreakers', undefined, false)

      if (response.success && response.data) {
        icebreakers.value = response.data
        lastFetchedAt.value = new Date().toISOString()
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch icebreakers')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch icebreakers'
      error.value = errorMessage
      console.error('Fetch icebreakers error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch personalized icebreakers for a specific match
   *
   * Returns icebreaker suggestions tailored for the match context.
   * Requires authentication and valid match membership.
   *
   * @param matchId - The match ID to fetch icebreakers for
   * @returns Array of personalized icebreaker objects
   */
  const fetchMatchIcebreakers = async (matchId: number): Promise<Icebreaker[]> => {
    // Return cached data if we already have icebreakers for this match
    if (currentMatchId.value === matchId && hasMatchIcebreakers.value) {
      return matchIcebreakers.value
    }

    try {
      loading.value = true
      error.value = null

      const response = await api.get<Icebreaker[]>(
        `/match/matches/${matchId}/icebreakers`
      )

      if (response.success && response.data) {
        matchIcebreakers.value = response.data
        currentMatchId.value = matchId
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch match icebreakers')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch match icebreakers'
      error.value = errorMessage
      console.error('Fetch match icebreakers error:', err)

      // Handle specific error codes
      if (err.http_status === 403) {
        if (err.error_code === 'NOT_PART_OF_MATCH') {
          error.value = 'You are not part of this match.'
        } else if (err.error_code === 'MATCH_INACTIVE') {
          error.value = 'This match is no longer active.'
        }
      } else if (err.http_status === 404) {
        error.value = 'Match not found.'
      }

      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Send an icebreaker as a message in the match's chat
   *
   * Creates a message with the icebreaker content in the chat channel.
   * The message will have type "icebreaker" in its data field for
   * special styling/formatting in the chat UI.
   *
   * @param matchId - The match ID to send the icebreaker in
   * @param icebreakerId - The icebreaker ID to send
   * @returns The created message object
   */
  const sendIcebreaker = async (
    matchId: number,
    icebreakerId: number
  ): Promise<IcebreakerMessage> => {
    try {
      sending.value = true
      error.value = null

      const response = await api.post<IcebreakerMessage>(
        `/match/matches/${matchId}/icebreakers/${icebreakerId}/send`
      )

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to send icebreaker')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send icebreaker'
      error.value = errorMessage
      console.error('Send icebreaker error:', err)

      // Handle specific error codes
      if (err.http_status === 403) {
        if (err.error_code === 'NOT_PART_OF_MATCH') {
          error.value = 'You are not part of this match.'
        } else if (err.error_code === 'MATCH_INACTIVE') {
          error.value = 'This match is no longer active.'
        } else if (err.error_code === 'ICEBREAKER_INACTIVE') {
          error.value = 'This icebreaker is no longer available.'
        }
      } else if (err.http_status === 404) {
        error.value = 'Match or icebreaker not found.'
      }

      throw err
    } finally {
      sending.value = false
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get icebreaker by ID from cached data
   */
  const getIcebreakerById = (id: number): Icebreaker | undefined => {
    return icebreakers.value.find(ib => ib.id === id) ||
           matchIcebreakers.value.find(ib => ib.id === id)
  }

  /**
   * Get icebreakers by category ID
   */
  const getIcebreakersByCategory = (categoryId: number): Icebreaker[] => {
    return icebreakers.value.filter(ib => ib.category_id === categoryId)
  }

  /**
   * Get most popular icebreakers (sorted by usage count)
   */
  const getPopularIcebreakers = (limit = 5): Icebreaker[] => {
    return [...icebreakers.value]
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit)
  }

  /**
   * Clear match-specific icebreakers (e.g., when switching matches)
   */
  const clearMatchIcebreakers = () => {
    matchIcebreakers.value = []
    currentMatchId.value = null
  }

  /**
   * Clear all cached icebreakers
   */
  const clearCache = () => {
    icebreakers.value = []
    matchIcebreakers.value = []
    currentMatchId.value = null
    lastFetchedAt.value = null
    error.value = null
  }

  /**
   * Check if a message is an icebreaker message
   * Useful for special styling in chat UI
   */
  const isIcebreakerMessage = (message: Message): boolean => {
    // Handle the case where data is an object with type field
    if (message.data && typeof message.data === 'object') {
      return (message.data as any).type === 'icebreaker'
    }
    // Handle legacy message_type field
    return message.message_type === 'icebreaker' as any
  }

  /**
   * Get the prompt text from an icebreaker message
   */
  const getIcebreakerMessageContent = (message: Message): string | null => {
    if (message.data && typeof message.data === 'object') {
      return (message.data as any).content || null
    }
    return message.content || null
  }

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    icebreakers: computed(() => icebreakers.value),
    matchIcebreakers: computed(() => matchIcebreakers.value),
    currentMatchId: computed(() => currentMatchId.value),
    loading: computed(() => loading.value),
    sending: computed(() => sending.value),
    error: computed(() => error.value),

    // Computed
    icebreakersByCategory,
    matchIcebreakersByCategory,
    categories,
    hasIcebreakers,
    hasMatchIcebreakers,
    isCacheValid,

    // API Methods
    fetchIcebreakers,
    fetchMatchIcebreakers,
    sendIcebreaker,

    // Helper Methods
    getIcebreakerById,
    getIcebreakersByCategory,
    getPopularIcebreakers,
    clearMatchIcebreakers,
    clearCache,
    isIcebreakerMessage,
    getIcebreakerMessageContent
  }
}
