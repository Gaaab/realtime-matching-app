/**
 * API Mock Utilities for E2E Tests
 *
 * Provides utilities for mocking API responses during testing
 * to ensure consistent and reliable test execution.
 */

import { Page, Route } from '@playwright/test';
import { validUser, validUser2 } from '../fixtures/users';
import { existingMatches, discoverProfiles, mockMatchStats } from '../fixtures/matches';
import { mockVenues, mockCheckIns } from '../fixtures/venues';

/**
 * Mock successful login response
 */
export async function mockLoginSuccess(page: Page) {
  await page.route('**/api/v1/auth/login', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          token: 'mock-jwt-token-12345',
          user: validUser,
          expiresIn: 3600
        }
      })
    });
  });
}

/**
 * Mock failed login response
 */
export async function mockLoginFailure(page: Page) {
  await page.route('**/api/v1/auth/login', async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      })
    });
  });
}

/**
 * Mock registration success
 */
export async function mockRegistrationSuccess(page: Page) {
  await page.route('**/api/v1/auth/register', async (route: Route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          token: 'mock-jwt-token-67890',
          user: validUser2,
          message: 'Registration successful'
        }
      })
    });
  });
}

/**
 * Mock registration failure (email already exists)
 */
export async function mockRegistrationFailure(page: Page) {
  await page.route('**/api/v1/auth/register', async (route: Route) => {
    await route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: {
          message: 'Email already exists',
          code: 'EMAIL_EXISTS',
          fields: {
            email: ['This email is already registered']
          }
        }
      })
    });
  });
}

/**
 * Mock user profile endpoint
 */
export async function mockUserProfile(page: Page, user = validUser) {
  await page.route('**/api/v1/user/profile', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: user
      })
    });
  });
}

/**
 * Mock profile update success
 */
export async function mockProfileUpdateSuccess(page: Page) {
  await page.route('**/api/v1/user/profile', async (route: Route) => {
    if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...validUser,
            ...JSON.parse(route.request().postData() || '{}')
          },
          message: 'Profile updated successfully'
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock matches list endpoint
 */
export async function mockMatchesList(page: Page) {
  await page.route('**/api/v1/matches', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          matches: existingMatches,
          pagination: {
            total: existingMatches.length,
            page: 1,
            perPage: 20
          }
        }
      })
    });
  });
}

/**
 * Mock discover profiles endpoint
 */
export async function mockDiscoverProfiles(page: Page) {
  await page.route('**/api/v1/matches/discover', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          profiles: discoverProfiles,
          hasMore: true
        }
      })
    });
  });
}

/**
 * Mock match action (like/pass/superlike)
 */
export async function mockMatchAction(page: Page, isMatch: boolean = false) {
  await page.route('**/api/v1/matches/action', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          isMatch,
          message: isMatch ? 'It\'s a match!' : 'Action recorded'
        }
      })
    });
  });
}

/**
 * Mock profile reveal
 */
export async function mockProfileReveal(page: Page) {
  await page.route('**/api/v1/matches/*/reveal', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          profile: discoverProfiles[0],
          creditsUsed: 1,
          remainingCredits: 9
        }
      })
    });
  });
}

/**
 * Mock match statistics
 */
export async function mockMatchStatistics(page: Page) {
  await page.route('**/api/v1/matches/stats', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockMatchStats
      })
    });
  });
}

/**
 * Mock chat messages for a conversation
 */
export async function mockChatMessages(page: Page, matchId: number) {
  await page.route(`**/api/v1/chat/${matchId}/messages`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          messages: [
            {
              id: 1,
              matchId,
              senderId: 1,
              receiverId: 101,
              content: 'Hey! How are you?',
              sentAt: '2024-12-13T10:00:00Z',
              read: true
            },
            {
              id: 2,
              matchId,
              senderId: 101,
              receiverId: 1,
              content: 'Hi! I\'m great, thanks! How about you?',
              sentAt: '2024-12-13T10:05:00Z',
              read: true
            }
          ],
          pagination: {
            total: 2,
            page: 1,
            perPage: 50
          }
        }
      })
    });
  });
}

/**
 * Mock send message
 */
export async function mockSendMessage(page: Page) {
  await page.route('**/api/v1/chat/*/messages', async (route: Route) => {
    if (route.request().method() === 'POST') {
      const postData = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: Date.now(),
            content: postData.content,
            sentAt: new Date().toISOString(),
            read: false
          }
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock nearby venues
 */
export async function mockNearbyVenues(page: Page, venues = mockVenues) {
  await page.route('**/api/v1/venue/nearby*', async (route: Route) => {
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
 * Mock venue search
 */
export async function mockVenueSearch(page: Page, venues = mockVenues) {
  await page.route('**/api/v1/venue/search*', async (route: Route) => {
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
 * Mock venue by ID
 */
export async function mockVenueById(page: Page, venue = mockVenues[0]) {
  await page.route('**/api/v1/venue/*', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: venue
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock venue check-in
 */
export async function mockVenueCheckIn(page: Page) {
  await page.route('**/api/v1/venue/checkins', async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: Date.now(),
            venue_id: 201,
            user_id: 1,
            checked_in_at: new Date().toISOString(),
            checked_out_at: null,
            is_active: true,
            venue: mockVenues[0]
          },
          message: 'Checked in successfully'
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock venue checkout
 */
export async function mockVenueCheckOut(page: Page) {
  await page.route('**/api/v1/venue/checkins/*/checkout', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          checked_out_at: new Date().toISOString()
        },
        message: 'Checked out successfully'
      })
    });
  });
}

/**
 * Mock current check-in
 */
export async function mockCurrentCheckIn(page: Page, checkIn: any = null) {
  await page.route('**/api/v1/venue/checkins*', async (route: Route) => {
    if (route.request().method() === 'GET' || route.request().url().includes('active')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: checkIn ? [checkIn] : []
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock nearby users at venue
 */
export async function mockNearbyUsers(page: Page, users: any[] = []) {
  await page.route('**/api/v1/venue/nearby-users*', async (route: Route) => {
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

/**
 * Mock user check-ins history
 */
export async function mockUserCheckIns(page: Page) {
  await page.route('**/api/v1/user/checkins', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          checkIns: mockCheckIns,
          pagination: {
            total: mockCheckIns.length,
            page: 1,
            perPage: 20
          }
        }
      })
    });
  });
}

/**
 * Mock settings update
 */
export async function mockSettingsUpdate(page: Page) {
  await page.route('**/api/v1/user/settings', async (route: Route) => {
    if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: JSON.parse(route.request().postData() || '{}'),
          message: 'Settings updated successfully'
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock onboarding profile update (name, birthdate, gender)
 */
export async function mockOnboardingProfileUpdate(page: Page) {
  await page.route('**/api/v1/auth/profile', async (route: Route) => {
    if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
      const postData = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...validUser,
            ...postData,
            onboarding_completed: false
          },
          message: 'Profile updated successfully'
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock onboarding attributes update (ethnicity, work, kids, smoking, religion)
 */
export async function mockOnboardingAttributesUpdate(page: Page) {
  await page.route('**/api/v1/profile/user/attributes', async (route: Route) => {
    if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            attributes: JSON.parse(route.request().postData() || '{}').attributes
          },
          message: 'Attributes updated successfully'
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock onboarding preferences update
 */
export async function mockOnboardingPreferencesUpdate(page: Page) {
  await page.route('**/api/v1/profile/user/preferences', async (route: Route) => {
    if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
      const postData = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            user_id: 1,
            ...postData
          },
          message: 'Preferences updated successfully'
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock onboarding interests update
 */
export async function mockOnboardingInterestsUpdate(page: Page) {
  await page.route('**/api/v1/profile/user/interests', async (route: Route) => {
    if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            interests: []
          },
          message: 'Interests updated successfully'
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock onboarding dealbreaker creation
 */
export async function mockOnboardingDealbreakerCreate(page: Page) {
  await page.route('**/api/v1/profile/user/dealbreakers', async (route: Route) => {
    if (route.request().method() === 'POST') {
      const postData = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: Date.now(),
            user_id: 1,
            ...postData,
            created_at: new Date().toISOString()
          },
          message: 'Dealbreaker created successfully'
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock onboarding completion
 */
export async function mockOnboardingComplete(page: Page) {
  await page.route('**/api/v1/auth/onboarding/complete', async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...validUser,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          },
          message: 'Onboarding completed successfully'
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock all onboarding API endpoints
 * Convenience function to set up all onboarding mocks at once
 */
export async function mockOnboardingFlow(page: Page) {
  await mockOnboardingProfileUpdate(page);
  await mockOnboardingAttributesUpdate(page);
  await mockOnboardingPreferencesUpdate(page);
  await mockOnboardingInterestsUpdate(page);
  await mockOnboardingDealbreakerCreate(page);
  await mockOnboardingComplete(page);
}

/**
 * Clear all route mocks
 */
export async function clearAllMocks(page: Page) {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
}
