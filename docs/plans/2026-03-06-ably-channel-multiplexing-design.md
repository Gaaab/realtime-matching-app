# Ably Channel Multiplexing — Client Implementation Design

**Date:** 2026-03-06
**Status:** Approved
**Breaking change:** Yes — hard cutover, no backwards compatibility

## Problem

The client currently subscribes to individual Ably channels per chat conversation (`channel:{channelId}`). The backend is moving to a single multiplexed channel per user (`user.{userId}`) where all events (chat, match, venue, presence, notifications, profile) are delivered with namespaced event names. The client must be rewritten to match.

## Architecture Overview

Single Ably channel with a central event router dispatching to domain-specific handlers.

```
Ably SDK
  user.{userId} channel (single subscription)
    useRealtime.ts (event router)
      chat handlers      -> useChat.ts       -> chatStore
      match handlers     -> useMatches.ts    -> matchStore
      venue handlers     -> useVenues.ts     -> venuesStore
      presence handlers  -> usePresence.ts   -> presenceStore (new)
      notification handlers -> useNotifications.ts -> notificationStore (new)
      profile handlers   -> useMatches.ts    -> matchStore
```

## Event Naming Convention

Events are namespaced by scope:

| Pattern | Scope | Example |
|---------|-------|---------|
| `chat:{uuid}:{action}` | chat | `chat:abc-123:message:created` |
| `venue:{venueId}:{action}` | venue | `venue:42:user_checked_in` |
| `{action}` (no prefix) | user | `match:created`, `presence:changed` |

### Full Event Catalog

**Chat-scoped** (`chat:{uuid}:*`):
- `message:created` — new message in conversation
- `message:updated` — message edited
- `message:deleted` — message removed
- `typing:started` — user started typing
- `typing:stopped` — user stopped typing
- `channel:expiring_soon` — chat window expiring
- `channel:archived` — chat archived

**Venue-scoped** (`venue:{venueId}:*`):
- `user_checked_in` — user checked in to venue
- `user_checked_out` — user checked out of venue

**User-scoped** (no prefix):
- `match:created` — new match
- `match:unmatched` — match removed
- `match:chat_renewed` — chat window renewed
- `profile:revealed` — profile reveal accepted
- `profile:unrevealed` — profile reveal revoked
- `notification:created` — new notification
- `presence:changed` — user online/offline status changed

### Payload Envelope

All events arrive in this format:

```json
{
  "event": "chat:abc-123:message:created",
  "data": { ... },
  "meta": {
    "timestamp": "2026-03-06T14:30:00.000000Z",
    "version": "v2",
    "source": "chat"
  }
}
```

## Component Design

### 1. Event Router — `composables/useRealtime.ts` (new)

Central coordinator. Responsibilities:

- On connect, call `GET /api/v1/broadcasting/channels` to get channel name
- Subscribe to the single Ably channel
- Parse event names into `{ scope, id, action }` using prefix routing
- Maintain a handler registry keyed by scope
- Expose `registerHandler(scope, callback)` / `unregisterHandler(scope)`
- On reconnection, notify all registered handlers

Event parsing logic:

```typescript
function parseEvent(name: string): ParsedEvent {
  if (name.startsWith('chat:')) {
    const [, uuid, ...rest] = name.split(':')
    return { scope: 'chat', id: uuid, action: rest.join(':') }
  }
  if (name.startsWith('venue:')) {
    const [, venueId, ...rest] = name.split(':')
    return { scope: 'venue', id: venueId, action: rest.join(':') }
  }
  return { scope: 'user', id: null, action: name }
}
```

### 2. Plugin — `plugins/ably.client.ts` (modified)

Minimal changes:
- Keep token auth via `POST /chat/auth` (endpoint unchanged)
- After connecting, call `useRealtime().connect()` to fetch channel and subscribe
- Remove per-channel subscription logic
- Connection state stays in `stores/ably.ts` (unchanged)

### 3. Domain Handlers

Each domain composable registers its handler with the router.

**Chat — `composables/useChat.ts` (modified):**
- Handles: `message:created`, `message:updated`, `message:deleted`, `typing:started`, `typing:stopped`, `channel:expiring_soon`, `channel:archived`
- Scoped by chat UUID from parsed event
- Existing chatStore logic preserved, subscription mechanism changes

**Matches — `composables/useMatches.ts` (modified):**
- Handles: `match:created`, `match:unmatched`, `match:chat_renewed`, `profile:revealed`, `profile:unrevealed`
- `match:created` shows toast notification, updates match list
- `profile:revealed/unrevealed` updates user card state

**Venue — `composables/useVenues.ts` (modified):**
- Handles: `venue:{id}:user_checked_in`, `venue:{id}:user_checked_out`
- On venue detail open: fetch `GET /api/v1/venue/{id}/presence` for initial user list
- Realtime events add/remove users from `nearbyUsers` in venuesStore
- Existing VenueDetailPanel already renders checked-in users

**Presence — `composables/usePresence.ts` (new):**
- Handles: `presence:changed`
- Maintains map of `userId -> { status, lastActiveAt }`
- Exposes `isOnline(userId)` for components
- New UI: online indicator dot on user avatars/cards

**Notifications — `composables/useNotifications.ts` (new):**
- Handles: `notification:created`
- Shows toast popup on arrival
- Maintains notification list and unread count
- New UI: unread badge in nav

### 4. New Stores

**`stores/notifications.ts`:**
- `notifications: Notification[]`
- `unreadCount: number`
- `addNotification()`, `markRead()`, `markAllRead()`

**`stores/presence.ts`:**
- `userPresence: Record<string, PresenceData>`
- Getter: `isOnline(userId): boolean`
- `updatePresence()`, `removePresence()`

### 5. New UI Components

- **`components/ui/Toast.vue`** — Dismissable toast for match notifications, etc.
- **`components/ui/OnlineIndicator.vue`** — Green/gray dot overlay for presence
- **`components/NotificationBadge.vue`** — Unread count badge for navigation

### 6. New Types — `types/realtime.ts`

```typescript
interface ParsedEvent {
  scope: 'chat' | 'venue' | 'user'
  id: string | null
  action: string
}

interface RealtimeMessage {
  event: string
  data: Record<string, any>
  meta: {
    timestamp: string
    version: string
    source: string
  }
}

type RealtimeHandler = (event: ParsedEvent, message: RealtimeMessage) => void
```

## Data Flow Example

New chat message:

```
Backend -> Ably channel user.123:
  event: "chat:abc-def:message:created"
  data: { id, content, sender_id, ... }
  meta: { version: "v2", source: "chat" }

-> useRealtime parses: { scope: 'chat', id: 'abc-def', action: 'message:created' }
-> dispatches to chat handler
-> useChat adds message to chatStore for channel abc-def
-> Vue reactivity updates chat UI
```

## Venue Presence Migration

Old: Ably native presence channels per venue.
New: REST + realtime events.

1. Venue detail opens -> `GET /api/v1/venue/{id}/presence` for initial user list
2. Subscribe via `useRealtime` for `venue:{id}:user_checked_in` / `user_checked_out`
3. Update `nearbyUsers` in venuesStore on each event
4. VenueDetailPanel renders reactively (already wired)

## Cleanup

**Remove:**
- Per-channel subscription logic in `composables/useAbly.ts`
- Ably native presence channel usage
- Old channel naming pattern (`channel:{channelId}`)
- `subscribeToChannel()`, `subscribeToPresence()`, `enterPresence()`, `leavePresence()` from useAbly

**Keep:**
- `stores/ably.ts` — connection state tracking
- `plugins/ably.client.ts` — connection init (modified)
- Ably SDK dependency (`ably@^2.16.0`)

**Deprecate:**
- `composables/useAbly.ts` — replaced by `composables/useRealtime.ts`

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /chat/auth` | POST | Ably token request (unchanged) |
| `GET /api/v1/broadcasting/channels` | GET | Get user's channel name (new) |
| `GET /api/v1/venue/{id}/presence` | GET | Initial venue presence list (new) |
