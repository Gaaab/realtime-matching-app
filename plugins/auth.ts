export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()
  const profileStore = useProfileStore()

  // Only run on client side
  if (process.client) {
    try {
      // Hydrate auth from storage
      authStore.hydrateFromStorage()

      // If auth_user is populated, fetch full profile from /auth/profile
      if (authStore.user?.id) {
        try {
          await profileStore.fetchProfile()
        } catch (error) {
          console.error('Failed to fetch profile during initialization:', error)
          // Don't logout here - user might still be valid, just profile fetch failed
        }
      }
      // If we have a token but no user, fetch auth and profile
      else if (authStore.token && !authStore.user) {
        try {
          const { checkAuth } = useAuth()
          await checkAuth()
        } catch (error) {
          console.error('Failed to restore auth session:', error)
          authStore.logout()
        }
      }
    } finally {
      // Mark auth as initialized regardless of success/failure
      authStore.setInitialized(true)
    }
  }
})
