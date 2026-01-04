/**
 * Chat Channel - represents a conversation between matched users
 * Maps to API response from GET /api/v1/chat/channels
 */
export interface Channel {
  id: number
  type: 'direct' | 'group'
  visibility: 'private' | 'public'
  channel_id: string // UUID
  slug: string | null
  meta: ChannelMeta | null
  created_at: string
  updated_at: string
  members_count: number
  messages_count: number
  unread_count: number
  chat_requires_approval: boolean
  last_message: Message | null
  last_read_at: string | null
  muted_at: string | null
  archived_at: string | null // null = active, timestamp = archived (read-only)
  members: ChannelMember[]
  // Computed display properties
  name?: string // Display name derived from members or meta
}

/**
 * Channel metadata for group channels
 */
export interface ChannelMeta {
  label: string | null
  description: string | null
}

/**
 * Channel member - represents a user's membership in a channel
 */
export interface ChannelMember {
  id: number
  model_type: string // 'user'
  model_id: number
  created_at: string
  updated_at: string
  last_read_at: string | null
  meta: ChannelMemberMeta
  role_set_by?: number | null
  model: ChannelMemberModel
}

/**
 * Channel member metadata
 */
export interface ChannelMemberMeta {
  is_initiator: boolean
  role: 'member' | 'admin'
}

/**
 * Channel member model (user info) - matches UserResource from API
 */
export interface ChannelMemberModel {
  id: number
  first_name: string
  last_name?: string | null
  full_name?: string
  avatar_permanent_url?: string
  avatar_permanent_thumb_url?: string
  // Legacy/computed fields for backward compatibility
  name?: string
  avatar?: string | null
}

/**
 * Legacy participant interface for backwards compatibility
 * @deprecated Use ChannelMember instead
 */
export interface ChannelParticipant {
  id: number
  user_id: number
  first_name: string
  profile_picture_url: string | null
  is_online?: boolean
  last_seen_at?: string
}

/**
 * Chat Message - represents a single message in a channel
 * Maps to API response from GET /api/v1/chat/channels/{id}/messages
 */
export interface Message {
  id: number
  sender_type: string // 'user'
  sender_id: number
  data: string | null // Message text content
  created_at: string
  updated_at: string
  deleted_at: string | null
  is_read: boolean
  sender: MessageSender | null
  attachments: MessageAttachment[]
  link_preview: LinkPreview | null
  // Legacy/computed fields for backward compatibility
  content?: string // Alias for data
  channel_id?: number
  read_at?: string | null
  message_type?: 'text' | 'image' | 'gif' | 'system'
  media_url?: string
  status?: 'pending' | 'sent' | 'delivered' | 'error'
  user?: {
    id: number
    first_name: string
    profile_picture_url: string | null
  }
  user_id?: number // Alias for sender_id
}

/**
 * Message sender info - matches UserResource from API
 * The sender is the Member model which contains a model (User) relationship
 */
export interface MessageSender {
  id: number
  model_type: string
  model_id: number
  created_at: string
  updated_at: string
  last_read_at: string | null
  meta: {
    is_initiator?: boolean
    role?: 'member' | 'admin'
  }
  model: MessageSenderUser
}

/**
 * User info nested inside sender.model - matches UserResource from API
 */
export interface MessageSenderUser {
  id: number
  first_name: string
  last_name?: string | null
  full_name?: string
  avatar_permanent_url?: string
  avatar_permanent_thumb_url?: string
  // Legacy fields for backward compatibility
  name?: string
  avatar?: string | null
}

/**
 * Message attachment (media files)
 */
export interface MessageAttachment {
  id: number
  type: string // 'image', 'video', etc.
  url: string
  thumbnail_url?: string
  filename?: string
  size?: number
  mime_type?: string
}

/**
 * Link preview metadata
 */
export interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  image: string | null
  site_name: string | null
}

/**
 * Data for sending a message
 */
export interface SendMessageData {
  data: string // Message text content
  attachments?: File[]
  // Legacy fields for backward compatibility
  content?: string
  message_type?: 'text' | 'image' | 'gif'
  media_url?: string
}

export interface TypingIndicator {
  user_id: number
  channel_id: number
  is_typing: boolean
}

export interface MessageReadReceipt {
  message_id: number
  user_id: number
  read_at: string
}

// ============================================================================
// ABLY REAL-TIME TYPES
// ============================================================================

/**
 * Pending message for offline queue
 * Stores messages that failed to send and will be retried on reconnection
 */
export interface PendingMessage {
  clientId: string // UUID for deduplication
  channelId: number
  content: string
  messageType: 'text' | 'image' | 'gif'
  mediaUrl?: string
  createdAt: string // Client timestamp
  status: 'pending' | 'failed' | 'sending'
  retryCount: number
  lastAttemptAt?: string
}

/**
 * Online user in a channel
 */
export interface OnlineUser extends ChannelParticipant {
  lastSeenAt?: string | null
  last_activity_at?: string | null
}

/**
 * Online status enum for presence
 */
export enum OnlineStatus {
  OFFLINE = 0,
  ACTIVE = 1,
  AWAY = 2,
  DO_NOT_DISTURB = 3,
  INVISIBLE = 4
}

/**
 * Presence data for channel
 */
export interface PresenceData {
  userId: number
  status: OnlineStatus
  lastSeenAt: string
  typingIn?: number // Channel ID if typing
}

/**
 * Ably subscription for a channel
 */
export interface AblyChannelSubscription {
  channelId: number
  unsubscribe: () => void
}

/**
 * Chat sync status per channel
 */
export type SyncStatus = 'syncing' | 'synced' | 'error'

/**
 * Connection state for Ably
 */
export type ConnectionState =
  | 'initialized'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'suspended'
  | 'closing'
  | 'closed'
  | 'failed'

/**
 * Ably error interface
 */
export interface AblyError {
  code: number
  message: string
  statusCode: number
  timestamp: string
}

/**
 * Connection metrics for monitoring
 */
export interface ConnectionMetrics {
  latency: number
  lastPingAt: number | null
  reconnectAttempts: number
  totalReconnects: number
  connectionUptime: number
  lastConnectedAt: string | null
  lastDisconnectedAt: string | null
}

/**
 * Message queue configuration
 */
export interface QueuedMessage extends PendingMessage {
  priority: number
  expiresAt: string | null
  metadata?: Record<string, unknown>
}

/**
 * Chat error types
 */
export enum ChatErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

/**
 * Parsed chat error
 */
export interface ChatError {
  type: ChatErrorType
  code: string
  message: string
  userMessage: string
  retryable: boolean
  retryAfterMs?: number
  originalError?: unknown
}

// ============================================================================
// CHANNEL FILTER OPTIONS
// ============================================================================

/**
 * Filter options for fetching channels
 * Maps to query params in GET /api/v1/chat/channels
 */
export interface ChannelFilterOptions {
  include_archived?: boolean // Include archived channels from past matches
  with_empty_conversation?: boolean // Include channels with no messages
  page?: number
  per_page?: number
}

/**
 * Channels list response meta
 */
export interface ChannelsListMeta {
  current_page: number
  per_page: number
  total: number
  chat_request_count: number
}

/**
 * Messages list response meta
 */
export interface MessagesListMeta {
  current_page: number
  per_page: number
  total: number
  last_read_at: string | null
  unread_count: number
}

// ============================================================================
// HELPER FUNCTIONS / UTILITIES
// ============================================================================

/**
 * Check if a channel is archived (read-only)
 */
export const isChannelArchived = (channel: Channel): boolean => {
  return channel.archived_at !== null
}

/**
 * Get the display name for a channel
 * For direct channels, uses the other member's name
 * For group channels, uses the meta label
 */
export const getChannelDisplayName = (channel: Channel, currentUserId: number): string => {
  if (channel.meta?.label) {
    return channel.meta.label
  }

  if (channel.type === 'direct' && channel.members.length > 0) {
    const otherMember = channel.members.find(m => m.model_id !== currentUserId)
    if (otherMember) {
      // Use full_name, first_name, or legacy name field
      return otherMember.model.full_name || otherMember.model.first_name || otherMember.model.name || 'Unknown'
    }
  }

  return channel.name || 'Unknown'
}

/**
 * Get the avatar URL for a channel
 * For direct channels, uses the other member's avatar
 */
export const getChannelAvatar = (channel: Channel, currentUserId: number): string | null => {
  if (channel.type === 'direct' && channel.members.length > 0) {
    const otherMember = channel.members.find(m => m.model_id !== currentUserId)
    if (otherMember) {
      // Use avatar_permanent_thumb_url, avatar_permanent_url, or legacy avatar field
      return otherMember.model.avatar_permanent_thumb_url
        || otherMember.model.avatar_permanent_url
        || otherMember.model.avatar
        || null
    }
  }
  return null
}

/**
 * Normalize a message from API to ensure backward compatibility
 * The API returns sender as a Member with nested model (User)
 */
export const normalizeMessage = (message: Message): Message => {
  // Extract user info from sender.model if available
  const senderUser = message.sender?.model
  const avatarUrl = senderUser?.avatar_permanent_thumb_url
    || senderUser?.avatar_permanent_url
    || senderUser?.avatar
    || null

  return {
    ...message,
    content: message.data || message.content || '',
    user_id: message.sender?.model_id || message.sender_id,
    user: senderUser ? {
      id: senderUser.id,
      first_name: senderUser.first_name,
      profile_picture_url: avatarUrl
    } : message.user,
    read_at: message.is_read ? message.updated_at : null
  }
}
