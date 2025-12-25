# Chat Implementation Guide

## ✅ What's Been Implemented

### 1. Core Services Layer (`/services`)

#### **MessageQueueService** (`services/messageQueue.ts`)
- Offline message queue with retry logic
- Exponential backoff (1s → 30s max)
- LocalStorage persistence
- Usage:
```typescript
const queue = useMessageQueue()
queue.setSendHandler(async (channelId, data) => {
  // Your API call here
})
queue.enqueue(channelId, { content: 'Hello', message_type: 'text' })
```

#### **ChatAuthService** (`services/chatAuthService.ts`)
- Token refresh management
- Automatic token validation
- Ably token generation
- Usage:
```typescript
const chatAuth = useChatAuth()
const token = await chatAuth.getValidToken(api)
```

#### **ChatErrorHandler** (`services/chatErrorHandler.ts`)
- Error categorization (Network, Auth, Rate Limit, Server, Validation)
- User-friendly error messages
- Retry logic with exponential backoff
- Usage:
```typescript
const errorHandler = useChatErrorHandler()
const result = await errorHandler.withRetry(() => api.sendMessage(...))
```

#### **ReconnectionManager** (`services/reconnectionManager.ts`)
- Automatic reconnection with backoff
- Connection state tracking
- Configurable retry attempts (default: 10)
- Usage:
```typescript
const reconnect = useReconnectionManager()
reconnect.setReconnectHandler(async () => {
  await ably.connect()
})
reconnect.startReconnecting()
```

### 2. Enhanced State Management

#### **Enhanced Ably Store** (`stores/ably.ts`)
New features added:
- Connection state tracking (`initialized`, `connecting`, `connected`, etc.)
- Connection metrics (latency, uptime, reconnect attempts)
- Error history (last 20 errors)
- Connection quality indicator (`excellent`, `good`, `poor`, `unknown`)

New getters:
- `connectionQuality` - Based on latency
- `shouldShowReconnecting` - UI indicator
- `formattedUptime` - Human-readable uptime
- `recentErrors` - Last 5 errors

New actions:
- `setConnectionState()` - Update connection state
- `updateMetrics()` - Update connection metrics
- `incrementReconnectBackoff()` - Exponential backoff
- `resetReconnectBackoff()` - Reset on successful connect

### 3. UI Components (`/components/chat`)

#### **MessageBubble.vue**
Accessible message component with:
- Sender/receiver styling
- Avatar display
- Status indicators (sending, sent, read)
- Relative timestamps ("5m ago", "yesterday")
- Screen reader support with ARIA labels
- Keyboard focus support

Props:
```vue
<MessageBubble
  :message="message"
  :current-user-id="userId"
  :is-consecutive="true"
  :show-avatar="true"
/>
```

#### **MessageStatus.vue**
Visual status indicator component:
- 6 status types: `pending`, `sending`, `sent`, `delivered`, `read`, `failed`
- Animated icons (spinner, pulse)
- Retry button for failed messages
- Accessibility labels

Props:
```vue
<MessageStatus
  status="sending"
  size="sm"
  :show-label="false"
  @retry="handleRetry"
/>
```

### 4. Composables

#### **useChatAccessibility.ts**
Accessibility utilities:
- `announce()` - Screen reader announcements
- `announceNewMessage()` - New message notifications
- `announceMessageSent()` - Send confirmations
- `announceMessageFailed()` - Error notifications
- `handleChatKeyboard()` - Keyboard navigation
- `createFocusTrap()` - Modal focus management

Usage:
```typescript
const { announce, announceNewMessage } = useChatAccessibility()

// Announce to screen readers
announce('Connection restored', 'polite')

// Announce new message
announceNewMessage('John', 'Hello there!')
```

### 5. Enhanced Type Definitions (`/types/chat.ts`)

New types added:
- `ConnectionState` - Ably connection states
- `ConnectionMetrics` - Connection quality metrics
- `QueuedMessage` - Enhanced pending messages
- `ChatErrorType` - Error categorization enum
- `ChatError` - Parsed error interface

---

## 🚀 How to Use

### Basic Integration Example

Here's how to integrate the message queue with your existing chat:

```vue
<script setup lang="ts">
// In your chat page or component
import { useMessageQueue } from '~/services/messageQueue'
import { useChatErrorHandler } from '~/services/chatErrorHandler'

const api = useApi()
const chatStore = useChatStore()
const messageQueue = useMessageQueue()
const errorHandler = useChatErrorHandler()

// Configure message queue on mount
onMounted(() => {
  messageQueue.setSendHandler(async (channelId, data) => {
    const response = await api.post(`/chat/channels/${channelId}/messages`, data)
    if (!response.success) {
      throw new Error(response.message || 'Failed to send')
    }
    return response.data
  })

  messageQueue.setOnMessageSent((clientId, serverMessage) => {
    const message = serverMessage as Message
    chatStore.addMessage(message.channel_id, message)
    console.log(`Message ${clientId} sent successfully`)
  })

  messageQueue.setOnMessageFailed((clientId, error) => {
    console.error(`Message ${clientId} failed: ${error.message}`)
    // Show toast notification to user
  })
})

// Send message with offline support
const handleSendMessage = async (content: string) => {
  const ablyStore = useAblyStore()

  // If connected, try direct send
  if (ablyStore.isConnected) {
    try {
      const response = await api.post(`/chat/channels/${channelId}/messages`, {
        content,
        message_type: 'text'
      })
      if (response.success) {
        chatStore.addMessage(channelId, response.data)
        return
      }
    } catch (error) {
      console.warn('Direct send failed, queueing...')
    }
  }

  // Queue for offline/retry
  const clientId = messageQueue.enqueue(channelId, {
    content,
    message_type: 'text'
  })

  // Add optimistic message to UI
  const optimisticMessage = {
    id: -Date.now(), // Negative ID = pending
    channel_id: channelId,
    sender_id: userId,
    content,
    message_type: 'text',
    created_at: new Date().toISOString(),
    read_at: null
  }
  chatStore.addMessage(channelId, optimisticMessage)
}
</script>
```

### Using Connection Metrics in Your UI

```vue
<template>
  <div class="chat-header">
    <!-- Connection Status Banner -->
    <div
      v-if="!ablyStore.isConnected"
      class="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm"
    >
      {{ ablyStore.shouldShowReconnecting ? 'Reconnecting...' : 'Disconnected' }}
    </div>

    <!-- Connection Quality Indicator -->
    <div v-if="ablyStore.isConnected" class="flex items-center gap-2">
      <span
        class="w-2 h-2 rounded-full"
        :class="{
          'bg-green-500': ablyStore.connectionQuality === 'excellent',
          'bg-yellow-500': ablyStore.connectionQuality === 'good',
          'bg-orange-500': ablyStore.connectionQuality === 'poor'
        }"
      />
      <span class="text-xs text-gray-500">
        {{ ablyStore.connectionQuality }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const ablyStore = useAblyStore()
</script>
```

### Using MessageBubble Component

```vue
<template>
  <div class="message-list">
    <MessageBubble
      v-for="(message, index) in messages"
      :key="message.id"
      :message="message"
      :current-user-id="currentUserId"
      :is-consecutive="isConsecutive(message, messages[index - 1])"
    />
  </div>
</template>

<script setup lang="ts">
const messages = ref<Message[]>([...])
const currentUserId = ref(123)

// Check if messages are consecutive (same sender, within 1 minute)
const isConsecutive = (current: Message, previous?: Message) => {
  if (!previous) return false
  if (current.sender_id !== previous.sender_id) return false
  const timeDiff = new Date(current.created_at).getTime() - new Date(previous.created_at).getTime()
  return timeDiff < 60000 // 1 minute
}
</script>
```

---

## 📋 Next Steps (Optional Enhancements)

While the core functionality is implemented, you can further enhance your chat by:

1. **Enhanced ChatInput Component**
   - Add emoji picker (use a library like `emoji-mart` or build custom)
   - Character count with limit
   - Auto-resize textarea
   - Attachment support

2. **Enhanced MessageList Component**
   - Virtual scrolling for large message lists (use `@vueuse/core` useVirtualList)
   - Auto-scroll to bottom
   - Load more pagination
   - Date separators

3. **ChatService Orchestration Layer**
   - Centralized service to coordinate API, Ably, queue, and stores
   - See the detailed implementation in the agent output above

4. **Enhanced Ably Plugin**
   - Connection quality monitoring with heartbeat
   - See the detailed implementation in the agent output above

---

## 🎯 Benefits You Now Have

✅ **Offline Resilience** - Messages queue when offline and send when reconnected
✅ **Retry Logic** - Automatic exponential backoff retry for failed messages
✅ **Error Handling** - User-friendly error messages with categorization
✅ **Connection Monitoring** - Real-time connection quality and metrics
✅ **Accessibility** - Screen reader support and keyboard navigation
✅ **Visual Feedback** - Message status indicators and animations
✅ **Type Safety** - Enhanced TypeScript types throughout

---

## 🐛 Troubleshooting

### Messages not sending when offline?
- Check that you're calling `messageQueue.enqueue()` when Ably is disconnected
- Verify the send handler is configured in `onMounted()`
- Check localStorage for `chat_message_queue` to see queued messages

### Connection quality showing "unknown"?
- This is normal when disconnected
- Once connected, metrics will populate within 30 seconds (first heartbeat)

### Errors not being categorized properly?
- Check the error object structure in browser console
- The error handler looks for `http_status` and `code` properties
- You may need to adapt your API error responses

---

## 📚 Additional Resources

- The original detailed implementations from both agents are above in this conversation
- Your existing `useChat.ts` and `useAbly.ts` composables can integrate with these new services
- The enhanced Ably store is backward compatible with your existing code

---

## 🤝 Integration with Existing Code

All the new code is designed to work alongside your existing implementation:

1. **Stores**: The enhanced `ably.ts` store maintains backward compatibility
2. **Services**: New services are standalone and can be adopted incrementally
3. **Components**: New components use your existing `Message` type definitions
4. **Composables**: Work with your existing stores and APIs

You can adopt these enhancements incrementally without breaking existing functionality!
