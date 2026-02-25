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

// Current photo index for gallery
const currentPhotoIndex = ref(0)

const isCheckingIn = computed(() => venuesStore.isCheckingIn)
const isLoadingUsers = computed(() => venuesStore.isLoadingUsers)
const nearbyUsers = computed(() => venuesStore.nearbyUsers)
const isCheckedIn = computed(() => venuesStore.isCheckedIn)
const isCheckedInHere = computed(() => {
  return venuesStore.checkedInVenueId === props.venue?.id
})

// Active user count from venue data
const activeUserCount = computed(() => {
  return (props.venue as any)?.active_user_count || 0
})

// Reset photo index when venue changes
watch(() => props.venue, () => {
  currentPhotoIndex.value = 0
})

const handleCheckIn = async () => {
  if (!props.venue) return

  try {
    venuesStore.clearError()
    await venuesStore.checkInToVenue(props.venue)
  } catch (err) {
    console.error('Check-in failed:', err)
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

// Photo navigation
const nextPhoto = () => {
  if (props.venue?.photos && currentPhotoIndex.value < props.venue.photos.length - 1) {
    currentPhotoIndex.value++
  }
}

const prevPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
  }
}

// Format distance
const formatDistance = (distance?: number) => {
  if (!distance) return ''
  if (distance < 1000) return `${Math.round(distance)}m away`
  return `${(distance / 1000).toFixed(1)}km away`
}

// Format rating
const formatRating = (rating?: number) => {
  if (!rating) return 'No rating'
  return `${rating.toFixed(1)} / 5`
}

// Get price level indicators
const getPriceLevel = (level?: number) => {
  if (!level) return ''
  return '$'.repeat(level)
}

// Get current day's hours
const getTodayHours = computed(() => {
  if (!props.venue?.hours) return null

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const today = days[new Date().getDay()]
  return (props.venue.hours as any)[today] || null
})

// Open Google Maps directions
const openDirections = () => {
  if (!props.venue) return
  const url = `https://www.google.com/maps/dir/?api=1&destination=${props.venue.latitude},${props.venue.longitude}&destination_place_id=${props.venue.google_place_id}`
  window.open(url, '_blank')
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="md:translate-x-full translate-y-full opacity-0"
    enter-to-class="translate-x-0 translate-y-0 opacity-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="translate-x-0 translate-y-0 opacity-100"
    leave-to-class="md:translate-x-full translate-y-full opacity-0"
  >
    <div
      v-if="isOpen && venue"
      class="fixed bottom-0 md:top-0 md:bottom-auto right-0 md:h-full h-[85vh] w-full md:w-[400px] bg-white shadow-2xl z-50 overflow-y-auto rounded-t-3xl md:rounded-none"
    >
      <!-- Mobile Drag Handle -->
      <div class="md:hidden flex justify-center pt-3 pb-1">
        <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <h2 class="text-xl font-bold text-gray-900">Venue Details</h2>
        <button
          @click="handleClose"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Venue Image Gallery -->
      <div v-if="venue.photos && venue.photos.length > 0" class="relative h-56 bg-gray-200 group">
        <img
          :src="venue.photos[currentPhotoIndex]"
          :alt="venue.name"
          class="w-full h-full object-cover transition-opacity duration-300"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />

        <!-- Photo Navigation -->
        <div v-if="venue.photos.length > 1" class="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click.stop="prevPhoto"
            :disabled="currentPhotoIndex === 0"
            class="p-2 bg-black/50 text-white rounded-full disabled:opacity-30 hover:bg-black/70 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            @click.stop="nextPhoto"
            :disabled="currentPhotoIndex === venue.photos.length - 1"
            class="p-2 bg-black/50 text-white rounded-full disabled:opacity-30 hover:bg-black/70 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Photo Indicators -->
        <div v-if="venue.photos.length > 1" class="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          <button
            v-for="(_, index) in venue.photos"
            :key="index"
            @click.stop="currentPhotoIndex = index"
            :class="[
              'w-2 h-2 rounded-full transition-all',
              index === currentPhotoIndex ? 'bg-white w-4' : 'bg-white/60 hover:bg-white/80'
            ]"
          />
        </div>

        <!-- Active Users Overlay Badge -->
        <div v-if="activeUserCount > 0" class="absolute top-3 right-3">
          <div class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-full shadow-lg">
            <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span class="text-sm font-semibold">{{ activeUserCount }} here now</span>
          </div>
        </div>
      </div>
      <div v-else class="relative h-56 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        <svg class="w-20 h-20 text-white opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>

        <!-- Active Users Overlay Badge -->
        <div v-if="activeUserCount > 0" class="absolute top-3 right-3">
          <div class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-full shadow-lg">
            <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span class="text-sm font-semibold">{{ activeUserCount }} here now</span>
          </div>
        </div>
      </div>

      <!-- Venue Info -->
      <div class="px-6 py-6">
        <h3 class="text-2xl font-bold text-gray-900 mb-2">{{ venue.name }}</h3>

        <!-- Category, Rating & Price -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <UiBadge v-if="venue.category" variant="primary">{{ venue.category }}</UiBadge>

          <!-- Star Rating -->
          <div v-if="venue.rating" class="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-lg">
            <div class="flex items-center">
              <template v-for="i in 5" :key="i">
                <svg
                  class="w-4 h-4"
                  :class="i <= Math.round(venue.rating) ? 'text-yellow-400' : 'text-gray-300'"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </template>
            </div>
            <span class="text-sm font-medium text-yellow-700 ml-1">{{ formatRating(venue.rating) }}</span>
          </div>

          <span v-if="venue.price_level" class="text-sm font-medium text-gray-600 px-2 py-1 bg-gray-100 rounded-lg">
            {{ getPriceLevel(venue.price_level) }}
          </span>
        </div>

        <!-- Quick Info Grid -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <!-- Address Card -->
          <div class="col-span-2 p-3 bg-gray-50 rounded-xl">
            <div class="flex items-start gap-3">
              <div class="p-2 bg-white rounded-lg shadow-sm">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">{{ venue.address }}</p>
                <p class="text-sm text-gray-500">{{ venue.city }}, {{ venue.state }} {{ venue.postal_code }}</p>
                <p v-if="venue.distance" class="text-sm text-primary-600 font-medium mt-1">
                  {{ formatDistance(venue.distance) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Hours Card -->
          <div v-if="getTodayHours" class="p-3 bg-gray-50 rounded-xl">
            <div class="flex items-center gap-2 mb-1">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-xs font-medium text-gray-500 uppercase">Today</span>
            </div>
            <p class="text-sm font-medium text-gray-900">{{ getTodayHours }}</p>
          </div>

          <!-- Distance Card -->
          <div v-if="venue.distance" class="p-3 bg-gray-50 rounded-xl">
            <div class="flex items-center gap-2 mb-1">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span class="text-xs font-medium text-gray-500 uppercase">Distance</span>
            </div>
            <p class="text-sm font-medium text-gray-900">{{ formatDistance(venue.distance) }}</p>
          </div>
        </div>

        <!-- Action Buttons Row -->
        <div class="flex gap-2 mb-4">
          <!-- Directions Button -->
          <button
            @click="openDirections"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Directions
          </button>

          <!-- Phone Button -->
          <a
            v-if="venue.phone"
            :href="`tel:${venue.phone}`"
            class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call
          </a>

          <!-- Website Button -->
          <a
            v-if="venue.website"
            :href="venue.website"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Web
          </a>
        </div>

        <!-- Active Users Count (Before Check-in) -->
        <div v-if="!isCheckedInHere && nearbyUsers.length > 0" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-sm text-blue-900 font-semibold mb-1">People Already Here</p>
          <p class="text-lg font-bold text-blue-600">{{ nearbyUsers.length }} {{ nearbyUsers.length === 1 ? 'person' : 'people' }}</p>
        </div>

        <!-- Check-in Button -->
        <div class="mb-6">
          <UiButton
            v-if="!isCheckedInHere"
            @click="handleCheckIn"
            :loading="isCheckingIn"
            :disabled="isCheckedIn && !isCheckedInHere"
            fullWidth
            size="lg"
          >
            {{ isCheckedIn ? 'Already Checked In' : 'Check In Here' }}
          </UiButton>
          <UiButton
            v-else
            @click="handleCheckOut"
            variant="danger"
            fullWidth
            size="lg"
          >
            Check Out
          </UiButton>
        </div>

        <!-- Error Message -->
        <div v-if="venuesStore.error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ venuesStore.error }}</p>
        </div>

        <!-- Active Users Section -->
        <div v-if="isCheckedInHere" class="border-t border-gray-200 pt-6">
          <!-- People Already Here State -->
          <div v-if="nearbyUsers.length > 0" class="mb-4">
            <h4 class="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
              <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              {{ nearbyUsers.length }} {{ nearbyUsers.length === 1 ? 'Person' : 'People' }} Checked In Here
            </h4>

            <!-- Privacy Notice -->
            <div class="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p class="text-sm font-semibold text-purple-900 mb-1">Privacy Protected</p>
                  <p class="text-xs text-purple-700">
                    Profiles are blurred for privacy. Send a reveal request to see their full profile. They'll be notified and can choose to accept.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoadingUsers" class="space-y-3">
            <div v-for="i in 3" :key="i" class="animate-pulse">
              <div class="flex items-center gap-3 p-3 bg-gray-100 rounded-xl">
                <div class="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div class="flex-1">
                  <div class="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div class="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Users List -->
          <div v-else-if="nearbyUsers.length > 0" class="space-y-3">
            <VenueUserCard
              v-for="user in nearbyUsers"
              :key="user.id"
              :user="user"
            />
          </div>

          <!-- Empty State: Nobody Checked In Yet -->
          <div v-else class="text-center py-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div class="mb-4">
              <svg class="w-16 h-16 mx-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5-4a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p class="text-gray-700 font-semibold mb-2">Nobody's Checked In Yet</p>
            <p class="text-sm text-gray-600">Be the first and open the door for new connections</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      @click="handleClose"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
    />
  </Transition>
</template>
