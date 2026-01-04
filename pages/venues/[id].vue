<script setup lang="ts">
import type { Venue, VenueUser } from '~/types/venue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const venueId = computed(() => parseInt(route.params.id as string, 10))

const {
  getVenueById,
  getVenueUsers,
  revealProfile,
  checkOut
} = useVenues()

// State
const venue = ref<Venue | null>(null)
const users = ref<VenueUser[]>([])
const isLoadingVenue = ref(false)
const isLoadingUsers = ref(false)
const isCheckingOut = ref(false)
const error = ref<string | null>(null)
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)

// Computed
const checkedInCount = computed(() => users.value.length)

// Format distance
const formattedDistance = computed(() => {
  if (!venue.value?.distance) return ''
  const distanceKm = venue.value.distance / 1000
  if (distanceKm < 1) {
    return `${Math.round(venue.value.distance)}m from you`
  }
  return `${distanceKm.toFixed(1)}km from you`
})

// Format last updated time
const lastUpdated = ref('Updated just now')
let updateInterval: NodeJS.Timeout | null = null

// Load venue details
const loadVenue = async () => {
  try {
    isLoadingVenue.value = true
    error.value = null
    venue.value = await getVenueById(venueId.value)
  } catch (err: any) {
    console.error('Failed to load venue:', err)
    error.value = err.message || 'Failed to load venue'
    showToast('Failed to load venue details', 'error')
  } finally {
    isLoadingVenue.value = false
  }
}

// Load users at venue
const loadUsers = async () => {
  try {
    isLoadingUsers.value = true
    error.value = null
    users.value = await getVenueUsers(venueId.value)
    updateLastUpdatedTime()
  } catch (err: any) {
    console.error('Failed to load users:', err)
    error.value = err.message || 'Failed to load users'
    showToast('Failed to load checked-in users', 'error')
  } finally {
    isLoadingUsers.value = false
  }
}

// Handle reveal profile
const handleRevealProfile = async (userId: number) => {
  try {
    await revealProfile(userId, venueId.value)

    // Update the user's reveal status locally
    const userIndex = users.value.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      users.value[userIndex].is_revealed = true
      // Reload to get unblurred avatar
      await loadUsers()
    }

    showToast('Profile revealed! You can now see their full profile.')
  } catch (err: any) {
    console.error('Failed to reveal profile:', err)
    showToast(err.message || 'Failed to reveal profile', 'error')
  }
}

// Handle view profile
const handleViewProfile = (userId: number) => {
  router.push(`/profile/${userId}`)
}

// Handle check out
const handleCheckOut = async () => {
  try {
    isCheckingOut.value = true
    await checkOut(venueId.value)
    showToast('Checked out successfully')

    // Navigate back to venues list
    setTimeout(() => {
      router.push('/venues')
    }, 1000)
  } catch (err: any) {
    console.error('Failed to check out:', err)
    showToast(err.message || 'Failed to check out', 'error')
  } finally {
    isCheckingOut.value = false
  }
}

// Show toast notification
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { message, type }
  setTimeout(() => {
    toast.value = null
  }, 3000)
}

// Update "last updated" time
const updateLastUpdatedTime = () => {
  const now = Date.now()
  const checkInTime = users.value[0]?.checked_in_at
    ? new Date(users.value[0].checked_in_at).getTime()
    : now

  const diffMs = now - checkInTime
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) {
    lastUpdated.value = 'Updated just now'
  } else if (diffMins < 60) {
    lastUpdated.value = `Updated ${diffMins}m ago`
  } else {
    const diffHours = Math.floor(diffMins / 60)
    lastUpdated.value = `Updated ${diffHours}h ago`
  }
}

// Set up auto-refresh
const startAutoRefresh = () => {
  // Refresh users every 30 seconds
  updateInterval = setInterval(async () => {
    await loadUsers()
  }, 30000)

  // Update "last updated" time every minute
  setInterval(() => {
    updateLastUpdatedTime()
  }, 60000)
}

// Lifecycle
onMounted(async () => {
  await Promise.all([loadVenue(), loadUsers()])
  startAutoRefresh()
})

onBeforeUnmount(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-2xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Back button and venue info -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <button
              @click="router.back()"
              class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div v-if="venue" class="flex items-center gap-3 flex-1 min-w-0">
              <!-- Venue icon/image placeholder -->
              <div class="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0"></div>

              <div class="flex-1 min-w-0">
                <h1 class="text-base font-bold text-gray-900 truncate">
                  {{ venue.name }}
                </h1>
                <p v-if="formattedDistance" class="text-xs text-gray-500">
                  {{ formattedDistance }}
                </p>
              </div>
            </div>

            <!-- Loading skeleton -->
            <div v-else class="flex items-center gap-3 flex-1">
              <div class="w-10 h-10 rounded-lg bg-gray-200 animate-pulse"></div>
              <div class="flex-1">
                <div class="h-4 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
                <div class="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
          </div>

          <!-- Check Out button -->
          <button
            @click="handleCheckOut"
            :disabled="isCheckingOut"
            class="px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isCheckingOut ? 'Checking Out...' : 'Check Out' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-2xl mx-auto px-4 py-6">
      <!-- Check-in count header -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-1">
          {{ checkedInCount }} {{ checkedInCount === 1 ? 'person' : 'people' }} checked in
        </h2>
        <p class="text-sm text-gray-500">{{ lastUpdated }}</p>
      </div>

      <!-- Loading state -->
      <div v-if="isLoadingUsers && users.length === 0" class="space-y-4">
        <div
          v-for="i in 3"
          :key="`skeleton-${i}`"
          class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse"
        >
          <div class="flex flex-col items-center">
            <div class="w-24 h-24 rounded-full bg-gray-200 mb-3"></div>
            <div class="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div class="h-6 bg-gray-200 rounded-full w-32 mb-4"></div>
            <div class="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>

      <!-- Users list -->
      <div v-else-if="users.length > 0" class="space-y-4">
        <VenueUserCard
          v-for="venueUser in users"
          :key="venueUser.id"
          :user="venueUser"
          :venue-id="venueId"
          @reveal="handleRevealProfile"
          @view-profile="handleViewProfile"
        />
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-12">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No one here yet</h3>
        <p class="text-sm text-gray-500">Be the first to check in at this venue!</p>
      </div>

      <!-- Error state -->
      <div v-if="error && users.length === 0" class="text-center py-12">
        <svg class="w-16 h-16 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
        <p class="text-sm text-gray-500 mb-4">{{ error }}</p>
        <button
          @click="loadUsers"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="toast"
          :class="[
            'fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 max-w-sm',
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          ]"
          role="alert"
        >
          <!-- Success Icon -->
          <svg
            v-if="toast.type === 'success'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <!-- Error Icon -->
          <svg
            v-else
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span class="text-sm font-medium">{{ toast.message }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
