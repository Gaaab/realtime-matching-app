import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'
import type { NearbyUser } from '~/types/venue'
import type { useVenuesStore } from '~/stores/venues'

export function createVenueRealtimeHandler(
  venuesStore: ReturnType<typeof useVenuesStore>,
) {
  const handler = (event: ParsedEvent, envelope: RealtimeEnvelope) => {
    const venueId = event.id ? parseInt(event.id, 10) : null
    if (!venueId) return

    const isRelevantVenue =
      venuesStore.selectedVenue?.id === venueId ||
      venuesStore.checkedInVenueId === venueId

    if (!isRelevantVenue) return

    switch (event.action) {
      case 'user_checked_in': {
        const user = envelope.data as NearbyUser
        const exists = venuesStore.nearbyUsers.find(u => u.user_id === user.user_id)
        if (!exists) {
          venuesStore.nearbyUsers.push(user)
        }
        break
      }
      case 'user_checked_out': {
        const userId = envelope.data.user_id
        venuesStore.nearbyUsers = venuesStore.nearbyUsers.filter(u => u.user_id !== userId)
        break
      }
    }
  }

  return { handler }
}
