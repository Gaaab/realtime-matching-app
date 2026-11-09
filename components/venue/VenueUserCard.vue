<script setup lang="ts">
import type { NearbyUser } from '~/types/venue'

const props = defineProps<{
  user: NearbyUser
}>()

const { sendReveal, isLoading: isSendingReveal } = useMatches()
const revealSent = ref(false)
const error = ref<string | null>(null)

const isRevealed = computed(() => props.user.is_revealed === true)
const hasRevealPending = computed(() => {
  return revealSent.value || props.user.reveal_direction === 'sent'
})

const handleSendReveal = async () => {
  try {
    error.value = null
    const userId = props.user.id
    await sendReveal(userId, props.user.venue?.id)
    revealSent.value = true
  } catch (err: any) {
    console.error('Failed to send reveal:', err)
    if (err.message?.includes('already') || err.message?.includes('pending')) {
      revealSent.value = true
      error.value = null
    } else {
      error.value = err instanceof Error ? err.message : 'Failed to send reveal'
    }
  }
}

// Format time
const formatCheckedInTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
    <div class="p-4">
      <div class="flex items-center gap-4">
        <!-- Blurred Avatar using BlurredAvatar component -->
        <div class="flex-shrink-0">
          <UiBlurredAvatar
            :src="user.avatar_url || user.avatar || user.profile_picture_url"
            :name="user.first_name"
            size="lg"
            :blurred="!isRevealed"
          />
        </div>

        <!-- User Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h5 class="font-bold text-gray-900 text-lg truncate">
              {{ user.first_name }}, {{ user.age }}
            </h5>
          </div>

          <div class="flex items-center gap-2 text-sm text-gray-500">
            <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="4"/>
            </svg>
            <span>Checked in {{ formatCheckedInTime(user.checked_in_at) }}</span>
          </div>

          <!-- Reveal prompt -->
          <p v-if="!hasRevealPending && !isRevealed" class="text-xs text-primary-600 mt-2 font-medium flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Tap to reveal their profile
          </p>
        </div>
      </div>

      <!-- Action Section -->
      <div class="mt-4">
        <!-- Reveal Button -->
        <button
          v-if="!hasRevealPending && !isRevealed"
          @click="handleSendReveal"
          :disabled="isSendingReveal"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          <template v-if="isSendingReveal">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>Sending Request...</span>
          </template>
          <template v-else>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Send Reveal Request</span>
          </template>
        </button>

        <!-- Pending State -->
        <div
          v-else-if="hasRevealPending && !isRevealed"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-700 rounded-xl font-medium text-sm"
        >
          <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Reveal Request Sent</span>
        </div>

        <!-- Revealed State -->
        <div
          v-else-if="isRevealed"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 rounded-xl font-medium text-sm"
        >
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Profile Revealed</span>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Privacy Notice Footer -->
    <div class="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
      <p class="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        They will be notified of your request
      </p>
    </div>
  </div>
</template>
