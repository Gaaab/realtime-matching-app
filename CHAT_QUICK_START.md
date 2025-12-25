# Chat Implementation Quick Start Guide

## Overview

Your Nuxt 4 dating app has a **solid foundation** for chat functionality. This guide helps you start implementing the missing pieces.

## Current Status

### What You Have (Excellent!)
- Ably real-time connection configured and working
- Comprehensive chat store with offline support
- Modern, responsive UI components
- Type-safe implementation
- Message queuing for offline scenarios
- Presence and typing indicators

### What You Need to Add
1. Request/approval flow for dating context
2. Group chat support
3. Image/media sharing
4. Enhanced components (header, message bubbles, etc.)

## Phase 1: Essential Features (Start Here)

### 1. Add Request/Approval Flow

**Create:** `components/chat/ChatRequestCard.vue`
```vue
<template>
  <div class="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
    <div class="flex items-center gap-3">
      <UiAvatar :src="channel.participants[0]?.profile_picture_url" size="md" />
      <div class="flex-1">
        <h3 class="font-semibold">{{ channel.participants[0]?.first_name }} wants to connect</h3>
        <p class="text-sm text-gray-600">Sent a connection request</p>
      </div>
    </div>
    <div class="flex gap-2 mt-3">
      <button @click="approve" class="btn-approve">Accept</button>
      <button @click="reject" class="btn-reject">Decline</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Implementation details in full plan
</script>
```

**Update:** `composables/useChat.ts`
```typescript
// Add these methods:

const approveChannelRequest = async (channelId: number) => {
  try {
    const response = await api.post(`/chat/channels/${channelId}/approve`)
    if (response.success) {
      chatStore.updateChannel(channelId, {
        chat_requires_approval: false,
        approved_at: new Date().toISOString()
      })
      return true
    }
  } catch (error) {
    console.error('Approve request error:', error)
    throw error
  }
}

const rejectChannelRequest = async (channelId: number) => {
  // Similar implementation
}
```

### 2. Subscribe to User Channel

**In your chat page setup:**
```typescript
// pages/chat.vue - onMounted
const { subscribeToUserChannel } = useChat()

onMounted(() => {
  // Subscribe to global user events
  subscribeToUserChannel()

  // Load channels
  loadChannels()
})
```

**Add to useChat.ts:**
```typescript
const subscribeToUserChannel = () => {
  const { $ably } = useNuxtApp()
  const authStore = useAuthStore()

  const userChannel = $ably.channels.get(`users.${authStore.user.id}.channels`)

  userChannel.subscribe('channel:created', (event) => {
    chatStore.addChannel(event.data)
  })

  userChannel.subscribe('channel:updated', (event) => {
    chatStore.updateChannel(event.data.id, event.data)
  })
}
```

### 3. Enhance ConversationsList

**Add tabs for Requests:**
```vue
<template>
  <div class="flex flex-col h-full bg-gray-50 border-r border-gray-200">
    <!-- Tabs -->
    <div class="flex border-b border-gray-200">
      <button
        @click="activeTab = 'all'"
        :class="['flex-1 py-3', activeTab === 'all' && 'border-b-2 border-primary-500']"
      >
        All
      </button>
      <button
        @click="activeTab = 'requests'"
        :class="['flex-1 py-3', activeTab === 'requests' && 'border-b-2 border-primary-500']"
      >
        Requests
        <span v-if="requestCount > 0" class="badge">{{ requestCount }}</span>
      </button>
    </div>

    <!-- List based on active tab -->
    <div class="flex-1 overflow-y-auto">
      <template v-if="activeTab === 'requests'">
        <!-- Show channels with chat_requires_approval = true -->
      </template>
      <template v-else>
        <!-- Show all channels -->
      </template>
    </div>
  </div>
</template>
```

## Phase 2: Enhanced Components

### Create Specialized Components

**1. MessageBubble.vue**
```vue
<template>
  <div :class="['flex gap-3', isOwnMessage ? 'flex-row-reverse' : 'flex-row']">
    <!-- Avatar -->
    <UiAvatar v-if="showAvatar" :src="message.user?.profile_picture_url" size="sm" />
    <div v-else class="w-10"></div>

    <!-- Message Content -->
    <div :class="['max-w-xs lg:max-w-md']">
      <!-- Name -->
      <p v-if="showAvatar" class="text-xs font-semibold mb-1 px-3">
        {{ isOwnMessage ? 'You' : message.user?.first_name }}
      </p>

      <!-- Bubble -->
      <div :class="bubbleClasses">
        <template v-if="message.message_type === 'image'">
          <img :src="message.media_url" alt="Image" class="rounded-lg max-w-full" />
        </template>
        <template v-else>
          {{ message.content }}
        </template>
      </div>

      <!-- Timestamp & Status -->
      <div class="flex items-center gap-1 text-xs mt-1 px-3 text-gray-500">
        <span>{{ formatTime(message.created_at) }}</span>
        <StatusIcon v-if="isOwnMessage" :status="message.status" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// See full implementation in plan
</script>
```

**2. ChatHeader.vue**
```vue
<template>
  <div class="border-b border-gray-200 p-4 flex items-center justify-between bg-white">
    <div class="flex items-center gap-3">
      <button @click="$emit('back')" class="md:hidden">
        <!-- Back arrow icon -->
      </button>
      <UiAvatar :src="recipientAvatar" size="md" />
      <div>
        <h2 class="text-lg font-bold">{{ channelName }}</h2>
        <p class="text-xs text-gray-500">{{ statusText }}</p>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex items-center gap-2">
      <button class="p-2 hover:bg-gray-100 rounded-lg">
        <!-- Call icon -->
      </button>
      <button class="p-2 hover:bg-gray-100 rounded-lg">
        <!-- More options icon -->
      </button>
    </div>
  </div>
</template>
```

## Backend Requirements

### API Endpoints Needed

```typescript
// Request/Approval
POST /chat/channels/{channelId}/approve
POST /chat/channels/{channelId}/reject

// Channels
GET  /chat/channels/request?filter[type]=direct
POST /chat/channels (create channel for match)

// Messages
POST /chat/channels/{channelId}/messages
DELETE /chat/channels/{channelId}/messages/{messageId}/remove-for-you
DELETE /chat/channels/{channelId}/messages/{messageId}/remove-for-everyone

// Media
POST /media (with type: 'chat')
```

### Ably Server Events

Your backend must publish these events after database operations:

```typescript
// After creating a message
ably.channels.get(`channel:${channelId}`).publish('message:created', message)

// After creating a channel
ably.channels.get(`users.${userId}.channels`).publish('channel:created', channel)

// After updating a channel (new message, read, etc.)
ably.channels.get(`users.${userId}.channels`).publish('channel:updated', channel)
```

## Testing Your Implementation

### 1. Test Request Flow

**User A (Chrome):**
```javascript
// Send first message to User B
await createChannelForMatch(matchId)
await sendMessage(channelId, "Hi! Nice to meet you!")
```

**User B (Firefox/Incognito):**
```javascript
// Should see request in "Requests" tab
// Click "Accept"
// Should now be able to send messages
```

### 2. Test Real-time Sync

**User A:**
```javascript
// Send a message
await sendMessage(channelId, "Testing real-time")
```

**User B (open chat):**
```javascript
// Should see message appear instantly
// Should see typing indicator when A types
```

### 3. Test Offline Queue

**User A:**
```javascript
// Disconnect network
await sendMessage(channelId, "Offline message")
// Should see as "pending"

// Reconnect network
// Should see message send and update to "sent"
```

## Styling Guide

### Color Scheme

```typescript
// Your message bubbles
bg-primary-500 text-white rounded-2xl rounded-br-none

// Their message bubbles
bg-gray-100 text-gray-900 rounded-2xl rounded-bl-none

// Request/approval elements
bg-amber-50 border-l-4 border-amber-500

// Unread badges
bg-primary-500 text-white rounded-full

// Online status
bg-green-500 (online)
bg-gray-400 (offline)
```

### Responsive Breakpoints

```typescript
// Mobile (< 768px): Full-width chat
// Tablet (768px+): Sidebar + chat
// Desktop (1024px+): Wide sidebar
```

## Common Issues & Solutions

### Issue: Messages not appearing in real-time

**Check:**
1. Is Ably connected? (Check console for "Ably connected")
2. Is channel subscribed? (Check `ablyStore.activeChannels`)
3. Is backend publishing events?
4. Check network tab for Ably WebSocket

**Solution:**
```typescript
// Debug subscription
console.log('Active channels:', ablyStore.activeChannels)
console.log('Subscribed to channel:', chatStore.isChannelSubscribed(channelId))
```

### Issue: Duplicate messages

**Check:**
1. Are you subscribing multiple times?
2. Is deduplication working?

**Solution:**
```typescript
// Already implemented in useChat.ts
const processedMessageIds = ref<Set<string>>(new Set())

// In message handler
if (processedMessageIds.value.has(messageKey)) {
  return // Skip duplicate
}
processedMessageIds.value.add(messageKey)
```

### Issue: Offline messages not sending

**Check:**
1. Is message queue populated? (Check `chatStore.messageQueue`)
2. Did reconnection trigger flush?

**Solution:**
```typescript
// Manually trigger flush (for testing)
await flushMessageQueue(channelId)
```

## Next Steps

1. Start with Phase 1 (Request/Approval Flow)
2. Test thoroughly with two users
3. Move to Phase 2 (Group Chat) once Phase 1 is stable
4. Add media support in Phase 3
5. Polish UX in Phase 4

## Resources

- **Full Implementation Plan:** `/Users/gabriel/Developer/intro/web-app/CHAT_IMPLEMENTATION_PLAN.md`
- **Reference Module:** `/Users/gabriel/Developer/appetiser/chat-module`
- **Current Implementation:** `/Users/gabriel/Developer/intro/web-app/components/chat/`
- **Ably Docs:** https://ably.com/docs
- **Nuxt 4 Docs:** https://nuxt.com/docs

## Support

If you encounter issues:
1. Check console for errors
2. Verify Ably connection status
3. Check network tab for API calls
4. Review the full implementation plan
5. Test with the reference module patterns

Good luck with your implementation!
