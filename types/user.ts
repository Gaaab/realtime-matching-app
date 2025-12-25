export interface User {
  id: number
  email?: string
  phone_number: string
  email_verified_at: string | null
  phone_number_verified_at: string | null
  created_at: string
  updated_at: string
  profile?: UserProfile
}

export interface UserProfile {
  id: number
  user_id: number
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'non-binary' | 'other'
  bio: string | null
  location: {
    city: string
    state: string
    country: string
    latitude: number
    longitude: number
  } | null
  profile_picture_url: string | null
  photos: ProfilePhoto[]
  attributes?: UserAttributes
  interests?: UserInterest[]
  preferences?: UserPreferences
  created_at: string
  updated_at: string
}

export interface ProfilePhoto {
  id: number
  url: string
  order: number
  created_at: string
}

export interface UserAttributes {
  height?: number
  body_type?: string
  ethnicity?: string
  religion?: string
  education?: string
  occupation?: string
  smoking?: 'never' | 'occasionally' | 'regularly'
  drinking?: 'never' | 'occasionally' | 'regularly'
  children?: 'none' | 'have' | 'want'
  relationship_status?: 'single' | 'divorced' | 'widowed'
}

export interface UserInterest {
  id: number
  name: string
  category: string
}

export interface UserPreferences {
  min_age: number
  max_age: number
  max_distance: number
  preferred_gender: string[]
  deal_breakers: string[]
}

export interface LoginCredentials {
  phone_number: string
}

export interface OTPVerification {
  phone_number: string
  code: string
}

export interface RegisterData {
  phone_number: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'non-binary' | 'other'
}

export interface AuthResponse {
  user: User
  token: string
}

export interface OTPResponse {
  success: boolean
  message: string
  verification_required: boolean
}
