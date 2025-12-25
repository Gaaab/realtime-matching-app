# Chat Feature Implementation Plan
## Nuxt 4 Dating/Social Application

**Date:** December 25, 2025
**Project:** /Users/gabriel/Developer/intro/web-app
**Reference:** /Users/gabriel/Developer/appetiser/chat-module

---

## Executive Summary

This document provides a comprehensive plan for implementing a real-time chat feature in a Nuxt 4 dating/social application, based on analysis of a reference implementation and the current project state.

### Key Findings
- **Current State:** Basic chat infrastructure exists with Ably integration, components, composables, and stores
- **Reference Module:** Provides patterns for real-time messaging, channel management, and UI components
- **Gap:** Missing group chat support, file sharing, chat requests/approval flow, and enhanced UI features
- **Recommendation:** Incremental enhancement approach to build upon existing solid foundation

---

## 1. Architecture Analysis

### 1.1 Reference Implementation Architecture

The reference chat module follows these patterns:

**Component Structure:**
```
components/
├── ChatBox.vue          - Message input with optimistic updates
├── ChatContent.vue      - Message list with virtual scrolling
├── ChatHeader.vue       - Channel header with metadata
├── DirectChatList.vue   - Direct message channels list
├── GroupChatList.vue    - Group channels list
├── InviteForm.vue       - Invite users to group
└── group/
    └── Card.vue         - Group channel card component
```

**Key Patterns:**
1. **Optimistic UI Updates:** Messages appear instantly before API confirms
2. **Real-time Events:** Ably channels subscribe to `message:created`, `channel:updated`, `channel:created`
3. **Frontend Sorting:** Channels sorted by `updated_at`, requests appear first
4. **Minimal Store:** Simple Pinia store with just message data
5. **Component-level State:** Most state managed in component refs
6. **Approval Flow:** Channels can require approval before messaging

### 1.2 Current Implementation Architecture

**Component Structure:**
```
components/chat/
├── ChatContainer.vue     - Main container with header, messages, input
├── ChatInput.vue         - Message input with typing indicators
├── MessageList.vue       - Message display with pagination
└── ConversationsList.vue - Channel list with search
```

**Composables:**
```
composables/
├── useChat.ts           - Comprehensive chat operations (15KB)
└── useAbly.ts           - Ably real-time operations (11KB)
```

**Stores:**
```
stores/
├── chat.ts              - Rich state management with Ably support
└── ably.ts              - Connection state tracking
```

**Key Patterns:**
1. **Comprehensive Composable:** useChat provides all chat operations
2. **Rich Store:** Extensive state management including queuing, presence, sync status
3. **Ably Integration:** Full presence, typing, and message sync support
4. **Type Safety:** Strong TypeScript types for all entities
5. **Offline Support:** Message queue for offline messages
6. **Sync Status:** Per-channel sync tracking

### 1.3 Key Architectural Differences

| Aspect | Reference Module | Current Implementation |
|--------|------------------|------------------------|
| State Management | Minimal store | Rich Pinia store |
| Composable | Basic useAbly | Comprehensive useChat + useAbly |
| Components | Specialized per feature | Generalized containers |
| Real-time Events | Component-level subscriptions | Composable-managed subscriptions |
| Offline Support | None | Message queue system |
| Typing Indicators | Not implemented | Full support |
| Presence | Not implemented | Full support |
| Read Receipts | Not implemented | Implemented |
| Channel Types | Direct + Group | Direct only (currently) |

---

## 2. Gap Analysis

### 2.1 Missing Features from Reference

1. **Group Chat Support**
   - Group channel creation
   - Group member management
   - Group invitations
   - Group admin controls

2. **Chat Request/Approval Flow**
   - Connection requests for dating context
   - Approve/reject functionality
   - Request notifications
   - UI for pending requests

3. **Message Operations**
   - Delete for self vs everyone
   - Delete entire conversation
   - Message editing (not in reference either)

4. **UI Components**
   - Dedicated group chat list
   - Invite form for groups
   - Request initial message display
   - Specialized chat header for groups

### 2.2 Features Current Has That Reference Lacks

1. **Advanced Real-time**
   - Presence tracking
   - Online/offline status
   - Typing indicators
   - Message sync status
   - Offline message queue

2. **Enhanced UX**
   - Search functionality
   - Loading states
   - Error handling
   - Optimistic updates with retry
   - Message pagination

3. **Dating App Context**
   - Match-based channel creation
   - Profile integration
   - Privacy controls ready

### 2.3 Features Neither Has (Recommendations)

1. **Media Sharing**
   - Image uploads
   - GIF support
   - File attachments
   - Voice messages

2. **Enhanced Privacy**
   - Block users
   - Report/flag messages
   - Unmatch functionality
   - Message expiration

3. **Notifications**
   - Push notifications
   - Desktop notifications
   - Unread badges
   - Sound alerts

4. **Advanced Features**
   - Message reactions
   - Message threading/replies
   - Pinned messages
   - Message search
   - Voice/video calls

---

## 3. Component Architecture

### 3.1 Recommended Component Hierarchy

```
pages/
└── chat.vue                    - Main chat page (exists)

components/chat/
├── ChatContainer.vue           - Main container (exists, enhance)
├── ChatInput.vue               - Message input (exists, enhance)
├── MessageList.vue             - Message display (exists, enhance)
├── ConversationsList.vue       - Channel list (exists, enhance)
├── ChatHeader.vue              - NEW: Dedicated header component
├── MessageBubble.vue           - NEW: Individual message component
├── TypingIndicator.vue         - NEW: Typing indicator display
├── ChatRequestCard.vue         - NEW: Connection request display
├── GroupChatList.vue           - NEW: Group channels list
├── DirectChatList.vue          - NEW: Direct channels list
├── InviteModal.vue             - NEW: Invite to group modal
├── MessageActions.vue          - NEW: Message context menu
├── MediaUpload.vue             - NEW: Media upload component
└── EmptyState.vue              - NEW: Empty state component

components/chat/group/
├── GroupHeader.vue             - NEW: Group-specific header
├── GroupCard.vue               - NEW: Group channel card
├── MemberList.vue              - NEW: Group members list
└── GroupSettings.vue           - NEW: Group settings modal
```

### 3.2 Component Responsibilities

#### ChatContainer.vue (ENHANCE)
- **Current:** Layout, header, message list, input orchestration
- **Enhancement:**
  - Extract header to dedicated component
  - Add typing indicator display
  - Add connection status indicator
  - Support group vs direct mode

#### ChatInput.vue (ENHANCE)
- **Current:** Text input, typing events, send
- **Enhancement:**
  - Media upload button
  - Emoji picker
  - @ mentions for groups
  - Send on Enter/Shift+Enter configuration

#### MessageList.vue (ENHANCE)
- **Current:** Message display, pagination
- **Enhancement:**
  - Virtual scrolling for performance
  - Date separators
  - Unread message indicator
  - Scroll-to-bottom button
  - Message grouping by sender

#### ConversationsList.vue (ENHANCE)
- **Current:** Channel list, search, selection
- **Enhancement:**
  - Separate tabs for Direct/Group/Requests
  - Request count badge
  - Pull-to-refresh on mobile
  - Infinite scroll pagination

#### ChatHeader.vue (NEW)
- Display channel name/avatar
- Online status for direct chats
- Member count for groups
- Action buttons (call, video, options)
- Group info button

#### MessageBubble.vue (NEW)
- Individual message rendering
- Media display (images, GIFs)
- Message status indicators
- Read receipts
- Timestamp formatting
- Action menu trigger

#### ChatRequestCard.vue (NEW)
- Display pending connection request
- Accept/Reject buttons
- User profile preview
- Request message display

---

## 4. Real-time Messaging Flow

### 4.1 Current Ably Integration (Solid Foundation)

**Plugin:** `/Users/gabriel/Developer/intro/web-app/plugins/ably.client.ts`
- Token-based authentication via backend
- Auto-reconnection handling
- Connection state monitoring
- User-specific clientId from token

**Composable:** `/Users/gabriel/Developer/intro/web-app/composables/useAbly.ts`
- Channel subscription management
- Message publishing
- Presence tracking
- Typing indicators
- Error handling

**Store:** `/Users/gabriel/Developer/intro/web-app/stores/ably.ts`
- Connection state
- Active channels tracking
- Error management

### 4.2 Reference Module Ably Patterns

**Channel Naming:**
- User channels: `users.{userId}.channels`
- Events: `channel:created`, `channel:updated`, `message:created`

**Subscription Pattern:**
```typescript
const realtime = ably.value.channels.get(`users.${user.id}.channels`)

realtime.subscribe('channel:created', (newChannel) => {
  // Handle new channel
})

realtime.subscribe('channel:updated', (updatedChannel) => {
  // Handle channel updates (new messages, etc.)
})

realtime.subscribe('message:created', (message) => {
  // Handle new message in active channel
})
```

### 4.3 Recommended Hybrid Approach

**Combine Both Patterns:**

1. **User-level channel** for global events (reference pattern):
   - New channel requests
   - Channel updates
   - System notifications

2. **Channel-specific subscriptions** for active chat (current pattern):
   - Real-time messages
   - Typing indicators
   - Presence
   - Read receipts

**Implementation:**
```typescript
// In useChat composable
export const useChat = () => {
  const { $ably } = useNuxtApp()
  const authStore = useAuthStore()

  // Global user channel subscription
  const subscribeToUserChannel = () => {
    const userChannel = $ably.channels.get(`users.${authStore.user.id}.channels`)

    userChannel.subscribe('channel:created', (event) => {
      // Add new channel to list
      chatStore.addChannel(event.data)
    })

    userChannel.subscribe('channel:updated', (event) => {
      // Update channel (new message, unread count)
      chatStore.updateChannel(event.data.id, event.data)
    })
  }

  // Active channel subscription (existing pattern)
  const openChannelWithAbly = async (channelId: number) => {
    // Existing implementation - already good!
    // Fetches history, subscribes to messages, loads presence
  }

  return {
    subscribeToUserChannel,
    openChannelWithAbly,
    // ... existing methods
  }
}
```

### 4.4 Event Flow Diagram

```
User Sends Message
    ↓
[Optimistic Update] → Add to local state
    ↓
[API POST] → /chat/channels/{id}/messages
    ↓
[Backend] → Saves message, publishes to Ably
    ↓
[Ably Event] → message:created
    ↓
[All Subscribers] → Receive message
    ↓
[Local Update] → Replace optimistic message with real one
```

---

## 5. Backend API Integration

### 5.1 Required API Endpoints

Based on current composable and reference implementation:

#### Chat Channels
```typescript
// List channels
GET /chat/channels
  Query: {
    type?: 'direct' | 'group',
    includes?: 'members' | 'last_message',
    filter?: { with_empty_conversation: boolean }
  }
  Response: Channel[]

// Get channel requests (pending approval)
GET /chat/channels/request
  Query: { filter: { type: 'direct' | 'group' } }
  Response: Channel[]

// Get specific channel
GET /chat/channels/{channelId}
  Response: Channel

// Create channel (for match)
POST /chat/channels
  Body: { match_id: number }
  Response: Channel

// Create group channel
POST /chat/channels
  Body: {
    type: 'group',
    name: string,
    description?: string,
    member_ids: number[]
  }
  Response: Channel

// Mark channel as read
POST /chat/channels/{channelId}/read
  Response: { success: boolean }

// Approve channel request
POST /chat/channels/{channelId}/approve
  Response: Channel

// Reject channel request
POST /chat/channels/{channelId}/reject
  Response: { success: boolean }

// Delete channel
DELETE /chat/channels/{channelId}
  Response: { success: boolean }
```

#### Messages
```typescript
// List messages in channel
GET /chat/channels/{channelId}/messages
  Query: {
    page?: number,
    limit?: number,
    since?: ISO timestamp (for sync),
    per_page?: number
  }
  Response: {
    data: Message[],
    meta: { current_page, last_page, total }
  }

// Send message
POST /chat/channels/{channelId}/messages
  Body: {
    content?: string,
    message_type: 'text' | 'image' | 'gif' | 'system',
    media_url?: string
  }
  Response: Message

// Mark message as read
POST /chat/channels/{channelId}/messages/{messageId}/read
  Response: { success: boolean }

// Delete message for self
DELETE /chat/channels/{channelId}/messages/{messageId}/remove-for-you
  Response: { success: boolean }

// Delete message for everyone
DELETE /chat/channels/{channelId}/messages/{messageId}/remove-for-everyone
  Response: { success: boolean }

// Delete all messages in channel
DELETE /chat/channels/{channelId}/messages
  Response: { success: boolean }
```

#### Media
```typescript
// Upload media
POST /media
  Body: FormData { file: File, type: 'chat' }
  Response: { url: string }
```

#### Ably Auth
```typescript
// Get Ably token
POST /chat/auth
  Body: { formatted: true }
  Response: TokenRequest
```

### 5.2 API Response Types

**Channel:**
```typescript
interface Channel {
  id: number
  type: 'direct' | 'group'
  visibility: 'public' | 'private'
  channel_id: string  // Ably channel ID
  name?: string       // For groups or recipient name
  slug?: string
  match_id?: number   // For dating context
  created_at: string
  updated_at: string

  // Metadata
  meta?: {
    label?: string
    description?: string
    initiator_id?: number
  }

  // Counts
  members_count?: number
  messages_count?: number
  unread_count: number

  // Relations
  participants: ChannelParticipant[]
  members?: ChannelMember[]
  admins?: ChannelAdmin[]
  last_message?: Message

  // Dating app specific
  chat_requires_approval?: boolean
  approved_at?: string
}
```

**Message:**
```typescript
interface Message {
  id: number
  channel_id: number
  user_id: number
  sender_id: number
  content: string
  message_type: 'text' | 'image' | 'gif' | 'system'
  media_url?: string
  created_at: string
  updated_at: string
  read_at: string | null
  deleted_at?: string | null

  // Relations
  sender?: {
    id: number
    first_name: string
    last_name?: string
    profile_picture_url: string | null
  }
  user?: {
    id: number
    first_name: string
    profile_picture_url: string | null
  }

  // Client-side only
  status?: 'pending' | 'sent' | 'delivered' | 'error'
}
```

### 5.3 Backend Requirements

**Ably Server Integration:**
- Backend must publish events to Ably channels when:
  - New message created → `channel:{channelId}` with event `message:created`
  - Message updated → `channel:{channelId}` with event `message:updated`
  - Message deleted → `channel:{channelId}` with event `message:deleted`
  - Channel created → `users.{userId}.channels` with event `channel:created`
  - Channel updated → `users.{userId}.channels` with event `channel:updated`

**Token Generation:**
- Must include correct `clientId` (user ID)
- Appropriate capabilities for user's channels
- Token expiration handling

**Privacy Rules:**
- Users can only access channels they're members of
- Messages can only be read by channel members
- Delete for everyone only by sender (time limit recommended)

---

## 6. UI/UX Design Specifications

### 6.1 Reference Module UI Patterns

**Message Bubbles:**
- Left-aligned for received messages (light purple background #f0eff8)
- Right-aligned for sent messages (purple background #888be6)
- Rounded corners: 20px with 4px on opposite corner
- Max width: 80% of container
- Padding: 8px 16px

**Channel List:**
- Avatar + name + last message + timestamp
- Unread badge (pink #a018a4)
- "Connect request" label for pending
- Sorted by updated_at
- Requests always at top

**Chat Input:**
- Rounded pill design (40px border radius)
- White background
- Send button: circular, primary color
- Auto-grow textarea

**Colors:**
```scss
$message-sent: #888be6;
$message-received: #f0eff8;
$message-received-text: #494484;
$unread-badge: #a018a4;
$background: #f0f0f0;
$border: #e5e5e5;
```

### 6.2 Current Implementation UI Patterns

**Message Bubbles:**
- Modern gradient design
- Primary color (configurable)
- Tailwind CSS utilities
- Smooth animations
- Status indicators (pending, sent, delivered)

**Channel List:**
- Search functionality
- Clean, minimal design
- Gradient avatars for channels without images
- Hover states
- Loading skeletons

**Chat Input:**
- Gray background (#f3f4f6)
- Focus ring for accessibility
- Attachment and emoji buttons
- Auto-resize textarea
- Send on Ctrl+Enter

### 6.3 Recommended Unified Design System

**Color Palette:**
```typescript
// Dating app theme
const chatTheme = {
  // Message bubbles
  messageSent: {
    bg: 'bg-primary-500',      // Your app primary
    text: 'text-white',
    border: 'rounded-2xl rounded-br-none'
  },
  messageReceived: {
    bg: 'bg-gray-100',
    text: 'text-gray-900',
    border: 'rounded-2xl rounded-bl-none'
  },

  // Channel list
  channelSelected: 'bg-primary-50 border-l-4 border-l-primary-500',
  channelHover: 'hover:bg-gray-100',
  unreadBadge: 'bg-primary-500 text-white',

  // Status colors
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-400',

  // Request/approval
  requestBg: 'bg-amber-50',
  requestBorder: 'border-l-amber-500',
  approveBtn: 'bg-green-500 hover:bg-green-600',
  rejectBtn: 'bg-red-500 hover:bg-red-600'
}
```

**Typography:**
```typescript
// Message text
.message-content {
  font-size: 0.875rem;      // 14px
  line-height: 1.25rem;     // 20px
  word-break: break-word;
}

// Channel name
.channel-name {
  font-size: 1rem;          // 16px
  font-weight: 600;
  line-height: 1.5rem;
}

// Last message preview
.last-message {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: theme('colors.gray.500');
}

// Timestamp
.timestamp {
  font-size: 0.75rem;       // 12px
  color: theme('colors.gray.400');
}
```

**Spacing:**
```typescript
// Message spacing
paddingBubble: 'px-4 py-2',
gapMessages: 'space-y-4',
gapConsecutive: 'space-y-1',

// Channel list
paddingChannel: 'p-3',
gapChannelItems: 'space-y-1',

// Input
paddingInput: 'p-4',
```

**Animations:**
```typescript
// Message entrance
.message-enter {
  animation: fadeSlideIn 0.3s ease-out;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Typing indicator
.typing-indicator {
  animation: pulse 1.5s ease-in-out infinite;
}

// Loading states
.skeleton {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### 6.4 Responsive Design

**Breakpoints:**
```typescript
// Mobile first
sm: 640px   // Small tablets
md: 768px   // Tablets / show sidebar
lg: 1024px  // Desktop / expand sidebar
xl: 1280px  // Large desktop / 3-column layout
```

**Layout Variations:**

**Mobile (< 768px):**
- Full-width chat view
- Floating back button when chat open
- Bottom sheet for channel list
- Sticky input at bottom
- Compact header

**Tablet (768px - 1024px):**
- Split view: 320px sidebar + chat
- Collapsible sidebar
- Standard header
- Standard input

**Desktop (> 1024px):**
- 3-column option: Sidebar (360px) + Chat + Info panel (280px)
- Hover states
- Keyboard shortcuts
- Rich tooltips

---

## 7. State Management Strategy

### 7.1 Current Store Structure (Excellent Foundation)

**Chat Store** (`/Users/gabriel/Developer/intro/web-app/stores/chat.ts`):
```typescript
interface ChatState {
  // Core data
  channels: Channel[]
  currentChannel: Channel | null
  messages: Record<number, Message[]>
  typingUsers: Record<number, number[]>

  // UI state
  loading: boolean
  error: string | null
  unreadCount: number

  // Ably-specific
  messageQueue: PendingMessage[]          // Offline messages
  subscriptions: Record<number, boolean>   // Active subscriptions
  syncStatus: Record<number, SyncStatus>   // Per-channel sync
  lastSyncedAt: Record<number, string>     // Last sync timestamp
  onlineUsers: Record<number, OnlineUser[]> // Presence per channel
  userOnlineStatus: number                 // Current user status
}
```

**Strengths:**
- Comprehensive state coverage
- Offline support built-in
- Per-channel granularity
- Type-safe with TypeScript
- Well-organized getters and actions

**Recommendations:**
- Keep current structure
- Add group-specific state:
  ```typescript
  interface ChatState {
    // ... existing state

    // Group chat additions
    groupInvitations: GroupInvitation[]
    channelRequests: ChannelRequest[]
    selectedMembers: number[]  // For invite flow
  }
  ```

### 7.2 Composable Pattern (Excellent)

**Current useChat.ts Pattern:**
- Centralized business logic
- API integration
- Ably real-time coordination
- Error handling
- Computed properties for reactive data

**Recommendations:**
- Split into focused composables:
  ```
  useChat.ts          - Core chat operations (keep existing)
  useChatMessages.ts  - Message-specific operations
  useChatChannels.ts  - Channel management
  useChatRequests.ts  - Request/approval flow (NEW)
  useChatGroups.ts    - Group operations (NEW)
  useChatMedia.ts     - Media upload/handling (NEW)
  ```

### 7.3 Data Flow

```
Component
    ↓
Composable (useChat)
    ↓
├─→ Store (Pinia)      ← Ably Events
├─→ API (useApi)       → Backend → Ably Publish
└─→ Ably (useAbly)     → Subscribe/Publish
```

---

## 8. Privacy & Security Considerations

### 8.1 Dating App Specific Requirements

**Connection/Match Requirement:**
- Only allow messaging after mutual match
- Check match status before allowing message send
- Backend must validate match relationship

**Request/Approval Flow:**
- First message creates a "request"
- Recipient must approve before conversation continues
- Sender can send one initial message
- Show clear "pending" state

**Blocking:**
- Users can block matches
- Blocked users cannot send messages
- Existing messages remain visible
- Backend must enforce at API level

**Reporting:**
- Flag inappropriate messages
- Report users for violations
- Include context (last N messages)
- Trigger moderation workflow

### 8.2 Message Privacy

**Delete Options:**
1. **Delete for You:** Hides from current user only
2. **Delete for Everyone:** Removes for all participants
   - Time limit (e.g., 1 hour after sending)
   - Only sender can delete
   - Show "Message deleted" placeholder

**Message Encryption:**
- Transport: HTTPS + WSS (Ably provides)
- At rest: Backend database encryption
- Consider E2E encryption for sensitive content (future enhancement)

**Data Retention:**
- Define retention policy (e.g., 90 days)
- Allow users to request data deletion
- Comply with GDPR/privacy regulations

### 8.3 Authentication & Authorization

**Token-Based Auth (Current Implementation):**
```typescript
// Ably token includes user identity
{
  clientId: "user-{userId}",  // Set by backend
  capability: {
    "channel:{channelId}": ["publish", "subscribe", "presence"],
    "users.{userId}.channels": ["subscribe"]
  }
}
```

**Backend Validation:**
- Verify user is channel member before CRUD
- Check match/friend status for new channels
- Validate message sender matches authenticated user
- Enforce rate limiting (prevent spam)

**Client-Side Guards:**
```typescript
// In composable
const sendMessage = async (channelId: number, content: string) => {
  // Check if user is member
  const channel = chatStore.getChannelById(channelId)
  if (!channel || !isChannelMember(channel, authStore.user.id)) {
    throw new Error('Not authorized to send messages')
  }

  // Check if blocked
  if (channel.is_blocked) {
    throw new Error('Cannot message blocked user')
  }

  // Check if request approved (for dating context)
  if (channel.chat_requires_approval && !channel.approved_at) {
    throw new Error('Waiting for approval')
  }

  // Proceed with send
  // ...
}
```

### 8.4 Content Moderation

**Client-Side:**
- Input validation (length limits)
- Profanity filter (warning, not blocking)
- Spam detection (rate limiting)
- Link validation

**Backend:**
- Content filtering
- Automated flagging (ML-based)
- Admin moderation queue
- User reputation system

### 8.5 Online Presence Privacy

**Options:**
```typescript
enum OnlineStatus {
  OFFLINE = 0,
  ACTIVE = 1,      // Show as online
  AWAY = 2,        // Show as away
  DO_NOT_DISTURB = 3,  // Appear offline, no notifications
  INVISIBLE = 4    // Appear offline, receive notifications
}
```

**User Controls:**
- Toggle online status visibility
- "Last seen" privacy (show to matches only, hide, etc.)
- Read receipts on/off
- Typing indicators on/off

---

## 9. Implementation Roadmap

### Phase 1: Foundation Enhancement (Week 1-2)
**Goal:** Solidify existing features, add missing core functionality

**Tasks:**
1. **Component Refactoring**
   - Extract ChatHeader from ChatContainer
   - Create MessageBubble component
   - Add TypingIndicator component
   - Enhance MessageList with virtual scrolling

2. **Request/Approval Flow**
   - Add ChatRequestCard component
   - Implement approval/rejection API calls
   - Update ConversationsList to show requests
   - Add request notification handling

3. **User Channel Subscription**
   - Implement global user channel subscription
   - Handle channel:created events
   - Handle channel:updated events
   - Update channel list reactively

4. **Message Actions**
   - Add MessageActions menu component
   - Implement delete for self
   - Implement delete for everyone
   - Add delete conversation

**Deliverables:**
- Fully functional request/approval flow
- Enhanced component structure
- Real-time channel updates
- Message deletion features

**Testing:**
- Request flow (send, receive, approve, reject)
- Real-time channel updates
- Message deletion permissions
- Mobile responsiveness

---

### Phase 2: Group Chat Support (Week 3-4)
**Goal:** Add group messaging capabilities

**Tasks:**
1. **Group Components**
   - Create GroupChatList component
   - Create GroupHeader component
   - Create InviteModal component
   - Create MemberList component

2. **Group State Management**
   - Add group state to chat store
   - Create useChatGroups composable
   - Implement group member tracking
   - Add admin permission checks

3. **Group API Integration**
   - Create group endpoint integration
   - Add member invite/remove
   - Implement group settings
   - Handle group events via Ably

4. **Group UI**
   - Separate tabs for Direct/Group
   - Group creation flow
   - Member management UI
   - Group settings modal

**Deliverables:**
- Functional group chat creation
- Member invitation system
- Group message display
- Group management UI

**Testing:**
- Create group with multiple members
- Invite/remove members
- Group message delivery to all members
- Admin permissions

---

### Phase 3: Media & Rich Content (Week 5)
**Goal:** Support image sharing and rich media

**Tasks:**
1. **Media Upload**
   - Create MediaUpload component
   - Implement file picker
   - Add image preview
   - Implement progress indicator

2. **Media Display**
   - Image rendering in MessageBubble
   - Lightbox/modal for full-size view
   - Thumbnail generation
   - Loading states

3. **GIF Support**
   - Integrate GIF picker (Giphy API)
   - GIF rendering
   - GIF search

4. **File Types**
   - Support common image formats
   - Validate file size/type
   - Compress images client-side
   - Handle upload errors

**Deliverables:**
- Image message sending
- Image display in chat
- GIF picker and sending
- Error handling for uploads

**Testing:**
- Upload various image formats
- Large file handling
- Network failure recovery
- Mobile photo capture

---

### Phase 4: Enhanced UX (Week 6)
**Goal:** Polish user experience and add quality-of-life features

**Tasks:**
1. **Notifications**
   - Desktop notification API
   - Unread badge on tab
   - Sound alerts (optional)
   - Notification preferences

2. **Search & Filter**
   - Search messages within channel
   - Filter channels by type
   - Search users for new chats

3. **Keyboard Shortcuts**
   - Navigate channels (Ctrl+K)
   - Quick reply (R)
   - Search (Ctrl+F)
   - Escape to close modals

4. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support
   - High contrast mode

5. **Performance**
   - Virtual scrolling optimization
   - Image lazy loading
   - Message pagination
   - Debounce typing indicators

**Deliverables:**
- Desktop notifications
- Message search
- Keyboard shortcuts
- Accessibility compliance
- Performance improvements

**Testing:**
- Notification permissions
- Search accuracy
- Keyboard-only navigation
- Screen reader testing
- Performance profiling

---

### Phase 5: Advanced Features (Week 7-8)
**Goal:** Add differentiating features for dating app context

**Tasks:**
1. **Privacy Controls**
   - Block user functionality
   - Report/flag messages
   - Unmatch and delete conversation
   - Online status controls

2. **Message Reactions**
   - Emoji reactions
   - Reaction picker
   - Reaction display
   - Real-time reaction sync

3. **Voice Messages** (Optional)
   - Voice recording
   - Audio playback
   - Waveform visualization
   - Voice message compression

4. **Video/Voice Calls** (Optional)
   - WebRTC integration
   - Call initiation UI
   - Call status display
   - Call history

**Deliverables:**
- Privacy controls implemented
- Message reactions functional
- Voice messages (if included)
- Call functionality (if included)

**Testing:**
- Block/report/unmatch flows
- Reaction synchronization
- Voice message quality
- Call connection stability

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Components:**
```typescript
// MessageBubble.test.ts
describe('MessageBubble', () => {
  it('renders sent message with correct styling')
  it('renders received message with correct styling')
  it('displays timestamp correctly')
  it('shows status indicator for sent messages')
  it('handles long messages with word wrap')
  it('renders media messages')
})

// ChatInput.test.ts
describe('ChatInput', () => {
  it('emits send event on Enter')
  it('inserts newline on Shift+Enter')
  it('emits typing event on input')
  it('clears input after send')
  it('disables send when empty')
})
```

**Composables:**
```typescript
// useChat.test.ts
describe('useChat', () => {
  it('fetches channels successfully')
  it('handles channel fetch error')
  it('sends message with optimistic update')
  it('queues message when offline')
  it('syncs messages after reconnect')
  it('subscribes to channel correctly')
})
```

**Store:**
```typescript
// chat.test.ts
describe('chatStore', () => {
  it('adds channel correctly')
  it('updates channel unread count')
  it('sorts channels by updated_at')
  it('adds message to correct channel')
  it('handles message queue')
})
```

### 10.2 Integration Tests

**Page Tests:**
```typescript
// chat.test.ts
describe('Chat Page', () => {
  it('loads channels on mount')
  it('displays channel list')
  it('selects channel on click')
  it('loads messages for selected channel')
  it('sends message and updates list')
  it('receives real-time message')
  it('shows typing indicator')
  it('handles channel request approval')
})
```

### 10.3 E2E Tests

**User Flows:**
```typescript
// chat.e2e.ts
describe('Chat E2E', () => {
  it('complete chat flow', async () => {
    // 1. Login as User A
    // 2. Navigate to chat
    // 3. Create channel with User B
    // 4. Send message
    // 5. Switch to User B
    // 6. Receive message notification
    // 7. Open chat
    // 8. See message
    // 9. Reply
    // 10. Switch to User A
    // 11. See reply
  })

  it('request approval flow', async () => {
    // 1. User A sends first message to User B
    // 2. User B sees request
    // 3. User B approves
    // 4. Conversation opens
    // 5. Both can send messages
  })
})
```

### 10.4 Manual Testing Checklist

**Functional:**
- [ ] Send text message
- [ ] Send image message
- [ ] Send GIF
- [ ] Receive message
- [ ] Typing indicator
- [ ] Read receipts
- [ ] Online status
- [ ] Create channel
- [ ] Create group
- [ ] Invite to group
- [ ] Approve request
- [ ] Reject request
- [ ] Delete message (self)
- [ ] Delete message (everyone)
- [ ] Delete conversation
- [ ] Block user
- [ ] Report message
- [ ] Search messages
- [ ] Filter channels

**Real-time:**
- [ ] Message delivery (sender → recipient)
- [ ] Typing indicator sync
- [ ] Online status update
- [ ] Channel list update
- [ ] Unread count update
- [ ] Reconnection handling
- [ ] Offline message queue

**UI/UX:**
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] Smooth animations
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Accessibility (keyboard nav)
- [ ] Accessibility (screen reader)

**Performance:**
- [ ] Large channel list (100+ channels)
- [ ] Long conversation (1000+ messages)
- [ ] Image loading
- [ ] Virtual scrolling
- [ ] Typing debounce

---

## 11. Risk Assessment & Mitigation

### 11.1 Technical Risks

**Risk: Ably Connection Stability**
- **Impact:** High - Core functionality depends on real-time connection
- **Probability:** Medium
- **Mitigation:**
  - Implement robust reconnection logic (already in place)
  - Message queue for offline messages (already implemented)
  - Sync on reconnect (already implemented)
  - Fallback to polling if WebSocket fails
  - User notification of connection status

**Risk: Message Delivery Guarantee**
- **Impact:** High - Lost messages damage user trust
- **Probability:** Low-Medium
- **Mitigation:**
  - Optimistic updates with confirmation
  - Retry failed messages
  - Persistent queue in localStorage
  - Message status indicators
  - Backend idempotency (duplicate prevention)

**Risk: Race Conditions**
- **Impact:** Medium - Duplicate messages or missed updates
- **Probability:** Medium
- **Mitigation:**
  - Message deduplication by ID (already implemented)
  - Atomic state updates in store
  - Proper cleanup of subscriptions
  - Event timestamp ordering

**Risk: Performance with Scale**
- **Impact:** Medium - Slow UI with many messages/channels
- **Probability:** Medium
- **Mitigation:**
  - Virtual scrolling (implement)
  - Pagination for messages (already planned)
  - Lazy loading images
  - Debounce expensive operations
  - IndexedDB for local caching (future)

### 11.2 Product Risks

**Risk: Spam/Abuse**
- **Impact:** High - Damages user experience
- **Probability:** High (in dating context)
- **Mitigation:**
  - Request/approval flow
  - Rate limiting on messages
  - Report/block functionality
  - Content moderation
  - Reputation system

**Risk: Privacy Violations**
- **Impact:** Critical - Legal and reputational damage
- **Probability:** Low-Medium
- **Mitigation:**
  - Strict authorization checks
  - Match requirement enforcement
  - Block functionality
  - Data encryption
  - Privacy policy compliance
  - GDPR compliance

**Risk: Poor Mobile Experience**
- **Impact:** High - Most dating app usage is mobile
- **Probability:** Medium
- **Mitigation:**
  - Mobile-first design
  - Touch-optimized UI
  - Responsive testing
  - Performance optimization
  - Native app feel (PWA features)

### 11.3 Timeline Risks

**Risk: Scope Creep**
- **Impact:** High - Delays launch
- **Probability:** High
- **Mitigation:**
  - Phased rollout (MVP → enhancements)
  - Clear acceptance criteria
  - Regular stakeholder alignment
  - Feature prioritization framework

**Risk: Integration Complexity**
- **Impact:** Medium - Delays specific features
- **Probability:** Medium
- **Mitigation:**
  - Start with proven patterns
  - Incremental integration
  - Comprehensive testing
  - Fallback plans for features

---

## 12. Success Metrics

### 12.1 Technical Metrics

**Performance:**
- Page load time < 2s
- Message send latency < 500ms
- Real-time message delivery < 1s
- Typing indicator delay < 100ms
- Virtual scroll FPS > 30

**Reliability:**
- Message delivery rate > 99.9%
- Uptime (Ably) > 99.95%
- Error rate < 0.1%
- Reconnection success rate > 95%

**Code Quality:**
- Test coverage > 80%
- TypeScript strict mode compliance
- Zero critical accessibility issues
- Lighthouse score > 90

### 12.2 Product Metrics

**Engagement:**
- Daily active users sending messages
- Messages per conversation
- Response rate
- Average response time
- Session duration in chat

**Feature Adoption:**
- % users using group chat
- % users sending media
- % users using reactions
- Request approval rate
- Block/report usage

**User Satisfaction:**
- Net Promoter Score (NPS)
- User ratings in app store
- Support tickets related to chat
- User feedback sentiment

---

## 13. Documentation Requirements

### 13.1 Technical Documentation

**API Documentation:**
- Endpoint specifications (OpenAPI/Swagger)
- Request/response examples
- Error codes and handling
- Rate limiting policies
- Authentication flow

**Component Library:**
- Storybook for chat components
- Props documentation
- Usage examples
- Accessibility notes
- Design system integration

**Architecture Docs:**
- System architecture diagram
- Data flow diagrams
- State management guide
- Real-time event flow
- Security architecture

### 13.2 User Documentation

**Help Center:**
- How to start a conversation
- How to send messages/media
- How to create a group
- Understanding connection requests
- Privacy and blocking
- Troubleshooting

**In-App Guidance:**
- Onboarding tooltip tour
- Empty state instructions
- Error message guidance
- Feature announcements

---

## 14. Recommended Implementation Order

### Priority 1: Core Functionality (Must Have)
1. Request/approval flow for dating context
2. Real-time message delivery
3. User channel subscription for notifications
4. Basic message operations (send, receive, delete)
5. Channel list with unread counts
6. Mobile-responsive UI

### Priority 2: Enhanced Experience (Should Have)
7. Group chat support
8. Image message sending
9. Typing indicators
10. Online presence
11. Message search
12. Keyboard shortcuts

### Priority 3: Advanced Features (Nice to Have)
13. GIF support
14. Message reactions
15. Voice messages
16. Video/voice calls
17. Read receipts
18. Message threading

### Priority 4: Polish (Future Enhancements)
19. Desktop notifications
20. Message scheduling
21. Message translation
22. Emoji reactions
23. Polls in groups
24. Disappearing messages

---

## 15. Conclusion

### Current State Assessment
The project has an **excellent foundation** with:
- Robust Ably integration with presence, typing, and offline support
- Comprehensive chat store with message queuing
- Well-structured composables separating concerns
- Type-safe implementation with TypeScript
- Modern, responsive UI components

### Gaps to Address
1. **Dating app context:** Request/approval flow for first contact
2. **Group chat:** Full support for multi-participant conversations
3. **Media sharing:** Image and GIF support
4. **Component specialization:** More focused, reusable components

### Recommended Approach
**Incremental Enhancement Strategy:**
- Build upon existing solid foundation
- Add features in phases
- Maintain code quality and type safety
- Regular testing and validation
- User feedback integration

### Estimated Timeline
- **Phase 1 (Core):** 2 weeks
- **Phase 2 (Groups):** 2 weeks
- **Phase 3 (Media):** 1 week
- **Phase 4 (UX):** 1 week
- **Phase 5 (Advanced):** 2 weeks
- **Total:** 8 weeks for full implementation

### Next Steps
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1: Foundation Enhancement
4. Schedule weekly check-ins
5. Gather user feedback early and often

---

## Appendix A: File Locations Reference

### Current Project
```
/Users/gabriel/Developer/intro/web-app/
├── components/chat/
│   ├── ChatContainer.vue
│   ├── ChatInput.vue
│   ├── MessageList.vue
│   └── ConversationsList.vue
├── composables/
│   ├── useChat.ts
│   └── useAbly.ts
├── stores/
│   ├── chat.ts
│   └── ably.ts
├── types/
│   └── chat.ts
├── plugins/
│   └── ably.client.ts
└── pages/
    └── chat.vue
```

### Reference Module
```
/Users/gabriel/Developer/appetiser/chat-module/
├── components/
│   ├── ChatBox.vue
│   ├── ChatContent.vue
│   ├── ChatHeader.vue
│   ├── DirectChatList.vue
│   ├── GroupChatList.vue
│   ├── InviteForm.vue
│   └── group/
│       └── Card.vue
├── composables/
│   └── useAbly.ts
├── store/
│   └── chat.ts
├── types/
│   └── Channel.ts
└── pages/
    └── messages.client.vue
```

---

**Document Version:** 1.0
**Last Updated:** December 25, 2025
**Author:** Claude Code - Meta Dispatcher Agent
**Status:** Ready for Review
