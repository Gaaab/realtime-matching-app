/**
 * Map Testing Helper Utilities
 *
 * Provides specialized utilities for testing Google Maps integration,
 * markers, geolocation, and map interactions.
 */

import { Page, expect, Locator } from '@playwright/test';

/**
 * Mock geolocation to a specific location
 * @param page - Playwright page instance
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 */
export async function mockGeolocation(
  page: Page,
  latitude: number,
  longitude: number
) {
  await page.context().setGeolocation({ latitude, longitude });
  await page.context().grantPermissions(['geolocation']);
}

/**
 * Mock Sydney Opera House location (default test location)
 * @param page - Playwright page instance
 */
export async function mockSydneyLocation(page: Page) {
  await mockGeolocation(page, -33.8568, 151.2153);
}

/**
 * Deny geolocation permission
 * @param page - Playwright page instance
 */
export async function denyGeolocation(page: Page) {
  await page.context().clearPermissions();
}

/**
 * Wait for Google Maps to load
 * @param page - Playwright page instance
 * @param timeout - Optional timeout in milliseconds
 */
export async function waitForMapToLoad(page: Page, timeout: number = 15000) {
  // Wait for map container to be visible
  await page.waitForSelector('[data-testid="map-container"], .w-full.h-full', {
    state: 'visible',
    timeout
  });

  // Wait for loading overlay to disappear
  await page.waitForSelector('.animate-spin', {
    state: 'hidden',
    timeout
  }).catch(() => {
    // Loading spinner may not appear if map loads quickly
  });

  // Give map a moment to render
  await page.waitForTimeout(1000);
}

/**
 * Get all visible map markers
 * @param page - Playwright page instance
 * @returns Array of marker elements
 */
export async function getMapMarkers(page: Page): Promise<Locator[]> {
  // Advanced markers are rendered in the map container
  const markers = page.locator('.advanced-marker');
  const count = await markers.count();
  const result: Locator[] = [];
  for (let i = 0; i < count; i++) {
    result.push(markers.nth(i));
  }
  return result;
}

/**
 * Get count of visible map markers
 * @param page - Playwright page instance
 * @returns Number of markers
 */
export async function getMarkerCount(page: Page): Promise<number> {
  return await page.locator('.advanced-marker').count();
}

/**
 * Get active (blue) markers
 * @param page - Playwright page instance
 * @returns Array of active marker elements
 */
export async function getActiveMarkers(page: Page): Promise<Locator[]> {
  const markers = page.locator('.advanced-marker.active');
  const count = await markers.count();
  const result: Locator[] = [];
  for (let i = 0; i < count; i++) {
    result.push(markers.nth(i));
  }
  return result;
}

/**
 * Get inactive (gray) markers
 * @param page - Playwright page instance
 * @returns Array of inactive marker elements
 */
export async function getInactiveMarkers(page: Page): Promise<Locator[]> {
  const markers = page.locator('.advanced-marker.inactive');
  const count = await markers.count();
  const result: Locator[] = [];
  for (let i = 0; i < count; i++) {
    result.push(markers.nth(i));
  }
  return result;
}

/**
 * Get user location marker
 * @param page - Playwright page instance
 * @returns User location marker element
 */
export async function getUserLocationMarker(page: Page): Promise<Locator> {
  return page.locator('.user-location-marker');
}

/**
 * Click a specific marker by index
 * @param page - Playwright page instance
 * @param index - Marker index (0-based)
 */
export async function clickMarker(page: Page, index: number) {
  const markers = await getMapMarkers(page);
  if (index >= markers.length) {
    throw new Error(`Marker index ${index} out of range (${markers.length} markers)`);
  }
  await markers[index].click();
}

/**
 * Find and click marker with specific venue name
 * @param page - Playwright page instance
 * @param venueName - Venue name to search for
 */
export async function clickMarkerByVenueName(page: Page, venueName: string) {
  // Look for venue label containing the name
  const venueLabel = page.locator('.venue-label', { hasText: venueName });
  const count = await venueLabel.count();

  if (count === 0) {
    throw new Error(`No marker found for venue: ${venueName}`);
  }

  // Click the parent marker container
  const markerContainer = venueLabel.first().locator('xpath=ancestor::div[contains(@class, "venue-marker-main")]');
  await markerContainer.click();
}

/**
 * Verify marker has user count badge
 * @param page - Playwright page instance
 * @param markerIndex - Marker index
 * @param expectedCount - Expected user count
 */
export async function verifyMarkerUserCount(
  page: Page,
  markerIndex: number,
  expectedCount: number
) {
  const markers = await getMapMarkers(page);
  const marker = markers[markerIndex];
  const badge = marker.locator('.user-count-badge');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText(expectedCount.toString());
}

/**
 * Verify marker displays venue information
 * @param page - Playwright page instance
 * @param venueName - Venue name to verify
 */
export async function verifyVenueMarkerInfo(page: Page, venueName: string) {
  const venueLabel = page.locator('.venue-label', { hasText: venueName });
  await expect(venueLabel).toBeVisible();
}

/**
 * Wait for venue detail panel to open
 * @param page - Playwright page instance
 */
export async function waitForVenuePanel(page: Page) {
  await page.waitForSelector('[data-testid="venue-detail-panel"], .venue-detail-panel', {
    state: 'visible',
    timeout: 5000
  }).catch(() => {
    // Panel may use different selector, try generic approach
  });
}

/**
 * Verify venue count badge displays correct numbers
 * @param page - Playwright page instance
 * @param activeCount - Expected active venues count
 * @param inactiveCount - Expected inactive venues count
 */
export async function verifyVenueCountBadge(
  page: Page,
  activeCount: number,
  inactiveCount: number
) {
  const activeText = page.locator('text=/\\d+ active venues/');
  const inactiveText = page.locator('text=/\\d+ nearby venues/');

  await expect(activeText).toContainText(`${activeCount} active venues`);
  await expect(inactiveText).toContainText(`${inactiveCount} nearby venues`);
}

/**
 * Use the map search functionality
 * @param page - Playwright page instance
 * @param searchQuery - Search query
 */
export async function searchVenues(page: Page, searchQuery: string) {
  const searchInput = page.locator('input[placeholder*="Search"], input[type="text"]').first();
  await searchInput.fill(searchQuery);

  // Wait for debounce and search to complete
  await page.waitForTimeout(500);
}

/**
 * Clear map search
 * @param page - Playwright page instance
 */
export async function clearVenueSearch(page: Page) {
  const clearButton = page.locator('button[title="Clear search"]');
  await clearButton.click();
  await page.waitForTimeout(500);
}

/**
 * Verify search is active
 * @param page - Playwright page instance
 * @param searchTerm - Expected search term
 */
export async function verifySearchActive(page: Page, searchTerm: string) {
  const searchStatus = page.locator(`text=/Showing search results for.*${searchTerm}/`);
  await expect(searchStatus).toBeVisible();
}

/**
 * Click refresh venues button
 * @param page - Playwright page instance
 */
export async function refreshVenues(page: Page) {
  const refreshButton = page.locator('button[title="Refresh venues"]');
  await refreshButton.click();
  await page.waitForTimeout(1000);
}

/**
 * Verify map has loaded without errors
 * @param page - Playwright page instance
 */
export async function verifyMapLoadedSuccessfully(page: Page) {
  // Check that error overlay is not visible
  const errorOverlay = page.locator('text=/Unable to Load Map/');
  await expect(errorOverlay).not.toBeVisible();

  // Check that map container is visible
  const mapContainer = page.locator('[data-testid="map-container"], .w-full.h-full').first();
  await expect(mapContainer).toBeVisible();
}

/**
 * Simulate map pan/zoom to trigger bounds change
 * @param page - Playwright page instance
 */
export async function triggerMapBoundsChange(page: Page) {
  // Evaluate JavaScript to programmatically change map bounds
  await page.evaluate(() => {
    const mapElement = document.querySelector('.w-full.h-full.map-container');
    if (mapElement) {
      // Trigger a resize event which will trigger bounds change
      window.dispatchEvent(new Event('resize'));
    }
  });

  // Wait for debounce
  await page.waitForTimeout(1000);
}

/**
 * Verify marker animation (for active markers)
 * @param page - Playwright page instance
 * @param markerIndex - Marker index
 */
export async function verifyMarkerHasAnimation(page: Page, markerIndex: number) {
  const markers = await getMapMarkers(page);
  const marker = markers[markerIndex];

  // Check if marker has animation class or style
  const hasAnimation = await marker.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return styles.animation !== 'none' && styles.animation !== '';
  });

  expect(hasAnimation).toBeTruthy();
}

/**
 * Get marker color
 * @param page - Playwright page instance
 * @param markerIndex - Marker index
 * @returns Marker color (blue for active, gray for inactive)
 */
export async function getMarkerColor(page: Page, markerIndex: number): Promise<string> {
  const markers = await getMapMarkers(page);
  const marker = markers[markerIndex];

  // Check SVG fill color
  const color = await marker.evaluate((el) => {
    const svg = el.querySelector('svg path');
    return svg ? (svg as SVGPathElement).getAttribute('fill') : null;
  });

  return color || 'unknown';
}

/**
 * Verify marker is visible on screen
 * @param page - Playwright page instance
 * @param markerIndex - Marker index
 */
export async function verifyMarkerVisible(page: Page, markerIndex: number) {
  const markers = await getMapMarkers(page);
  const marker = markers[markerIndex];
  await expect(marker).toBeVisible();
}

/**
 * Check if invalid venues warning is displayed
 * @param page - Playwright page instance
 */
export async function checkInvalidVenuesWarning(page: Page): Promise<boolean> {
  try {
    const warning = page.locator('text=/venue.*could not be displayed/i');
    return await warning.isVisible();
  } catch {
    return false;
  }
}

/**
 * Verify user location marker is visible
 * @param page - Playwright page instance
 */
export async function verifyUserLocationMarkerVisible(page: Page) {
  const userMarker = await getUserLocationMarker(page);
  await expect(userMarker).toBeVisible();
}

/**
 * Wait for markers to update after action
 * @param page - Playwright page instance
 * @param expectedCount - Expected marker count (optional)
 */
export async function waitForMarkersUpdate(page: Page, expectedCount?: number) {
  await page.waitForTimeout(1000);

  if (expectedCount !== undefined) {
    await expect(page.locator('.advanced-marker')).toHaveCount(expectedCount);
  }
}

/**
 * Verify distance label on marker
 * @param page - Playwright page instance
 * @param venueName - Venue name
 */
export async function verifyMarkerHasDistance(page: Page, venueName: string) {
  const venueLabel = page.locator('.venue-label', { hasText: venueName });
  // Distance should contain 📍 emoji and km/m unit
  const distanceInfo = venueLabel.locator('text=/📍.*[km|m]/');
  await expect(distanceInfo).toBeVisible();
}

/**
 * Mock nearby venues API response
 * @param page - Playwright page instance
 * @param venues - Array of venue objects
 */
export async function mockNearbyVenuesAPI(page: Page, venues: any[]) {
  await page.route('**/api/v1/venue/nearby*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: venues
      })
    });
  });
}

/**
 * Mock venue search API response
 * @param page - Playwright page instance
 * @param venues - Array of venue objects
 */
export async function mockVenueSearchAPI(page: Page, venues: any[]) {
  await page.route('**/api/v1/venue/search*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: venues
      })
    });
  });
}

/**
 * Mock current check-in API response
 * @param page - Playwright page instance
 * @param checkIn - Check-in object or null
 */
export async function mockCurrentCheckInAPI(page: Page, checkIn: any = null) {
  await page.route('**/api/v1/venue/checkins*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: checkIn ? [checkIn] : []
      })
    });
  });
}

/**
 * Mock nearby users at venue API response
 * @param page - Playwright page instance
 * @param users - Array of user objects
 */
export async function mockNearbyUsersAPI(page: Page, users: any[] = []) {
  await page.route('**/api/v1/venue/nearby-users*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: users
      })
    });
  });
}
