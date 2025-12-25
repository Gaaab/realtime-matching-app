import { defineStore } from 'pinia'
import type { User } from '~/types/user'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  initialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    initialized: false,
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated && state.user !== null,
    userProfile: (state) => state.user?.profile,
    userId: (state) => state.user?.id,
  },

  actions: {
    setUser(user: User | null) {
      this.user = user
      this.isAuthenticated = user !== null
    },

    setToken(token: string | null) {
      this.token = token
      if (token) {
        const api = useApi()
        api.setAuthToken(token)
      }
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setInitialized(initialized: boolean) {
      this.initialized = initialized
    },

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      const api = useApi()
      api.removeAuthToken()
    },

    hydrateFromStorage() {
      if (process.client) {
        const token = localStorage.getItem('auth_token')
        const userStr = localStorage.getItem('auth_user')

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr)
            this.setToken(token)
            this.setUser(user)
          } catch (error) {
            console.error('Failed to parse stored user data:', error)
            this.logout()
          }
        }
      }
    },

    persistToStorage() {
      if (process.client) {
        if (this.token) {
          localStorage.setItem('auth_token', this.token)
        } else {
          localStorage.removeItem('auth_token')
        }

        if (this.user) {
          localStorage.setItem('auth_user', JSON.stringify(this.user))
        } else {
          localStorage.removeItem('auth_user')
        }
      }
    },
  },
})
