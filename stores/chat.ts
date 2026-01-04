import { defineStore } from 'pinia'
import type {
  Channel,
  Message,
  TypingIndicator,
  PendingMessage,
  OnlineUser,
  SyncStatus
} from '~/types/chat'

interface ChatState {
  channels: Channel[]
  currentChannel: Channel | null
  messages: Record<number, Message[]>
  typingUsers: Record<number, number[]>
  loading: boolean
  error: string | null
  unreadCount: number

  // ABLY: Message queue for offline messages
  messageQueue: PendingMessage[]

  // ABLY: Subscription management
  subscriptions: Record<number, boolean> // Track which channels we're subscribed to

  // ABLY: Sync status per channel
  syncStatus: Record<number, SyncStatus>
  lastSyncedAt: Record<number, string> // ISO timestamp

  // ABLY: Online users and presence
  onlineUsers: Record<number, OnlineUser[]> // Per-channel online users
  userOnlineStatus: number // OnlineStatus enum value
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    channels: [],
    currentChannel: null,
    messages: {},
    typingUsers: {},
    loading: false,
    error: null,
    unreadCount: 0,

    // ABLY: Offline message queue
    messageQueue: [],

    // ABLY: Subscription tracking
    subscriptions: {},

    // ABLY: Sync status
    syncStatus: {},
    lastSyncedAt: {},

    // ABLY: Online presence
    onlineUsers: {},
    userOnlineStatus: 1 // Active by default
  }),

  getters: {
    getChannelById: (state) => {
      return (channelId: number) => state.channels.find(ch => ch.id === channelId)
    },

    getMessagesByChannel: (state) => {
      return (channelId: number) => state.messages[channelId] || []
    },

    getTypingUsersInChannel: (state) => {
      return (channelId: number) => state.typingUsers[channelId] || []
    },

    sortedChannels: (state) => {
      return [...state.channels].sort((a, b) => {
        const aTime = a.last_message?.created_at || a.created_at
        const bTime = b.last_message?.created_at || b.created_at
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })
    },

    hasUnreadMessages: (state) => state.unreadCount > 0,

    totalUnreadCount: (state) => {
      return state.channels.reduce((total, channel) => {
        return total + (channel.unread_count || 0)
      }, 0)
    },

    // ========== ABLY GETTERS ==========

    /**
     * Check if there are queued messages waiting to send
     */
    hasQueuedMessages: (state) => state.messageQueue.length > 0,

    /**
     * Get pending messages for a specific channel
     */
    getPendingMessages: (state) => (channelId: number) => {
      return state.messageQueue.filter((msg) => msg.channelId === channelId)
    },

    /**
     * Get sync status for a channel
     */
    getSyncStatus: (state) => (channelId: number) => {
      return state.syncStatus[channelId] || 'syncing'
    },

    /**
     * Check if channel is fully synced
     */
    isChannelSynced: (state) => (channelId: number) => {
      return state.syncStatus[channelId] === 'synced'
    },

    /**
     * Check if subscribed to channel updates
     */
    isChannelSubscribed: (state) => (channelId: number) => {
      return state.subscriptions[channelId] || false
    },

    /**
     * Get online users in a specific channel
     */
    getOnlineUsers: (state) => (channelId: number) => {
      return state.onlineUsers[channelId] || []
    },

    /**
     * Get count of online users in a channel
     */
    getOnlineUserCount: (state) => (channelId: number) => {
      return (state.onlineUsers[channelId] || []).length
    },

    /**
     * Get last sync time for a channel
     */
    getLastSyncTime: (state) => (channelId: number) => {
      return state.lastSyncedAt[channelId] || null
    }
  },

  actions: {
    setChannels(channels: Channel[]) {
      this.channels = channels
      this.calculateUnreadCount()
    },

    addChannel(channel: Channel) {
      const existingIndex = this.channels.findIndex(ch => ch.id === channel.id)
      if (existingIndex >= 0) {
        this.channels[existingIndex] = channel
      } else {
        this.channels.unshift(channel)
      }
      this.calculateUnreadCount()
    },

    updateChannel(channelId: number, data: Partial<Channel>) {
      const index = this.channels.findIndex(ch => ch.id === channelId)
      if (index >= 0) {
        this.channels[index] = { ...this.channels[index], ...data }
        this.calculateUnreadCount()
      }
    },

    setCurrentChannel(channel: Channel | null) {
      this.currentChannel = channel
    },

    setMessages(channelId: number, messages: Message[]) {
      this.messages[channelId] = messages
      this.sortMessagesInChannel(channelId)
    },

    addMessage(channelId: number, message: Message) {
      if (!this.messages[channelId]) {
        this.messages[channelId] = []
      }

      const existingIndex = this.messages[channelId].findIndex(m => m.id === message.id)
      if (existingIndex >= 0) {
        this.messages[channelId][existingIndex] = message
      } else {
        this.messages[channelId].push(message)
      }

      // Update channel's last message
      const channelIndex = this.channels.findIndex(ch => ch.id === channelId)
      if (channelIndex >= 0) {
        this.channels[channelIndex].last_message = message
      }

      this.sortMessagesInChannel(channelId)
    },

    prependMessages(channelId: number, messages: Message[]) {
      if (!this.messages[channelId]) {
        this.messages[channelId] = []
      }

      const existingIds = new Set(this.messages[channelId].map(m => m.id))
      const newMessages = messages.filter(m => !existingIds.has(m.id))

      this.messages[channelId] = [...newMessages, ...this.messages[channelId]]
      this.sortMessagesInChannel(channelId)
    },

    sortMessagesInChannel(channelId: number) {
      if (this.messages[channelId]) {
        this.messages[channelId].sort((a, b) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
      }
    },

    markMessageAsRead(channelId: number, messageId: number) {
      if (this.messages[channelId]) {
        const message = this.messages[channelId].find(m => m.id === messageId)
        if (message && !message.read_at) {
          message.read_at = new Date().toISOString()
        }
      }
    },

    markChannelAsRead(channelId: number) {
      const channel = this.channels.find(ch => ch.id === channelId)
      if (channel) {
        channel.unread_count = 0
        this.calculateUnreadCount()
      }

      if (this.messages[channelId]) {
        this.messages[channelId].forEach(message => {
          if (!message.read_at) {
            message.read_at = new Date().toISOString()
          }
        })
      }
    },

    setTypingUser(channelId: number, userId: number, isTyping: boolean) {
      if (!this.typingUsers[channelId]) {
        this.typingUsers[channelId] = []
      }

      if (isTyping) {
        if (!this.typingUsers[channelId].includes(userId)) {
          this.typingUsers[channelId].push(userId)
        }
      } else {
        this.typingUsers[channelId] = this.typingUsers[channelId].filter(id => id !== userId)
      }
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    calculateUnreadCount() {
      this.unreadCount = this.channels.reduce((total, channel) => {
        return total + (channel.unread_count || 0)
      }, 0)
    },

    clearMessages(channelId: number) {
      delete this.messages[channelId]
      delete this.typingUsers[channelId]
    },

    clearChat() {
      this.channels = []
      this.currentChannel = null
      this.messages = {}
      this.typingUsers = {}
      this.error = null
      this.unreadCount = 0
    },

    // ========== ABLY ACTIONS ==========

    /**
     * Add message to offline queue
     */
    addMessageToQueue(message: PendingMessage) {
      this.messageQueue.push(message)
    },

    /**
     * Remove message from queue by clientId
     */
    removeMessageFromQueue(clientId: string) {
      this.messageQueue = this.messageQueue.filter(
        (msg) => msg.clientId !== clientId
      )
    },

    /**
     * Clear queue for a specific channel
     */
    clearMessageQueue(channelId: number) {
      this.messageQueue = this.messageQueue.filter(
        (msg) => msg.channelId !== channelId
      )
    },

    /**
     * Clear entire message queue
     */
    clearAllQueuedMessages() {
      this.messageQueue = []
    },

    /**
     * Update message in queue (for retry count, status)
     */
    updateQueuedMessage(
      clientId: string,
      updates: Partial<PendingMessage>
    ) {
      const index = this.messageQueue.findIndex((msg) => msg.clientId === clientId)
      if (index >= 0) {
        this.messageQueue[index] = {
          ...this.messageQueue[index],
          ...updates
        }
      }
    },

    /**
     * Mark channel as subscribed
     */
    setChannelSubscribed(channelId: number, subscribed: boolean) {
      this.subscriptions[channelId] = subscribed
    },

    /**
     * Set sync status for a channel
     */
    setSyncStatus(channelId: number, status: SyncStatus) {
      this.syncStatus[channelId] = status
    },

    /**
     * Update last sync timestamp for a channel
     */
    setLastSyncedAt(channelId: number, timestamp: string) {
      this.lastSyncedAt[channelId] = timestamp
    },

    /**
     * Set online users for a channel
     */
    setOnlineUsers(channelId: number, users: OnlineUser[]) {
      this.onlineUsers[channelId] = users
    },

    /**
     * Add online user to a channel
     */
    addOnlineUser(channelId: number, user: OnlineUser) {
      if (!this.onlineUsers[channelId]) {
        this.onlineUsers[channelId] = []
      }

      const existingIndex = this.onlineUsers[channelId].findIndex(
        (u) => u.user_id === user.user_id
      )
      if (existingIndex >= 0) {
        this.onlineUsers[channelId][existingIndex] = user
      } else {
        this.onlineUsers[channelId].push(user)
      }
    },

    /**
     * Remove online user from a channel
     */
    removeOnlineUser(channelId: number, userId: number) {
      if (this.onlineUsers[channelId]) {
        this.onlineUsers[channelId] = this.onlineUsers[channelId].filter(
          (u) => u.user_id !== userId
        )
      }
    },

    /**
     * Clear online users for a channel
     */
    clearOnlineUsers(channelId: number) {
      delete this.onlineUsers[channelId]
    },

    /**
     * Set current user's online status
     */
    setUserOnlineStatus(status: number) {
      this.userOnlineStatus = status
    }
  },
})
