<script setup lang="ts">
/**
 * CheckedInUserCard Component
 *
 * Displays a checked-in user with a blurred avatar and reveal request functionality.
 * Used within the VenueBottomSheet to show other users at the same venue.
 */

import type { NearbyUser } from '~/types/venue'

const props = defineProps<{
  user: NearbyUser
}>()

const { sendReveal, isLoading: isSendingReveal } = useMatches()

// Local state
const revealRequested = ref(false)
const error = ref<string | null>(null)
const isExpanded = ref(false)

// Use API's is_revealed field, fall back to local state for optimistic UI
const isRevealed = computed(() => {
  return props.user.is_revealed === true
})

const hasRevealPending = computed(() => {
  return revealRequested.value || props.user.reveal_direction === 'sent'
})

const handleRequestReveal = async () => {
  try {
    error.value = null
    const userId = props.user.id
    await sendReveal(userId, props.user.venue?.id)
    revealRequested.value = true
  } catch (err) {
    console.error('Failed to request reveal:', err)
    error.value = err instanceof Error ? err.message : 'Failed to send request'
  }
}

// Format time since check-in
const formatCheckedInTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just arrived'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

// Toggle expanded view
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div
    class="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md"
    :class="{ 'ring-2 ring-primary-500 ring-offset-2': isExpanded }"
  >
    <!-- Main Card Content -->
    <div
      class="flex items-center gap-3 p-3 cursor-pointer"
      @click="toggleExpanded"
    >
      <!-- Blurred Avatar -->
      <div class="flex-shrink-0">
        <UiBlurredAvatar
          :src="user.avatar_url || user.avatar || user.profile_picture_url"
          :name="user.first_name"
          :blurred="!isRevealed"
          size="md"
          @click.stop="handleRequestReveal"
        />
      </div>

      <!-- User Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h5 class="font-semibold text-gray-900 truncate">
            {{ user.first_name }}, {{ user.age }}
          </h5>
          <span
            v-if="!isRevealed"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
          >
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
            Hidden
          </span>
        </div>
        <p class="text-sm text-gray-500 flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ formatCheckedInTime(user.checked_in_at) }}
        </p>
      </div>

      <!-- Action Button -->
      <div class="flex-shrink-0">
        <template v-if="!hasRevealPending && !isRevealed">
          <UiButton
            @click.stop="handleRequestReveal"
            :loading="isSendingReveal"
            size="sm"
            variant="primary"
            class="whitespace-nowrap"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Reveal
          </UiButton>
        </template>
        <template v-else-if="hasRevealPending && !isRevealed">
          <div class="flex items-center gap-1.5 text-sm text-amber-600 font-medium px-2 py-1 bg-amber-50 rounded-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Pending</span>
          </div>
        </template>
        <template v-else>
          <div class="flex items-center gap-1.5 text-sm text-green-600 font-medium px-2 py-1 bg-green-50 rounded-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Revealed</span>
          </div>
        </template>
      </div>

      <!-- Expand Indicator -->
      <svg
        class="w-5 h-5 text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': isExpanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <!-- Expanded Content -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-48 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="max-h-48 opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-if="isExpanded" class="overflow-hidden">
        <div class="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
          <!-- Privacy Explanation -->
          <div v-if="!isRevealed" class="mb-3">
            <p class="text-sm text-gray-600">
              <span class="font-medium text-gray-700">Privacy protected.</span>
              Send a reveal request to see {{ user.first_name }}'s full profile and photo.
              They'll be notified and can choose to reveal back.
            </p>
          </div>

          <!-- Quick Actions -->
          <div class="flex gap-2">
            <UiButton
              v-if="!hasRevealPending && !isRevealed"
              @click="handleRequestReveal"
              :loading="isSendingReveal"
              size="sm"
              variant="primary"
              fullWidth
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Request to Reveal
            </UiButton>
            <UiButton
              v-else-if="isRevealed"
              size="sm"
              variant="outline"
              fullWidth
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Start Chat
            </UiButton>
            <div v-else class="w-full text-center py-2 text-sm text-gray-500">
              Waiting for {{ user.first_name }} to respond...
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Error Message -->
    <div v-if="error" class="px-4 pb-3">
      <div class="p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
        {{ error }}
      </div>
    </div>
  </div>
</template>
