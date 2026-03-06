export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  if (process.client) {
    // Hydrate auth state from localStorage if store is empty (e.g. after HMR or page refresh)
    if (!authStore.token && !authStore.user) {
      authStore.hydrateFromStorage();
    }

    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      return navigateTo("/login");
    }
  }
});
