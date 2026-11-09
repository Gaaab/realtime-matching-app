import type { ParsedEvent, RealtimeEnvelope } from "~/types/realtime";
import type { NearbyUser } from "~/types/venue";
import type { useVenuesStore } from "~/stores/venues";

export function createVenueRealtimeHandler(
  venuesStore: ReturnType<typeof useVenuesStore>,
) {
  const handler = (event: ParsedEvent, envelope: RealtimeEnvelope) => {
    const venueId = event.id ? parseInt(event.id, 10) : null;
    if (!venueId || isNaN(venueId)) return;

    const isCheckedInHere = venuesStore.checkedInVenueId === venueId;

    switch (event.action) {
      case "user_checked_in": {
        // Update count via store action (triggers reactivity for markers)
        venuesStore.updateVenueUserCount(venueId, 1);

        // Update nearbyUsers list for selected/checked-in venue
        if (isCheckedInHere) {
          const user = envelope.data as NearbyUser;
          const userId = user.id || user.user_id;
          const exists = venuesStore.nearbyUsers.find(
            (u) => (u.id || u.user_id) === userId,
          );
          if (!exists) {
            venuesStore.nearbyUsers.push(user);
          }
        }
        break;
      }
      case "user_checked_out": {
        // Update count via store action (triggers reactivity for markers)
        venuesStore.updateVenueUserCount(venueId, -1);

        // Update nearbyUsers list for selected/checked-in venue
        if (isCheckedInHere) {
          const userId = envelope.data.user_id || envelope.data.id;
          venuesStore.nearbyUsers = venuesStore.nearbyUsers.filter(
            (u) => (u.id || u.user_id) !== userId,
          );
        }
        break;
      }
    }
  };

  return { handler };
}
