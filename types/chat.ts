export interface Channel {
  id: number
  match_id: number
  channel_id: string
  created_at: string
  updated_at: string
  participants: ChannelParticipant[]
  last_message?: Message
  unread_count?: number
}

export interface ChannelParticipant {
  id: number
  user_id: number
  first_name: string
  profile_picture_url: string | null
  is_online?: boolean
  last_seen_at?: string
}

export interface Message {
  id: number
  channel_id: number
  sender_id: number
  content: string
  message_type: 'text' | 'image' | 'gif' | 'system'
  read_at: string | null
  created_at: string
  updated_at: string
  sender?: {
    id: number
    first_name: string
    profile_picture_url: string | null
  }
  media_url?: string
}

export interface SendMessageData {
  content: string
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
