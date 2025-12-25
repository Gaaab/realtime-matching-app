export interface Match {
  id: number
  user_id: number
  matched_user_id: number
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  matched_at: string
  expires_at: string
  profile: MatchProfile
  compatibility_score?: number
  mutual_interests?: string[]
}

export interface MatchProfile {
  id: number
  user_id: number
  first_name: string
  age: number
  gender: string
  bio: string | null
  profile_picture_url: string | null
  photos: Array<{
    id: number
    url: string
    order: number
  }>
  location?: {
    city: string
    distance: number
  }
  interests?: Array<{
    id: number
    name: string
    category: string
  }>
  attributes?: Record<string, any>
}

export interface ProfileReveal {
  id: number
  revealer_user_id: number
  revealed_user_id: number
  reveal_type: 'full' | 'partial'
  revealed_at: string
  profile: MatchProfile
}

export interface MatchAction {
  user_id: number
  action: 'like' | 'pass' | 'super_like'
}

export interface MatchFilters {
  min_age?: number
  max_age?: number
  max_distance?: number
  gender?: string
  interests?: number[]
}

export interface CompatibilityScore {
  overall: number
  interests: number
  lifestyle: number
  values: number
  location: number
}
