export default defineNuxtPlugin((nuxtApp) => {
  const authStore = useAuthStore()

  // Hydrate auth state from localStorage on app initialization
  if (process.client) {
    authStore.hydrateFromStorage()
  }

  // Setup global error handler for API errors
  nuxtApp.hook('vue:error', (error: any) => {
    if (error?.http_status === 401) {
      // Unauthorized - clear auth and redirect to login
      authStore.logout()
      navigateTo('/login')
    }
  })

  return {
    provide: {
      api: useApi(),
    },
  }
})
