// Profile Preview Types for viewing other users' profiles

export interface ProfileAttributeKey {
  id: number
  key: string
  label: string
  data_type: string
  options: any[] | null
}

export interface ProfileAttribute {
  id: number
  attribute_key_id: number
  value: any  // Parsed value
  raw_value: string
  numeric_value: number | null
  is_visible_on_profile: boolean
  attribute_key: ProfileAttributeKey
}

export interface ProfileInterestDetail {
  id: number
  name: string
  category: string | null
}

export interface ProfileInterest {
  id: number
  interest_id: number
  interest: ProfileInterestDetail
}

export interface AccessContext {
  type: 'match' | 'venue' | null
  is_revealed: boolean
}

export interface ProfilePreview {
  id: number
  first_name: string
  last_name: string
  full_name: string
  birthdate: string  // ISO date
  age: number
  gender: string
  description: string | null
  ethnicity: string | null
  location_city: string | null
  location_state: string | null
  avatar_url: string | null  // Automatically blurred or unblurred from backend
  is_premium: boolean
  last_active_at: string | null  // ISO timestamp
  attributes: ProfileAttribute[]
  interests: ProfileInterest[]
  access_context: AccessContext
}

// Helper type for calculating similarities
export interface ProfileSimilarities {
  shared_attributes: number
  shared_interests: number
  total: number
}
