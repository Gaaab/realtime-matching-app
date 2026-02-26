# Venue Discovery & Client-Side Proximity Check-in — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the client to use the new `/venue/nearby` endpoint with radius-based discovery, and add real-time client-side proximity tracking so users see which venues they can check into as they move.

**Architecture:** The Pinia venues store switches from `/venue/search` to `/venue/nearby` (with `radius` param). A reactive `venuesWithProximity` getter watches the shared user location and recalculates Haversine distance + `can_checkin` for every venue. Components consume this getter for instant UI feedback — map markers show green rings on check-in-able venues, and the detail panels disable the check-in button with a distance hint when out of range.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, Pinia, TypeScript, Google Maps API

**Design doc:** `docs/plans/2026-02-26-venue-discovery-proximity-design.md`

---

## Task 1: Update Venue Types

**Files:**
- Modify: `types/venue.ts:1-28` (Venue interface)
- Modify: `types/venue.ts:40-48` (add NearbyVenueParams after VenueSearchParams)

**Step 1: Add `distance_meters` and `can_checkin` to Venue interface**

In `types/venue.ts`, add these two fields after the existing `distance` field (line 25):

```typescript
  distance?: number;
  distance_meters?: number | null;
  can_checkin?: boolean;
```

**Step 2: Add NearbyVenueParams interface**

After the `VenueSearchParams` interface (after line 48), add:

```typescript
export interface NearbyVenueParams {
  latitude: number;
  longitude: number;
  radius?: number;
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx nuxi typecheck` or `npx tsc --noEmit`
Expected: No new errors (fields are optional so existing code is unaffected)

**Step 4: Commit**

```bash
git add types/venue.ts
git commit -m "feat: add distance_meters, can_checkin, and NearbyVenueParams to venue types"
```

---

## Task 2: Update `useVenues` Composable — Add `radius` to `getNearbyVenues`

**Files:**
- Modify: `composables/useVenues.ts:1-7` (imports)
- Modify: `composables/useVenues.ts:27-53` (getNearbyVenues function)

**Step 1: Add `NearbyVenueParams` to imports**

In `composables/useVenues.ts`, update the import (line 1-7) to include the new type:

```typescript
import type {
  Venue,
  VenueSearchParams,
  NearbyVenueParams,
  VenueCheckIn,
  NearbyUser,
  CheckInData,
} from "~/types/venue";
```

**Step 2: Update `getNearbyVenues` signature and body**

Replace the `getNearbyVenues` function (lines 27-53) with:

```typescript
  const getNearbyVenues = async (
    latitude: number,
    longitude: number,
    radius?: number,
  ) => {
    try {
      const params: Record<string, unknown> = {
        latitude,
        longitude,
      };

      if (radius) {
        params.radius = radius;
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

Key changes: replaced `category?: string` param with `radius?: number`, removed `category` param logic, changed `params` type from `any` to `Record<string, unknown>`.

**Step 3: Verify no compile errors**

Run: `npx nuxi typecheck` or `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add composables/useVenues.ts
git commit -m "feat: add radius parameter to getNearbyVenues composable"
```

---

## Task 3: Update Venues Store — Switch Endpoint and Add Proximity Getter

**Files:**
- Modify: `stores/venues.ts` (entire file — imports, state, getters, actions)

**Step 1: Export `_sharedLocation` from `useLocation.ts`**

The `_sharedLocation` ref in `composables/useLocation.ts` (line 7) is module-scoped but not exported. We need to access it from the store. Add an export for it:

In `composables/useLocation.ts`, change line 7 from:
```typescript
const _sharedLocation = ref<Coordinates | null>(null);
```
to:
```typescript
export const _sharedLocation = ref<Coordinates | null>(null);
```

**Step 2: Add Haversine helper and proximity getter to the store**

In `stores/venues.ts`, update the imports at the top of the file (lines 1-7):

```typescript
import { defineStore } from "pinia";
import type {
  Venue,
  VenueCheckIn,
  NearbyUser,
  CheckInData,
} from "~/types/venue";
import { _sharedLocation } from "~/composables/useLocation";
```

**Step 3: Add Haversine distance function**

After the `dedupeVenues` function (after line 37), add:

```typescript
const CHECKIN_RADIUS_METERS = 200;

function getVenueCoords(venue: Venue): { lat: number; lng: number } | null {
  if (venue.location?.latitude != null && venue.location?.longitude != null) {
    const lat = typeof venue.location.latitude === "string" ? parseFloat(venue.location.latitude) : venue.location.latitude;
    const lng = typeof venue.location.longitude === "string" ? parseFloat(venue.location.longitude) : venue.location.longitude;
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  if (venue.latitude != null && venue.longitude != null) {
    const lat = typeof venue.latitude === "string" ? parseFloat(venue.latitude as any) : venue.latitude;
    const lng = typeof venue.longitude === "string" ? parseFloat(venue.longitude as any) : venue.longitude;
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  return null;
}

function haversineMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
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
```

**Step 4: Add `venuesWithProximity` getter**

Inside the `getters` block, after the existing `checkedInVenueId` getter (after line 75), add:

```typescript
    venuesWithProximity(): Venue[] {
      const location = _sharedLocation.value;
      if (!location) return this.venues;

      return this.venues.map((v) => {
        const coords = getVenueCoords(v);
        if (!coords) {
          return { ...v, distance_meters: null, can_checkin: false };
        }
        const dist = haversineMeters(
          location.latitude, location.longitude,
          coords.lat, coords.lng,
        );
        return {
          ...v,
          distance_meters: Math.round(dist),
          can_checkin: dist <= CHECKIN_RADIUS_METERS,
        };
      });
    },
```

Note: This getter uses `this.venues` (function syntax, not arrow) so it accesses the Pinia state correctly while also reading the external reactive `_sharedLocation` ref.

**Step 5: Switch `fetchNearbyVenues` from `searchVenues` to `getNearbyVenues`**

Replace the `fetchNearbyVenues` action (lines 79-120) with:

```typescript
    async fetchNearbyVenues(latitude: number, longitude: number, radius?: number) {
      this.isLoadingVenues = true;
      this.error = null;

      try {
        console.log(
          `[VenuesStore] Fetching nearby venues at (${latitude}, ${longitude}), radius=${radius ?? 'default'}`,
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
```

Key changes: calls `getNearbyVenues` instead of `searchVenues`, accepts optional `radius` param, removed verbose sample logging.

**Step 6: Verify no compile errors**

Run: `npx nuxi typecheck` or `npx tsc --noEmit`

**Step 7: Commit**

```bash
git add composables/useLocation.ts stores/venues.ts
git commit -m "feat: add venuesWithProximity getter and switch to /venue/nearby endpoint"
```

---

## Task 4: Update VenueMap — Use Proximity Data and Add Check-In-Range Marker Style

**Files:**
- Modify: `components/venue/VenueMap.vue`

**Step 1: Update `updateVenueMarkers` to read from `venuesWithProximity`**

In `VenueMap.vue`, find the `updateVenueMarkers` function. Replace the line that iterates venues (line 449):

```typescript
  for (const venue of venuesStore.venues) {
```

with:

```typescript
  for (const venue of venuesStore.venuesWithProximity) {
```

**Step 2: Update the watcher to use `venuesWithProximity`**

Replace the watcher (lines 746-752):

```typescript
watch(
  () => venuesStore.venues,
  async () => {
    await updateVenueMarkers(false);
  },
  { deep: true },
);
```

with:

```typescript
watch(
  () => venuesStore.venuesWithProximity,
  async () => {
    await updateVenueMarkers(false);
  },
  { deep: true },
);
```

**Step 3: Update `createMarkerContent` to show green ring for check-in-able venues**

Replace the `createMarkerContent` function (lines 629-681) with:

```typescript
const createMarkerContent = (
  venue: Venue,
  isActive: boolean,
  userCount: number = 0,
  canCheckIn: boolean = false,
) => {
  const wrapper = document.createElement("div");
  wrapper.className = `people-pin ${isActive ? "active" : ""}`;

  const bgColor = isActive ? "#0050FF" : "#E5E7EB";
  const fgColor = isActive ? "#FFFFFF" : "#374151";
  const ringColor = canCheckIn ? "#22C55E" : "none";
  const ringWidth = canCheckIn ? 3 : 0;

  wrapper.innerHTML = `
    <svg width="72" height="44" viewBox="0 0 72 44" xmlns="http://www.w3.org/2000/svg">
      <!-- Check-in range ring -->
      ${canCheckIn ? `<rect x="-2" y="-2" width="76" height="40" rx="20" fill="none" stroke="${ringColor}" stroke-width="${ringWidth}" />` : ""}

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
```

Key change: 4th param changed from `distance` to `canCheckIn`, green ring SVG added around the bubble when within range.

**Step 4: Update the marker creation call inside `updateVenueMarkers`**

Find where `createMarkerContent` is called inside the venue loop (around line 488). Replace:

```typescript
      const contentEL = createMarkerContent(
        venue,
        hasActiveUsers,
        activeUserCount,
        distance,
      );
```

with:

```typescript
      const canCheckIn = venue.can_checkin === true;

      const contentEL = createMarkerContent(
        venue,
        hasActiveUsers,
        activeUserCount,
        canCheckIn,
      );
```

**Step 5: Remove the local `calculateDistance` call inside the marker loop**

Remove the block that calculates distance locally (around lines 478-486):

```typescript
    // Calculate distance from user location
    const distance = userLocation.value
      ? calculateDistance(
          userLocation.value.latitude,
          userLocation.value.longitude,
          coordinates.lat,
          coordinates.lng,
        )
      : 0;
```

This is no longer needed since proximity data comes from the store getter.

**Step 6: Commit**

```bash
git add components/venue/VenueMap.vue
git commit -m "feat: update map markers to show green ring for check-in-able venues"
```

---

## Task 5: Update VenueBottomSheet — Proximity-Aware Check-In Button

**Files:**
- Modify: `components/venue/VenueBottomSheet.vue`

**Step 1: Add proximity computed properties**

In the `<script setup>` section, after the existing `activeUserCount` computed (after line 27), add:

```typescript
const canCheckIn = computed(() => {
  return props.venue?.can_checkin === true;
})

const distanceText = computed(() => {
  const meters = props.venue?.distance_meters;
  if (meters == null) return '';
  if (meters < 1000) return `${meters}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
})
```

**Step 2: Update the check-in button section**

Find the check-in button block (lines 314-326). Replace:

```html
                <UiButton
                  @click="handleCheckIn"
                  :loading="isCheckingIn"
                  :disabled="isCheckedIn && !isCheckedInHere"
                  fullWidth
                  size="lg"
                  class="shadow-lg shadow-primary-500/25"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {{ isCheckedIn ? 'Checked in elsewhere' : 'Check In Here' }}
                </UiButton>

                <p v-if="isCheckedIn && !isCheckedInHere" class="text-center text-sm text-gray-500 mt-2">
                  You need to check out from your current venue first
                </p>
```

with:

```html
                <UiButton
                  @click="handleCheckIn"
                  :loading="isCheckingIn"
                  :disabled="!canCheckIn || (isCheckedIn && !isCheckedInHere)"
                  fullWidth
                  size="lg"
                  class="shadow-lg shadow-primary-500/25"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <template v-if="isCheckedIn && !isCheckedInHere">
                    Checked in elsewhere
                  </template>
                  <template v-else-if="!canCheckIn">
                    Too far{{ distanceText ? ` (${distanceText})` : '' }}
                  </template>
                  <template v-else>
                    Check In Here
                  </template>
                </UiButton>

                <p v-if="isCheckedIn && !isCheckedInHere" class="text-center text-sm text-gray-500 mt-2">
                  You need to check out from your current venue first
                </p>
                <p v-else-if="!canCheckIn && distanceText" class="text-center text-sm text-gray-500 mt-2">
                  Move within 200m to check in
                </p>
```

**Step 3: Update the distance display in the address section**

Find the distance display (line 245-247):

```html
                <p v-if="venue.distance" class="text-primary-600 font-medium mt-1">
                  {{ formatDistance(venue.distance) }}
                </p>
```

Replace with:

```html
                <p v-if="distanceText" class="text-primary-600 font-medium mt-1">
                  {{ distanceText }}
                </p>
```

**Step 4: Commit**

```bash
git add components/venue/VenueBottomSheet.vue
git commit -m "feat: add proximity-aware check-in button to bottom sheet"
```

---

## Task 6: Update VenueDetailPanel — Proximity-Aware Check-In Button

**Files:**
- Modify: `components/venue/VenueDetailPanel.vue`

**Step 1: Add proximity computed properties**

In the `<script setup>` section, after the `activeUserCount` computed (after line 29), add:

```typescript
const canCheckIn = computed(() => {
  return props.venue?.can_checkin === true;
})

const distanceText = computed(() => {
  const meters = props.venue?.distance_meters;
  if (meters == null) return '';
  if (meters < 1000) return `${meters}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
})
```

**Step 2: Update the check-in button block**

Find the check-in button (lines 327-347). Replace:

```html
          <UiButton
            v-if="!isCheckedInHere"
            @click="handleCheckIn"
            :loading="isCheckingIn"
            :disabled="isCheckedIn && !isCheckedInHere"
            fullWidth
            size="lg"
          >
            {{ isCheckedIn ? 'Already Checked In' : 'Check In Here' }}
          </UiButton>
```

with:

```html
          <UiButton
            v-if="!isCheckedInHere"
            @click="handleCheckIn"
            :loading="isCheckingIn"
            :disabled="!canCheckIn || (isCheckedIn && !isCheckedInHere)"
            fullWidth
            size="lg"
          >
            <template v-if="isCheckedIn && !isCheckedInHere">
              Already Checked In
            </template>
            <template v-else-if="!canCheckIn">
              Too far{{ distanceText ? ` (${distanceText})` : '' }}
            </template>
            <template v-else>
              Check In Here
            </template>
          </UiButton>
          <p v-if="!isCheckedInHere && !canCheckIn && distanceText" class="text-center text-sm text-gray-500 mt-2">
            Move within 200m to check in
          </p>
```

**Step 3: Update distance display in the address card**

Find the distance display in the address card (lines 250-252):

```html
                <p v-if="venue.distance" class="text-sm text-primary-600 font-medium mt-1">
                  {{ formatDistance(venue.distance) }}
                </p>
```

Replace with:

```html
                <p v-if="distanceText" class="text-sm text-primary-600 font-medium mt-1">
                  {{ distanceText }}
                </p>
```

**Step 4: Update the standalone distance card**

Find the distance card (lines 269-277):

```html
          <div v-if="venue.distance" class="p-3 bg-gray-50 rounded-xl">
            ...
            <p class="text-sm font-medium text-gray-900">{{ formatDistance(venue.distance) }}</p>
          </div>
```

Replace:

```html
          <div v-if="distanceText" class="p-3 bg-gray-50 rounded-xl">
            <div class="flex items-center gap-2 mb-1">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span class="text-xs font-medium text-gray-500 uppercase">Distance</span>
            </div>
            <p class="text-sm font-medium text-gray-900">{{ distanceText }}</p>
          </div>
```

**Step 5: Commit**

```bash
git add components/venue/VenueDetailPanel.vue
git commit -m "feat: add proximity-aware check-in button to detail panel"
```

---

## Task 7: Smoke Test & Final Verification

**Files:**
- All modified files from tasks 1-6

**Step 1: Run TypeScript type check**

Run: `npx nuxi typecheck` or `npx tsc --noEmit`
Expected: No errors

**Step 2: Run the dev server and verify**

Run: `npx nuxi dev`

Manual checks:
1. Navigate to `/explore` — map loads, markers appear
2. Venues within 200m of your location show green ring on marker
3. Click a nearby venue (<200m) — bottom sheet shows "Check In Here" (enabled)
4. Click a distant venue (>200m) — bottom sheet shows "Too far (Xm away)" (disabled, grayed out)
5. Distance text shows correctly in venue panels ("148m away", "1.5km away")
6. Moving location updates marker rings and button states reactively

**Step 3: Run existing E2E tests**

Run: `npx playwright test tests/map-markers.spec.ts`
Expected: Existing tests should pass (API mock returns venues, markers render)

Note: Some tests may need mock data updates if they rely on the old endpoint — see step 4.

**Step 4: If tests fail due to endpoint change**

The E2E tests mock `/venue/nearby` via `mockNearbyVenuesAPI`. Since the store now calls `/venue/nearby` (which was already being mocked), tests should work. If any test relied on the store calling `/venue/search`, update the mock route accordingly.

**Step 5: Final commit**

```bash
git add -A
git commit -m "test: verify venue discovery and proximity check-in changes"
```
