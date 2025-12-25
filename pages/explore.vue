<script setup lang="ts">
import { useVenuesStore } from '~/stores/venues'
import type { Venue } from '~/types/venue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const venuesStore = useVenuesStore()

// Venue panel state
const selectedVenue = ref<Venue | null>(null)
const isPanelOpen = ref(false)

const handleVenueClick = (venue: Venue) => {
  selectedVenue.value = venue
  isPanelOpen.value = true
}

const closeVenuePanel = () => {
  isPanelOpen.value = false
  // Delay clearing selected venue to allow exit animation
  setTimeout(() => {
    selectedVenue.value = null
  }, 300)
}

// Watch for changes to selected venue from store
watch(() => venuesStore.selectedVenue, (venue) => {
  if (venue && !isPanelOpen.value) {
    selectedVenue.value = venue
    isPanelOpen.value = true
  }
})

// Calculate map height to fill available space
// Account for bottom navigation (64px + safe area)
const mapHeight = computed(() => {
  return 'calc(100vh - 64px - env(safe-area-inset-bottom, 0px))'
})
</script>

<template>
  <div class="relative w-full h-full">
    <!-- Full-screen Map -->
    <VenueMap
      :height="mapHeight"
      :full-screen="true"
      @venue-click="handleVenueClick"
    />

    <!-- Venue Detail Panel -->
    <VenueDetailPanel
      :venue="selectedVenue"
      :is-open="isPanelOpen"
      @close="closeVenuePanel"
    />
  </div>
</template>

<style scoped>
/* Ensure the explore page takes full available height */
div {
  min-height: calc(100vh - 64px - env(safe-area-inset-bottom, 0px));
}
</style>
