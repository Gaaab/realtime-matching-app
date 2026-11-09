export interface ChannelMember {
  id: number
  model_type: string
  model_id: number
  created_at: string
  updated_at: string
  last_read_at: string | null
  meta: Record<string, any>
  model?: {
    id: number
    first_name: string
    last_name?: string
    full_name?: string
    avatar_permanent_url?: string
    avatar_permanent_thumb_url?: string
    blurred_avatar_url?: string | null
    [key: string]: any
  }
}

export interface ChatAvailability {
  is_available: boolean
  reason: string | null
  user_one_checked_in: boolean
  user_two_checked_in: boolean
  same_venue: boolean
  venue_id: number | null
  channel_expires_at: string | null
  channel_time_remaining_seconds: number | null
  channel_time_remaining_formatted: string | null
  is_expiring_soon: boolean
  expiring_user_id: number | null
  participants_expiration: {
    user_one: { user_id: number; expires_at: string; time_remaining_seconds: number }
    user_two: { user_id: number; expires_at: string; time_remaining_seconds: number }
  } | null
}

export interface Channel {
  id: number
  type: string
  visibility: string
  channel_id: string
  slug: string
  meta: Record<string, any>
  created_at: string
  updated_at: string
  members_count: number
  messages_count: number
  unread_count: number
  chat_requires_approval: boolean
  last_message?: Message | null
  members?: ChannelMember[]
  admins?: { id: number; model_id: number; model_type: string }[]
  archived_at?: string | null
  last_read_at?: string | null
  muted_at?: string | null
  chat_availability?: ChatAvailability | null
}

export interface Message {
  id: number
  channel_id?: number
  sender_type: string
  sender_id: number
  type: string
  data: string | null
  icebreaker_id?: number | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  is_read: boolean
  sender?: {
    id: number
    model_type: string
    model_id: number
    model?: {
      id: number
      first_name: string
      last_name?: string
      full_name?: string
      avatar_permanent_url?: string
      avatar_permanent_thumb_url?: string
      [key: string]: any
    }
    [key: string]: any
  }
  attachments?: any[]
  link_preview?: any | null
}

export interface SendMessageData {
  data: string
  attachments?: File[]
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

export interface PendingMessage {
  clientId: string
  channelId: number
  content: string
  messageType: string
  mediaUrl?: string
  createdAt: string
  status: 'pending' | 'failed' | 'sending'
  retryCount: number
  lastAttemptAt?: string
}

export interface OnlineUser extends ChannelMember {
  lastSeenAt?: string | null
}

export enum OnlineStatus {
  OFFLINE = 0,
  ACTIVE = 1,
  AWAY = 2,
  DO_NOT_DISTURB = 3,
  INVISIBLE = 4
}

export interface PresenceData {
  userId: number
  status: OnlineStatus
  lastSeenAt: string
  typingIn?: number
}

export interface AblyChannelSubscription {
  channelId: number
  unsubscribe: () => void
}

export type SyncStatus = 'syncing' | 'synced' | 'error'
