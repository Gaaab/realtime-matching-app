<script setup lang="ts">
import type { Message } from '~/types/chat'

interface Props {
  messages: Message[]
  currentUserId: number | string
  isLoading?: boolean
  hasMore?: boolean
  isLoadingMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  hasMore: false,
  isLoadingMore: false
})

const emit = defineEmits<{
  loadMore: []
}>()

// Scroll container reference
const messagesContainer = ref<HTMLElement | null>(null)

// Track if user is near the bottom of the scroll container
const isNearBottom = ref(true)

// Threshold in pixels to consider "near bottom"
const SCROLL_THRESHOLD = 100

// Track if we should show "new messages" indicator
const hasNewMessagesBelow = ref(false)

/**
 * Check if the user is near the bottom of the scroll container.
 * This determines whether we should auto-scroll on new messages.
 */
const checkIfNearBottom = () => {
  if (!messagesContainer.value) return

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight

  isNearBottom.value = distanceFromBottom < SCROLL_THRESHOLD

  // Clear the new messages indicator if user scrolls to bottom
  if (isNearBottom.value) {
    hasNewMessagesBelow.value = false
  }
}

/**
 * Scroll to the bottom of the messages container.
 * @param behavior - 'smooth' for animated scroll, 'auto' for instant scroll
 */
const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  nextTick(() => {
    if (!messagesContainer.value) return

    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior
    })

    // Clear the new messages indicator
    hasNewMessagesBelow.value = false
  })
}

/**
 * Handle scroll events to track user position.
 * Uses passive listener for better performance.
 */
const handleScroll = () => {
  checkIfNearBottom()
}

// Watch for new messages and auto-scroll appropriately
watch(
  () => props.messages,
  (newMessages, oldMessages) => {
    // Skip if no new messages were added
    if (!newMessages || !oldMessages || newMessages.length <= oldMessages.length) {
      return
    }

    // Get the latest message
    const latestMessage = newMessages[newMessages.length - 1]
    if (!latestMessage) return

    // Determine if we should auto-scroll:
    // 1. User sent the message (always scroll to show their message)
    // 2. User is already near the bottom (they're following the conversation)
    const isOwnMessage = String(latestMessage.user_id) === String(props.currentUserId) ||
                         String(latestMessage.sender_id) === String(props.currentUserId)

    if (isOwnMessage || isNearBottom.value) {
      scrollToBottom()
    } else {
      // User is reading older messages, show indicator instead of interrupting
      hasNewMessagesBelow.value = true
    }
  },
  { deep: true }
)

// Initial scroll to bottom when component mounts (with instant scroll for initial load)
onMounted(() => {
  scrollToBottom('auto')

  // Add scroll listener with passive option for performance
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', handleScroll, { passive: true })
  }
})

// Clean up scroll listener
onBeforeUnmount(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleScroll)
  }
})

// Expose scrollToBottom for parent components to call
defineExpose({
  scrollToBottom
})

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffHours < 48) return 'yesterday'
  return date.toLocaleDateString()
}

const isConsecutive = (current: Message, previous: Message | undefined): boolean => {
  if (!previous) return false
  if (current.user_id !== previous.user_id) return false
  const currentTime = new Date(current.created_at).getTime()
  const previousTime = new Date(previous.created_at).getTime()
  return currentTime - previousTime < 60000 // 1 minute
}
</script>

<template>
  <div class="flex flex-col h-full relative">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-12 h-12 mx-auto mb-3">
          <svg class="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p class="text-gray-500">Loading conversation...</p>
      </div>
    </div>

    <!-- Messages Container -->
    <div
      v-else
      ref="messagesContainer"
      class="flex-1 overflow-y-auto px-4 py-6 space-y-4 relative scroll-smooth"
    >
      <!-- Load More Button -->
      <div v-if="hasMore" class="flex justify-center pt-4">
        <button
          @click="emit('loadMore')"
          :disabled="isLoadingMore"
          class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
        >
          <span v-if="!isLoadingMore">Load Earlier Messages</span>
          <span v-else class="flex items-center gap-2">
            <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="messages.length === 0" class="flex items-center justify-center h-64">
        <div class="text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p class="text-gray-500 font-medium">No messages yet</p>
          <p class="text-sm text-gray-400">Start the conversation!</p>
        </div>
      </div>

      <!-- Messages -->
      <template v-for="(message, index) in messages" :key="message.id">
        <div
          :class="[
            'flex gap-3 animate-fade-in',
            message.user_id === currentUserId ? 'flex-row-reverse' : 'flex-row'
          ]"
        >
          <!-- Avatar -->
          <div
            v-if="!isConsecutive(message, messages[index - 1])"
            class="flex-shrink-0"
          >
            <UiAvatar
              :src="message.user?.profile_picture_url ?? undefined"
              :alt="message.user?.first_name || 'User'"
              size="sm"
            />
          </div>
          <div v-else class="flex-shrink-0 w-10"></div>

          <!-- Message Bubble -->
          <div :class="[
            'max-w-xs lg:max-w-md',
            message.user_id === currentUserId ? 'items-end' : 'items-start'
          ]">
            <!-- User Name (for first message in series) -->
            <p
              v-if="!isConsecutive(message, messages[index - 1])"
              :class="[
                'text-xs font-semibold mb-1 px-3',
                message.user_id === currentUserId ? 'text-right text-primary-600' : 'text-left text-gray-600'
              ]"
            >
              {{ message.user_id === currentUserId ? 'You' : message.user?.first_name }}
            </p>

            <!-- Message Content -->
            <div
              :class="[
                'px-4 py-2 rounded-2xl break-words',
                message.user_id === currentUserId
                  ? 'bg-primary-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-900 rounded-bl-none'
              ]"
            >
              {{ message.content }}
            </div>

            <!-- Timestamp & Status -->
            <div
              :class="[
                'flex items-center gap-1 text-xs mt-1 px-3',
                message.user_id === currentUserId ? 'justify-end' : 'justify-start'
              ]"
            >
              <span class="text-gray-500">
                {{ formatTime(message.created_at) }}
              </span>
              <div v-if="message.user_id === currentUserId" class="flex items-center gap-0.5">
                <!-- Message Status Indicator -->
                <svg
                  v-if="message.status === 'pending'"
                  class="w-3 h-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="1"/>
                </svg>
                <svg
                  v-else-if="message.status === 'sent'"
                  class="w-3 h-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg
                  v-else-if="message.status === 'delivered'"
                  class="w-3 h-3 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7 20H5a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2h-5l-4 4z" />
                </svg>
                <svg
                  v-else-if="message.status === 'error'"
                  class="w-3 h-3 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0 0v2m0-2v-2m0 0H9m3 0h3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
