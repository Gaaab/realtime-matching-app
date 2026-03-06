import type { ParsedEvent, RealtimeEnvelope } from "~/types/realtime";
import type { NearbyUser } from "~/types/venue";
import type { useVenuesStore } from "~/stores/venues";

export function createVenueRealtimeHandler(
  venuesStore: ReturnType<typeof useVenuesStore>,
) {
  const handler = (event: ParsedEvent, envelope: RealtimeEnvelope) => {
    const venueId = event.id ? parseInt(event.id, 10) : null;
    if (!venueId || isNaN(venueId)) return;

    // Update active_user_count for any venue in the store
    const venue = venuesStore.venues.find((v) => v.id === venueId);

    switch (event.action) {
      case "user_checked_in": {
        // Update count on the venue object for marker display
        if (venue) {
          (venue as any).active_user_count =
            ((venue as any).active_user_count || 0) + 1;
        }

        // Update nearbyUsers list for selected/checked-in venue
        const isRelevantVenue =
          venuesStore.selectedVenue?.id === venueId ||
          venuesStore.checkedInVenueId === venueId;
        if (isRelevantVenue) {
          const user = envelope.data as NearbyUser;
          const exists = venuesStore.nearbyUsers.find(
            (u) => u.user_id === user.user_id,
          );
          if (!exists) {
            venuesStore.nearbyUsers.push(user);
          }
        }
        break;
      }
      case "user_checked_out": {
        // Update count on the venue object for marker display
        if (venue) {
          (venue as any).active_user_count = Math.max(
            0,
            ((venue as any).active_user_count || 0) - 1,
          );
        }

        // Update nearbyUsers list for selected/checked-in venue
        const isRelevant =
          venuesStore.selectedVenue?.id === venueId ||
          venuesStore.checkedInVenueId === venueId;
        if (isRelevant) {
          const userId = envelope.data.user_id;
          venuesStore.nearbyUsers = venuesStore.nearbyUsers.filter(
            (u) => u.user_id !== userId,
          );
        }
        break;
      }
    }
  };

  return { handler };
}
