# Venue Discovery & Client-Side Proximity Check-in — Design Document

**Date:** 2026-02-26
**Status:** Approved
**Branch:** TBD (from `main`)

## Problem

The client currently fetches venues via `/venue/search` with no radius control, and check-in eligibility is only validated server-side (200m gate). Users have no way to know if they're within check-in range until they attempt it and get rejected. The API is being updated to decouple discovery radius from check-in radius and return `distance_meters` + `can_checkin` on every venue.

## Solution

1. Switch venue discovery to use `/venue/nearby` with the new `radius` parameter (default 10km).
2. Add `distance_meters` and `can_checkin` fields to the client `Venue` type.
3. Track user location client-side and reactively recalculate proximity in the Pinia store, giving instant UI feedback as the user moves.
4. Update map markers and venue panels to visually communicate check-in eligibility.

## API Changes (Server-Side, Already Designed)

Reference: `/Users/gabriel/Playground/ai_docs_intro_u/venue-map-discovery/design.md`

- `GET /venue/nearby` — new `radius` param (integer, min:100, max:50000, default:10000)
- `VenueResource` — new fields: `distance_meters` (integer, nullable), `can_checkin` (boolean)
- `GET /venue/search` — also returns `distance_meters` and `can_checkin`
- Check-in endpoints unchanged (200m server-side gate remains)

## Client Changes

### 1. Type Changes (`types/venue.ts`)

Add to `Venue` interface:

| Field            | Type                | Description                                      |
|------------------|---------------------|--------------------------------------------------|
| `distance_meters`| `number \| null`    | Distance from user to venue in meters             |
| `can_checkin`    | `boolean`           | Whether user is within 200m check-in range        |

Add new interface:

```typescript
interface NearbyVenueParams {
  latitude: number;
  longitude: number;
  radius?: number; // meters, default 10000, max 50000
}
```

### 2. Composable Changes (`composables/useVenues.ts`)

Update `getNearbyVenues` to accept an optional `radius` parameter and pass it to `/venue/nearby`.

No changes to `searchVenues` — it continues to call `/venue/search` and now also receives the new fields.

### 3. Store Changes (`stores/venues.ts`)

**Switch endpoint:** `fetchNearbyVenues` calls `getNearbyVenues` (the `/venue/nearby` endpoint) instead of `searchVenues`.

**Reactive proximity getter:** Add `venuesWithProximity` getter that:
- Reads the shared user location from `useLocation`'s `_sharedLocation` ref
- For each venue, recalculates `distance_meters` using client-side Haversine
- Sets `can_checkin = distance_meters <= 200`
- Returns the enriched venue array

This getter recomputes automatically as `_sharedLocation` changes (user moves).

**Additional getters:**
- `checkInableVenues` — filters `venuesWithProximity` where `can_checkin === true`
- `discoveryOnlyVenues` — filters where `can_checkin === false`

Components read `venuesWithProximity` instead of `venues` for proximity-aware data.

### 4. Map Changes (`components/venue/VenueMap.vue`)

- `updateVenueMarkers` reads from `venuesStore.venuesWithProximity`
- Marker visual distinction:
  - Venues with `can_checkin === true`: green ring/glow around pin
  - Venues with active users but `can_checkin === false`: blue pin (current behavior)
  - Inactive venues outside range: gray pin (current behavior)
- Remove local `calculateDistance` — use store proximity data
- `fetchAndSaveGooglePlaces` fallback calls store's `fetchNearbyVenues` (which now uses `/venue/nearby`)

### 5. Panel Changes (`VenueBottomSheet.vue` & `VenueDetailPanel.vue`)

- Display formatted distance: "148m away", "1.5km away"
- Check-in button states:
  - `can_checkin === true`: "Check In Here" (enabled, current behavior)
  - `can_checkin === false`: "Too far (1.2km away)" (disabled, grayed out)
  - Already checked in elsewhere: "Checked in elsewhere" (disabled, current behavior)
- Existing `TOO_FAR_FROM_VENUE` error handling remains as server-side safety net

### 6. Data Flow

```
User moves
  -> watchPosition updates _sharedLocation
  -> venuesWithProximity getter recomputes distances
  -> VenueMap watcher re-renders markers (green ring appears/disappears)
  -> Bottom sheet / detail panel reactively update button state
```

## What Doesn't Change

- Check-in/check-out API calls and server-side validation
- Google Places fetching and batch save flow
- Search functionality (`/venue/search` still used for text search)
- Map bounds listener and debouncing
- Venue deduplication logic

## Testing

- Verify `/venue/nearby` is called with default radius on map load
- Verify `distance_meters` and `can_checkin` render correctly in venue panels
- Verify check-in button is disabled with distance hint when `can_checkin === false`
- Verify markers change style as simulated user location crosses 200m threshold
- Verify check-in still works end-to-end when within range
- Verify server-side `TOO_FAR_FROM_VENUE` error still handled gracefully
