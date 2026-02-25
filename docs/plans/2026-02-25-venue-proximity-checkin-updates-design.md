# Venue Proximity & Check-in API Updates - Client Design

**Date:** 2026-02-25
**Status:** Approved
**Branch:** feature/venue-proximity-checkin-updates

## Problem

The backend has introduced two API changes that the client needs to integrate:

1. **200m Proximity Filter** - Server now enforces a 200m radius for venue discovery and check-in validation. Client must send location headers on every authenticated request and include GPS coordinates in check-in requests.
2. **Check-in by Venue ID** - Check-in endpoint now accepts either `google_place_id` or `venue_id` (mutually exclusive), enabling check-ins to admin-created venues.
3. **Photo URLs** - Backend now returns photo URLs as strings in venue responses. Client should display these instead of relying solely on Google Places `getURI()`.

## Approach

Centralized location interceptor: a global API interceptor injects `X-Latitude`/`X-Longitude` headers automatically, with a location watcher for significant movement updates.

## Design

### 1. Location Management

**Enhance `composables/useLocation.ts`:**
- Add a reactive `currentLocation` ref holding latest GPS coordinates
- Add `startLocationTracking()` using browser `watchPosition` for continuous updates
- Add significant movement detection (>10m from last known) that triggers `POST /api/v1/location`
- Export the reactive location ref for use by the API interceptor

**API interceptor in `composables/useApi.ts`:**
- Before every authenticated request, read the reactive location ref
- Inject `X-Latitude` and `X-Longitude` headers if coordinates are available
- No request is blocked if location is unavailable (headers are simply omitted)

**New API function in `useLocation.ts`:**
- `updateLocation(lat, lng)` calls `POST /api/v1/location`

### 2. Check-in Flow

**`stores/venues.ts` — `checkInToVenue()`:**
- Pass `latitude` and `longitude` in the check-in request body (from reactive location ref)
- Support both `venue_id` and `google_place_id` (mutually exclusive): if venue has a backend `id` and no `google_place_id`, send `venue_id`; otherwise send `google_place_id`

**`composables/useVenues.ts` — `checkIn()`:**
- Update `POST /venue/checkins` payload to include `latitude`, `longitude`
- Accept either `venue_id` or `google_place_id`

**`types/venue.ts`:**
- Update check-in types to include `latitude`, `longitude`, and optional `venue_id`

**Error handling in `VenueBottomSheet.vue`:**
- Handle `TOO_FAR_FROM_VENUE` error code from 422 responses
- Display: "You're too far from this venue" with distance in meters

### 3. Venue Discovery (200m Server-Side)

**`composables/useVenues.ts` — `getNearbyVenues()`:**
- Remove `radius` parameter from the API call (server enforces 200m)
- Still pass `latitude` and `longitude` as query params

**`VenueMap.vue`:**
- Remove radius-related logic from venue fetching
- Backend returns only venues within 200m

**`stores/venues.ts` — `fetchNearbyVenues()`:**
- Remove `radius` parameter from action signature and API call

### 4. Photo URL Display

**`VenueMap.vue`:**
- When fetching venues from backend (`GET /venue/nearby`), use the returned `photos` array directly
- Google Places photos still used for client-side search results before batch save

**`VenueBottomSheet.vue` / `VenueDetailPanel.vue`:**
- Already use `venue.photos[0]` / `venue.photos[index]` as `<img>` src — works with backend URLs
- Add fallback placeholder for missing/broken photos

**Store deduplication:**
- When merging venues from Google Places and backend, prefer backend photo URLs

## Files to Change

| File | Changes |
|------|---------|
| `composables/useLocation.ts` | Reactive `currentLocation`, `startLocationTracking()`, `updateLocation()`, movement detection |
| `composables/useApi.ts` | Global interceptor for `X-Latitude`/`X-Longitude` headers |
| `composables/useVenues.ts` | `checkIn()` sends lat/lng + venue_id; remove `radius` from `getNearbyVenues()` |
| `stores/venues.ts` | `checkInToVenue()` passes location; `fetchNearbyVenues()` drops radius; dedup prefers backend photos |
| `types/venue.ts` | Add `venue_id`, `latitude`, `longitude` to check-in types |
| `components/venue/VenueMap.vue` | Remove radius from venue fetch; use backend photo URLs for saved venues |
| `components/venue/VenueBottomSheet.vue` | Handle `TOO_FAR_FROM_VENUE` error |
| `components/venue/VenueDetailPanel.vue` | Add image error fallback |

## Out of Scope

- Google Places client-side search (unchanged)
- Venue batch import logic (unchanged)
- Admin panel changes
- Client-side 200m filtering (server handles this)

## Error Handling

| Scenario | HTTP Status | Error Code | Client Behavior |
|----------|-------------|------------|-----------------|
| Check-in beyond 200m | 422 | `TOO_FAR_FROM_VENUE` | Show "You're too far from this venue" with distance |
| Missing lat/lng on check-in | 422 | Standard validation | Show validation error |
| Venue not found (venue_id) | 404 | Not Found | Show error message |
| Both venue_id and google_place_id sent | 422 | Validation | Should never happen (client logic prevents this) |
