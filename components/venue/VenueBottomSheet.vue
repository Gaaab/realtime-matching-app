<script setup lang="ts">
import { useVenuesStore } from '~/stores/venues'
import type { Venue } from '~/types/venue'

const props = defineProps<{
  venue: Venue | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const venuesStore = useVenuesStore()

// Reactive states from store
const isCheckingIn = computed(() => venuesStore.isCheckingIn)
const isLoadingUsers = computed(() => venuesStore.isLoadingUsers)
const nearbyUsers = computed(() => venuesStore.nearbyUsers)
const isCheckedIn = computed(() => venuesStore.isCheckedIn)
const isCheckedInHere = computed(() => {
  return venuesStore.checkedInVenueId === props.venue?.id
})
const activeUserCount = computed(() => {
  if (!props.venue) return 0
  return (props.venue as any).active_user_count || 0
})

// Bottom sheet drag handling
const sheetRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startY = ref(0)
const currentY = ref(0)
const sheetHeight = ref(0)

// Track if sheet has been dragged down enough to close
const shouldClose = computed(() => {
  if (!isDragging.value) return false
  const dragDistance = currentY.value - startY.value
  return dragDistance > 100 // Close if dragged down more than 100px
})

const handleTouchStart = (e: TouchEvent) => {
  isDragging.value = true
  startY.value = e.touches[0].clientY
  currentY.value = e.touches[0].clientY
  if (sheetRef.value) {
    sheetHeight.value = sheetRef.value.offsetHeight
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  currentY.value = e.touches[0].clientY
}

const handleTouchEnd = () => {
  if (shouldClose.value) {
    handleClose()
  }
  isDragging.value = false
  startY.value = 0
  currentY.value = 0
}

const dragOffset = computed(() => {
  if (!isDragging.value) return 0
  const offset = currentY.value - startY.value
  return Math.max(0, offset) // Only allow dragging down
})

// Check-in handlers
const handleCheckIn = async () => {
  if (!props.venue) return

  try {
    venuesStore.clearError()
    await venuesStore.checkInToVenue(props.venue)
  } catch (err) {
    console.error('Check-in failed:', err)
    // Error is handled by the store and displayed via venuesStore.error
  }
}

const handleCheckOut = async () => {
  try {
    await venuesStore.checkOutFromVenue()
  } catch (err) {
    console.error('Check-out failed:', err)
  }
}

const handleClose = () => {
  emit('close')
}

// Format helpers
const formatDistance = (distance?: number) => {
  if (!distance) return ''
  if (distance < 1000) return `${Math.round(distance)}m away`
  return `${(distance / 1000).toFixed(1)}km away`
}

const formatRating = (rating?: number) => {
  if (!rating) return 'No rating'
  return `${rating.toFixed(1)}`
}

const getPriceLevel = (level?: number) => {
  if (!level) return ''
  return '$'.repeat(level)
}

// Prevent body scroll when sheet is open
watch(() => props.isOpen, (isOpen) => {
  if (typeof document !== 'undefined') {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// Cleanup on unmount
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        @click="handleClose"
      />
    </Transition>

    <!-- Bottom Sheet (Mobile) / Modal (Desktop) -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-y-full md:translate-y-0 md:opacity-0 md:scale-95"
      enter-to-class="translate-y-0 md:opacity-100 md:scale-100"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-y-0 md:opacity-100 md:scale-100"
      leave-to-class="translate-y-full md:translate-y-0 md:opacity-0 md:scale-95"
    >
      <div
        v-if="isOpen && venue"
        ref="sheetRef"
        :style="{ transform: `translateY(${dragOffset}px)` }"
        class="fixed z-50 bg-white shadow-2xl overflow-hidden
               bottom-0 left-0 right-0 max-h-[90vh] rounded-t-3xl
               md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
               md:max-w-lg md:w-full md:max-h-[85vh] md:rounded-2xl md:mx-4"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Drag Handle (Mobile only) -->
        <div class="md:hidden flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
          <div
            class="w-12 h-1.5 bg-gray-300 rounded-full transition-colors"
            :class="{ 'bg-gray-400': isDragging }"
          />
        </div>

        <!-- Header -->
        <div class="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between z-10">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full" :class="activeUserCount > 0 ? 'bg-green-500' : 'bg-gray-300'" />
            <span class="text-sm font-medium text-gray-600">
              {{ activeUserCount > 0 ? `${activeUserCount} here now` : 'No one here yet' }}
            </span>
          </div>
          <button
            @click="handleClose"
            class="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="overflow-y-auto max-h-[calc(90vh-60px)] md:max-h-[calc(85vh-60px)]">
          <!-- Venue Image -->
          <div class="relative h-40 md:h-48 bg-gray-100">
            <img
              v-if="venue.photos && venue.photos.length > 0"
              :src="venue.photos[0]"
              :alt="venue.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <svg class="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <!-- Venue Info -->
          <div class="px-5 py-5">
            <!-- Name & Category -->
            <h2 class="text-xl font-bold text-gray-900 mb-2">{{ venue.name }}</h2>

            <div class="flex flex-wrap items-center gap-2 mb-4">
              <UiBadge v-if="venue.category" variant="primary" size="sm">
                {{ venue.category }}
              </UiBadge>
              <div v-if="venue.rating" class="flex items-center gap-1 text-sm">
                <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="font-medium text-gray-700">{{ formatRating(venue.rating) }}</span>
              </div>
              <span v-if="venue.price_level" class="text-sm font-medium text-gray-500">
                {{ getPriceLevel(venue.price_level) }}
              </span>
            </div>

            <!-- Address -->
            <div class="flex items-start gap-3 mb-4 text-sm">
              <svg class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <div>
                <p class="text-gray-700">{{ venue.address }}</p>
                <p class="text-gray-500">{{ venue.city }}, {{ venue.state }} {{ venue.postal_code }}</p>
                <p v-if="venue.distance" class="text-primary-600 font-medium mt-1">
                  {{ formatDistance(venue.distance) }}
                </p>
              </div>
            </div>

            <!-- Contact Info -->
            <div v-if="venue.phone || venue.website" class="flex flex-wrap gap-3 mb-5">
              <a
                v-if="venue.phone"
                :href="`tel:${venue.phone}`"
                class="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call
              </a>
              <a
                v-if="venue.website"
                :href="venue.website"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Website
              </a>
            </div>

            <!-- Error Message -->
            <div v-if="venuesStore.error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p class="text-sm text-red-600">{{ venuesStore.error }}</p>
            </div>

            <!-- Check-in Section -->
            <div class="border-t border-gray-100 pt-5">
              <!-- Not Checked In State -->
              <template v-if="!isCheckedInHere">
                <!-- Show count of people here before check-in -->
                <div v-if="activeUserCount > 0" class="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                  <div class="flex items-center gap-3">
                    <div class="flex -space-x-2">
                      <div
                        v-for="i in Math.min(activeUserCount, 3)"
                        :key="i"
                        class="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
                      >
                        <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                        </svg>
                      </div>
                      <div
                        v-if="activeUserCount > 3"
                        class="w-8 h-8 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-primary-600"
                      >
                        +{{ activeUserCount - 3 }}
                      </div>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">{{ activeUserCount }} {{ activeUserCount === 1 ? 'person' : 'people' }} here</p>
                      <p class="text-sm text-gray-600">Check in to see who's around</p>
                    </div>
                  </div>
                </div>

                <!-- Check-in Button -->
                <UiButton
                  @click="handleCheckIn"
                  :loading="isCheckingIn"
                  :disabled="isCheckedIn && !isCheckedInHere"
                  fullWidth
                  size="lg"
                  class="shadow-lg shadow-primary-500/25"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {{ isCheckedIn ? 'Checked in elsewhere' : 'Check In Here' }}
                </UiButton>

                <p v-if="isCheckedIn && !isCheckedInHere" class="text-center text-sm text-gray-500 mt-2">
                  You need to check out from your current venue first
                </p>
              </template>

              <!-- Checked In State -->
              <template v-else>
                <!-- Checked-in Badge -->
                <div class="flex items-center justify-between mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span class="font-semibold text-green-800">You're checked in!</span>
                  </div>
                  <UiButton
                    @click="handleCheckOut"
                    variant="ghost"
                    size="sm"
                    class="text-red-600 hover:bg-red-50"
                  >
                    Check Out
                  </UiButton>
                </div>

                <!-- Users Section -->
                <div class="mt-4">
                  <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    People Here
                  </h3>

                  <!-- Loading State -->
                  <div v-if="isLoadingUsers" class="space-y-3">
                    <div v-for="i in 3" :key="i" class="animate-pulse">
                      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div class="w-12 h-12 bg-gray-200 rounded-full" />
                        <div class="flex-1">
                          <div class="h-4 bg-gray-200 rounded w-24 mb-2" />
                          <div class="h-3 bg-gray-200 rounded w-16" />
                        </div>
                        <div class="w-20 h-8 bg-gray-200 rounded-lg" />
                      </div>
                    </div>
                  </div>

                  <!-- Users List with Blurred Avatars -->
                  <div v-else-if="nearbyUsers.length > 0" class="space-y-3">
                    <VenueCheckedInUserCard
                      v-for="user in nearbyUsers"
                      :key="user.id"
                      :user="user"
                    />
                  </div>

                  <!-- Empty State -->
                  <div v-else class="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <div class="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p class="font-semibold text-gray-700 mb-1">You're the first one here!</p>
                    <p class="text-sm text-gray-500">Others will see you when they check in</p>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Smooth transitions for drag handling */
.transition-transform {
  transition-property: transform;
}

/* Prevent text selection during drag */
[ref="sheetRef"] {
  user-select: none;
  -webkit-user-select: none;
}
</style>
