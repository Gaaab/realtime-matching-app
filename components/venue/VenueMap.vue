<script setup lang="ts">
import { useVenuesStore } from "~/stores/venues";
import type { Venue } from "~/types/venue";

const props = defineProps<{
  height?: string;
  fullScreen?: boolean;
}>();

const venuesStore = useVenuesStore();
const {
  createMap,
  createMarker,
  createPinMarkerIcon,
  fitBounds,
  isLoading: isMapLoading,
  error: mapError,
} = useGoogleMaps();
const {
  getCurrentLocation,
  requestLocationPermission,
  isLoading: isLocationLoading,
  error: locationError,
  permissionDenied,
} = useLocation();
const { getUserStoredLocation } = useAuth();
const {
  fetchNearbyPlaces,
  parseAddressComponents,
  getVenueType,
  getPlaceDetails,
  getPhotoUrl,
} = useGooglePlaces();
const { createVenuesBatch } = useVenues();

const mapContainer = ref<HTMLElement | null>(null);
const map = ref<google.maps.Map | null>(null);
const markers = ref<Map<number, google.maps.marker.AdvancedMarkerElement>>(
  new Map(),
);
const userMarker = ref<google.maps.marker.AdvancedMarkerElement | null>(null);
const userLocation = ref<{ latitude: number; longitude: number } | null>(null);

const isInitialized = ref(false);
const initError = ref<string | null>(null);
const showPermissionAlert = ref(false);
const skippedVenuesCount = ref(0);
const isFetchingPlaces = ref(false);

// Search state
const searchQuery = ref("");
const isSearching = ref(false);
const isSearchActive = ref(false);
let searchDebounceTimer: NodeJS.Timeout | null = null;

// Sydney Opera House coordinates as default mock location
const SYDNEY_OPERA_HOUSE = {
  latitude: -33.8568,
  longitude: 151.2153,
};

// Default zoom level to show ~10km radius
const DEFAULT_ZOOM = 15;

const handleSearch = async (query: string) => {
  // Clear existing debounce timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  // If query is empty, clear search and show nearby venues
  if (!query.trim()) {
    isSearchActive.value = false;
    searchQuery.value = "";
    if (userLocation.value) {
      await venuesStore.fetchNearbyVenues(
        userLocation.value.latitude,
        userLocation.value.longitude,
      );
    }
    return;
  }

  // Debounce search requests (300ms)
  searchDebounceTimer = setTimeout(async () => {
    try {
      isSearching.value = true;
      const { searchVenues } = useVenues();

      // Search with AU bias - use current user location if available
      const searchParams = {
        location: query.trim(),
        latitude: userLocation.value?.latitude,
        longitude: userLocation.value?.longitude,
        limit: 50,
      };

      const results = await searchVenues(searchParams);

      // Update store with search results
      venuesStore.setNearbyVenues(results);
      isSearchActive.value = true;
    } catch (error) {
      console.error("Search failed:", error);
      isSearchActive.value = false;
    } finally {
      isSearching.value = false;
    }
  }, 300);
};

const clearSearch = async () => {
  searchQuery.value = "";
  isSearchActive.value = false;

  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  // Return to nearby venues
  if (userLocation.value) {
    await venuesStore.fetchNearbyVenues(
      userLocation.value.latitude,
      userLocation.value.longitude,
    );
  }
};

const emit = defineEmits<{
  venueClick: [venue: Venue];
  mapReady: [];
}>();

onMounted(async () => {
  await initializeMap();
});

onBeforeUnmount(() => {
  clearMarkers();
  const { stopLocationTracking } = useLocation();
  stopLocationTracking();
});

/**
 * Fetch nearby places from Google Places API and save them to the backend
 * Uses batch API endpoint for efficient saving of multiple venues at once
 */
const fetchAndSaveGooglePlaces = async (
  location: google.maps.LatLngLiteral,
) => {
  if (!map.value) {
    console.warn("[VenueMap] Map not initialized, cannot fetch places");
    return;
  }

  // Prevent multiple simultaneous fetches
  if (isFetchingPlaces.value) {
    console.log("[VenueMap] Already fetching places, skipping...");
    return;
  }

  try {
    isFetchingPlaces.value = true;
    console.log("[VenueMap] Fetching nearby places from Google Places API...");

    // Fetch nearby places from Google (radius: 5km)
    const places = await fetchNearbyPlaces(map.value, location, 5000);

    console.log(`[VenueMap] Found ${places.length} places from Google`);

    if (places.length === 0) {
      console.log("[VenueMap] No places found, skipping batch save");
      return;
    }

    // Transform all places into venue data for batch saving
    const venuesData = places.map((place) => {
      const addressInfo = parseAddressComponents(place.addressComponents);

      return {
        name: place.displayName || "Unknown Place",
        venue_type: getVenueType(place.types),
        address: addressInfo.street || place.formattedAddress || "",
        city: addressInfo.city,
        state: addressInfo.state,
        country: addressInfo.country,
        postal_code: addressInfo.postal_code,
        latitude: place.location.lat(),
        longitude: place.location.lng(),
        google_place_id: place.id,
        phone: place.nationalPhoneNumber,
        website: place.websiteURI,
        rating: place.rating,
        price_level: place.priceLevel ? parseInt(place.priceLevel) : undefined,
        photos:
          place.photos?.slice(0, 5).map((photo) => getPhotoUrl(photo, 800)) ||
          [],
      };
    });

    // Batch save all venues in a single API call
    const savedVenues = await createVenuesBatch(venuesData, {
      skip_duplicates: true,
      update_existing: false,
    });

    console.log(`[VenueMap] Batch API returned ${savedVenues.length} venues`);

    // If batch save returned no venues (all were duplicates), fetch from backend search endpoint
    if (savedVenues.length === 0) {
      console.log(
        "[VenueMap] No venues returned from batch (likely all duplicates), fetching from search endpoint",
      );
      await venuesStore.fetchNearbyVenues(location.lat, location.lng);
    } else {
      // Update the venues store with the saved venues
      venuesStore.setNearbyVenues(savedVenues);
    }
  } catch (error) {
    console.error("[VenueMap] Failed to fetch and save Google Places:", error);
    // Fallback to fetching from backend if Google Places fails
    await venuesStore.fetchNearbyVenues(location.lat, location.lng);
  } finally {
    isFetchingPlaces.value = false;
  }
};

const initializeMap = async () => {
  try {
    if (!mapContainer.value) {
      throw new Error("Map container not found");
    }

    // Step 1: Request browser geolocation (required)
    console.log("Requesting browser geolocation...");
    const browserLocation = await requestBrowserLocation();

    if (!browserLocation) {
      throw new Error(
        "Location access required to use the app. Please enable GPS in your browser settings.",
      );
    }

    userLocation.value = browserLocation;

    // Start continuous location tracking for API headers
    const { startLocationTracking } = useLocation()
    startLocationTracking()

    console.log("Using browser geolocation:", userLocation.value);

    // Create map centered on user location with appropriate zoom
    const center = {
      lat: userLocation.value.latitude,
      lng: userLocation.value.longitude,
    };

    map.value = await createMap(mapContainer.value, {
      center,
      zoom: DEFAULT_ZOOM,
      mapId: "VENUE_MAP",
    });

    if (!map.value) {
      throw new Error("Failed to create map");
    }

    // Add user location marker
    await addUserLocationMarker(center);

    // Fetch nearby places from Google Places API and save to backend
    await fetchAndSaveGooglePlaces(center);

    // Add venue markers
    await updateVenueMarkers();

    // Check if user has an active check-in
    await venuesStore.fetchCurrentCheckIn();

    // Add bounds change listener to fetch venues when panning/zooming
    // This will update markers without re-centering the map view
    setupBoundsListener();

    isInitialized.value = true;
    emit("mapReady");
  } catch (err) {
    console.error("Failed to initialize map:", err);
    initError.value =
      err instanceof Error ? err.message : "Failed to initialize map";
  }
};

const requestBrowserLocation = async () => {
  // Request browser geolocation (required for the app)
  try {
    const { requestLocationPermission, getCurrentLocation } = useLocation();
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      throw new Error("Location permission denied");
    }

    const browserLocation = await getCurrentLocation();
    if (!browserLocation) {
      throw new Error("Could not get location");
    }

    return {
      latitude: browserLocation.latitude,
      longitude: browserLocation.longitude,
    };
  } catch (error) {
    console.error("Browser location request failed:", error);
    throw error;
  }
};

const setupBoundsListener = () => {
  if (!map.value) return;

  // Debounce function to limit API calls
  let boundsChangeTimeout: NodeJS.Timeout | null = null;
  let isFirstBoundsChange = true;

  map.value.addListener("bounds_changed", () => {
    // Skip the first bounds_changed event (triggered on map creation)
    if (isFirstBoundsChange) {
      isFirstBoundsChange = false;
      return;
    }

    if (boundsChangeTimeout) {
      clearTimeout(boundsChangeTimeout);
    }

    boundsChangeTimeout = setTimeout(async () => {
      const bounds = map.value?.getBounds();
      if (!bounds) return;

      const centerPoint = bounds.getCenter();
      const center = {
        lat: centerPoint.lat(),
        lng: centerPoint.lng(),
      };

      console.log(
        "[VenueMap] Map panned, fetching Google Places for new location...",
      );

      // Fetch and save Google Places for the new map center
      // This runs in the background and updates markers automatically
      await fetchAndSaveGooglePlaces(center);
    }, 1000); // Debounce by 1 second to avoid excessive API calls
  });
};

/**
 * Helper function to extract coordinates from venue
 * Handles both flat (latitude, longitude) and nested (location.latitude, location.longitude) formats
 */
const getVenueCoordinates = (
  venue: Venue,
): { lat: number; lng: number } | null => {
  // Check for nested location object first (new format)
  if (
    venue.location?.latitude !== undefined &&
    venue.location?.longitude !== undefined
  ) {
    const lat =
      typeof venue.location.latitude === "string"
        ? parseFloat(venue.location.latitude)
        : venue.location.latitude;
    const lng =
      typeof venue.location.longitude === "string"
        ? parseFloat(venue.location.longitude)
        : venue.location.longitude;

    if (isValidCoordinates(lat, lng)) {
      return { lat, lng };
    }
  }

  // Fallback to flat coordinates (legacy format)
  if (venue.latitude !== undefined && venue.longitude !== undefined) {
    const lat =
      typeof venue.latitude === "string"
        ? parseFloat(venue.latitude)
        : venue.latitude;
    const lng =
      typeof venue.longitude === "string"
        ? parseFloat(venue.longitude)
        : venue.longitude;

    if (isValidCoordinates(lat, lng)) {
      return { lat, lng };
    }
  }

  return null;
};

const addUserLocationMarker = async (position: google.maps.LatLngLiteral) => {
  if (!map.value) return;

  userMarker.value = await createMarker(map.value, position, {
    title: "Your Location",
    content: createUserLocationMarkerContent(),
    zIndex: 9000,
  });
};

const updateVenueMarkers = async (shouldFitBounds: boolean = true) => {
  if (!map.value) {
    console.warn("[VenueMap] Map not initialized, cannot update markers");
    return;
  }

  // Clear existing markers
  clearMarkers();

  // Reset skipped venues count
  skippedVenuesCount.value = 0;

  const bounds = new google.maps.LatLngBounds();

  // Add user location to bounds if available
  if (userLocation.value) {
    bounds.extend({
      lat: userLocation.value.latitude,
      lng: userLocation.value.longitude,
    });
  }

  // Track skipped venues for debugging
  const skippedVenues: {
    id: number;
    name: string;
    latitude: unknown;
    longitude: unknown;
    reason: string;
  }[] = [];

  // Log venue count for debugging
  console.log(
    `[VenueMap] Processing ${venuesStore.venues.length} venues for markers`,
  );

  // Create markers for all venues
  for (const venue of venuesStore.venues) {
    // Extract coordinates using helper function (handles both formats)
    const coordinates = getVenueCoordinates(venue);

    if (!coordinates) {
      console.warn(`[VenueMap] Skipping venue with invalid coordinates:`, {
        id: venue.id,
        name: venue.name,
        latitude: venue?.location?.latitude,
        longitude: venue?.location?.longitude,
        location: venue.location,
      });
      skippedVenues.push({
        id: venue.id,
        name: venue.name,
        latitude: venue.latitude || venue.location?.latitude,
        longitude: venue.longitude || venue.location?.longitude,
        reason: "invalid_coordinates",
      });
      continue;
    }

    const position = coordinates;

    // Check if venue has active users
    const activeUserCount = (venue as any).active_user_count || 0;
    const hasActiveUsers = activeUserCount > 0;

    // Calculate distance from user location
    const distance = userLocation.value
      ? calculateDistance(
          userLocation.value.latitude,
          userLocation.value.longitude,
          coordinates.lat,
          coordinates.lng,
        )
      : 0;

    try {
      const contentEL = createMarkerContent(
        venue,
        hasActiveUsers,
        activeUserCount,
        distance,
      );

      //const pin = await createPinMarkerIcon({
      //  background: '#1A73E8',
      //  glyphColor: '#fff',
      //  borderColor: '#174EA6',
      //})

      const marker = await createMarker(map.value, position, {
        title: venue.name,
        content: contentEL,
        //content: pin.element,
      });

      if (marker) {
        // Add click listener
        marker.addListener("click", () => {
          handleMarkerClick(venue);
        });

        marker.addListener("gmp-click", () => {
          console.log("Advanced marker clicked");
          handleMarkerClick(venue);
        });

        markers.value.set(venue.id, marker);
        bounds.extend(position);
        marker.setMap(map.value);
      } else {
        console.warn(
          `[VenueMap] Failed to create marker for venue: ${venue.name} (ID: ${venue.id})`,
        );
        skippedVenues.push({
          id: venue.id,
          name: venue.name,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          reason: "marker_creation_failed",
        });
      }
    } catch (err) {
      console.error(
        `[VenueMap] Error creating marker for venue ${venue.name}:`,
        err,
      );
      skippedVenues.push({
        id: venue.id,
        name: venue.name,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        reason: "marker_creation_error",
      });
    }
  }

  // Update skipped venues count for UI feedback
  skippedVenuesCount.value = skippedVenues.length;

  // Log summary
  const successCount = markers.value.size;
  console.log(
    `[VenueMap] Created ${successCount} markers, skipped ${skippedVenues.length} venues`,
  );

  if (skippedVenues.length > 0) {
    console.warn(
      `[VenueMap] Skipped venue details:`,
      skippedVenues
        .map((v) => `${v.name} (ID: ${v.id}, reason: ${v.reason})`)
        .join(", "),
    );
  }

  // Fit map to show all markers (only on initial load, not on pan)
  if (shouldFitBounds && markers.value.size > 0) {
    console.log("Fit map to show all markers");
    fitBounds(map.value, bounds);
  }
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

/**
 * Validates that coordinates are valid numbers within acceptable ranges
 * @param lat - Latitude value to validate
 * @param lng - Longitude value to validate
 * @returns true if coordinates are valid, false otherwise
 */
const isValidCoordinates = (lat: unknown, lng: unknown): boolean => {
  // Check if values are numbers and not NaN
  if (typeof lat !== "number" || typeof lng !== "number") {
    return false;
  }
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return false;
  }
  // Validate latitude range (-90 to 90) and longitude range (-180 to 180)
  if (lat < -90 || lat > 90) {
    return false;
  }
  if (lng < -180 || lng > 180) {
    return false;
  }
  return true;
};

const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
};

const createMarkerContent = (
  venue: Venue,
  isActive: boolean,
  userCount: number = 0,
  distance: number = 0,
) => {
  const wrapper = document.createElement("div");
  wrapper.className = `people-pin ${isActive ? "active" : ""}`;

  const bgColor = isActive ? "#0050FF" : "#E5E7EB";
  const fgColor = isActive ? "#FFFFFF" : "#374151";

  wrapper.innerHTML = `
    <svg width="72" height="44" viewBox="0 0 72 44" xmlns="http://www.w3.org/2000/svg">
      <!-- Bubble -->
      <rect x="0" y="0" width="72" height="36" rx="18" fill="${bgColor}" />

      <!-- Tail -->
      <path d="M34 36 L38 36 L36 44 Z" fill="${bgColor}" />

      <!-- Person Icon -->
      <g transform="translate(18, 10)" fill="${fgColor}">
        <circle cx="5" cy="5" r="3"/>
        <path d="M0 14 C0 11 10 11 10 14" />
      </g>

      <!-- Count -->
      <text
        x="46"
        y="23"
        text-anchor="middle"
        font-size="14"
        font-weight="600"
        fill="${fgColor}"
        font-family="system-ui, -apple-system, BlinkMacSystemFont"
      >
        ${userCount}
      </text>
    </svg>
  `;

  // Hover scale (optional but nice)
  wrapper.style.cursor = "pointer";
  wrapper.style.transition = "transform 0.15s ease";
  wrapper.addEventListener("mouseenter", () => {
    wrapper.style.transform = "scale(1.1)";
  });
  wrapper.addEventListener("mouseleave", () => {
    wrapper.style.transform = "scale(1)";
  });

  return wrapper;
};

const createUserLocationMarkerContent = () => {
  // Create a marker for user location (green/cyan dot)
  const div = document.createElement("div");
  div.className = "user-location-marker";

  div.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#00D9FF" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `;

  return div;
};

const handleMarkerClick = async (venue: Venue) => {
  console.log("Venue marker clicked:", venue.name);
  venuesStore.setSelectedVenue(venue);

  // Fetch users at this venue
  const activeUserCount = (venue as any).active_user_count || 0;
  if (activeUserCount > 0) {
    try {
      await venuesStore.fetchNearbyUsers(venue.id);
    } catch (error) {
      console.error("Failed to fetch users at venue:", error);
    }
  } else {
    // Clear users if no one is checked in
    venuesStore.clearVenueUsers();
  }

  emit("venueClick", venue);

  // Optionally pan to venue
  if (map.value) {
    const coordinates = getVenueCoordinates(venue);
    if (coordinates) {
      map.value.panTo(coordinates);
    }
  }
};

const clearMarkers = () => {
  markers.value.forEach((marker) => {
    marker.map = null;
  });
  markers.value.clear();
};

const refreshVenues = async () => {
  if (!userLocation.value) return;

  await venuesStore.fetchNearbyVenues(
    userLocation.value.latitude,
    userLocation.value.longitude,
  );

  await updateVenueMarkers();
};

// Watch for venue changes
// Note: Only fit bounds on initial load, not when updating markers from panning
watch(
  () => venuesStore.venues,
  async () => {
    await updateVenueMarkers(false);
  },
  { deep: true },
);

// Expose refresh method
defineExpose({
  refreshVenues,
});
</script>

<template>
  <div
    class="relative w-full"
    :style="{ height: height || '600px' }"
    :class="{ 'fixed inset-0 z-10': fullScreen }"
  >
    <!-- Search Bar -->
    <div
      class="absolute top-4 left-4 right-4 z-20 md:left-auto md:right-auto md:w-80"
    >
      <div class="relative flex items-center">
        <input
          v-model="searchQuery"
          @input="(e) => handleSearch((e.target as HTMLInputElement).value)"
          type="text"
          placeholder="Search nearby venues..."
          class="w-full px-4 py-2.5 pl-10 bg-white border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        <svg
          class="absolute left-3 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <!-- Clear button -->
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
          title="Clear search"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Loading spinner -->
        <div v-if="isSearching" class="absolute right-3">
          <svg
            class="animate-spin w-5 h-5 text-primary-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>

      <!-- Search status indicator -->
      <div
        v-if="isSearchActive && searchQuery"
        class="mt-2 text-xs text-gray-600 px-1"
      >
        Showing search results for "{{ searchQuery }}"
      </div>
    </div>

    <!-- Map Container -->
    <div
      ref="mapContainer"
      class="w-full h-full overflow-hidden map-container"
      :class="fullScreen ? '' : 'rounded-xl shadow-lg'"
    />

    <!-- Loading Overlay -->
    <div
      v-if="isMapLoading || isLocationLoading || venuesStore.isLoadingVenues"
      class="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center"
      :class="fullScreen ? '' : 'rounded-xl'"
    >
      <div class="text-center">
        <div class="w-16 h-16 mx-auto mb-4">
          <svg
            class="animate-spin h-16 w-16 text-primary-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <p class="text-gray-600 font-medium">Loading map...</p>
      </div>
    </div>

    <!-- Using Mock Location Alert -->
    <div
      v-if="showPermissionAlert"
      class="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50"
      :class="fullScreen ? '' : 'rounded-xl'"
    >
      <div class="text-center px-6 max-w-sm">
        <div
          class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Showing Sydney Venues
        </h3>
        <p class="text-sm text-gray-600 mb-2">
          Currently showing venues around Sydney Opera House (10km radius).
        </p>
        <p class="text-xs text-gray-500 mb-4">
          To see venues near your actual location, enable location access in
          your browser settings.
        </p>
        <div class="space-y-2">
          <UiButton @click="showPermissionAlert = false" size="sm" fullWidth>
            Explore Sydney Venues
          </UiButton>
          <p class="text-xs text-gray-500 mt-3">
            💡 <strong>Tip:</strong> Users with stored location in their profile
            will see personalized venues automatically.
          </p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="initError || mapError"
      class="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center"
      :class="fullScreen ? '' : 'rounded-xl'"
    >
      <div class="text-center px-6">
        <div
          class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Unable to Load Map
        </h3>
        <p class="text-sm text-gray-600 mb-4">
          {{ initError || mapError }}
        </p>
        <UiButton @click="initializeMap" size="sm"> Try Again </UiButton>
      </div>
    </div>

    <!-- Map Controls -->
    <div class="absolute top-4 right-4 space-y-2">
      <button
        @click="refreshVenues"
        :disabled="venuesStore.isLoadingVenues || isFetchingPlaces"
        class="bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
        title="Refresh venues"
      >
        <svg
          class="w-5 h-5 text-gray-700"
          :class="{
            'animate-spin': venuesStore.isLoadingVenues || isFetchingPlaces,
          }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      <!-- Background Fetching Indicator -->
      <div
        v-if="isFetchingPlaces"
        class="bg-white px-3 py-2 rounded-lg shadow-lg animate-pulse"
      >
        <div class="flex items-center gap-2">
          <svg
            class="animate-spin w-4 h-4 text-primary-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span class="text-xs font-medium text-gray-600"
            >Finding places...</span
          >
        </div>
      </div>
    </div>

    <!-- Venue Count Badge -->
    <!-- Position higher when in full-screen mode to avoid bottom navigation -->
    <div
      class="absolute left-4 bg-white px-4 py-2 rounded-lg shadow-lg"
      :class="fullScreen ? 'bottom-20 sm:bottom-24' : 'bottom-4'"
    >
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 bg-primary-500 rounded-full"></div>
        <span class="text-sm font-medium text-gray-700">
          {{ venuesStore.activeVenues.length }} active venues
        </span>
      </div>
      <div class="flex items-center gap-2 mt-1">
        <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
        <span class="text-sm font-medium text-gray-700">
          {{ venuesStore.inactiveVenues.length }} nearby venues
        </span>
      </div>
    </div>

    <!-- Invalid Venues Warning -->
    <div
      v-if="skippedVenuesCount > 0"
      class="absolute right-4 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg shadow-lg max-w-xs"
      :class="fullScreen ? 'bottom-20 sm:bottom-24' : 'bottom-4'"
    >
      <div class="flex items-start gap-2">
        <svg
          class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <p class="text-sm font-medium text-amber-800">
            {{ skippedVenuesCount }} venue{{
              skippedVenuesCount > 1 ? "s" : ""
            }}
            could not be displayed
          </p>
          <p class="text-xs text-amber-600 mt-0.5">
            Some venues have missing location data
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.people-pin {
  position: absolute;
  z-index: 1001;
}

.people-pin svg {
  overflow: visible;
  filter: drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.15));
}

.people-pin.active svg {
  filter: drop-shadow(0px 6px 14px rgba(0, 80, 255, 0.35));
}
</style>
