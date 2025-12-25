<script setup lang="ts">
import type { Message, Channel, OnlineUser } from '~/types/chat'

interface Props {
  channel: Channel | null
  messages: Message[]
  onlineUsers?: OnlineUser[]
  currentUserId: number | string
  isLoading?: boolean
  isSendingMessage?: boolean
  hasMoreMessages?: boolean
  isLoadingMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  onlineUsers: () => [],
  isLoading: false,
  isSendingMessage: false,
  hasMoreMessages: false,
  isLoadingMore: false
})

const emit = defineEmits<{
  send: [message: string]
  loadMore: []
  typing: [isTyping: boolean]
}>()

const messageListRef = ref<InstanceType<typeof ChatInput> | null>(null)

const handleSendMessage = async (content: string) => {
  emit('send', content)
}

const handleLoadMore = () => {
  emit('loadMore')
}

const handleTyping = (isTyping: boolean) => {
  emit('typing', isTyping)
}

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
</script>

<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header -->
    <div
      v-if="channel"
      class="border-b border-gray-200 p-4 flex items-center justify-between bg-white sticky top-0 z-10"
    >
      <div>
        <h2 class="text-lg font-bold text-gray-900">{{ recipientName }}</h2>
        <p v-if="channel.type === 'direct' && onlineUsers.length > 0" class="text-xs text-gray-500">
          {{ formatLastActivity(onlineUsers[0]?.last_activity_at) }}
        </p>
        <p v-else-if="channel.type === 'group'" class="text-xs text-gray-500">
          {{ memberCount }} members
        </p>
      </div>

      <!-- Header Actions -->
      <div class="flex items-center gap-2">
        <button
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          title="Call"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>

        <button
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          title="Video call"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          title="More options"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- No Channel Selected -->
    <div v-else class="flex-1 flex items-center justify-center">
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
        :messages="messages"
        :current-user-id="currentUserId"
        :is-loading="isLoading"
        :has-more="hasMoreMessages"
        :is-loading-more="isLoadingMore"
        @load-more="handleLoadMore"
      />
    </div>

    <!-- Input -->
    <div v-if="channel" class="flex-shrink-0">
      <ChatInput
        ref="messageListRef"
        :is-loading="isLoading"
        :is-sending="isSendingMessage"
        :disabled="!channel"
        @send="handleSendMessage"
        @typing="handleTyping"
      />
    </div>
  </div>
</template>
