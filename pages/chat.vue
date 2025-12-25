<script setup lang="ts">
import type { Channel, Message } from '~/types/chat'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { user } = useAuth()
const { channels, messages, getChannel, getChannelMessages, sendMessage, markChannelAsRead } = useChat()
const { subscribeToChannelUpdates, openChannelWithAbly, publishTypingViaAbly } = useChat()

// State
const selectedChannelId = ref<number | string | null>(null)
const isLoadingChannels = ref(false)
const isLoadingMessages = ref(false)
const isSendingMessage = ref(false)
const unreadCounts = ref<Record<number | string, number>>({})
const lastMessages = ref<Record<number | string, Message | null>>({})
const channelData = ref<Record<number | string, Channel>>({})

// Load channels on mount
const loadChannels = async () => {
  try {
    isLoadingChannels.value = true
    // This would typically fetch from your API
    // For now, channels are populated from the composable
  } catch (error) {
    console.error('Failed to load channels:', error)
  } finally {
    isLoadingChannels.value = false
  }
}

// Handle channel selection
const handleSelectChannel = async (channelId: number | string) => {
  selectedChannelId.value = channelId

  try {
    isLoadingMessages.value = true

    // Open channel with Ably (fetches history, subscribes, loads presence)
    await openChannelWithAbly(channelId)

    // Mark as read
    await markChannelAsRead(channelId)

    // Clear unread count
    if (unreadCounts.value[channelId]) {
      unreadCounts.value[channelId] = 0
    }
  } catch (error) {
    console.error('Failed to open channel:', error)
  } finally {
    isLoadingMessages.value = false
  }
}

// Handle sending message
const handleSendMessage = async (content: string) => {
  if (!selectedChannelId.value || !user.value) return

  try {
    isSendingMessage.value = true

    const message: Message = {
      id: `temp-${Date.now()}`,
      channel_id: selectedChannelId.value as number,
      user_id: user.value.id,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending',
      user: {
        id: user.value.id,
        first_name: user.value.first_name,
        profile_picture_url: user.value.profile_picture_url
      }
    }

    // Optimistic update
    messages.value.push(message)

    // Send via API and Ably
    const sent = await sendMessage(selectedChannelId.value, content)

    if (sent) {
      // Update last message
      lastMessages.value[selectedChannelId.value] = sent

      // Clear typing indicator
      await publishTypingViaAbly(selectedChannelId.value, false)
    }
  } catch (error) {
    console.error('Failed to send message:', error)
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
  return channelData.value[selectedChannelId.value] || null
})

// Compute current messages
const currentMessages = computed(() => {
  if (!selectedChannelId.value) return []
  return messages.value.filter(m => m.channel_id === selectedChannelId.value)
})

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
        @select-channel="handleSelectChannel"
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
        :channel="currentChannel"
        :messages="currentMessages"
        :current-user-id="user?.id || ''"
        :is-loading="isLoadingMessages"
        :is-sending-message="isSendingMessage"
        @send="handleSendMessage"
        @load-more="handleLoadMore"
        @typing="handleTyping"
      />
    </div>
  </div>
</template>

<style scoped>
/* Ensure full height layout */
:deep(body) {
  overflow: hidden;
}
</style>
