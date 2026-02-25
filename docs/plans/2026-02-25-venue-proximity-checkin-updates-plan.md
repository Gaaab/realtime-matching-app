# Venue Proximity & Check-in API Updates — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate backend API changes for 200m proximity enforcement, check-in by venue ID, location headers, and backend photo URL display.

**Architecture:** Centralized location interceptor injects `X-Latitude`/`X-Longitude` headers on every authenticated request via the existing `useApi` composable. A location watcher tracks GPS movement and reports significant changes to the backend. Check-in flow updated to support both `venue_id` and `google_place_id` with required coordinates.

**Tech Stack:** Nuxt 3, Vue 3 (Composition API), Pinia, TypeScript, Google Maps API

---

### Task 1: Update TypeScript Types

**Files:**
- Modify: `types/venue.ts:75-80`

**Step 1: Update `CheckInData` interface**

Replace the current `CheckInData` interface (lines 75-80) with:

```typescript
export interface CheckInData {
  google_place_id?: string
  venue_id?: number
  latitude: number
  longitude: number
}
```

Key changes:
- `google_place_id` becomes **optional** (was required)
- `venue_id` becomes **optional** (was required, now mutually exclusive with `google_place_id`)
- `latitude` and `longitude` become **required** (were optional)

**Step 2: Add `ProximityError` interface**

Add after `CheckInData` in `types/venue.ts`:

```typescript
export interface ProximityError {
  error_code: 'TOO_FAR_FROM_VENUE'
  message: string
  distance_meters: number
}
```

**Step 3: Commit**

```bash
git add types/venue.ts
git commit -m "feat: update CheckInData types for proximity and venue_id support"
```

---

### Task 2: Enhance Location Composable

**Files:**
- Modify: `composables/useLocation.ts`

**Step 1: Add module-level shared state**

The location ref needs to be shared across all instances of `useLocation()` (the API interceptor and other consumers both need the same ref). Add above the `useLocation` function definition (before line 6):

```typescript
// Shared state across all useLocation() instances
const _sharedLocation = ref<Coordinates | null>(null)
const _lastReportedLocation = ref<Coordinates | null>(null)
const _watchId = ref<number | null>(null)
```

**Step 2: Add `startLocationTracking()` function**

Add inside the composable, after `clearWatch` (after line 135):

```typescript
const SIGNIFICANT_MOVEMENT_METERS = 10

const startLocationTracking = () => {
  if (_watchId.value !== null) return // Already tracking

  // Get initial position
  getCurrentPosition()

  _watchId.value = navigator.geolocation.watchPosition(
    (position) => {
      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
      currentLocation.value = coords
      _sharedLocation.value = coords

      // Check for significant movement
      if (_lastReportedLocation.value) {
        const distanceKm = calculateDistance(_lastReportedLocation.value, coords)
        const distanceMeters = distanceKm * 1000
        if (distanceMeters > SIGNIFICANT_MOVEMENT_METERS) {
          _lastReportedLocation.value = coords
          reportLocationToServer(coords)
        }
      } else {
        _lastReportedLocation.value = coords
        reportLocationToServer(coords)
      }
    },
    (err) => {
      console.error('Location tracking error:', err)
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    }
  )
}

const stopLocationTracking = () => {
  if (_watchId.value !== null) {
    navigator.geolocation.clearWatch(_watchId.value)
    _watchId.value = null
  }
}

const reportLocationToServer = async (coords: Coordinates) => {
  try {
    const api = useApi()
    await api.post('/location', {
      latitude: coords.latitude,
      longitude: coords.longitude,
    })
  } catch (err) {
    // Non-critical — silently fail
    console.warn('Failed to report location:', err)
  }
}
```

**Step 3: Update `getCurrentPosition` to also set shared state**

In the success callback of `getCurrentPosition` (around line 67), after `currentLocation.value = coords`, add:

```typescript
_sharedLocation.value = coords
```

**Step 4: Export `getSharedLocation` getter and new functions**

Add a getter function inside the composable:

```typescript
const getSharedLocation = (): Coordinates | null => {
  return _sharedLocation.value
}
```

Update the return statement (line 169) to include:

```typescript
return {
  currentLocation: readonly(currentLocation),
  loading: readonly(loading),
  error: readonly(error),
  permissionDenied: readonly(permissionDenied),
  isSupported: readonly(isSupported),
  requestLocationPermission,
  getCurrentPosition,
  getCurrentLocation,
  watchPosition,
  clearWatch,
  startLocationTracking,
  stopLocationTracking,
  getSharedLocation,
  calculateDistance,
  formatDistance,
}
```

**Step 5: Commit**

```bash
git add composables/useLocation.ts
git commit -m "feat: add location tracking with significant movement detection"
```

---

### Task 3: Add Location Headers to API Client

**Files:**
- Modify: `composables/useApi.ts:42-56`

**Step 1: Import location getter**

The `getHeaders` function (line 42) needs to inject `X-Latitude` and `X-Longitude` when the user is authenticated and we have a location. Update `getHeaders`:

```typescript
const getHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  if (includeAuth) {
    const token = getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Inject location headers on authenticated requests
    if (process.client) {
      const { getSharedLocation } = useLocation()
      const location = getSharedLocation()
      if (location) {
        headers['X-Latitude'] = String(location.latitude)
        headers['X-Longitude'] = String(location.longitude)
      }
    }
  }

  return headers
}
```

**Step 2: Commit**

```bash
git add composables/useApi.ts
git commit -m "feat: inject X-Latitude/X-Longitude headers on authenticated API requests"
```

---

### Task 4: Update Venue Composable

**Files:**
- Modify: `composables/useVenues.ts:27-55` (getNearbyVenues)
- Modify: `composables/useVenues.ts:72-85` (checkIn)

**Step 1: Remove `radius` from `getNearbyVenues()`**

Replace the `getNearbyVenues` function (lines 27-55) with:

```typescript
const getNearbyVenues = async (
  latitude: number,
  longitude: number,
  category?: string,
) => {
  try {
    const params: any = {
      latitude,
      longitude,
    };

    if (category) {
      params.category = category;
    }

    const response = await api.get<Venue[]>("/venue/nearby", params);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to fetch nearby venues");
  } catch (error: any) {
    console.error("Get nearby venues error:", error);
    throw error;
  }
};
```

Key change: removed `radius` parameter entirely — server enforces 200m.

**Step 2: Update `checkIn()` to handle new payload**

The `checkIn` function (lines 72-85) already accepts `CheckInData` which we updated in Task 1. The function itself doesn't need changes since it passes `data` through directly. No code change needed here — the type change handles it.

**Step 3: Commit**

```bash
git add composables/useVenues.ts
git commit -m "feat: remove radius from getNearbyVenues, server enforces 200m"
```

---

### Task 5: Update Venue Store

**Files:**
- Modify: `stores/venues.ts`

**Step 1: Update `fetchNearbyVenues()` — remove radius**

Replace `fetchNearbyVenues` action (lines 63-100) with:

```typescript
async fetchNearbyVenues(latitude: number, longitude: number) {
  this.isLoadingVenues = true
  this.error = null

  try {
    console.log(`[VenuesStore] Fetching venues at (${latitude}, ${longitude})`)

    const { searchVenues } = useVenues()
    const venues = await searchVenues({
      latitude,
      longitude,
      limit: 50
    })

    console.log(`[VenuesStore] Received ${venues.length} venues from API`)

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
```

Key change: removed `radius` parameter.

**Step 2: Update `checkInToVenue()` — add location + venue_id logic**

Replace `checkInToVenue` action (lines 102-136) with:

```typescript
async checkInToVenue(venue: Venue) {
  this.isCheckingIn = true
  this.error = null

  try {
    // Check if user is already checked in somewhere else
    if (this.currentCheckIn && !this.currentCheckIn.checked_out_at) {
      throw new Error(
        `You are already checked in at ${this.currentCheckIn.venue.name}. Please check out before checking into another venue.`
      )
    }

    // Get current location — required for check-in
    const { getSharedLocation } = useLocation()
    const location = getSharedLocation()
    if (!location) {
      throw new Error('Unable to determine your location. Please enable GPS and try again.')
    }

    // Build check-in payload: use venue_id for admin venues, google_place_id otherwise
    const { checkIn } = useVenues()
    const checkInData: import('~/types/venue').CheckInData = {
      latitude: location.latitude,
      longitude: location.longitude,
    }

    if (venue.google_place_id) {
      checkInData.google_place_id = venue.google_place_id
    } else {
      checkInData.venue_id = venue.id
    }

    const checkInResult = await checkIn(checkInData)
    this.currentCheckIn = checkInResult

    // After successful check-in, fetch nearby users at this venue
    await this.fetchNearbyUsers(venue.id)

    return checkInResult
  } catch (err: any) {
    console.error('Failed to check in:', err)

    // Handle TOO_FAR_FROM_VENUE error specifically
    if (err?.error_code === 'TOO_FAR_FROM_VENUE' || err?.errors?.error_code?.[0] === 'TOO_FAR_FROM_VENUE') {
      const distance = err.distance_meters || err.errors?.distance_meters?.[0]
      this.error = distance
        ? `You're too far from this venue (${Math.round(distance)}m away). Move within 200m to check in.`
        : "You're too far from this venue. Move within 200m to check in."
    } else {
      this.error = err instanceof Error ? err.message : (err?.message || 'Failed to check in')
    }

    throw err
  } finally {
    this.isCheckingIn = false
  }
},
```

Key changes:
- Accepts a `Venue` object instead of separate params
- Gets location from shared location ref
- Builds payload with either `venue_id` or `google_place_id`
- Handles `TOO_FAR_FROM_VENUE` error with distance message

**Step 3: Update deduplication to prefer backend photos**

Replace `dedupeVenues` function (lines 16-23) with:

```typescript
function dedupeVenues(venues: Venue[]): Venue[] {
  const map = new Map<string, Venue>()
  venues.forEach(v => {
    const key = v.google_place_id ?? `${v.name}-${v.latitude}-${v.longitude}`
    const existing = map.get(key)
    if (!existing) {
      map.set(key, v)
    } else if (v.id && v.photos?.length && (!existing.photos?.length || !existing.id)) {
      // Prefer backend venue (has id) with photos over Google Places-only venue
      map.set(key, v)
    }
  })
  return Array.from(map.values())
}
```

**Step 4: Commit**

```bash
git add stores/venues.ts
git commit -m "feat: update store for proximity check-in, venue_id support, remove radius"
```

---

### Task 6: Update VenueMap Component

**Files:**
- Modify: `components/venue/VenueMap.vue`

**Step 1: Remove radius from all `fetchNearbyVenues` calls**

There are 5 occurrences of `venuesStore.fetchNearbyVenues` that pass a radius. Remove the third argument from each:

- Line 76-80: `venuesStore.fetchNearbyVenues(userLocation.value.latitude, userLocation.value.longitude)` (remove `, 1000`)
- Line 124-128: `venuesStore.fetchNearbyVenues(userLocation.value.latitude, userLocation.value.longitude)` (remove `, 5000`)
- Line 215: `venuesStore.fetchNearbyVenues(location.lat, location.lng)` (remove `, 100`)
- Line 223: `venuesStore.fetchNearbyVenues(location.lat, location.lng)` (remove `, 100`)
- Lines 732-736: `venuesStore.fetchNearbyVenues(userLocation.value.latitude, userLocation.value.longitude)` (remove `, 5000`)

Also update the search params at line 96: remove `radius: 1000`.

**Step 2: Start location tracking on map init**

In `initializeMap()`, after `userLocation.value = browserLocation` (after line 245), add:

```typescript
// Start continuous location tracking for API headers
const { startLocationTracking } = useLocation()
startLocationTracking()
```

**Step 3: Commit**

```bash
git add components/venue/VenueMap.vue
git commit -m "feat: remove radius params from venue fetching, start location tracking"
```

---

### Task 7: Update VenueBottomSheet Component

**Files:**
- Modify: `components/venue/VenueBottomSheet.vue`

**Step 1: Update `handleCheckIn` to pass venue object**

Replace `handleCheckIn` function (lines 73-86) with:

```typescript
const handleCheckIn = async () => {
  if (!props.venue) return

  try {
    venuesStore.clearError()
    await venuesStore.checkInToVenue(props.venue)
  } catch (err) {
    console.error('Check-in failed:', err)
    // Error is handled by the store and displayed via venuesStore.error
  }
}
```

Key change: passes the whole `venue` object instead of separate fields. The store now handles location fetching and `venue_id` vs `google_place_id` logic.

**Step 2: Commit**

```bash
git add components/venue/VenueBottomSheet.vue
git commit -m "feat: update bottom sheet check-in to use new store API"
```

---

### Task 8: Update VenueDetailPanel Component

**Files:**
- Modify: `components/venue/VenueDetailPanel.vue`

**Step 1: Update `handleCheckIn` to pass venue object**

Replace `handleCheckIn` function (lines 37-51) with:

```typescript
const handleCheckIn = async () => {
  if (!props.venue) return

  try {
    venuesStore.clearError()
    await venuesStore.checkInToVenue(props.venue)
  } catch (err) {
    console.error('Check-in failed:', err)
  }
}
```

**Step 2: Add image error fallback**

In the template, update the `<img>` tag at line 148 to handle broken photo URLs:

```html
<img
  :src="venue.photos[currentPhotoIndex]"
  :alt="venue.name"
  class="w-full h-full object-cover transition-opacity duration-300"
  @error="($event.target as HTMLImageElement).style.display = 'none'"
/>
```

**Step 3: Commit**

```bash
git add components/venue/VenueDetailPanel.vue
git commit -m "feat: update detail panel check-in and add photo error fallback"
```

---

### Task 9: Add `clearError` Action to Store (if missing)

**Files:**
- Verify: `stores/venues.ts`

The store already has a `clearError` action (line 209-211). No change needed — just verify it exists and is called before check-in attempts (we added it in Task 7 and 8).

---

### Task 10: Final Integration Verification

**Step 1: Type-check the project**

Run: `npx nuxi typecheck`

Fix any TypeScript errors (most likely around callers of the updated functions).

**Step 2: Search for any remaining `radius` references in venue fetching**

Search for any remaining `fetchNearbyVenues` calls that still pass a radius and fix them.

**Step 3: Search for any remaining direct `checkInToVenue` calls with old signature**

Search for `checkInToVenue(` and verify all callers now pass a `Venue` object instead of `(venueId, googlePlaceId, lat, lng)`.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve type errors from proximity and venue_id integration"
```

---

## Summary of All Changes

| # | Task | Files |
|---|------|-------|
| 1 | Update TypeScript types | `types/venue.ts` |
| 2 | Enhance location composable | `composables/useLocation.ts` |
| 3 | Add location headers to API | `composables/useApi.ts` |
| 4 | Update venue composable | `composables/useVenues.ts` |
| 5 | Update venue store | `stores/venues.ts` |
| 6 | Update VenueMap | `components/venue/VenueMap.vue` |
| 7 | Update VenueBottomSheet | `components/venue/VenueBottomSheet.vue` |
| 8 | Update VenueDetailPanel | `components/venue/VenueDetailPanel.vue` |
| 9 | Verify clearError exists | `stores/venues.ts` |
| 10 | Final integration check | All files — typecheck + search |
