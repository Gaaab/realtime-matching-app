<script setup lang="ts">
import type { Channel, Message } from '~/types/chat'
import type { Icebreaker } from '~/types/icebreaker'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { user } = useAuth()
const {
  channels,
  messages,
  fetchChannels,
  fetchChannel,
  sendMessage,
  markChannelAsRead,
  toggleArchivedChannels,
  includeArchived,
  isChannelArchived,
  openChannelWithAbly,
  publishTypingViaAbly
} = useChat()

const { unmatchUser, reportMatch } = useMatches()

// Icebreakers composable
const {
  matchIcebreakers,
  fetchMatchIcebreakers,
  sendIcebreaker,
  loading: icebreakerLoading
} = useIcebreakers()

// State
const selectedChannelId = ref<number | undefined>(undefined)
const isLoadingChannels = ref(false)
const isLoadingMessages = ref(false)
const isSendingMessage = ref(false)
const unreadCounts = ref<Record<number, number>>({})
const lastMessages = ref<Record<number, Message | null>>({})
const channelData = ref<Record<number, Channel>>({})

// Reference to ChatContainer for scroll control and modal management
const chatContainerRef = ref<{
  scrollToBottom: (behavior?: ScrollBehavior) => void
  closeUnmatchDialog: () => void
  closeReportModal: () => void
  setUnmatchLoading: (loading: boolean) => void
  setReportLoading: (loading: boolean) => void
} | null>(null)

// Toast state for notifications
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { message, type }
  setTimeout(() => {
    toast.value = null
  }, 3000)
}

// Load channels on mount
const loadChannels = async () => {
  try {
    isLoadingChannels.value = true
    await fetchChannels()
  } catch (error) {
    console.error('Failed to load channels:', error)
  } finally {
    isLoadingChannels.value = false
  }
}

// Handle toggle archived channels
const handleToggleArchived = async () => {
  try {
    isLoadingChannels.value = true
    await toggleArchivedChannels()
  } catch (error) {
    console.error('Failed to toggle archived channels:', error)
  } finally {
    isLoadingChannels.value = false
  }
}

// Handle channel selection
const handleSelectChannel = async (channelId: number | string) => {
  // Ensure channelId is a number (API expects numeric IDs)
  const numericChannelId = typeof channelId === 'string' ? parseInt(channelId, 10) : channelId
  selectedChannelId.value = numericChannelId

  try {
    isLoadingMessages.value = true

    // Open channel with Ably (fetches history, subscribes, loads presence)
    await openChannelWithAbly(numericChannelId)

    // Mark as read
    await markChannelAsRead(numericChannelId)

    // Clear unread count
    if (unreadCounts.value[numericChannelId]) {
      unreadCounts.value[numericChannelId] = 0
    }

    // Fetch icebreakers for this match (channel ID maps to match ID)
    // This is done in parallel with other operations for better UX
    fetchMatchIcebreakers(numericChannelId).catch((err) => {
      // Non-critical - log but don't show error to user
      console.warn('Failed to fetch icebreakers:', err)
    })

    // Scroll to bottom after messages are loaded (use instant scroll for channel switch)
    nextTick(() => {
      chatContainerRef.value?.scrollToBottom('auto')
    })
  } catch (error) {
    console.error('Failed to open channel:', error)
  } finally {
    isLoadingMessages.value = false
  }
}

// Handle sending message
const handleSendMessage = async (content: string) => {
  if (!selectedChannelId.value || !user.value) return

  // Check if the current channel is archived
  if (currentChannel.value && isChannelArchived(currentChannel.value)) {
    console.warn('Cannot send message to archived channel')
    return
  }

  try {
    isSendingMessage.value = true

    // Send via API (the composable handles optimistic updates and Ably)
    const sent = await sendMessage(selectedChannelId.value, { data: content })

    if (sent) {
      // Update last message
      lastMessages.value[selectedChannelId.value] = sent

      // Clear typing indicator
      await publishTypingViaAbly(selectedChannelId.value, false)

      // Scroll to show the sent message (use smooth scroll for user-initiated action)
      nextTick(() => {
        chatContainerRef.value?.scrollToBottom('smooth')
      })
    }
  } catch (error: any) {
    console.error('Failed to send message:', error)
    // Error is already handled in the composable (shows toast/error message)
  } finally {
    isSendingMessage.value = false
  }
}

// Handle typing indicator
const handleTyping = async (isTyping: boolean) => {
  if (!selectedChannelId.value) return

  try {
    await publishTypingViaAbly(selectedChannelId.value, isTyping)
  } catch (error) {
    console.error('Failed to publish typing indicator:', error)
  }
}

// Handle load more messages
const handleLoadMore = async () => {
  if (!selectedChannelId.value) return

  try {
    isLoadingMessages.value = true
    // TODO: Implement pagination for message history
  } catch (error) {
    console.error('Failed to load more messages:', error)
  } finally {
    isLoadingMessages.value = false
  }
}

// Compute current channel
const currentChannel = computed(() => {
  if (!selectedChannelId.value) return null
  return channels.value.find(ch => ch.id === selectedChannelId.value) || null
})

// Compute current messages - use the messages from useChat which already filters by current channel
// The messages computed in useChat uses chatStore.getMessagesByChannel(currentChannel.id)
const currentMessages = computed(() => {
  // messages from useChat is already filtered for the current channel
  return messages.value
})

// Use icebreakers from the API (fetched via useIcebreakers composable)
// matchIcebreakers contains personalized suggestions for the current match
const currentIcebreakers = computed<Icebreaker[]>(() => {
  return matchIcebreakers.value
})

/**
 * Handle icebreaker selection
 *
 * When a user selects an icebreaker, we call the API to send it as a message.
 * The API creates a special "icebreaker" type message in the chat.
 */
const handleIcebreakerSelect = async (icebreaker: Icebreaker) => {
  const matchId = getMatchId()
  if (!matchId) {
    showToast('Unable to send icebreaker: Match not found', 'error')
    return
  }

  try {
    isSendingMessage.value = true

    // Send the icebreaker via API - this creates a message with type "icebreaker"
    await sendIcebreaker(matchId, icebreaker.id)

    // Scroll to show the sent message
    nextTick(() => {
      chatContainerRef.value?.scrollToBottom('smooth')
    })
  } catch (error: any) {
    console.error('Failed to send icebreaker:', error)
    showToast(error.message || 'Failed to send icebreaker', 'error')
  } finally {
    isSendingMessage.value = false
  }
}

// Get the other member from the current channel (for reporting)
const getOtherMemberId = (): number | null => {
  if (!currentChannel.value || !user.value) return null

  const otherMember = currentChannel.value.members?.find(
    member => member.model_id !== user.value?.id
  )

  return otherMember?.model_id || null
}

// Get match ID from channel (assume channel ID corresponds to a match)
// In a real app, you might need to fetch the match associated with this channel
const getMatchId = (): number | null => {
  // For now, we'll use the channel ID as a proxy
  // In production, you may need to store match_id in channel meta or fetch it
  return selectedChannelId.value || null
}

// Handle unmatch action (simple confirmation, no reason required)
const handleUnmatch = async () => {
  const matchId = getMatchId()
  if (!matchId) {
    showToast('Unable to unmatch: Match not found', 'error')
    chatContainerRef.value?.closeUnmatchDialog()
    return
  }

  try {
    // Simple unmatch without reason
    await unmatchUser(matchId)

    // Close the dialog
    chatContainerRef.value?.closeUnmatchDialog()

    // Show success toast
    showToast('You have unmatched this person')

    // Clear the selected channel and return to conversations list
    selectedChannelId.value = undefined

    // Refresh channels list to remove the unmatched conversation
    await loadChannels()
  } catch (error: any) {
    console.error('Failed to unmatch:', error)
    showToast(error.message || 'Failed to unmatch. Please try again.', 'error')
    chatContainerRef.value?.setUnmatchLoading(false)
  }
}

// Handle report action (will also unmatch the user)
// Data structure from ReportModal: { reasonId: number, description?: string }
const handleReport = async (data: { reasonId: number; description?: string }) => {
  const matchId = getMatchId()
  if (!matchId) {
    showToast('Unable to report: Match not found', 'error')
    chatContainerRef.value?.closeReportModal()
    return
  }

  try {
    // Report the match (this will also unmatch)
    await reportMatch(matchId, data.reasonId, data.description)

    // Close the modal
    chatContainerRef.value?.closeReportModal()

    // Show success toast
    showToast('Report submitted. Thank you for helping keep our community safe.')

    // Clear the selected channel and return to conversations list
    selectedChannelId.value = undefined

    // Refresh channels list to remove the conversation
    await loadChannels()
  } catch (error: any) {
    console.error('Failed to report:', error)
    showToast(error.message || 'Failed to submit report. Please try again.', 'error')
    chatContainerRef.value?.setReportLoading(false)
  }
}

onMounted(() => {
  loadChannels()
})

// Clean up on unmount
onBeforeUnmount(() => {
  // TODO: Implement cleanup
})
</script>

<template>
  <!-- Account for bottom navigation height -->
  <div class="h-[calc(100vh-64px-env(safe-area-inset-bottom,0px))] flex bg-white">
    <!-- Conversations Sidebar -->
    <div class="hidden md:flex md:flex-col md:w-80 md:bg-gray-50 md:border-r md:border-gray-200">
      <ConversationsList
        :channels="channels"
        :selected-channel-id="selectedChannelId"
        :is-loading="isLoadingChannels"
        :unread-counts="unreadCounts"
        :last-messages="lastMessages"
        :include-archived="includeArchived"
        @select-channel="handleSelectChannel"
        @toggle-archived="handleToggleArchived"
      />
    </div>

    <!-- Mobile Drawer (collapsible) -->
    <Transition
      enter-active-class="transition-all duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-all duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div v-if="false" class="fixed inset-0 z-40 md:hidden">
        <!-- Mobile conversations list would go here -->
      </div>
    </Transition>

    <!-- Chat Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Empty State for Mobile/Tablet without selection -->
      <div v-if="!selectedChannelId" class="flex-1 flex items-center justify-center md:hidden">
        <div class="text-center px-4">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
          <p class="text-sm text-gray-500">Choose a conversation to start messaging</p>
        </div>
      </div>

      <!-- Chat Container -->
      <ChatContainer
        v-if="selectedChannelId"
        ref="chatContainerRef"
        :channel="currentChannel"
        :messages="currentMessages"
        :current-user-id="user?.id || ''"
        :is-loading="isLoadingMessages"
        :is-sending-message="isSendingMessage"
        :icebreakers="currentIcebreakers"
        @send="handleSendMessage"
        @load-more="handleLoadMore"
        @typing="handleTyping"
        @unmatch="handleUnmatch"
        @report="handleReport"
        @select-icebreaker="handleIcebreakerSelect"
      />
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

<style scoped>
/* Ensure full height layout */
:deep(body) {
  overflow: hidden;
}
</style>
