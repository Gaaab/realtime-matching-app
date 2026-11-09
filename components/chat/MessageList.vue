<script setup lang="ts">
import type { Message } from '~/types/chat'

interface Props {
  messages: Message[]
  currentUserId: number
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

const messagesContainer = ref<HTMLElement | null>(null)

const scrollToBottom = () => {
  if (messagesContainer.value) {
    nextTick(() => {
      messagesContainer.value?.scrollTo(0, messagesContainer.value.scrollHeight)
    })
  }
}

watch(() => props.messages, scrollToBottom, { deep: true })

onMounted(scrollToBottom)

const getSenderName = (message: Message): string => {
  return message.sender?.model?.first_name || 'User'
}

const getSenderAvatar = (message: Message): string | undefined => {
  const model = message.sender?.model
  return model?.avatar_permanent_thumb_url || model?.avatar_permanent_url || undefined
}

const getMessageContent = (message: Message): string => {
  if (typeof message.data === 'string') return message.data
  return ''
}

// Check if sender model_id matches current user
const isMine = (message: Message): boolean => {
  const senderUserId = message.sender?.model_id || message.sender?.model?.id
  return senderUserId === props.currentUserId
}

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
  const currentSender = current.sender?.model_id || current.sender?.model?.id
  const previousSender = previous.sender?.model_id || previous.sender?.model?.id
  if (currentSender !== previousSender) return false
  const currentTime = new Date(current.created_at).getTime()
  const previousTime = new Date(previous.created_at).getTime()
  return currentTime - previousTime < 60000
}
</script>

<template>
  <div class="flex flex-col h-full">
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
      class="flex-1 overflow-y-auto px-4 py-6 space-y-4"
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
            isMine(message) ? 'flex-row-reverse' : 'flex-row'
          ]"
        >
          <!-- Avatar -->
          <div
            v-if="!isConsecutive(message, messages[index - 1])"
            class="flex-shrink-0"
          >
            <UiAvatar
              :src="getSenderAvatar(message)"
              :alt="getSenderName(message)"
              size="sm"
            />
          </div>
          <div v-else class="flex-shrink-0 w-10"></div>

          <!-- Message Bubble -->
          <div :class="[
            'max-w-xs lg:max-w-md',
            isMine(message) ? 'items-end' : 'items-start'
          ]">
            <!-- User Name (for first message in series) -->
            <p
              v-if="!isConsecutive(message, messages[index - 1])"
              :class="[
                'text-xs font-semibold mb-1 px-3',
                isMine(message) ? 'text-right text-primary-600' : 'text-left text-gray-600'
              ]"
            >
              {{ isMine(message) ? 'You' : getSenderName(message) }}
            </p>

            <!-- Message Content -->
            <div
              :class="[
                'px-4 py-2 rounded-2xl break-words',
                isMine(message)
                  ? 'bg-primary-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-900 rounded-bl-none'
              ]"
            >
              {{ getMessageContent(message) }}
            </div>

            <!-- Timestamp & Read Status -->
            <div
              :class="[
                'flex items-center gap-1 text-xs mt-1 px-3',
                isMine(message) ? 'justify-end' : 'justify-start'
              ]"
            >
              <span class="text-gray-500">
                {{ formatTime(message.created_at) }}
              </span>
              <svg
                v-if="isMine(message) && message.is_read"
                class="w-3 h-3 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
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
