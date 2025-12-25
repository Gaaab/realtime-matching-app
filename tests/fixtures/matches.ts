/**
 * Mock Match Data for Testing
 *
 * This file contains mock match and profile data for testing
 * the matching system, profile reveals, and interactions.
 */

export interface Match {
  id: number;
  userId: number;
  matchedUserId: number;
  status: 'pending' | 'revealed' | 'mutual' | 'passed';
  matchedAt: string;
  revealedAt?: string;
  profile?: MatchProfile;
}

export interface MatchProfile {
  id: number;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  distance: number;
  commonInterests: string[];
  verified: boolean;
}

export interface MatchAction {
  action: 'like' | 'pass' | 'superlike';
  profileId: number;
}

// Mock match profiles for swiping/discovering
export const discoverProfiles: MatchProfile[] = [
  {
    id: 101,
    name: 'Sarah',
    age: 27,
    bio: 'Adventure seeker and food lover. Let\'s explore the city together!',
    photos: [
      'https://example.com/sarah1.jpg',
      'https://example.com/sarah2.jpg',
      'https://example.com/sarah3.jpg'
    ],
    distance: 5,
    commonInterests: ['hiking', 'photography', 'cooking'],
    verified: true
  },
  {
    id: 102,
    name: 'Emily',
    age: 25,
    bio: 'Artist and yoga instructor. Peace, love, and good vibes.',
    photos: [
      'https://example.com/emily1.jpg',
      'https://example.com/emily2.jpg'
    ],
    distance: 8,
    commonInterests: ['yoga', 'art', 'meditation'],
    verified: true
  },
  {
    id: 103,
    name: 'Rachel',
    age: 29,
    bio: 'Marketing professional by day, DJ by night. Always up for dancing!',
    photos: [
      'https://example.com/rachel1.jpg'
    ],
    distance: 12,
    commonInterests: ['music', 'dancing', 'nightlife'],
    verified: false
  },
  {
    id: 104,
    name: 'Lisa',
    age: 26,
    bio: 'Bookworm and coffee addict. Let\'s grab a latte and chat!',
    photos: [
      'https://example.com/lisa1.jpg',
      'https://example.com/lisa2.jpg'
    ],
    distance: 3,
    commonInterests: ['reading', 'coffee', 'writing'],
    verified: true
  }
];

// Mock existing matches (revealed and mutual)
export const existingMatches: Match[] = [
  {
    id: 1001,
    userId: 1,
    matchedUserId: 101,
    status: 'mutual',
    matchedAt: '2024-12-10T10:00:00Z',
    revealedAt: '2024-12-10T14:30:00Z',
    profile: discoverProfiles[0]
  },
  {
    id: 1002,
    userId: 1,
    matchedUserId: 102,
    status: 'revealed',
    matchedAt: '2024-12-11T15:20:00Z',
    revealedAt: '2024-12-11T16:00:00Z',
    profile: discoverProfiles[1]
  },
  {
    id: 1003,
    userId: 1,
    matchedUserId: 104,
    status: 'pending',
    matchedAt: '2024-12-12T09:15:00Z',
    profile: discoverProfiles[3]
  }
];

// Mock pending matches (not yet revealed)
export const pendingMatches: Match[] = [
  {
    id: 1003,
    userId: 1,
    matchedUserId: 104,
    status: 'pending',
    matchedAt: '2024-12-12T09:15:00Z',
    profile: {
      id: 104,
      name: '???',
      age: 26,
      bio: 'Reveal this profile to see more...',
      photos: ['https://example.com/placeholder.jpg'],
      distance: 3,
      commonInterests: [],
      verified: false
    }
  }
];

// Mock swipe actions
export const swipeActions: MatchAction[] = [
  { action: 'like', profileId: 101 },
  { action: 'pass', profileId: 102 },
  { action: 'superlike', profileId: 103 },
  { action: 'like', profileId: 104 }
];

// Match statistics
export interface MatchStats {
  totalMatches: number;
  revealedMatches: number;
  mutualMatches: number;
  pendingReveals: number;
  likesReceived: number;
  likesSent: number;
}

export const mockMatchStats: MatchStats = {
  totalMatches: 15,
  revealedMatches: 8,
  mutualMatches: 5,
  pendingReveals: 7,
  likesReceived: 42,
  likesSent: 38
};

// Reveal costs (credits/points system)
export interface RevealCost {
  credits: number;
  type: 'standard' | 'premium';
}

export const revealCosts: Record<string, RevealCost> = {
  standard: {
    credits: 1,
    type: 'standard'
  },
  premium: {
    credits: 0,
    type: 'premium'
  }
};

// User balance for reveals
export interface UserBalance {
  credits: number;
  subscriptionType: 'free' | 'premium';
}

export const mockUserBalance: UserBalance = {
  credits: 10,
  subscriptionType: 'free'
};

export const mockPremiumUserBalance: UserBalance = {
  credits: 999,
  subscriptionType: 'premium'
};

export const mockNoCreditsBalance: UserBalance = {
  credits: 0,
  subscriptionType: 'free'
};
