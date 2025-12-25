/**
 * Mock Venue Data for Testing
 *
 * This file contains mock venue data for testing
 * venue search, check-ins, and location-based features.
 */

export interface Venue {
  id: number;
  name: string;
  type: string;
  address: string;
  city: string;
  country: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  priceLevel: number;
  photos: string[];
  description: string;
  openNow: boolean;
  hours?: {
    open: string;
    close: string;
  };
  amenities: string[];
  activeUsers: number;
}

export interface CheckIn {
  id: number;
  userId: number;
  venueId: number;
  checkedInAt: string;
  checkedOutAt?: string;
  status: 'active' | 'completed';
}

export interface VenueSearchParams {
  query?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  openNow?: boolean;
  minRating?: number;
}

// Mock venues for search results - using Sydney, Australia locations
export const mockVenues: Venue[] = [
  {
    id: 201,
    name: 'The Coffee House',
    type: 'cafe',
    address: '123 George Street',
    city: 'Sydney',
    country: 'Australia',
    location: {
      latitude: -33.8688,
      longitude: 151.2093
    },
    rating: 4.5,
    priceLevel: 2,
    photos: [
      'https://example.com/coffee-house1.jpg',
      'https://example.com/coffee-house2.jpg'
    ],
    description: 'Cozy coffee shop with great atmosphere and specialty brews',
    openNow: true,
    hours: {
      open: '07:00',
      close: '22:00'
    },
    amenities: ['wifi', 'outdoor seating', 'laptop friendly'],
    activeUsers: 5
  },
  {
    id: 202,
    name: 'Sunset Bar & Lounge',
    type: 'bar',
    address: '456 Circular Quay',
    city: 'Sydney',
    country: 'Australia',
    location: {
      latitude: -33.8580,
      longitude: 151.2100
    },
    rating: 4.2,
    priceLevel: 3,
    photos: [
      'https://example.com/sunset-bar1.jpg'
    ],
    description: 'Rooftop bar with stunning harbour views and craft cocktails',
    openNow: true,
    hours: {
      open: '17:00',
      close: '02:00'
    },
    amenities: ['rooftop', 'live music', 'happy hour'],
    activeUsers: 12
  },
  {
    id: 203,
    name: 'Fitness First Gym',
    type: 'gym',
    address: '789 Pitt Street',
    city: 'Sydney',
    country: 'Australia',
    location: {
      latitude: -33.8720,
      longitude: 151.2070
    },
    rating: 4.7,
    priceLevel: 3,
    photos: [
      'https://example.com/gym1.jpg',
      'https://example.com/gym2.jpg'
    ],
    description: '24/7 gym with modern equipment and personal trainers',
    openNow: true,
    amenities: ['24/7', 'personal training', 'classes', 'sauna'],
    activeUsers: 8
  },
  {
    id: 204,
    name: 'Italian Bistro',
    type: 'restaurant',
    address: '321 Darling Harbour',
    city: 'Sydney',
    country: 'Australia',
    location: {
      latitude: -33.8735,
      longitude: 151.2000
    },
    rating: 4.8,
    priceLevel: 4,
    photos: [
      'https://example.com/bistro1.jpg',
      'https://example.com/bistro2.jpg',
      'https://example.com/bistro3.jpg'
    ],
    description: 'Authentic Italian cuisine in an elegant setting',
    openNow: false,
    hours: {
      open: '18:00',
      close: '23:00'
    },
    amenities: ['reservations', 'romantic', 'wine selection'],
    activeUsers: 3
  },
  {
    id: 205,
    name: 'Royal Botanic Garden',
    type: 'park',
    address: 'Mrs Macquaries Rd',
    city: 'Sydney',
    country: 'Australia',
    location: {
      latitude: -33.8642,
      longitude: 151.2166
    },
    rating: 4.9,
    priceLevel: 0,
    photos: [
      'https://example.com/park1.jpg'
    ],
    description: 'Beautiful botanical gardens perfect for walks and outdoor activities',
    openNow: true,
    amenities: ['free', 'walking trails', 'scenic views', 'pet friendly'],
    activeUsers: 25
  },
  {
    id: 206,
    name: 'Opera Bar',
    type: 'bar',
    address: 'Sydney Opera House',
    city: 'Sydney',
    country: 'Australia',
    location: {
      latitude: -33.8568,
      longitude: 151.2153
    },
    rating: 4.6,
    priceLevel: 3,
    photos: [
      'https://example.com/opera-bar.jpg'
    ],
    description: 'Iconic bar at Sydney Opera House with harbour views',
    openNow: true,
    hours: {
      open: '11:00',
      close: '23:00'
    },
    amenities: ['waterfront', 'live music', 'iconic location'],
    activeUsers: 15
  }
];

// Mock check-ins
export const mockCheckIns: CheckIn[] = [
  {
    id: 301,
    userId: 1,
    venueId: 201,
    checkedInAt: '2024-12-13T10:30:00Z',
    status: 'active'
  },
  {
    id: 302,
    userId: 2,
    venueId: 201,
    checkedInAt: '2024-12-13T11:00:00Z',
    status: 'active'
  },
  {
    id: 303,
    userId: 1,
    venueId: 202,
    checkedInAt: '2024-12-12T20:00:00Z',
    checkedOutAt: '2024-12-12T23:30:00Z',
    status: 'completed'
  }
];

// Search filters
export const searchFilters: VenueSearchParams[] = [
  {
    query: 'coffee',
    type: 'cafe',
    radius: 5000,
    openNow: true
  },
  {
    type: 'bar',
    minRating: 4.0,
    openNow: true
  },
  {
    query: 'restaurant',
    type: 'restaurant',
    radius: 2000
  },
  {
    type: 'gym',
    openNow: true
  }
];

// Venue types for filtering
export const venueTypes = [
  'cafe',
  'bar',
  'restaurant',
  'gym',
  'park',
  'museum',
  'theater',
  'club',
  'library',
  'bookstore'
];

// Popular venues (trending)
export const popularVenues: Venue[] = [
  mockVenues[1], // Sunset Bar & Lounge (12 active users)
  mockVenues[4], // Central Park (25 active users)
  mockVenues[2]  // Fitness First Gym (8 active users)
];

// Nearby venues (based on user location)
export const nearbyVenues: Venue[] = [
  mockVenues[0], // 0.3 km away
  mockVenues[3], // 0.5 km away
  mockVenues[1]  // 0.8 km away
];

// Check-in statistics
export interface CheckInStats {
  totalCheckIns: number;
  uniqueVenues: number;
  favoriteVenueType: string;
  mostVisitedVenue: Venue;
  checkInsThisWeek: number;
}

export const mockCheckInStats: CheckInStats = {
  totalCheckIns: 47,
  uniqueVenues: 23,
  favoriteVenueType: 'cafe',
  mostVisitedVenue: mockVenues[0],
  checkInsThisWeek: 5
};
