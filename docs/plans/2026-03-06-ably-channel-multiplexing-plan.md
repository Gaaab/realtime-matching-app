# Ably Channel Multiplexing — Client Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace per-channel Ably subscriptions with a single multiplexed `user.{userId}` channel, routing all realtime events (chat, match, venue, presence, notifications) through a central event router.

**Architecture:** New `useRealtime` composable acts as the central event router — subscribes to one Ably channel, parses namespaced event names, and dispatches to domain-specific handlers registered by `useChat`, `useMatches`, `useVenues`, `usePresence`, and `useNotifications`.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Pinia (Options API), Ably SDK `^2.16.0`, Tailwind CSS

**Design doc:** `docs/plans/2026-03-06-ably-channel-multiplexing-design.md`

---

## Task 1: Add Realtime Types

**Files:**
- Create: `types/realtime.ts`

**Step 1: Create the types file**

```typescript
// types/realtime.ts

export type RealtimeScope = 'chat' | 'venue' | 'user'

export interface ParsedEvent {
  scope: RealtimeScope
  id: string | null
  action: string
}

export interface RealtimeEnvelope {
  event: string
  data: Record<string, any>
  meta: {
    timestamp: string
    version: string
    source: string
  }
}

export type RealtimeHandler = (event: ParsedEvent, envelope: RealtimeEnvelope) => void

export interface BroadcastingChannelsResponse {
  channel: string
}
```

**Step 2: Verify no TypeScript errors**

Run: `npx nuxi typecheck` (or just confirm the file is syntactically correct by inspection — no test framework for types).

**Step 3: Commit**

```bash
git add types/realtime.ts
git commit -m "feat: add realtime event types for channel multiplexing"
```

---

## Task 2: Add Notification Types and Store

**Files:**
- Create: `types/notification.ts`
- Create: `stores/notifications.ts`

**Step 1: Create notification types**

```typescript
// types/notification.ts

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, any>
  read_at: string | null
  created_at: string
}
```

**Step 2: Create notifications store**

```typescript
// stores/notifications.ts

import { defineStore } from 'pinia'
import type { AppNotification } from '~/types/notification'

interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
}

export const useNotificationsStore = defineStore('notifications', {
  state: (): NotificationsState => ({
    notifications: [],
    unreadCount: 0,
  }),

  getters: {
    hasUnread: (state) => state.unreadCount > 0,

    recentNotifications: (state) => {
      return [...state.notifications]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50)
    },
  },

  actions: {
    addNotification(notification: AppNotification) {
      const exists = this.notifications.find(n => n.id === notification.id)
      if (!exists) {
        this.notifications.unshift(notification)
        if (!notification.read_at) {
          this.unreadCount++
        }
      }
    },

    markRead(notificationId: string) {
      const notification = this.notifications.find(n => n.id === notificationId)
      if (notification && !notification.read_at) {
        notification.read_at = new Date().toISOString()
        this.unreadCount = Math.max(0, this.unreadCount - 1)
      }
    },

    markAllRead() {
      this.notifications.forEach(n => {
        if (!n.read_at) {
          n.read_at = new Date().toISOString()
        }
      })
      this.unreadCount = 0
    },

    setNotifications(notifications: AppNotification[]) {
      this.notifications = notifications
      this.unreadCount = notifications.filter(n => !n.read_at).length
    },

    reset() {
      this.notifications = []
      this.unreadCount = 0
    },
  },
})
```

**Step 3: Commit**

```bash
git add types/notification.ts stores/notifications.ts
git commit -m "feat: add notification types and Pinia store"
```

---

## Task 3: Add Presence Store

**Files:**
- Create: `stores/presence.ts`

**Step 1: Create presence store**

```typescript
// stores/presence.ts

import { defineStore } from 'pinia'

export interface UserPresence {
  userId: number
  status: 'online' | 'offline' | 'away'
  lastActiveAt: string
}

interface PresenceState {
  userPresence: Record<number, UserPresence>
}

export const usePresenceStore = defineStore('presence', {
  state: (): PresenceState => ({
    userPresence: {},
  }),

  getters: {
    isOnline: (state) => {
      return (userId: number): boolean => {
        return state.userPresence[userId]?.status === 'online'
      }
    },

    getPresence: (state) => {
      return (userId: number): UserPresence | null => {
        return state.userPresence[userId] || null
      }
    },
  },

  actions: {
    updatePresence(userId: number, data: { status: string; last_active_at: string }) {
      this.userPresence[userId] = {
        userId,
        status: data.status as UserPresence['status'],
        lastActiveAt: data.last_active_at,
      }
    },

    removePresence(userId: number) {
      delete this.userPresence[userId]
    },

    reset() {
      this.userPresence = {}
    },
  },
})
```

**Step 2: Commit**

```bash
git add stores/presence.ts
git commit -m "feat: add presence store for user online status tracking"
```

---

## Task 4: Create the Event Router (`useRealtime`)

This is the central piece. It subscribes to a single Ably channel and routes events.

**Files:**
- Create: `composables/useRealtime.ts`

**Step 1: Create the composable**

```typescript
// composables/useRealtime.ts

import type { Realtime, RealtimeChannel } from 'ably'
import type { ParsedEvent, RealtimeEnvelope, RealtimeHandler, RealtimeScope, BroadcastingChannelsResponse } from '~/types/realtime'

function parseEvent(name: string): ParsedEvent {
  if (name.startsWith('chat:')) {
    const parts = name.split(':')
    const uuid = parts[1]
    const action = parts.slice(2).join(':')
    return { scope: 'chat', id: uuid, action }
  }
  if (name.startsWith('venue:')) {
    const parts = name.split(':')
    const venueId = parts[1]
    const action = parts.slice(2).join(':')
    return { scope: 'venue', id: venueId, action }
  }
  return { scope: 'user', id: null, action: name }
}

const handlers = new Map<RealtimeScope, Set<RealtimeHandler>>()
let channel: RealtimeChannel | null = null
let channelName: string | null = null
let isSubscribed = false

export const useRealtime = () => {
  const nuxt = useNuxtApp()
  const ablyStore = useAblyStore()

  function getAbly(): Realtime | null {
    return nuxt.$ably as Realtime | null
  }

  function registerHandler(scope: RealtimeScope, handler: RealtimeHandler) {
    if (!handlers.has(scope)) {
      handlers.set(scope, new Set())
    }
    handlers.get(scope)!.add(handler)
  }

  function unregisterHandler(scope: RealtimeScope, handler: RealtimeHandler) {
    handlers.get(scope)?.delete(handler)
  }

  function dispatch(parsed: ParsedEvent, envelope: RealtimeEnvelope) {
    const scopeHandlers = handlers.get(parsed.scope)
    if (scopeHandlers) {
      scopeHandlers.forEach(handler => {
        try {
          handler(parsed, envelope)
        } catch (err) {
          console.error(`[Realtime] Handler error for ${parsed.scope}:${parsed.action}:`, err)
        }
      })
    }
  }

  async function connect() {
    const ably = getAbly()
    if (!ably || isSubscribed) return

    try {
      // Fetch channel name from backend
      const api = useApi()
      const response = await api.get<BroadcastingChannelsResponse>('/broadcasting/channels')

      if (!response.success || !response.data?.channel) {
        console.error('[Realtime] Failed to get channel name from backend')
        return
      }

      channelName = response.data.channel
      channel = ably.channels.get(channelName)

      // Subscribe to all events on this channel
      channel.subscribe((message) => {
        try {
          const envelope = message.data as RealtimeEnvelope
          if (!envelope?.event) {
            console.warn('[Realtime] Received message without event field:', message)
            return
          }

          const parsed = parseEvent(envelope.event)
          dispatch(parsed, envelope)
        } catch (err) {
          console.error('[Realtime] Error processing message:', err)
        }
      })

      isSubscribed = true
      ablyStore.addActiveChannel(channelName)
      console.log(`[Realtime] Subscribed to ${channelName}`)
    } catch (err) {
      console.error('[Realtime] Failed to connect:', err)
    }
  }

  function disconnect() {
    if (channel && channelName) {
      channel.unsubscribe()
      ablyStore.removeActiveChannel(channelName)
      channel = null
      channelName = null
      isSubscribed = false
      console.log('[Realtime] Disconnected')
    }
  }

  function reset() {
    disconnect()
    handlers.clear()
  }

  return {
    connect,
    disconnect,
    reset,
    registerHandler,
    unregisterHandler,
    parseEvent,
  }
}
```

**Step 2: Verify the file compiles**

Run: `npx nuxi typecheck` or just visually confirm types align.

**Step 3: Commit**

```bash
git add composables/useRealtime.ts
git commit -m "feat: add useRealtime event router for multiplexed channel"
```

---

## Task 5: Update Plugin to Use Event Router

**Files:**
- Modify: `plugins/ably.client.ts`

**Step 1: Update the plugin**

Replace the connection monitoring block to also connect the realtime router after Ably connects. The key change: after `ably.connect()`, watch for the `connected` state and call `useRealtime().connect()`.

In `plugins/ably.client.ts`, replace lines 86-138 (from `ably.connect()` to the end of the connection monitoring) with:

```typescript
    // Connect to Ably
    ably.connect()

    // Connection state monitoring
    ably.connection.on((stateChange) => {
      const ablyStore = useAblyStore()

      switch (stateChange.current) {
        case 'connected':
          ablyStore.setConnected(true)
          ablyStore.setConnectionError(null)
          console.log('Ably connected')

          // Subscribe to the multiplexed channel
          useRealtime().connect()
          break

        case 'connecting':
          console.log('Ably connecting...')
          break

        case 'disconnected':
          ablyStore.setConnected(false)
          console.log('Ably disconnected')
          break

        case 'suspended':
          ablyStore.setConnected(false)
          console.warn('Ably suspended - will attempt to reconnect')
          break

        case 'closed':
          ablyStore.setConnected(false)
          console.error('Ably connection closed')
          break

        case 'failed':
          ablyStore.setConnected(false)
          ablyStore.setConnectionError({
            code: stateChange.reason?.code || 0,
            message: stateChange.reason?.message || 'Unknown error',
            statusCode: stateChange.reason?.statusCode || 0
          })
          console.error('Ably connection failed:', stateChange.reason)
          break
      }
    })

    // Handle errors
    ably.connection.on('error', (error) => {
      const ablyStore = useAblyStore()
      ablyStore.setConnectionError({
        code: error.code || 0,
        message: error.message,
        statusCode: error.statusCode || 0
      })
      console.error('Ably error:', error)
    })
```

The only change from original is adding `useRealtime().connect()` inside the `'connected'` case.

**Step 2: Verify app still boots**

Run: `npm run dev` — confirm no errors in console, Ably initializes.

**Step 3: Commit**

```bash
git add plugins/ably.client.ts
git commit -m "feat: wire useRealtime event router into Ably plugin"
```

---

## Task 6: Update Chat Composable to Use Event Router

Replace the Ably per-channel subscription in `useChat.ts` with registering a handler via `useRealtime`.

**Files:**
- Modify: `composables/useChat.ts`

**Step 1: Replace Ably integration in useChat**

Key changes:
1. Remove `useAbly()` import and usage
2. Add `useRealtime()` handler registration
3. Replace `subscribeToChannelUpdates()` with a realtime handler
4. Replace `loadChannelPresence()` — no more Ably presence, just REST (already loaded by store)
5. Replace `publishTypingViaAbly()` — typing now goes through the API endpoint `POST /channels/{channel}/typing`
6. Remove `subscribeToChannelLegacy()`

Replace the entire Ably section (lines 200-431) and update the import (line 9):

Remove line 9 (`const { subscribeToChannel, publishMessage, subscribeToPresence } = useAbly()`)

Add after the `processingMessageIds` ref:

```typescript
  // Register realtime event handler for chat events
  const { registerHandler, unregisterHandler } = useRealtime()

  const chatRealtimeHandler = (event: ParsedEvent, envelope: RealtimeEnvelope) => {
    // event.id is the chat channel UUID
    // We need to find the channel by its channel_id (UUID)
    const channelUuid = event.id
    if (!channelUuid) return

    const channel = chatStore.channels.find(c => c.channel_id === channelUuid)
    if (!channel) {
      console.warn(`[Chat] Received event for unknown channel UUID: ${channelUuid}`)
      return
    }

    const channelId = channel.id

    switch (event.action) {
      case 'message:created': {
        const message = envelope.data as Message
        const messageKey = `${message.id}`
        if (processedMessageIds.value.has(messageKey)) return
        processedMessageIds.value.add(messageKey)
        chatStore.addMessage(channelId, message)
        break
      }
      case 'message:updated': {
        const updatedMessage = envelope.data as Message
        chatStore.addMessage(channelId, updatedMessage)
        break
      }
      case 'message:deleted': {
        const messageId = envelope.data.id
        const messages = chatStore.getMessagesByChannel(channelId)
        chatStore.setMessages(channelId, messages.filter(m => m.id !== messageId))
        break
      }
      case 'typing:started': {
        const userId = envelope.data.user_id
        if (userId) chatStore.setTypingUser(channelId, userId, true)
        break
      }
      case 'typing:stopped': {
        const userId = envelope.data.user_id
        if (userId) chatStore.setTypingUser(channelId, userId, false)
        break
      }
      case 'channel:expiring_soon': {
        // Update channel metadata — could show a warning in UI
        console.log(`[Chat] Channel ${channelUuid} expiring soon`)
        break
      }
      case 'channel:archived': {
        // Mark channel as archived
        console.log(`[Chat] Channel ${channelUuid} archived`)
        break
      }
    }
  }

  // Register on composable creation
  registerHandler('chat', chatRealtimeHandler)
```

Replace `subscribeToChannelUpdates` with a no-op (channels are now auto-subscribed via the global handler):

```typescript
  const subscribeToChannelUpdates = (_channelId: number) => {
    // No-op: chat events are handled by the global realtime handler
    chatStore.setChannelSubscribed(_channelId, true)
    return () => {}
  }
```

Replace `openChannelWithAbly` — remove presence loading via Ably:

```typescript
  const openChannelWithAbly = async (channelId: number) => {
    try {
      chatStore.setLoading(true)
      chatStore.setSyncStatus(channelId, 'syncing')

      const messagesResponse = await fetchMessages(channelId, 1, 50)
      messagesResponse.forEach((msg) => {
        processedMessageIds.value.add(msg.id.toString())
      })

      // Mark channel as subscribed (events come through global realtime handler)
      chatStore.setChannelSubscribed(channelId, true)

      chatStore.setSyncStatus(channelId, 'synced')
      chatStore.setLastSyncedAt(channelId, new Date().toISOString())
    } catch (error: any) {
      chatStore.setSyncStatus(channelId, 'error')
      chatStore.setError(error.message)
      throw error
    } finally {
      chatStore.setLoading(false)
    }
  }
```

Replace `loadChannelPresence` — no more Ably presence:

```typescript
  const loadChannelPresence = async (_channelId: number) => {
    // Presence is now handled by the presence store via realtime events
    // No per-channel Ably presence subscription needed
  }
```

Replace `publishTypingViaAbly` — now calls the REST API:

```typescript
  const publishTypingViaAbly = async (channelId: number, isTyping: boolean) => {
    try {
      // Find the channel to get its ID for the API call
      const channel = chatStore.channels.find(c => c.id === channelId)
      if (!channel) return

      await api.post(`/chat/channels/${channel.id}/typing`, {
        is_typing: isTyping,
      })
    } catch (err) {
      console.warn('Failed to publish typing indicator:', err)
    }
  }
```

Remove `subscribeToChannelLegacy` from the return statement.

Add cleanup on unmount:

```typescript
  onBeforeUnmount(() => {
    unregisterHandler('chat', chatRealtimeHandler)
  })
```

**Step 2: Add the missing import at the top**

Add after line 2:

```typescript
import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'
```

**Step 3: Verify app boots and chat page loads**

Run: `npm run dev` — navigate to chat, confirm no errors.

**Step 4: Commit**

```bash
git add composables/useChat.ts
git commit -m "refactor: migrate useChat from per-channel Ably to realtime event router"
```

---

## Task 7: Add Match Realtime Handler

**Files:**
- Modify: `composables/useMatches.ts`

**Step 1: Read the current file to understand its structure**

The composable needs a realtime handler for: `match:created`, `match:unmatched`, `match:chat_renewed`, `profile:revealed`, `profile:unrevealed`.

**Step 2: Add the handler**

At the beginning of the `useMatches` function, after store initialization, add:

```typescript
import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'

// Inside useMatches():
  const { registerHandler, unregisterHandler } = useRealtime()
  const matchesStore = useMatchesStore()

  const matchRealtimeHandler = (event: ParsedEvent, envelope: RealtimeEnvelope) => {
    switch (event.action) {
      case 'match:created': {
        const match = envelope.data as Match
        matchesStore.addMatch(match)
        break
      }
      case 'match:unmatched': {
        const matchId = envelope.data.match_id || envelope.data.id
        if (matchId) matchesStore.removeMatch(matchId)
        break
      }
      case 'match:chat_renewed': {
        const matchId = envelope.data.match_id || envelope.data.id
        if (matchId) {
          matchesStore.updateMatch(matchId, {
            expires_at: envelope.data.expires_at,
          })
        }
        break
      }
      case 'profile:revealed': {
        const reveal = envelope.data as ProfileReveal
        matchesStore.addReveal(reveal)
        break
      }
      case 'profile:unrevealed': {
        const revealId = envelope.data.id
        const reveals = matchesStore.reveals.filter(r => r.id !== revealId)
        matchesStore.setReveals(reveals)
        break
      }
    }
  }

  registerHandler('user', matchRealtimeHandler)

  onBeforeUnmount(() => {
    unregisterHandler('user', matchRealtimeHandler)
  })
```

**Step 3: Commit**

```bash
git add composables/useMatches.ts
git commit -m "feat: add realtime event handler for matches and profile reveals"
```

---

## Task 8: Add Venue Realtime Handler + REST Presence

**Files:**
- Modify: `composables/useVenues.ts`
- Modify: `stores/venues.ts`

**Step 1: Add venue presence API call to useVenues composable**

Add a new function to `useVenues`:

```typescript
  const getVenuePresence = async (venueId: number) => {
    try {
      const response = await api.get<NearbyUser[]>(`/venue/${venueId}/presence`)
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch venue presence')
    } catch (error: any) {
      console.error('Fetch venue presence error:', error)
      throw error
    }
  }
```

Add it to the return statement.

**Step 2: Add realtime handler for venue events in useVenues**

```typescript
import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'

// Inside useVenues():
  const { registerHandler, unregisterHandler } = useRealtime()
  const venuesStore = useVenuesStore()

  const venueRealtimeHandler = (event: ParsedEvent, envelope: RealtimeEnvelope) => {
    const venueId = event.id ? parseInt(event.id, 10) : null
    if (!venueId) return

    switch (event.action) {
      case 'user_checked_in': {
        const user = envelope.data as NearbyUser
        // Only update if we're viewing this venue
        if (venuesStore.selectedVenue?.id === venueId || venuesStore.checkedInVenueId === venueId) {
          // Add user to nearbyUsers if not already present
          const exists = venuesStore.nearbyUsers.find(u => u.user_id === user.user_id)
          if (!exists) {
            venuesStore.nearbyUsers.push(user)
          }
        }
        break
      }
      case 'user_checked_out': {
        const userId = envelope.data.user_id
        if (venuesStore.selectedVenue?.id === venueId || venuesStore.checkedInVenueId === venueId) {
          venuesStore.nearbyUsers = venuesStore.nearbyUsers.filter(u => u.user_id !== userId)
        }
        break
      }
    }
  }

  registerHandler('venue', venueRealtimeHandler)

  onBeforeUnmount(() => {
    unregisterHandler('venue', venueRealtimeHandler)
  })
```

**Step 3: Update venue detail open flow in store**

In `stores/venues.ts`, update `fetchNearbyUsers` to also work with the new `/venue/{id}/presence` endpoint (keep existing behavior — the composable already calls `/venue/{id}/nearby-users` or similar). The store action already delegates to the composable, so it should work. If the API endpoint changes, update the composable's `getNearbyUsers` to point at the new endpoint.

**Step 4: Commit**

```bash
git add composables/useVenues.ts stores/venues.ts
git commit -m "feat: add venue realtime handler and REST presence endpoint"
```

---

## Task 9: Add Presence Realtime Handler

**Files:**
- Create: `composables/usePresence.ts`

**Step 1: Create the composable**

```typescript
// composables/usePresence.ts

import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'
import { usePresenceStore } from '~/stores/presence'

export const usePresence = () => {
  const presenceStore = usePresenceStore()
  const { registerHandler, unregisterHandler } = useRealtime()

  const presenceRealtimeHandler = (event: ParsedEvent, envelope: RealtimeEnvelope) => {
    if (event.action !== 'presence:changed') return

    const { user_id, status, last_active_at } = envelope.data
    if (!user_id) return

    if (status === 'offline') {
      presenceStore.removePresence(user_id)
    } else {
      presenceStore.updatePresence(user_id, {
        status,
        last_active_at: last_active_at || new Date().toISOString(),
      })
    }
  }

  registerHandler('user', presenceRealtimeHandler)

  const isOnline = (userId: number) => presenceStore.isOnline(userId)
  const getPresence = (userId: number) => presenceStore.getPresence(userId)

  onBeforeUnmount(() => {
    unregisterHandler('user', presenceRealtimeHandler)
  })

  return {
    isOnline,
    getPresence,
  }
}
```

**Step 2: Commit**

```bash
git add composables/usePresence.ts
git commit -m "feat: add presence composable with realtime event handling"
```

---

## Task 10: Add Notifications Realtime Handler

**Files:**
- Create: `composables/useNotifications.ts`

**Step 1: Create the composable**

```typescript
// composables/useNotifications.ts

import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'
import { useNotificationsStore } from '~/stores/notifications'
import type { AppNotification } from '~/types/notification'

export const useNotifications = () => {
  const api = useApi()
  const notificationsStore = useNotificationsStore()
  const { registerHandler, unregisterHandler } = useRealtime()

  // Toast state
  const activeToast = ref<AppNotification | null>(null)
  let toastTimeout: ReturnType<typeof setTimeout> | null = null

  const showToast = (notification: AppNotification) => {
    activeToast.value = notification
    if (toastTimeout) clearTimeout(toastTimeout)
    toastTimeout = setTimeout(() => {
      activeToast.value = null
    }, 5000)
  }

  const dismissToast = () => {
    activeToast.value = null
    if (toastTimeout) clearTimeout(toastTimeout)
  }

  const notificationRealtimeHandler = (event: ParsedEvent, envelope: RealtimeEnvelope) => {
    if (event.action !== 'notification:created') return

    const notification: AppNotification = {
      id: envelope.data.id || crypto.randomUUID(),
      type: envelope.data.type || 'general',
      title: envelope.data.title || 'New Notification',
      body: envelope.data.body || '',
      data: envelope.data,
      read_at: null,
      created_at: envelope.meta.timestamp || new Date().toISOString(),
    }

    notificationsStore.addNotification(notification)
    showToast(notification)
  }

  registerHandler('user', notificationRealtimeHandler)

  const fetchNotifications = async () => {
    try {
      const response = await api.get<AppNotification[]>('/notifications')
      if (response.success && response.data) {
        notificationsStore.setNotifications(response.data)
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch notifications')
    } catch (error: any) {
      console.error('Fetch notifications error:', error)
      throw error
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await api.post(`/notifications/${notificationId}/read`)
      notificationsStore.markRead(notificationId)
    } catch (error: any) {
      console.error('Mark notification read error:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all')
      notificationsStore.markAllRead()
    } catch (error: any) {
      console.error('Mark all notifications read error:', error)
    }
  }

  onBeforeUnmount(() => {
    unregisterHandler('user', notificationRealtimeHandler)
  })

  return {
    activeToast: computed(() => activeToast.value),
    dismissToast,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    notifications: computed(() => notificationsStore.recentNotifications),
    unreadCount: computed(() => notificationsStore.unreadCount),
    hasUnread: computed(() => notificationsStore.hasUnread),
  }
}
```

**Step 2: Commit**

```bash
git add composables/useNotifications.ts
git commit -m "feat: add notifications composable with realtime events and toast"
```

---

## Task 11: Create Toast UI Component

**Files:**
- Create: `components/ui/Toast.vue`

**Step 1: Create the component**

```vue
<script setup lang="ts">
import type { AppNotification } from '~/types/notification'

defineProps<{
  notification: AppNotification | null
}>()

const emit = defineEmits<{
  dismiss: []
}>()
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="notification"
      class="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
    >
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-start gap-3">
        <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-900 truncate">{{ notification.title }}</p>
          <p class="text-sm text-gray-600 line-clamp-2">{{ notification.body }}</p>
        </div>
        <button
          @click="emit('dismiss')"
          class="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>
```

**Step 2: Commit**

```bash
git add components/ui/Toast.vue
git commit -m "feat: add Toast notification UI component"
```

---

## Task 12: Create Online Indicator Component

**Files:**
- Create: `components/ui/OnlineIndicator.vue`

**Step 1: Create the component**

```vue
<script setup lang="ts">
const props = defineProps<{
  userId: number
  size?: 'sm' | 'md' | 'lg'
}>()

const presenceStore = usePresenceStore()
const isOnline = computed(() => presenceStore.isOnline(props.userId))

const sizeClasses = computed(() => {
  switch (props.size || 'sm') {
    case 'sm': return 'w-2.5 h-2.5'
    case 'md': return 'w-3 h-3'
    case 'lg': return 'w-3.5 h-3.5'
  }
})
</script>

<template>
  <span
    v-if="isOnline"
    :class="[sizeClasses, 'inline-block rounded-full bg-green-500 ring-2 ring-white']"
    aria-label="Online"
  />
</template>
```

**Step 2: Commit**

```bash
git add components/ui/OnlineIndicator.vue
git commit -m "feat: add OnlineIndicator component for user presence"
```

---

## Task 13: Wire Dynamic Badges into Bottom Navigation

**Files:**
- Modify: `components/BottomNavigation.vue`

**Step 1: Replace hardcoded badges with store data**

In the `<script setup>` section, add imports and computed properties:

```typescript
import { useChatStore } from '~/stores/chat'
import { useNotificationsStore } from '~/stores/notifications'

const chatStore = useChatStore()
const notificationsStore = useNotificationsStore()
```

Update the `navItems` to remove hardcoded badges:

```typescript
const navItems = [
  {
    name: 'Explore',
    icon: 'explore',
    path: '/explore',
    ariaLabel: 'Explore venues on map'
  },
  {
    name: 'Chat',
    icon: 'chat',
    path: '/chat',
    ariaLabel: 'View messages',
  },
  {
    name: 'Notifications',
    icon: 'notifications',
    path: '/notifications',
    ariaLabel: 'View notifications',
  },
  {
    name: 'Profile',
    icon: 'profile',
    path: '/profile',
    ariaLabel: 'View your profile'
  }
]
```

Add computed badge values:

```typescript
const chatBadge = computed(() => chatStore.unreadCount || null)
const notificationBadge = computed(() => notificationsStore.unreadCount || null)
```

In the template, replace the static badge rendering:

```vue
<!-- Badge for chat -->
<span
  v-if="item.icon === 'chat' && chatBadge"
  class="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full"
  :aria-label="`${chatBadge} unread messages`"
>
  {{ chatBadge > 99 ? '99+' : chatBadge }}
</span>

<!-- Badge for notifications -->
<span
  v-if="item.icon === 'notifications' && notificationBadge"
  class="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full"
  :aria-label="`${notificationBadge} new notifications`"
>
  {{ notificationBadge > 99 ? '99+' : notificationBadge }}
</span>
```

Remove the old generic badge span (`v-if="item.badge && item.badge > 0"`).

**Step 2: Verify badges render**

Run: `npm run dev` — check that bottom nav shows dynamic badges from stores.

**Step 3: Commit**

```bash
git add components/BottomNavigation.vue
git commit -m "feat: wire dynamic chat and notification badges in bottom nav"
```

---

## Task 14: Add Toast to Dashboard Layout

**Files:**
- Modify: `layouts/dashboard.vue`

**Step 1: Add the toast component**

Add the `UiToast` to the layout so it shows globally on all dashboard pages:

```vue
<script setup lang="ts">
const { activeToast, dismissToast } = useNotifications()
</script>

<template>
  <div>
    <slot />
    <BottomNavigation />
    <UiToast :notification="activeToast" @dismiss="dismissToast" />
  </div>
</template>
```

**Step 2: Verify toast renders on notification events**

Run: `npm run dev` — toast should appear when `notification:created` events arrive.

**Step 3: Commit**

```bash
git add layouts/dashboard.vue
git commit -m "feat: add global toast notification to dashboard layout"
```

---

## Task 15: Remove Old useAbly Composable

Now that all consumers have migrated to `useRealtime`, remove the old composable.

**Files:**
- Delete: `composables/useAbly.ts`

**Step 1: Search for remaining references**

Run: `grep -r "useAbly" --include="*.ts" --include="*.vue" .` — confirm no remaining imports. If any are found, update them.

**Step 2: Delete the file**

```bash
rm composables/useAbly.ts
```

**Step 3: Verify app still works**

Run: `npm run dev` — navigate through app, confirm no import errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove deprecated useAbly composable"
```

---

## Task 16: Clean Up Ably Store

**Files:**
- Modify: `stores/ably.ts`

**Step 1: Simplify the store**

The `activeChannels` array now only ever has one entry (the multiplexed channel). The store still works fine as-is, but remove the multi-channel tracking concept from the interface description. The actual code can stay the same — it's a minor comment/doc cleanup. No functional changes needed.

**Step 2: Commit**

```bash
git add stores/ably.ts
git commit -m "refactor: update ably store comments for single-channel architecture"
```

---

## Task 17: Integration Smoke Test

**Step 1: Manual test checklist**

Run `npm run dev` and verify:

- [ ] App boots without console errors
- [ ] Ably connects (check console for `[Realtime] Subscribed to user.{id}`)
- [ ] Chat page loads messages and receives realtime updates
- [ ] Typing indicators work (via REST endpoint)
- [ ] Venue detail panel shows checked-in users
- [ ] Bottom nav shows dynamic badge counts
- [ ] No references to old `channel:{channelId}` pattern in console

**Step 2: Check for TypeScript errors**

Run: `npx nuxi typecheck`

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address integration issues from multiplexing migration"
```

---

## Summary

| Task | Description | New/Modified |
|------|-------------|-------------|
| 1 | Realtime types | Create `types/realtime.ts` |
| 2 | Notification types + store | Create `types/notification.ts`, `stores/notifications.ts` |
| 3 | Presence store | Create `stores/presence.ts` |
| 4 | Event router | Create `composables/useRealtime.ts` |
| 5 | Plugin wiring | Modify `plugins/ably.client.ts` |
| 6 | Chat migration | Modify `composables/useChat.ts` |
| 7 | Match handler | Modify `composables/useMatches.ts` |
| 8 | Venue handler + REST presence | Modify `composables/useVenues.ts`, `stores/venues.ts` |
| 9 | Presence handler | Create `composables/usePresence.ts` |
| 10 | Notifications handler | Create `composables/useNotifications.ts` |
| 11 | Toast component | Create `components/ui/Toast.vue` |
| 12 | Online indicator | Create `components/ui/OnlineIndicator.vue` |
| 13 | Dynamic nav badges | Modify `components/BottomNavigation.vue` |
| 14 | Toast in layout | Modify `layouts/dashboard.vue` |
| 15 | Remove old useAbly | Delete `composables/useAbly.ts` |
| 16 | Clean up ably store | Modify `stores/ably.ts` |
| 17 | Integration test | Manual verification |
