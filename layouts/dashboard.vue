<script setup lang="ts">
const { activeToast, dismissToast } = useNotifications()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Main Content Area -->
    <!-- pb-20 accounts for bottom navigation height (h-16 + safe area) -->
    <main class="pb-20">
      <slot />
    </main>

    <!-- Bottom Navigation -->
    <BottomNavigation />

    <!-- Global Toast Notification -->
    <UiToast :notification="activeToast" @dismiss="dismissToast" />
  </div>
</template>

<style scoped>
/* Ensure content doesn't get hidden behind bottom nav on notched devices */
main {
  padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
}
</style>
