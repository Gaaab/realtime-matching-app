export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  // Support both flat and nested location formats
  latitude?: number;
  longitude?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  google_place_id?: string;
  category: string;
  subcategory?: string;
  rating?: number;
  price_level?: number;
  phone?: string;
  website?: string;
  hours?: VenueHours;
  photos?: string[];
  distance?: number;
  distance_meters?: number | null;
  can_checkin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface VenueHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface VenueSearchParams {
  location?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  min_rating?: number;
  price_level?: number;
  limit?: number;
}

export interface NearbyVenueParams {
  latitude: number;
  longitude: number;
  radius?: number;
}

export interface VenueCheckIn {
  id: number;
  user_id: number;
  venue_id: number;
  checked_in_at: string;
  checked_out_at: string | null;
  venue: Venue;
  is_active: boolean;
}

export interface NearbyUser {
  id: number;
  first_name: string;
  last_name?: string;
  full_name?: string;
  age: number;
  gender?: string;
  avatar?: string | null;
  avatar_url?: string | null;
  checked_in_at: string;
  has_match?: boolean;
  match_id?: number | null;
  is_revealed?: boolean;
  reveal_id?: number | null;
  reveal_direction?: "sent" | "received" | null;
  similarities_count?: number;
  highlights?: {
    attributes?: { key: string; value: string }[];
    interests?: { id: number; name: string; category?: string }[];
  };
  // Legacy fields for backwards compatibility
  user_id?: number;
  profile_picture_url?: string | null;
  distance?: number;
  venue?: {
    id: number;
    name: string;
  };
}

export interface CheckInData {
  google_place_id?: string;
  venue_id?: number;
  latitude: number;
  longitude: number;
}

export interface ProximityError {
  error_code: "TOO_FAR_FROM_VENUE";
  message: string;
  distance_meters: number;
}
