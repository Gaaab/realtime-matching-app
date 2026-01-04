import { useProfileStore } from '~/stores/profile'
import type { UserProfile, UserAttributes, UserInterest, UserPreferences } from '~/types/user'
import type { ProfilePreview } from '~/types/profile'

export const useProfile = () => {
  const api = useApi()
  const profileStore = useProfileStore()

  const fetchProfile = async () => {
    try {
      profileStore.setLoading(true)
      profileStore.setError(null)

      const response = await api.get<UserProfile>('/profile/user')

      if (response.success && response.data) {
        profileStore.setProfile(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch profile')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch profile'
      profileStore.setError(errorMessage)
      console.error('Fetch profile error:', error)
      throw error
    } finally {
      profileStore.setLoading(false)
    }
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      profileStore.setLoading(true)
      profileStore.setError(null)

      const response = await api.put<UserProfile>('/profile/user', data)

      if (response.success && response.data) {
        profileStore.setProfile(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to update profile')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update profile'
      profileStore.setError(errorMessage)
      console.error('Update profile error:', error)
      throw error
    } finally {
      profileStore.setLoading(false)
    }
  }

  const fetchAttributes = async () => {
    try {
      const response = await api.get<UserAttributes>('/profile/user/attributes')

      if (response.success && response.data) {
        profileStore.setAttributes(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch attributes')
    } catch (error: any) {
      console.error('Fetch attributes error:', error)
      throw error
    }
  }

  const updateAttributes = async (attributes: Partial<UserAttributes>) => {
    try {
      profileStore.setLoading(true)
      profileStore.setError(null)

      const response = await api.put<UserAttributes>('/profile/user/attributes', attributes)

      if (response.success && response.data) {
        profileStore.setAttributes(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to update attributes')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update attributes'
      profileStore.setError(errorMessage)
      console.error('Update attributes error:', error)
      throw error
    } finally {
      profileStore.setLoading(false)
    }
  }

  const fetchInterests = async () => {
    try {
      const response = await api.get<UserInterest[]>('/profile/user/interests')

      if (response.success && response.data) {
        profileStore.setInterests(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch interests')
    } catch (error: any) {
      console.error('Fetch interests error:', error)
      throw error
    }
  }

  const updateInterests = async (interestIds: number[]) => {
    try {
      profileStore.setLoading(true)
      profileStore.setError(null)

      const response = await api.post<UserInterest[]>('/profile/user/interests', {
        interest_ids: interestIds,
      })

      if (response.success && response.data) {
        profileStore.setInterests(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to update interests')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update interests'
      profileStore.setError(errorMessage)
      console.error('Update interests error:', error)
      throw error
    } finally {
      profileStore.setLoading(false)
    }
  }

  const fetchPreferences = async () => {
    try {
      const response = await api.get<UserPreferences>('/profile/user/preferences')

      if (response.success && response.data) {
        profileStore.setPreferences(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch preferences')
    } catch (error: any) {
      console.error('Fetch preferences error:', error)
      throw error
    }
  }

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    try {
      profileStore.setLoading(true)
      profileStore.setError(null)

      const response = await api.put<UserPreferences>('/profile/user/preferences', preferences)

      if (response.success && response.data) {
        profileStore.setPreferences(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to update preferences')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update preferences'
      profileStore.setError(errorMessage)
      console.error('Update preferences error:', error)
      throw error
    } finally {
      profileStore.setLoading(false)
    }
  }

  const uploadPhoto = async (file: File, order?: number) => {
    try {
      profileStore.setLoading(true)
      profileStore.setError(null)

      const additionalData = order !== undefined ? { order } : undefined
      const response = await api.uploadFile('/media', file, additionalData)

      if (response.success && response.data) {
        profileStore.addPhoto(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to upload photo')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload photo'
      profileStore.setError(errorMessage)
      console.error('Upload photo error:', error)
      throw error
    } finally {
      profileStore.setLoading(false)
    }
  }

  const deletePhoto = async (photoId: number) => {
    try {
      profileStore.setLoading(true)
      profileStore.setError(null)

      const response = await api.delete(`/media/${photoId}`)

      if (response.success) {
        profileStore.removePhoto(photoId)
        return true
      }

      throw new Error(response.message || 'Failed to delete photo')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete photo'
      profileStore.setError(errorMessage)
      console.error('Delete photo error:', error)
      throw error
    } finally {
      profileStore.setLoading(false)
    }
  }

  const setProfilePicture = async (photoId: number) => {
    try {
      profileStore.setLoading(true)
      profileStore.setError(null)

      const response = await api.post('/profile/user/profile-picture', { photo_id: photoId })

      if (response.success && response.data) {
        profileStore.updateProfilePicture(response.data.profile_picture_url)
        return response.data
      }

      throw new Error(response.message || 'Failed to set profile picture')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to set profile picture'
      profileStore.setError(errorMessage)
      console.error('Set profile picture error:', error)
      throw error
    } finally {
      profileStore.setLoading(false)
    }
  }

  // Profile Preview Methods (for viewing other users' profiles)
  const fetchUserProfile = async (userId: number) => {
    try {
      const response = await api.get<ProfilePreview>(`/profile/users/${userId}/preview`)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch user profile')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch user profile'
      console.error('Fetch user profile error:', error)
      throw error
    }
  }

  const revealProfile = async (userId: number) => {
    try {
      const response = await api.post(`/profile/users/${userId}/reveal`)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to reveal profile')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reveal profile'
      console.error('Reveal profile error:', error)
      throw error
    }
  }

  return {
    // Own profile methods
    fetchProfile,
    updateProfile,
    fetchAttributes,
    updateAttributes,
    fetchInterests,
    updateInterests,
    fetchPreferences,
    updatePreferences,
    uploadPhoto,
    deletePhoto,
    setProfilePicture,
    // Other users' profile methods
    fetchUserProfile,
    revealProfile,
    // Own profile state
    profile: computed(() => profileStore.profile),
    attributes: computed(() => profileStore.attributes),
    interests: computed(() => profileStore.interests),
    preferences: computed(() => profileStore.preferences),
    loading: computed(() => profileStore.loading),
    error: computed(() => profileStore.error),
    fullName: computed(() => profileStore.fullName),
    age: computed(() => profileStore.age),
    profileCompleteness: computed(() => profileStore.profileCompleteness),
  }
}
