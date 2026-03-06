<script setup lang="ts">
import type { Channel, Message } from '~/types/chat'

interface Props {
  channels: Channel[]
  selectedChannelId?: number | string
  isLoading?: boolean
  unreadCounts?: Record<number | string, number>
  lastMessages?: Record<number | string, Message | null>
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  unreadCounts: () => ({}),
  lastMessages: () => ({})
})

const emit = defineEmits<{
  selectChannel: [channelId: number | string]
}>()

const searchQuery = ref('')

const filteredChannels = computed(() => {
  if (!searchQuery.value.trim()) return props.channels

  const query = searchQuery.value.toLowerCase()
  return props.channels.filter(ch => {
    const name = (ch.name || '').toLowerCase()
    const type = (ch.type || '').toLowerCase()
    return name.includes(query) || type.includes(query)
  })
})

const formatLastMessage = (message: Message | null | undefined) => {
  if (!message) return 'No messages yet'

  const preview = message.content.substring(0, 50)
  return preview.length < message.content.length ? preview + '...' : preview
}

const formatLastMessageTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  if (diffHours < 48) return 'yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getChannelInitials = (channel: Channel) => {
  if (channel.type === 'direct') {
    return channel.name?.charAt(0).toUpperCase() || '?'
  }
  return channel.name?.slice(0, 2).toUpperCase() || '?'
}

const getUnreadCount = (channelId: number | string) => {
  return props.unreadCounts[channelId] || 0
}
</script>

<template>
  <div class="flex flex-col h-full bg-gray-50 border-r border-gray-200">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Messages</h2>

      <!-- Search -->
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search conversations..."
          class="w-full bg-white rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white border border-gray-200 transition-colors"
        />
        <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- Conversations List -->
    <div class="flex-1 overflow-y-auto">
      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-2 p-2">
        <div v-for="i in 5" :key="i" class="animate-pulse">
          <div class="flex items-center gap-3 p-3 rounded-lg bg-white">
            <div class="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="channels.length === 0" class="flex items-center justify-center h-full">
        <div class="text-center px-4">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p class="text-gray-500 font-medium">No conversations yet</p>
          <p class="text-sm text-gray-400 mt-1">Start chatting with someone</p>
        </div>
      </div>

      <!-- No Results -->
      <div v-else-if="filteredChannels.length === 0" class="flex items-center justify-center h-full">
        <div class="text-center px-4">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p class="text-gray-500 font-medium">No results found</p>
          <p class="text-sm text-gray-400">Try searching with a different term</p>
        </div>
      </div>

      <!-- Conversation Items -->
      <button
        v-for="channel in filteredChannels"
        v-else
        :key="channel.id"
        @click="emit('selectChannel', channel.id)"
        :class="[
          'w-full flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors border-b border-gray-100 text-left',
          selectedChannelId === channel.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
        ]"
      >
        <!-- Avatar -->
        <div
          :class="[
            'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white',
            channel.type === 'direct'
              ? 'bg-gradient-to-br from-primary-500 to-primary-700'
              : 'bg-gradient-to-br from-accent-500 to-accent-700'
          ]"
        >
          {{ getChannelInitials(channel) }}
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 mb-1">
            <h3 class="font-semibold text-gray-900 truncate">{{ channel.name }}</h3>
            <span v-if="lastMessages[channel.id]?.created_at" class="text-xs text-gray-500 flex-shrink-0">
              {{ formatLastMessageTime(lastMessages[channel.id]!.created_at) }}
            </span>
          </div>

          <div class="flex items-center justify-between gap-2">
            <p class="text-sm text-gray-500 truncate">
              {{ formatLastMessage(lastMessages[channel.id]) }}
            </p>

            <!-- Unread Badge -->
            <div
              v-if="getUnreadCount(channel.id) > 0"
              class="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
            >
              {{ getUnreadCount(channel.id) > 99 ? '99+' : getUnreadCount(channel.id) }}
            </div>
          </div>
        </div>
      </button>
    </div>

  </div>
</template>
