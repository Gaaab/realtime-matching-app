<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { user } = useAuth()
const chat = useChat()

// State
const selectedChannelId = ref<number | null>(null)
const isLoadingChannels = ref(false)
const isLoadingMessages = ref(false)
const isSendingMessage = ref(false)

// Load channels on mount
const loadChannels = async () => {
  try {
    isLoadingChannels.value = true
    await chat.fetchChannels()
  } catch (error) {
    console.error('Failed to load channels:', error)
  } finally {
    isLoadingChannels.value = false
  }
}

// Handle channel selection
const handleSelectChannel = async (channelId: number) => {
  selectedChannelId.value = channelId

  try {
    isLoadingMessages.value = true

    await chat.openChannelWithAbly(channelId)
    await chat.markChannelAsRead(channelId)
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
    await chat.sendTextMessage(selectedChannelId.value, content)
    await chat.publishTypingViaAbly(selectedChannelId.value, false)
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
    await chat.publishTypingViaAbly(selectedChannelId.value, isTyping)
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

// Compute current channel from store
const currentChannel = computed(() => {
  if (!selectedChannelId.value) return null
  const chatStore = useChatStore()
  return chatStore.getChannelById(selectedChannelId.value) || null
})

// Compute current messages from store
const currentMessages = computed(() => {
  if (!selectedChannelId.value) return []
  const chatStore = useChatStore()
  return chatStore.getMessagesByChannel(selectedChannelId.value)
})

onMounted(() => {
  loadChannels()
})
</script>

<template>
  <!-- Account for bottom navigation height -->
  <div class="h-[calc(100vh-64px-env(safe-area-inset-bottom,0px))] flex bg-white">
    <!-- Conversations Sidebar -->
    <div class="hidden md:flex md:flex-col md:w-80 md:bg-gray-50 md:border-r md:border-gray-200">
      <ConversationsList
        :channels="chat.channels.value"
        :selected-channel-id="selectedChannelId"
        :is-loading="isLoadingChannels"
        :current-user-id="user?.id"
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
        :current-user-id="user?.id || 0"
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
