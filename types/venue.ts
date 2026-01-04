export interface Venue {
  id: number
  name: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  // Support both flat and nested location formats
  latitude?: number
  longitude?: number
  location?: {
    latitude: number
    longitude: number
  }
  google_place_id: string
  category: string
  subcategory?: string
  rating?: number
  price_level?: number
  phone?: string
  website?: string
  hours?: VenueHours
  photos?: string[]
  distance?: number
  created_at: string
  updated_at: string
}

export interface VenueHours {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}

export interface VenueSearchParams {
  location?: string
  latitude?: number
  longitude?: number
  radius?: number
  category?: string
  min_rating?: number
  price_level?: number
  limit?: number
}

export interface VenueCheckIn {
  id: number
  user_id: number
  venue_id: number
  checked_in_at: string
  checked_out_at: string | null
  venue: Venue
  is_active: boolean
}

export interface NearbyUser {
  id: number
  user_id: number
  first_name: string
  age: number
  profile_picture_url: string | null
  distance: number
  venue?: {
    id: number
    name: string
  }
  checked_in_at: string
  is_revealed: boolean
}

export interface CheckInData {
  venue_id: number
  google_place_id: string
  latitude?: number
  longitude?: number
}

export interface VenueUser {
  id: number
  first_name: string
  age: number
  gender: string
  avatar_url: string | null
  checked_in_at: string
  has_match: boolean
  is_revealed: boolean
  similarities_count: number
  additional_similarities_count: number
  lifestyle_attributes: LifestyleAttribute[]
  interests: Interest[]
}

export interface LifestyleAttribute {
  key: string
  label: string
  value: any
}

export interface Interest {
  id: number
  name: string
  category: string | null
}
