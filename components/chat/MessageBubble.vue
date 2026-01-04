<script setup lang="ts">
import type { Message } from '~/types/chat'

interface Props {
  message: Message
  currentUserId: number | string
  isConsecutive?: boolean
  showAvatar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isConsecutive: false,
  showAvatar: true
})

// Check if message is from current user
// Handle both sender.model_id (new API) and sender_id (legacy/optimistic)
const isOwnMessage = computed(() => {
  const senderId = props.message.sender?.model_id || props.message.user_id || props.message.sender_id
  return senderId === props.currentUserId
})

// Get sender's display name
// API returns sender.model.first_name, but we also support legacy user.first_name
const senderName = computed(() => {
  // New API format: sender.model.first_name
  if (props.message.sender?.model) {
    return props.message.sender.model.full_name
      || props.message.sender.model.first_name
      || 'Unknown'
  }
  // Legacy format: user.first_name
  if (props.message.user) {
    return props.message.user.first_name || 'Unknown'
  }
  return 'Unknown'
})

// Get sender's avatar URL
// API returns sender.model.avatar_permanent_thumb_url, but we also support legacy formats
// Returns undefined instead of null to match the Avatar component's expected prop type
const senderAvatarUrl = computed((): string | undefined => {
  // New API format: sender.model.avatar_permanent_url
  if (props.message.sender?.model) {
    return props.message.sender.model.avatar_permanent_thumb_url
      || props.message.sender.model.avatar_permanent_url
      || undefined
  }
  // Legacy format: user.profile_picture_url
  if (props.message.user) {
    return props.message.user.profile_picture_url || undefined
  }
  return undefined
})

// Get message text content
// API returns 'data', but we normalize to 'content' for backward compatibility
const messageText = computed(() => {
  return props.message.content || props.message.data || ''
})

// Get message type - default to 'text' if not specified
const messageType = computed(() => {
  return props.message.message_type || 'text'
})

// Message status for screen readers
const statusLabel = computed(() => {
  if (props.message.id < 0) return 'Sending'
  if (!props.message.read_at) return 'Sent'
  return 'Read'
})

// Format timestamp for display and screen readers
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return {
    display: formatRelativeTime(date),
    accessible: date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }
}

const formatRelativeTime = (date: Date) => {
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

const timestamp = computed(() => formatTime(props.message.created_at))
</script>

<template>
  <div
    :class="[
      'flex gap-3 group',
      isOwnMessage ? 'flex-row-reverse' : 'flex-row'
    ]"
    role="listitem"
  >
    <!-- Avatar -->
    <div
      v-if="showAvatar && !isConsecutive"
      class="flex-shrink-0"
    >
      <UiAvatar
        v-if="senderName"
        :src="senderAvatarUrl"
        :name="senderName"
        :alt="`${senderName}'s avatar`"
        size="sm"
      />
    </div>
    <div v-else-if="showAvatar" class="flex-shrink-0 w-8" aria-hidden="true" />

    <!-- Message Content Container -->
    <div
      :class="[
        'max-w-[75%] lg:max-w-md',
        isOwnMessage ? 'items-end' : 'items-start'
      ]"
    >
      <!-- Sender Name (for first message in consecutive series) -->
      <p
        v-if="!isConsecutive && senderName"
        :class="[
          'text-xs font-semibold mb-1 px-1',
          isOwnMessage ? 'text-right text-primary-600' : 'text-left text-gray-600'
        ]"
      >
        <span class="sr-only">Message from </span>
        {{ isOwnMessage ? 'You' : senderName }}
      </p>

      <!-- Message Bubble -->
      <div
        :class="[
          'relative px-4 py-2.5 rounded-2xl break-words',
          'transition-shadow duration-200',
          'focus-within:ring-2 focus-within:ring-primary-300',
          isOwnMessage
            ? 'bg-primary-500 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        ]"
        tabindex="0"
        role="article"
        :aria-label="`Message from ${isOwnMessage ? 'you' : senderName}: ${messageText}. ${statusLabel}, ${timestamp.accessible}`"
      >
        <!-- Text Message -->
        <p v-if="messageType === 'text'" class="text-sm leading-relaxed">
          {{ messageText }}
        </p>

        <!-- Image Message -->
        <div v-else-if="messageType === 'image'" class="space-y-2">
          <img
            v-if="message.media_url"
            :src="message.media_url"
            :alt="messageText || 'Shared image'"
            class="rounded-lg max-w-full h-auto"
            loading="lazy"
          />
          <p v-if="messageText" class="text-sm">{{ messageText }}</p>
        </div>

        <!-- System Message -->
        <p
          v-else-if="messageType === 'system'"
          class="text-xs italic text-center"
        >
          {{ messageText }}
        </p>
      </div>

      <!-- Timestamp and Status -->
      <div
        :class="[
          'flex items-center gap-1.5 mt-1 px-1',
          'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          'transition-opacity duration-200',
          isOwnMessage ? 'justify-end' : 'justify-start'
        ]"
      >
        <time
          :datetime="message.created_at"
          :title="timestamp.accessible"
          class="text-xs text-gray-500"
        >
          {{ timestamp.display }}
        </time>

        <!-- Message Status Indicators (only for own messages) -->
        <div v-if="isOwnMessage" class="flex items-center">
          <!-- Sending -->
          <svg
            v-if="!message.id || message.id < 0"
            class="w-3.5 h-3.5 text-gray-400 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label="Sending"
          >
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>

          <!-- Sent (single check) -->
          <svg
            v-else-if="!message.read_at"
            class="w-3.5 h-3.5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label="Sent"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>

          <!-- Read (double check) -->
          <div v-else class="flex -space-x-1" aria-label="Read">
            <svg
              class="w-3.5 h-3.5 text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <svg
              class="w-3.5 h-3.5 text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
