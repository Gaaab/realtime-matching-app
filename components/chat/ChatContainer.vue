<script setup lang="ts">
import type { Message, Channel, OnlineUser } from '~/types/chat'
import type { Icebreaker } from '~/types/icebreaker'
import type { ReportData } from '~/components/chat/ReportModal.vue'

interface Props {
  channel: Channel | null
  messages: Message[]
  onlineUsers?: OnlineUser[]
  currentUserId: number | string
  isLoading?: boolean
  isSendingMessage?: boolean
  hasMoreMessages?: boolean
  isLoadingMore?: boolean
  icebreakers?: Icebreaker[]
  showIcebreakers?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  onlineUsers: () => [],
  isLoading: false,
  isSendingMessage: false,
  hasMoreMessages: false,
  isLoadingMore: false,
  icebreakers: () => [],
  showIcebreakers: true
})

const emit = defineEmits<{
  send: [message: string]
  loadMore: []
  typing: [isTyping: boolean]
  unmatch: []
  report: [data: ReportData]
  selectIcebreaker: [icebreaker: Icebreaker]
}>()

// Reference to MessageList component for scroll control
const messageListRef = ref<{ scrollToBottom: (behavior?: ScrollBehavior) => void } | null>(null)

// Dropdown menu state
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// Modal states
const isUnmatchDialogOpen = ref(false)
const isReportModalOpen = ref(false)
const isUnmatchLoading = ref(false)
const isReportLoading = ref(false)

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

// Toggle dropdown menu
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// Open unmatch confirmation dialog
const openUnmatchDialog = () => {
  isDropdownOpen.value = false
  isUnmatchDialogOpen.value = true
}

// Open report modal
const openReportModal = () => {
  isDropdownOpen.value = false
  isReportModalOpen.value = true
}

// Handle unmatch confirmation
const handleUnmatchConfirm = () => {
  isUnmatchLoading.value = true
  emit('unmatch')
}

// Handle report confirmation
const handleReportConfirm = (data: ReportData) => {
  isReportLoading.value = true
  emit('report', data)
}

// Close unmatch dialog and reset loading state (called from parent after API response)
const closeUnmatchDialog = () => {
  isUnmatchDialogOpen.value = false
  isUnmatchLoading.value = false
}

// Close report modal and reset loading state (called from parent after API response)
const closeReportModal = () => {
  isReportModalOpen.value = false
  isReportLoading.value = false
}

// Set unmatch loading state (called from parent)
const setUnmatchLoading = (loading: boolean) => {
  isUnmatchLoading.value = loading
}

// Set report loading state (called from parent)
const setReportLoading = (loading: boolean) => {
  isReportLoading.value = loading
}

// Add click outside listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Check if the channel is archived (read-only)
const isArchived = computed(() => {
  return props.channel?.archived_at !== null && props.channel?.archived_at !== undefined
})

// Get archived date formatted
const archivedDate = computed(() => {
  if (!props.channel?.archived_at) return ''
  const date = new Date(props.channel.archived_at)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

const handleSendMessage = async (content: string) => {
  // Prevent sending if archived
  if (isArchived.value) {
    console.warn('Cannot send message to archived channel')
    return
  }
  emit('send', content)
}

const handleLoadMore = () => {
  emit('loadMore')
}

const handleTyping = (isTyping: boolean) => {
  // Don't emit typing for archived channels
  if (isArchived.value) return
  emit('typing', isTyping)
}

// Handle icebreaker selection - emits to parent and can auto-fill message
const handleIcebreakerSelect = (icebreaker: Icebreaker) => {
  emit('selectIcebreaker', icebreaker)
}

// Determine if icebreakers should be visible
// Show icebreakers when: conversation is new (few messages), not archived, and icebreakers are available
const shouldShowIcebreakers = computed(() => {
  if (!props.showIcebreakers) return false
  if (isArchived.value) return false
  if (props.icebreakers.length === 0) return false
  // Only show for conversations with few messages (new conversations)
  // This helps users start the conversation
  return props.messages.length < 5
})

// Format channel member count
const memberCount = computed(() => {
  return props.onlineUsers.length
})

// Get recipient name for DM channels
const recipientName = computed(() => {
  if (!props.channel) return ''
  if (props.channel.type === 'direct' && props.channel.name) {
    return props.channel.name
  }
  return props.channel.name || 'Channel'
})

// Format last activity
const formatLastActivity = (timestamp: string | null) => {
  if (!timestamp) return 'offline'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'active now'
  if (diffMins < 60) return `active ${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `active ${diffHours}h ago`
  return date.toLocaleDateString()
}

/**
 * Scroll the message list to the bottom.
 * Used when channel changes or when triggered by parent components.
 */
const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  messageListRef.value?.scrollToBottom(behavior)
}

// Watch for channel changes to scroll to bottom
watch(
  () => props.channel?.id,
  (newChannelId, oldChannelId) => {
    if (newChannelId && newChannelId !== oldChannelId) {
      // Use 'auto' (instant) for channel switches to avoid disorienting smooth scroll
      nextTick(() => {
        scrollToBottom('auto')
      })
    }
  }
)

// Expose methods for parent components
defineExpose({
  scrollToBottom,
  closeUnmatchDialog,
  closeReportModal,
  setUnmatchLoading,
  setReportLoading
})
</script>

<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header -->
    <div
      v-if="channel"
      :class="[
        'border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10',
        isArchived ? 'bg-gray-50' : 'bg-white'
      ]"
    >
      <div class="flex items-center gap-3">
        <!-- Back button for mobile would go here -->
        <div>
          <div class="flex items-center gap-2">
            <h2 :class="['text-lg font-bold', isArchived ? 'text-gray-600' : 'text-gray-900']">
              {{ recipientName }}
            </h2>
            <!-- Archived badge in header -->
            <span
              v-if="isArchived"
              class="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full"
            >
              Archived
            </span>
          </div>
          <p v-if="isArchived" class="text-xs text-gray-400">
            Chat archived on {{ archivedDate }}
          </p>
          <p v-else-if="channel.type === 'direct' && onlineUsers.length > 0" class="text-xs text-gray-500">
            {{ formatLastActivity(onlineUsers[0]?.last_activity_at ?? null) }}
          </p>
          <p v-else-if="channel.type === 'group'" class="text-xs text-gray-500">
            {{ memberCount }} members
          </p>
        </div>
      </div>

      <!-- Header Actions -->
      <div class="flex items-center gap-2">
        <button
          v-if="!isArchived"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          title="Call"
          aria-label="Start voice call"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>

        <button
          v-if="!isArchived"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          title="Video call"
          aria-label="Start video call"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        <!-- More Options Dropdown -->
        <div ref="dropdownRef" class="relative">
          <button
            @click.stop="toggleDropdown"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            title="More options"
            aria-label="More options"
            :aria-expanded="isDropdownOpen"
            aria-haspopup="menu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <div
              v-if="isDropdownOpen"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
              role="menu"
              aria-orientation="vertical"
            >
              <!-- Report Option -->
              <button
                @click="openReportModal"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                role="menuitem"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Report
              </button>

              <!-- Divider -->
              <div class="border-t border-gray-100 my-1" role="separator"></div>

              <!-- Unmatch Option -->
              <button
                v-if="!isArchived"
                @click="openUnmatchDialog"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                role="menuitem"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Unmatch
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Archived Banner -->
    <div
      v-if="channel && isArchived"
      class="bg-amber-50 border-b border-amber-200 px-4 py-3"
      role="alert"
    >
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-amber-800">
            This conversation is archived
          </p>
          <p class="text-sm text-amber-700 mt-0.5">
            You can view the message history but cannot send new messages. This happens when you and this person are no longer matched.
          </p>
        </div>
      </div>
    </div>

    <!-- No Channel Selected -->
    <div v-if="!channel" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
        <p class="text-sm text-gray-500">Choose a conversation to start messaging</p>
      </div>
    </div>

    <!-- Messages -->
    <div v-if="channel" class="flex-1 overflow-hidden">
      <MessageList
        ref="messageListRef"
        :messages="messages"
        :current-user-id="currentUserId"
        :is-loading="isLoading"
        :has-more="hasMoreMessages"
        :is-loading-more="isLoadingMore"
        @load-more="handleLoadMore"
      />
    </div>

    <!-- Icebreakers Section -->
    <IcebreakersSection
      v-if="channel && !isArchived"
      :icebreakers="icebreakers"
      :is-visible="shouldShowIcebreakers"
      @select="handleIcebreakerSelect"
    />

    <!-- Input -->
    <div v-if="channel" class="flex-shrink-0">
      <ChatInput
        :is-loading="isLoading"
        :is-sending="isSendingMessage"
        :disabled="!channel || isArchived"
        @send="handleSendMessage"
        @typing="handleTyping"
      />
    </div>

    <!-- Unmatch Confirmation Dialog -->
    <ConfirmDialog
      v-model="isUnmatchDialogOpen"
      title="Unmatch this person?"
      message="Are you sure you want to unmatch? You won't be able to message each other anymore and this conversation will be archived."
      confirm-text="Unmatch"
      cancel-text="Cancel"
      variant="danger"
      :is-loading="isUnmatchLoading"
      @confirm="handleUnmatchConfirm"
    />

    <!-- Report Modal -->
    <ReportModal
      v-model="isReportModalOpen"
      :is-loading="isReportLoading"
      @confirm="handleReportConfirm"
    />
  </div>
</template>
