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

const isOwnMessage = computed(() => props.message.sender_id === props.currentUserId)

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
        v-if="message.sender"
        :src="message.sender.profile_picture_url"
        :name="message.sender.first_name"
        :alt="`${message.sender.first_name || 'User'}'s avatar`"
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
        v-if="!isConsecutive && message.sender"
        :class="[
          'text-xs font-semibold mb-1 px-1',
          isOwnMessage ? 'text-right text-primary-600' : 'text-left text-gray-600'
        ]"
      >
        <span class="sr-only">Message from </span>
        {{ isOwnMessage ? 'You' : message.sender.first_name }}
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
        :aria-label="`Message from ${isOwnMessage ? 'you' : message.sender?.first_name}: ${message.content}. ${statusLabel}, ${timestamp.accessible}`"
      >
        <!-- Text Message -->
        <p v-if="message.message_type === 'text'" class="text-sm leading-relaxed">
          {{ message.content }}
        </p>

        <!-- Image Message -->
        <div v-else-if="message.message_type === 'image'" class="space-y-2">
          <img
            v-if="message.media_url"
            :src="message.media_url"
            :alt="message.content || 'Shared image'"
            class="rounded-lg max-w-full h-auto"
            loading="lazy"
          />
          <p v-if="message.content" class="text-sm">{{ message.content }}</p>
        </div>

        <!-- System Message -->
        <p
          v-else-if="message.message_type === 'system'"
          class="text-xs italic text-center"
        >
          {{ message.content }}
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
