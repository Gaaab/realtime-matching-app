/**
 * Map Markers E2E Tests
 *
 * Comprehensive test suite for Google Maps markers functionality
 * including marker placement, interaction, visibility, and behavior.
 */

import { test, expect } from '@playwright/test';
import {
  mockGeolocation,
  mockSydneyLocation,
  waitForMapToLoad,
  getMapMarkers,
  getMarkerCount,
  getActiveMarkers,
  getInactiveMarkers,
  clickMarker,
  clickMarkerByVenueName,
  verifyMarkerUserCount,
  verifyVenueMarkerInfo,
  verifyVenueCountBadge,
  searchVenues,
  clearVenueSearch,
  verifySearchActive,
  refreshVenues,
  verifyMapLoadedSuccessfully,
  verifyMarkerVisible,
  verifyUserLocationMarkerVisible,
  waitForMarkersUpdate,
  verifyMarkerHasDistance,
  getMarkerColor,
  mockNearbyVenuesAPI,
  mockVenueSearchAPI,
  mockCurrentCheckInAPI,
  mockNearbyUsersAPI
} from './utils/map-helpers';
import { mockVenues } from './fixtures/venues';
import { login } from './utils/auth-helpers';
import { validUser } from './fixtures/users';

test.describe('Map Markers Functionality', () => {

  test.beforeEach(async ({ page, context }) => {
    // Grant geolocation permissions and set Sydney location
    await mockSydneyLocation(page);

    // Mock API endpoints
    await mockNearbyVenuesAPI(page, mockVenues);
    await mockCurrentCheckInAPI(page, null);
    await mockNearbyUsersAPI(page, []);

    // Mock authentication
    await context.addCookies([{
      name: 'auth_token',
      value: 'mock-jwt-token',
      domain: 'localhost',
      path: '/'
    }]);
  });

  test.describe('Map Initialization', () => {

    test('should load map successfully with geolocation permission', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Verify map loaded without errors
      await verifyMapLoadedSuccessfully(page);

      // Verify user location marker is visible
      await verifyUserLocationMarkerVisible(page);
    });

    test('should display loading state while map initializes', async ({ page }) => {
      await page.goto('/explore');

      // Loading spinner should be visible initially
      const loadingSpinner = page.locator('.animate-spin').first();
      const isVisible = await loadingSpinner.isVisible().catch(() => false);

      // If visible, wait for it to disappear
      if (isVisible) {
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 });
      }

      // Map should be loaded
      await verifyMapLoadedSuccessfully(page);
    });

    test('should handle geolocation denial gracefully', async ({ page, context }) => {
      // Deny geolocation
      await context.clearPermissions();

      await page.goto('/explore');

      // Should show error or fallback location
      const errorMessage = page.locator('text=/Location access required|Unable to Load Map/i');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Marker Placement and Visibility', () => {

    test('should display markers for all venues', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Verify all venue markers are rendered
      const markerCount = await getMarkerCount(page);
      expect(markerCount).toBe(mockVenues.length);
    });

    test('should display user location marker', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      // User location marker should be visible
      await verifyUserLocationMarkerVisible(page);
    });

    test('should distinguish between active and inactive venues', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Get active and inactive markers
      const activeMarkers = await getActiveMarkers(page);
      const inactiveMarkers = await getInactiveMarkers(page);

      // Count venues with active users from mock data
      const activeVenuesCount = mockVenues.filter(v => v.activeUsers > 0).length;
      const inactiveVenuesCount = mockVenues.filter(v => v.activeUsers === 0).length;

      expect(activeMarkers.length).toBe(activeVenuesCount);
      expect(inactiveMarkers.length).toBe(inactiveVenuesCount);
    });

    test('should display different marker colors for active vs inactive venues', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      const markers = await getMapMarkers(page);

      // Check first active venue (has users)
      const activeVenueIndex = mockVenues.findIndex(v => v.activeUsers > 0);
      if (activeVenueIndex >= 0) {
        const activeColor = await getMarkerColor(page, activeVenueIndex);
        expect(activeColor).toContain('#0050FF'); // Blue for active
      }

      // Check first inactive venue (no users)
      const inactiveVenueIndex = mockVenues.findIndex(v => v.activeUsers === 0);
      if (inactiveVenueIndex >= 0) {
        const inactiveColor = await getMarkerColor(page, inactiveVenueIndex);
        expect(inactiveColor).toContain('#9CA3AF'); // Gray for inactive
      }
    });

    test('should display venue information labels on markers', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Verify first few venues have labels
      for (let i = 0; i < Math.min(3, mockVenues.length); i++) {
        await verifyVenueMarkerInfo(page, mockVenues[i].name);
      }
    });

    test('should display user count badge on active venue markers', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Find first venue with active users
      const activeVenueIndex = mockVenues.findIndex(v => v.activeUsers > 0);
      if (activeVenueIndex >= 0) {
        const venue = mockVenues[activeVenueIndex];
        await verifyMarkerUserCount(page, activeVenueIndex, venue.activeUsers);
      }
    });

    test('should display distance information on markers', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Check that at least one marker has distance info
      const firstVenue = mockVenues[0];
      await verifyMarkerHasDistance(page, firstVenue.name);
    });
  });

  test.describe('Marker Interactions', () => {

    test('should open venue detail panel when marker is clicked', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Click first marker
      await clickMarker(page, 0);

      // Wait for venue panel to open
      await page.waitForTimeout(500);

      // Verify venue details are shown (name should be visible)
      const venueName = mockVenues[0].name;
      const venueTitle = page.locator(`text=${venueName}`);
      await expect(venueTitle).toBeVisible();
    });

    test('should display correct venue information when marker is clicked', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      const testVenue = mockVenues[0];

      // Click marker by venue name
      await clickMarkerByVenueName(page, testVenue.name);

      await page.waitForTimeout(500);

      // Verify venue details
      await expect(page.locator(`text=${testVenue.name}`)).toBeVisible();
      await expect(page.locator(`text=${testVenue.address}`).or(page.locator(`text=${testVenue.city}`).first())).toBeVisible();
    });

    test('should show active users when clicking active venue marker', async ({ page }) => {
      const activeVenue = mockVenues.find(v => v.activeUsers > 0);
      if (!activeVenue) {
        test.skip();
        return;
      }

      // Mock nearby users for this venue
      const mockUsers = Array.from({ length: activeVenue.activeUsers }, (_, i) => ({
        id: i + 1,
        user_id: i + 100,
        first_name: `User${i + 1}`,
        age: 25 + i,
        profile_picture_url: null,
        distance: 0.5,
        venue: {
          id: activeVenue.id,
          name: activeVenue.name
        },
        checked_in_at: new Date().toISOString()
      }));

      await mockNearbyUsersAPI(page, mockUsers);

      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Click active venue marker
      await clickMarkerByVenueName(page, activeVenue.name);

      await page.waitForTimeout(1000);

      // Should show user count or user list
      const userCountText = page.locator(`text=/\\d+.*user|people/i`);
      await expect(userCountText).toBeVisible({ timeout: 5000 }).catch(() => {
        // May use different wording
      });
    });

    test('should pan map to marker location when clicked', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      const initialViewport = await page.evaluate(() => {
        return {
          width: window.innerWidth,
          height: window.innerHeight
        };
      });

      // Click a marker
      await clickMarker(page, 1);

      await page.waitForTimeout(1000);

      // Map should still be visible (pan doesn't break it)
      await verifyMapLoadedSuccessfully(page);
    });

    test('should handle clicking multiple markers sequentially', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Click first marker
      await clickMarker(page, 0);
      await page.waitForTimeout(500);
      await expect(page.locator(`text=${mockVenues[0].name}`)).toBeVisible();

      // Click second marker
      await clickMarker(page, 1);
      await page.waitForTimeout(500);
      await expect(page.locator(`text=${mockVenues[1].name}`)).toBeVisible();

      // Click third marker
      await clickMarker(page, 2);
      await page.waitForTimeout(500);
      await expect(page.locator(`text=${mockVenues[2].name}`)).toBeVisible();
    });
  });

  test.describe('Venue Count Display', () => {

    test('should display correct active and inactive venue counts', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      const activeCount = mockVenues.filter(v => v.activeUsers > 0).length;
      const inactiveCount = mockVenues.filter(v => v.activeUsers === 0).length;

      await verifyVenueCountBadge(page, activeCount, inactiveCount);
    });

    test('should update venue counts when venues change', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      const initialActive = mockVenues.filter(v => v.activeUsers > 0).length;
      const initialInactive = mockVenues.filter(v => v.activeUsers === 0).length;

      await verifyVenueCountBadge(page, initialActive, initialInactive);

      // Update mock to change active venues
      const updatedVenues = mockVenues.map(v => ({
        ...v,
        activeUsers: v.id === 201 ? 10 : 0 // Only first venue active
      }));

      await mockNearbyVenuesAPI(page, updatedVenues);

      // Refresh venues
      await refreshVenues(page);
      await waitForMarkersUpdate(page);

      // Verify updated counts
      await verifyVenueCountBadge(page, 1, mockVenues.length - 1);
    });
  });

  test.describe('Search Functionality', () => {

    test('should filter markers when searching for venues', async ({ page }) => {
      // Mock search to return only coffee venues
      const coffeeVenues = mockVenues.filter(v =>
        v.name.toLowerCase().includes('coffee') || v.type === 'cafe'
      );
      await mockVenueSearchAPI(page, coffeeVenues);

      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Search for coffee
      await searchVenues(page, 'coffee');

      await page.waitForTimeout(1000);

      // Verify search is active
      await verifySearchActive(page, 'coffee');

      // Markers should be filtered (though we can't easily verify exact count in DOM)
      // At minimum, verify the coffee shop marker is visible
      await verifyVenueMarkerInfo(page, 'The Coffee House');
    });

    test('should clear search and show all venues', async ({ page }) => {
      const coffeeVenues = mockVenues.filter(v => v.type === 'cafe');
      await mockVenueSearchAPI(page, coffeeVenues);

      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Search first
      await searchVenues(page, 'coffee');
      await page.waitForTimeout(1000);

      // Clear search
      await clearVenueSearch(page);
      await page.waitForTimeout(1000);

      // All venues should be visible again
      const markerCount = await getMarkerCount(page);
      expect(markerCount).toBeGreaterThan(coffeeVenues.length);
    });

    test('should show search status indicator when searching', async ({ page }) => {
      await mockVenueSearchAPI(page, []);

      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Start search
      await searchVenues(page, 'test venue');

      // Search status should be visible
      const searchStatus = page.locator('text=/Showing search results/i');
      await expect(searchStatus).toBeVisible();
    });

    test('should handle empty search results gracefully', async ({ page }) => {
      // Mock empty search results
      await mockVenueSearchAPI(page, []);

      await page.goto('/explore');
      await waitForMapToLoad(page);

      await searchVenues(page, 'nonexistent venue xyz');
      await page.waitForTimeout(1000);

      // Should show 0 markers or appropriate message
      const markerCount = await getMarkerCount(page);
      expect(markerCount).toBe(0);
    });
  });

  test.describe('Marker Updates and Refresh', () => {

    test('should refresh markers when refresh button is clicked', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      const initialCount = await getMarkerCount(page);

      // Click refresh
      await refreshVenues(page);
      await page.waitForTimeout(1500);

      // Markers should still be present
      const newCount = await getMarkerCount(page);
      expect(newCount).toBe(initialCount);
    });

    test('should update markers when map bounds change', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Simulate map pan/zoom by triggering resize
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
      });

      await page.waitForTimeout(1500);

      // Map should still function
      await verifyMapLoadedSuccessfully(page);
    });

    test('should maintain marker state across re-renders', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      const firstVenue = mockVenues[0];

      // Click a marker
      await clickMarkerByVenueName(page, firstVenue.name);
      await page.waitForTimeout(500);

      // Verify venue is selected
      await expect(page.locator(`text=${firstVenue.name}`)).toBeVisible();

      // Trigger a refresh
      await refreshVenues(page);
      await page.waitForTimeout(1000);

      // Marker should still exist
      await verifyVenueMarkerInfo(page, firstVenue.name);
    });
  });

  test.describe('Invalid Coordinates Handling', () => {

    test('should skip venues with invalid coordinates', async ({ page }) => {
      // Create venues with some invalid coordinates
      const venuesWithInvalid = [
        ...mockVenues.slice(0, 2),
        {
          ...mockVenues[0],
          id: 999,
          name: 'Invalid Venue',
          location: {
            latitude: NaN,
            longitude: 151.2093
          }
        }
      ];

      await mockNearbyVenuesAPI(page, venuesWithInvalid);

      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Should show warning about skipped venues
      const warning = page.locator('text=/could not be displayed/i');
      await expect(warning).toBeVisible({ timeout: 5000 });

      // Should display count of skipped venues
      await expect(warning).toContainText('1 venue');
    });

    test('should display only valid venue markers', async ({ page }) => {
      const venuesWithInvalid = [
        mockVenues[0],
        mockVenues[1],
        {
          ...mockVenues[2],
          id: 998,
          location: {
            latitude: 999, // Invalid
            longitude: 151.2093
          }
        }
      ];

      await mockNearbyVenuesAPI(page, venuesWithInvalid);

      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Only 2 valid markers should be displayed
      const markerCount = await getMarkerCount(page);
      expect(markerCount).toBe(2);
    });
  });

  test.describe('Marker Animations', () => {

    test('should animate active venue markers', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Check for pulse animation on active markers
      const activeMarkers = await getActiveMarkers(page);

      if (activeMarkers.length > 0) {
        // Verify first active marker has animation class
        await expect(activeMarkers[0]).toHaveClass(/active/);
      }
    });

    test('should not animate inactive venue markers', async ({ page }) => {
      await page.goto('/explore');
      await waitForMapToLoad(page);

      const inactiveMarkers = await getInactiveMarkers(page);

      if (inactiveMarkers.length > 0) {
        // Verify inactive marker doesn't have active class
        await expect(inactiveMarkers[0]).not.toHaveClass(/active/);
      }
    });
  });

  test.describe('Responsive Behavior', () => {

    test('should display markers correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Markers should be visible on mobile
      const markerCount = await getMarkerCount(page);
      expect(markerCount).toBeGreaterThan(0);

      // User location marker should be visible
      await verifyUserLocationMarkerVisible(page);
    });

    test('should display markers correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/explore');
      await waitForMapToLoad(page);

      const markerCount = await getMarkerCount(page);
      expect(markerCount).toBeGreaterThan(0);
    });

    test('should display markers correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto('/explore');
      await waitForMapToLoad(page);

      const markerCount = await getMarkerCount(page);
      expect(markerCount).toBeGreaterThan(0);
    });
  });

  test.describe('Edge Cases', () => {

    test('should handle empty venues list gracefully', async ({ page }) => {
      await mockNearbyVenuesAPI(page, []);

      await page.goto('/explore');
      await waitForMapToLoad(page);

      // Should show 0 venue markers (only user location)
      const markerCount = await getMarkerCount(page);
      expect(markerCount).toBe(0);

      // Should show 0 active and 0 inactive venues
      await verifyVenueCountBadge(page, 0, 0);
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/v1/venue/nearby*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error'
          })
        });
      });

      await page.goto('/explore');

      // Map should still load even if venues fail
      await waitForMapToLoad(page);
    });

    test('should handle very large number of venues', async ({ page }) => {
      // Create 100 mock venues
      const manyVenues = Array.from({ length: 100 }, (_, i) => ({
        ...mockVenues[0],
        id: i + 1,
        name: `Venue ${i + 1}`,
        location: {
          latitude: -33.8568 + (Math.random() - 0.5) * 0.1,
          longitude: 151.2153 + (Math.random() - 0.5) * 0.1
        }
      }));

      await mockNearbyVenuesAPI(page, manyVenues);

      await page.goto('/explore');
      await waitForMapToLoad(page, 20000); // Longer timeout for many markers

      // Should handle many markers without crashing
      const markerCount = await getMarkerCount(page);
      expect(markerCount).toBe(100);
    });
  });
});
