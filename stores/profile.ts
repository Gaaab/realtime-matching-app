import { defineStore } from 'pinia'
import type { User } from '~/types/user'

interface ProfileState {
  profile: User | null
  isLoading: boolean
  error: string | null
  lastFetchedAt: number | null
}

export const useProfileStore = defineStore('profile', {
  state: (): ProfileState => ({
    profile: null,
    isLoading: false,
    error: null,
    lastFetchedAt: null,
  }),

  getters: {
    userProfile: (state) => state.profile,
    userLocation: (state) => state.profile?.profile?.location || null,
    isProfileLoaded: (state) => state.profile !== null,
  },

  actions: {
    async fetchProfile() {
      this.isLoading = true
      this.error = null

      try {
        const api = useApi()
        const response = await api.get<User>('/auth/profile')

        if (response.success && response.data) {
          this.profile = response.data
          this.lastFetchedAt = Date.now()
          return response.data
        }

        throw new Error(response.message || 'Failed to fetch profile')
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch profile'
        this.error = errorMessage
        console.error('Fetch profile error:', err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    setProfile(profile: User | null) {
      this.profile = profile
      if (profile) {
        this.lastFetchedAt = Date.now()
      }
    },

    clearProfile() {
      this.profile = null
      this.lastFetchedAt = null
      this.error = null
    },

    clearError() {
      this.error = null
    },
  },
})
