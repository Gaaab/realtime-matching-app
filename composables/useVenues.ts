import type { Venue, VenueSearchParams, VenueCheckIn, NearbyUser, CheckInData, VenueUser } from '~/types/venue'

export const useVenues = () => {
  const api = useApi()

  const searchVenues = async (params: VenueSearchParams) => {
    try {
      const response = await api.get<Venue[]>('/venue/search', params as any)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to search venues')
    } catch (error: any) {
      console.error('Search venues error:', error)
      throw error
    }
  }

  const getNearbyVenues = async (
    latitude: number,
    longitude: number,
    radius: number = 10,
    category?: string
  ) => {
    try {
      const params: any = {
        latitude,
        longitude,
        radius,
      }

      if (category) {
        params.category = category
      }

      const response = await api.get<Venue[]>('/venue/nearby', params)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch nearby venues')
    } catch (error: any) {
      console.error('Get nearby venues error:', error)
      throw error
    }
  }

  const getVenueById = async (venueId: number) => {
    try {
      const response = await api.get<Venue>(`/venue/${venueId}`)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch venue')
    } catch (error: any) {
      console.error('Get venue error:', error)
      throw error
    }
  }

  const checkIn = async (data: CheckInData) => {
    try {
      const response = await api.post<VenueCheckIn>('/venue/checkins', data)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to check in')
    } catch (error: any) {
      console.error('Check in error:', error)
      throw error
    }
  }

  const checkOut = async (checkInId: number) => {
    try {
      const response = await api.post(`/venue/checkins/checkout`)

      if (response.success) {
        return true
      }

      throw new Error(response.message || 'Failed to check out')
    } catch (error: any) {
      console.error('Check out error:', error)
      throw error
    }
  }

  const getMyCheckIns = async (activeOnly: boolean = true) => {
    try {
      const params = activeOnly ? { active: 1 } : {}
      const response = await api.get<VenueCheckIn[]>('/venue/checkins/current', params)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch check-ins')
    } catch (error: any) {
      console.error('Get check-ins error:', error)
      throw error
    }
  }

  const getCurrentCheckIn = async () => {
    try {
      const checkIns = await getMyCheckIns(true)
      return checkIns.length > 0 ? checkIns[0] : null
    } catch (error: any) {
      console.error('Get current check-in error:', error)
      return null
    }
  }

  const getNearbyUsers = async (venueId: number) => {
    try {
      const response = await api.get<NearbyUser[]>(`/venue/${venueId}/users`)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch nearby users')
    } catch (error: any) {
      console.error('Get nearby users error:', error)
      throw error
    }
  }

  /**
   * Get checked-in users at a venue with detailed profile information
   * Avatars are automatically blurred unless mutually revealed
   */
  const getVenueUsers = async (venueId: number) => {
    try {
      const response = await api.get<VenueUser[]>(`/venue/${venueId}/users/detailed`)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch venue users')
    } catch (error: any) {
      console.error('Get venue users error:', error)
      throw error
    }
  }

  /**
   * Reveal your profile to a user at the venue
   * @param userId - The user ID to reveal to
   * @param venueId - Optional venue ID for context
   */
  const revealProfile = async (userId: number, venueId?: number) => {
    try {
      const payload: any = {
        user_id: userId,
        reveal_type: 'full'
      }

      if (venueId) {
        payload.venue_id = venueId
      }

      const response = await api.post('/match/reveals', payload)

      if (response.success) {
        return response.data
      }

      throw new Error(response.message || 'Failed to reveal profile')
    } catch (error: any) {
      console.error('Reveal profile error:', error)
      throw error
    }
  }

  const getVenueCheckIns = async (venueId: number) => {
    try {
      const response = await api.get<VenueCheckIn[]>(`/venue/${venueId}/checkins`)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch venue check-ins')
    } catch (error: any) {
      console.error('Get venue check-ins error:', error)
      throw error
    }
  }

  const createVenue = async (venueData: {
    name: string
    venue_type: string
    address: string
    city: string
    state: string
    country: string
    postal_code?: string
    latitude: number
    longitude: number
    google_place_id: string
    phone?: string
    website?: string
    rating?: number
    price_level?: number
    photos?: string[]
  }) => {
    try {
      const response = await api.post<Venue>('/venue', venueData)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to create venue')
    } catch (error: any) {
      console.error('Create venue error:', error)
      throw error
    }
  }

  interface VenueData {
    name: string
    venue_type: string
    address: string
    city: string
    state: string
    country: string
    postal_code?: string
    latitude: number
    longitude: number
    google_place_id: string
    phone?: string
    website?: string
    rating?: number
    price_level?: number
    photos?: string[]
  }

  interface BatchOptions {
    skip_duplicates?: boolean
    update_existing?: boolean
  }

  interface BatchResponse {
    venues: Venue[]
    created_count: number
    skipped_count: number
    updated_count: number
  }

  const createVenuesBatch = async (
    venues: VenueData[],
    options: BatchOptions = { skip_duplicates: true, update_existing: false }
  ): Promise<Venue[]> => {
    try {
      if (venues.length === 0) {
        return []
      }

      const payload = {
        venues,
        options
      }

      const response = await api.post<BatchResponse>('/venue/batch', payload)

      if (response.success && response.data) {
        // Handle both response formats: nested in data or at root level
        const batchData = response.data
        const created = batchData.created_count ?? 0
        const skipped = batchData.skipped_count ?? 0
        const updated = batchData.updated_count ?? 0
        const venuesList = batchData.venues ?? []

        console.log(
          `[useVenues] Batch save complete: ${created} created, ` +
          `${skipped} skipped, ${updated} updated`
        )
        return venuesList
      }

      throw new Error(response.message || 'Failed to create venues batch')
    } catch (error: any) {
      console.error('Create venues batch error:', error)
      throw error
    }
  }

  const loading = ref(false)
  const error = ref<string | null>(null)

  return {
    searchVenues,
    getNearbyVenues,
    getVenueById,
    createVenue,
    createVenuesBatch,
    checkIn,
    checkOut,
    getMyCheckIns,
    getCurrentCheckIn,
    getNearbyUsers,
    getVenueUsers,
    getVenueCheckIns,
    revealProfile,
    loading,
    error,
  }
}
