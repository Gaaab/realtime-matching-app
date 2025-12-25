export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  if (process.client) {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      return navigateTo('/login')
    }
  }
})
