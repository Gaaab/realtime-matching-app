import { defineStore } from "pinia";
import type {
  Venue,
  VenueCheckIn,
  NearbyUser,
  CheckInData,
} from "~/types/venue";
import { _sharedLocation } from "~/composables/useLocation";

const CHECKIN_CACHE_KEY = "venue_current_checkin";

function cacheCheckIn(checkIn: VenueCheckIn | null) {
  if (!process.client) return;
  if (checkIn) {
    localStorage.setItem(CHECKIN_CACHE_KEY, JSON.stringify(checkIn));
  } else {
    localStorage.removeItem(CHECKIN_CACHE_KEY);
  }
}

function loadCachedCheckIn(): VenueCheckIn | null {
  if (!process.client) return null;
  try {
    const raw = localStorage.getItem(CHECKIN_CACHE_KEY);
    if (!raw) return null;
    const checkIn = JSON.parse(raw) as VenueCheckIn;
    // Only restore if it was active (no checked_out_at)
    if (checkIn.checked_out_at) return null;
    return checkIn;
  } catch {
    localStorage.removeItem(CHECKIN_CACHE_KEY);
    return null;
  }
}

interface VenueState {
  venues: Venue[];
  selectedVenue: Venue | null;
  currentCheckIn: VenueCheckIn | null;
  nearbyUsers: NearbyUser[];
  isLoadingVenues: boolean;
  isLoadingUsers: boolean;
  isCheckingIn: boolean;
  error: string | null;
}

function dedupeVenues(venues: Venue[]): Venue[] {
  const map = new Map<string, Venue>();
  venues.forEach((v) => {
    const key = v.google_place_id ?? `${v.name}-${v.latitude}-${v.longitude}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, v);
    } else if (
      v.id &&
      v.photos?.length &&
      (!existing.photos?.length || !existing.id)
    ) {
      // Prefer backend venue (has id) with photos over Google Places-only venue
      map.set(key, v);
    }
  });
  return Array.from(map.values());
}

const CHECKIN_RADIUS_METERS = 200;

function getVenueCoords(venue: Venue): { lat: number; lng: number } | null {
  if (venue.location?.latitude != null && venue.location?.longitude != null) {
    const lat =
      typeof venue.location.latitude === "string"
        ? parseFloat(venue.location.latitude)
        : venue.location.latitude;
    const lng =
      typeof venue.location.longitude === "string"
        ? parseFloat(venue.location.longitude)
        : venue.location.longitude;
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  if (venue.latitude != null && venue.longitude != null) {
    const lat =
      typeof venue.latitude === "string"
        ? parseFloat(venue.latitude as any)
        : venue.latitude;
    const lng =
      typeof venue.longitude === "string"
        ? parseFloat(venue.longitude as any)
        : venue.longitude;
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  return null;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const useVenuesStore = defineStore("venues", {
  state: (): VenueState => ({
    venues: [],
    selectedVenue: null,
    currentCheckIn: loadCachedCheckIn(),
    nearbyUsers: [],
    isLoadingVenues: false,
    isLoadingUsers: false,
    isCheckingIn: false,
    error: null,
  }),

  getters: {
    activeVenues: (state): Venue[] => {
      // Filter venues that have active users (this will be determined by backend data)
      return state.venues.filter((venue) => {
        // Backend should include an active_user_count field
        return (venue as any).active_user_count > 0;
      });
    },

    inactiveVenues: (state): Venue[] => {
      return state.venues.filter((venue) => {
        return (
          !(venue as any).active_user_count ||
          (venue as any).active_user_count === 0
        );
      });
    },

    isCheckedIn: (state): boolean => {
      return !!state.currentCheckIn && !state.currentCheckIn.checked_out_at;
    },

    checkedInVenueId: (state): number | null => {
      return state.currentCheckIn?.venue_id || null;
    },

    // Accesses _sharedLocation (external ref from useLocation composable) directly
    // so this getter recomputes reactively as the user's GPS position changes.
    venuesWithProximity(): Venue[] {
      const location = _sharedLocation.value;
      if (!location) return this.venues;

      return this.venues.map((v) => {
        const coords = getVenueCoords(v);
        if (!coords) {
          return { ...v, distance_meters: null, can_checkin: false };
        }
        const dist = haversineMeters(
          location.latitude,
          location.longitude,
          coords.lat,
          coords.lng,
        );
        return {
          ...v,
          distance_meters: Math.round(dist),
          can_checkin: dist <= CHECKIN_RADIUS_METERS,
        };
      });
    },

    checkInableVenues(): Venue[] {
      return this.venuesWithProximity.filter((v) => v.can_checkin === true);
    },

    discoveryOnlyVenues(): Venue[] {
      return this.venuesWithProximity.filter((v) => v.can_checkin !== true);
    },
  },

  actions: {
    async fetchNearbyVenues(
      latitude: number,
      longitude: number,
      radius?: number,
    ) {
      this.isLoadingVenues = true;
      this.error = null;

      try {
        console.log(
          `[VenuesStore] Fetching nearby venues at (${latitude}, ${longitude}), radius=${radius ?? "default"}`,
        );

        const { getNearbyVenues } = useVenues();
        const venues = await getNearbyVenues(latitude, longitude, radius);

        console.log(`[VenuesStore] Received ${venues.length} venues from API`);

        this.venues = dedupeVenues(venues);
        return venues;
      } catch (err) {
        console.error("Failed to fetch nearby venues:", err);
        this.error =
          err instanceof Error ? err.message : "Failed to load venues";
        throw err;
      } finally {
        this.isLoadingVenues = false;
      }
    },

    async checkInToVenue(venue: Venue) {
      this.isCheckingIn = true;
      this.error = null;

      try {
        // Check if user is already checked in somewhere else
        if (this.currentCheckIn && !this.currentCheckIn.checked_out_at) {
          throw new Error(
            `You are already checked in at ${this.currentCheckIn.venue.name}. Please check out before checking into another venue.`,
          );
        }

        // Get current location — required for check-in
        const { getSharedLocation } = useLocation();
        const location = getSharedLocation();
        if (!location) {
          throw new Error(
            "Unable to determine your location. Please enable GPS and try again.",
          );
        }

        // Build check-in payload: use venue_id for admin venues, google_place_id otherwise
        const { checkIn } = useVenues();
        const checkInData: CheckInData = {
          latitude: location.latitude,
          longitude: location.longitude,
        };

        if (venue.google_place_id) {
          checkInData.google_place_id = venue.google_place_id;
        } else {
          checkInData.venue_id = venue.id;
        }

        const checkInResult = await checkIn(checkInData);
        this.currentCheckIn = checkInResult;
        cacheCheckIn(checkInResult);

        // After successful check-in, fetch nearby users at this venue
        await this.fetchNearbyUsers(venue.id);

        return checkInResult;
      } catch (err: any) {
        console.error("Failed to check in:", err);

        // Handle TOO_FAR_FROM_VENUE error specifically
        if (
          err?.error_code === "TOO_FAR_FROM_VENUE" ||
          err?.errors?.error_code?.[0] === "TOO_FAR_FROM_VENUE"
        ) {
          const distance =
            err.distance_meters || err.errors?.distance_meters?.[0];
          this.error = distance
            ? `You're too far from this venue (${Math.round(distance)}m away). Move within 200m to check in.`
            : "You're too far from this venue. Move within 200m to check in.";
        } else {
          this.error =
            err instanceof Error
              ? err.message
              : err?.message || "Failed to check in";
        }

        throw err;
      } finally {
        this.isCheckingIn = false;
      }
    },

    async checkOutFromVenue() {
      if (!this.currentCheckIn) return;

      try {
        const { checkOut } = useVenues();
        await checkOut(this.currentCheckIn.id);

        this.currentCheckIn = null;
        cacheCheckIn(null);
        this.nearbyUsers = [];
      } catch (err) {
        console.error("Failed to check out:", err);
        this.error = err instanceof Error ? err.message : "Failed to check out";
        throw err;
      }
    },

    async fetchNearbyUsers(venueId: number) {
      this.isLoadingUsers = true;
      this.error = null;

      try {
        const { getNearbyUsers } = useVenues();
        const users = await getNearbyUsers(venueId);

        this.nearbyUsers = users;
        return users;
      } catch (err) {
        console.error("Failed to fetch nearby users:", err);
        this.error =
          err instanceof Error ? err.message : "Failed to load users";
        throw err;
      } finally {
        this.isLoadingUsers = false;
      }
    },

    async fetchCurrentCheckIn() {
      try {
        const { getCurrentCheckIn } = useVenues();
        const checkIn = await getCurrentCheckIn();

        if (checkIn) {
          this.currentCheckIn = checkIn;
          cacheCheckIn(checkIn);
          // If checked in, fetch nearby users
          if (checkIn.venue_id) {
            await this.fetchNearbyUsers(checkIn.venue_id);
          }
        } else {
          // Server says not checked in — clear stale cache
          this.currentCheckIn = null;
          cacheCheckIn(null);
        }

        return checkIn;
      } catch (err) {
        console.error("Failed to fetch current check-in:", err);
        // Keep cached value on network failure so UI stays consistent
        return this.currentCheckIn;
      }
    },

    setSelectedVenue(venue: Venue | null) {
      this.selectedVenue = venue;
    },

    setNearbyVenues(venues: Venue[]) {
      this.venues = dedupeVenues([...this.venues, ...venues]);
    },

    updateVenueUserCount(venueId: number, delta: number) {
      const index = this.venues.findIndex((v) => v.id === venueId);
      if (index === -1) return;

      const venue = this.venues[index];
      const current = (venue as any).active_user_count || 0;
      const updated = {
        ...venue,
        active_user_count: Math.max(0, current + delta),
      } as Venue;
      this.venues.splice(index, 1, updated);

      // Also update selectedVenue if it matches
      if (this.selectedVenue?.id === venueId) {
        this.selectedVenue = updated;
      }
    },

    clearVenueUsers() {
      this.nearbyUsers = [];
    },

    clearError() {
      this.error = null;
    },

    resetStore() {
      this.venues = [];
      this.selectedVenue = null;
      this.currentCheckIn = null;
      cacheCheckIn(null);
      this.nearbyUsers = [];
      this.error = null;
    },
  },
});
