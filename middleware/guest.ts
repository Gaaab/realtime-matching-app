export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // Initialize auth state from storage on first load
  if (process.client && !authStore.token && !authStore.user) {
    authStore.hydrateFromStorage()
  }

  // If user is authenticated, redirect to home
  if (authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
