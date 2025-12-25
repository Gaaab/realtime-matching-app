import { useAuthStore } from '~/stores/auth'
import type { LoginCredentials, RegisterData, AuthResponse, User } from '~/types/user'

export const useAuth = () => {
  const api = useApi()
  const authStore = useAuthStore()
  const router = useRouter()

  const login = async (credentials: LoginCredentials) => {
    try {
      authStore.setLoading(true)
      const profileStore = useProfileStore()
      const response = await api.post<AuthResponse>('/auth/login', credentials, false)

      if (response.success && response.data) {
        authStore.setToken(response.data.token)
        authStore.setUser(response.data.user)
        authStore.persistToStorage()

        // Immediately fetch full profile after login to get location and other details
        try {
          const profileData = await fetchProfile()
          return {
            success: true,
            user: profileData,
            message: response.message,
          }
        } catch (profileError) {
          console.warn('Profile fetch after login failed, using initial user data:', profileError)
          return {
            success: true,
            user: response.data.user,
            message: response.message,
          }
        }
      }

      throw new Error(response.message || 'Login failed')
    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      authStore.setLoading(true)
      const profileStore = useProfileStore()
      const response = await api.post<AuthResponse>('/auth/register', data, false)

      if (response.success && response.data) {
        authStore.setToken(response.data.token)
        authStore.setUser(response.data.user)
        authStore.persistToStorage()

        // Immediately fetch full profile after registration to get location and other details
        try {
          const profileData = await fetchProfile()
          return {
            success: true,
            user: profileData,
            message: response.message,
          }
        } catch (profileError) {
          console.warn('Profile fetch after registration failed, using initial user data:', profileError)
          return {
            success: true,
            user: response.data.user,
            message: response.message,
          }
        }
      }

      throw new Error(response.message || 'Registration failed')
    } catch (error: any) {
      console.error('Registration error:', error)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      const profileStore = useProfileStore()
      authStore.logout()
      profileStore.clearProfile()
      if (process.client) {
        localStorage.removeItem('auth_user')
      }
      await router.push('/login')
    }
  }

  const fetchProfile = async () => {
    try {
      const profileStore = useProfileStore()
      const response = await api.get<User>('/auth/profile')

      if (response.success && response.data) {
        authStore.setUser(response.data)
        profileStore.setProfile(response.data)
        authStore.persistToStorage()
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch profile')
    } catch (error: any) {
      console.error('Fetch profile error:', error)
      if (error.http_status === 401) {
        authStore.logout()
      }
      throw error
    }
  }

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const profileStore = useProfileStore()
      const response = await api.put<User>('/auth/profile', profileData)

      if (response.success && response.data) {
        authStore.setUser(response.data)
        profileStore.setProfile(response.data)
        authStore.persistToStorage()
        return response.data
      }

      throw new Error(response.message || 'Failed to update profile')
    } catch (error: any) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  const checkAuth = async () => {
    if (!authStore.token) {
      return false
    }

    try {
      await fetchProfile()
      return true
    } catch (error) {
      authStore.logout()
      return false
    }
  }

  // Get stored user location from profile if available
  const getUserStoredLocation = () => {
    const user = authStore.currentUser
    if (!user || !user.profile || !user.profile.location) {
      return null
    }

    const { latitude, longitude } = user.profile.location
    if (latitude && longitude) {
      return {
        latitude,
        longitude,
      }
    }

    return null
  }

  return {
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    checkAuth,
    getUserStoredLocation,
    user: computed(() => authStore.currentUser),
    isAuthenticated: computed(() => authStore.isLoggedIn),
    loading: computed(() => authStore.loading),
  }
}
