import { defineStore } from 'pinia'
import type { Venue, VenueCheckIn, NearbyUser } from '~/types/venue'

interface VenueState {
  venues: Venue[]
  selectedVenue: Venue | null
  currentCheckIn: VenueCheckIn | null
  nearbyUsers: NearbyUser[]
  isLoadingVenues: boolean
  isLoadingUsers: boolean
  isCheckingIn: boolean
  error: string | null
}


function dedupeVenues(venues: Venue[]): Venue[] {
  const map = new Map<string, Venue>()
  venues.forEach(v => {
    const key = v.google_place_id ?? `${v.name}-${v.latitude}-${v.longitude}`
    if (!map.has(key)) map.set(key, v)
  })
  return Array.from(map.values())
}


export const useVenuesStore = defineStore('venues', {
  state: (): VenueState => ({
    venues: [],
    selectedVenue: null,
    currentCheckIn: null,
    nearbyUsers: [],
    isLoadingVenues: false,
    isLoadingUsers: false,
    isCheckingIn: false,
    error: null
  }),

  getters: {
    activeVenues: (state): Venue[] => {
      // Filter venues that have active users (this will be determined by backend data)
      return state.venues.filter(venue => {
        // Backend should include an active_user_count field
        return (venue as any).active_user_count > 0
      })
    },

    inactiveVenues: (state): Venue[] => {
      return state.venues.filter(venue => {
        return !(venue as any).active_user_count || (venue as any).active_user_count === 0
      })
    },

    isCheckedIn: (state): boolean => {
      return !!state.currentCheckIn && !state.currentCheckIn.checked_out_at
    },

    checkedInVenueId: (state): number | null => {
      return state.currentCheckIn?.venue_id || null
    }
  },

  actions: {
    async fetchNearbyVenues(latitude: number, longitude: number, radius: number = 1000) {
      this.isLoadingVenues = true
      this.error = null

      try {
        console.log(`[VenuesStore] Fetching venues at (${latitude}, ${longitude}) with radius ${radius}m`)

        const { searchVenues } = useVenues()
        const venues = await searchVenues({
          latitude,
          longitude,
          radius,
          limit: 50
        })

        console.log(`[VenuesStore] Received ${venues.length} venues from API`)

        // Log first few venues for debugging
        if (venues.length > 0) {
          console.log('[VenuesStore] Sample venues:', venues.slice(0, 3).map(v => ({
            id: v.id,
            name: v.name,
            lat: v.latitude,
            lng: v.longitude,
            google_place_id: v.google_place_id
          })))
        }

        this.venues = dedupeVenues(venues)
        return venues
      } catch (err) {
        console.error('Failed to fetch nearby venues:', err)
        this.error = err instanceof Error ? err.message : 'Failed to load venues'
        throw err
      } finally {
        this.isLoadingVenues = false
      }
    },

    async checkInToVenue(venueId: number, googlePlaceId: string, latitude?: number, longitude?: number) {
      this.isCheckingIn = true
      this.error = null

      try {
        // Check if user is already checked in somewhere else
        if (this.currentCheckIn && !this.currentCheckIn.checked_out_at) {
          throw new Error(
            `You are already checked in at ${this.currentCheckIn.venue.name}. Please check out before checking into another venue.`
          )
        }

        const { checkIn } = useVenues()
        const checkInData = await checkIn({
          venue_id: venueId,
          google_place_id: googlePlaceId,
          latitude,
          longitude
        })

        this.currentCheckIn = checkInData

        // After successful check-in, fetch nearby users at this venue
        await this.fetchNearbyUsers(venueId)

        return checkInData
      } catch (err) {
        console.error('Failed to check in:', err)
        this.error = err instanceof Error ? err.message : 'Failed to check in'
        this.isCheckingIn = false
        throw err
      } finally {
        this.isCheckingIn = false
      }
    },

    async checkOutFromVenue() {
      if (!this.currentCheckIn) return

      try {
        const { checkOut } = useVenues()
        await checkOut(this.currentCheckIn.id)

        this.currentCheckIn = null
        this.nearbyUsers = []
      } catch (err) {
        console.error('Failed to check out:', err)
        this.error = err instanceof Error ? err.message : 'Failed to check out'
        throw err
      }
    },

    async fetchNearbyUsers(venueId: number) {
      this.isLoadingUsers = true
      this.error = null

      try {
        const { getNearbyUsers } = useVenues()
        const users = await getNearbyUsers(venueId)

        this.nearbyUsers = users
        return users
      } catch (err) {
        console.error('Failed to fetch nearby users:', err)
        this.error = err instanceof Error ? err.message : 'Failed to load users'
        throw err
      } finally {
        this.isLoadingUsers = false
      }
    },

    async fetchCurrentCheckIn() {
      try {
        const { getCurrentCheckIn } = useVenues()
        const checkIn = await getCurrentCheckIn()

        if (checkIn) {
          this.currentCheckIn = checkIn
          // If checked in, fetch nearby users
          if (checkIn.venue_id) {
            await this.fetchNearbyUsers(checkIn.venue_id)
          }
        }

        return checkIn
      } catch (err) {
        console.error('Failed to fetch current check-in:', err)
        // Not necessarily an error if user is not checked in
        return null
      }
    },

    setSelectedVenue(venue: Venue | null) {
      this.selectedVenue = venue
    },

    setNearbyVenues(venues: Venue[]) {
      this.venues = dedupeVenues([
        ...this.venues,
        ...venues
      ])
    },

    clearVenueUsers() {
      this.nearbyUsers = []
    },

    clearError() {
      this.error = null
    },

    resetStore() {
      this.venues = []
      this.selectedVenue = null
      this.currentCheckIn = null
      this.nearbyUsers = []
      this.error = null
    }
  }
})
