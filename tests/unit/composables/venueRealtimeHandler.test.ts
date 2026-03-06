import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVenuesStore } from '~/stores/venues'
import { createVenueRealtimeHandler } from '~/composables/useVenueRealtimeHandler'
import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'
import type { NearbyUser } from '~/types/venue'

function makeNearbyUser(overrides: Partial<NearbyUser> = {}): NearbyUser {
  return {
    user_id: 42,
    first_name: 'Test',
    profile_picture_url: null,
    ...overrides,
  } as NearbyUser
}

function makeEnvelope(event: string, data: Record<string, any>): RealtimeEnvelope {
  return {
    event,
    data,
    meta: { timestamp: '2026-01-01T00:00:00Z', version: '1', source: 'api' },
  }
}

function makeParsed(action: string, venueId: string = '5'): ParsedEvent {
  return { scope: 'venue', id: venueId, action }
}

describe('createVenueRealtimeHandler', () => {
  let venuesStore: ReturnType<typeof useVenuesStore>
  let handler: ReturnType<typeof createVenueRealtimeHandler>['handler']

  beforeEach(() => {
    setActivePinia(createPinia())
    venuesStore = useVenuesStore()
    const result = createVenueRealtimeHandler(venuesStore)
    handler = result.handler
  })

  describe('user_checked_in', () => {
    it('adds user to nearbyUsers when viewing the venue', () => {
      venuesStore.selectedVenue = { id: 5 } as any

      const user = makeNearbyUser({ user_id: 42 })
      handler(
        makeParsed('user_checked_in', '5'),
        makeEnvelope('venue:5:user_checked_in', user)
      )

      expect(venuesStore.nearbyUsers).toHaveLength(1)
      expect(venuesStore.nearbyUsers[0].user_id).toBe(42)
    })

    it('adds user when checked into the venue', () => {
      // Simulate being checked in via a check-in record
      venuesStore.currentCheckIn = { id: 1, venue_id: 5 } as any

      const user = makeNearbyUser({ user_id: 42 })
      handler(
        makeParsed('user_checked_in', '5'),
        makeEnvelope('venue:5:user_checked_in', user)
      )

      expect(venuesStore.nearbyUsers).toHaveLength(1)
    })

    it('does not add duplicate users', () => {
      venuesStore.selectedVenue = { id: 5 } as any
      venuesStore.nearbyUsers = [makeNearbyUser({ user_id: 42 })]

      handler(
        makeParsed('user_checked_in', '5'),
        makeEnvelope('venue:5:user_checked_in', makeNearbyUser({ user_id: 42 }))
      )

      expect(venuesStore.nearbyUsers).toHaveLength(1)
    })

    it('ignores event for unrelated venue', () => {
      venuesStore.selectedVenue = { id: 99 } as any

      handler(
        makeParsed('user_checked_in', '5'),
        makeEnvelope('venue:5:user_checked_in', makeNearbyUser())
      )

      expect(venuesStore.nearbyUsers).toHaveLength(0)
    })
  })

  describe('user_checked_out', () => {
    it('removes user from nearbyUsers', () => {
      venuesStore.selectedVenue = { id: 5 } as any
      venuesStore.nearbyUsers = [
        makeNearbyUser({ user_id: 42 }),
        makeNearbyUser({ user_id: 43 }),
      ]

      handler(
        makeParsed('user_checked_out', '5'),
        makeEnvelope('venue:5:user_checked_out', { user_id: 42 })
      )

      expect(venuesStore.nearbyUsers).toHaveLength(1)
      expect(venuesStore.nearbyUsers[0].user_id).toBe(43)
    })
  })

  describe('edge cases', () => {
    it('ignores events with null venue id', () => {
      venuesStore.selectedVenue = { id: 5 } as any

      handler(
        { scope: 'venue', id: null, action: 'user_checked_in' },
        makeEnvelope('venue::user_checked_in', makeNearbyUser())
      )

      expect(venuesStore.nearbyUsers).toHaveLength(0)
    })
  })
})
