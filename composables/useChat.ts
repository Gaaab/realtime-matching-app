import { useChatStore } from '~/stores/chat'
import type {
  Channel,
  Message,
  SendMessageData,
  PendingMessage,
  OnlineUser,
  ChannelFilterOptions,
  normalizeMessage
} from '~/types/chat'

// HTTP status codes for specific error handling
const HTTP_FORBIDDEN = 403
const HTTP_NOT_FOUND = 404

export const useChat = () => {
  const api = useApi()
  const chatStore = useChatStore()

  // Ably integration
  const { subscribeToChannel, publishMessage, subscribeToPresence } = useAbly()
  const processedMessageIds = ref<Set<string>>(new Set())
  const processingMessageIds = ref<Set<string>>(new Set())

  // Filter state for archived channels
  const includeArchived = ref(false)

  /**
   * Build query params for channel list API
   */
  const buildChannelQueryParams = (options: ChannelFilterOptions = {}) => {
    const params: Record<string, string> = {}

    if (options.include_archived || includeArchived.value) {
      params['filter[include_archived]'] = 'true'
    }

    if (options.with_empty_conversation) {
      params['filter[with_empty_conversation]'] = 'true'
    }

    if (options.page) {
      params.page = String(options.page)
    }

    if (options.per_page) {
      params.per_page = String(options.per_page)
    }

    return params
  }

  /**
   * Normalize channel data from API response
   * Computes display name from members for direct channels
   */
  const normalizeChannel = (channel: Channel, currentUserId?: number): Channel => {
    let name = channel.name

    // For direct channels, derive name from the other member
    if (channel.type === 'direct' && channel.members.length > 0 && currentUserId) {
      const otherMember = channel.members.find(m => m.model_id !== currentUserId)
      if (otherMember) {
        // Use full_name, first_name, or legacy name field
        name = otherMember.model.full_name || otherMember.model.first_name || otherMember.model.name || 'Unknown'
      }
    } else if (channel.meta?.label) {
      name = channel.meta.label
    }

    return {
      ...channel,
      name
    }
  }

  /**
   * Fetch channels with optional filters
   * @param options - Filter options for the API call
   */
  const fetchChannels = async (options: ChannelFilterOptions = {}) => {
    try {
      chatStore.setLoading(true)
      chatStore.setError(null)

      const params = buildChannelQueryParams(options)
      const response = await api.get<Channel[]>('/chat/channels', params)

      if (response.success && response.data) {
        // Get current user ID for normalizing channel names
        const authStore = useAuthStore()
        const currentUserId = authStore.user?.id

        // Normalize channels (add display names, etc.)
        const normalizedChannels = response.data.map(ch =>
          normalizeChannel(ch, currentUserId)
        )

        chatStore.setChannels(normalizedChannels)
        return normalizedChannels
      }

      throw new Error(response.message || 'Failed to fetch channels')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch channels'
      chatStore.setError(errorMessage)
      console.error('Fetch channels error:', error)
      throw error
    } finally {
      chatStore.setLoading(false)
    }
  }

  /**
   * Toggle showing archived channels
   */
  const toggleArchivedChannels = async () => {
    includeArchived.value = !includeArchived.value
    return await fetchChannels({ include_archived: includeArchived.value })
  }

  /**
   * Set archived filter state
   */
  const setIncludeArchived = async (value: boolean) => {
    includeArchived.value = value
    return await fetchChannels({ include_archived: value })
  }

  const fetchChannel = async (channelId: number) => {
    try {
      chatStore.setLoading(true)
      chatStore.setError(null)

      const response = await api.get<Channel>(`/chat/channels/${channelId}`)

      if (response.success && response.data) {
        // Normalize channel with display name
        const authStore = useAuthStore()
        const normalizedChannel = normalizeChannel(response.data, authStore.user?.id)

        chatStore.addChannel(normalizedChannel)
        chatStore.setCurrentChannel(normalizedChannel)
        return normalizedChannel
      }

      throw new Error(response.message || 'Failed to fetch channel')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch channel'
      chatStore.setError(errorMessage)
      console.error('Fetch channel error:', error)
      throw error
    } finally {
      chatStore.setLoading(false)
    }
  }

  /**
   * Check if a channel is archived (read-only)
   */
  const isChannelArchived = (channel: Channel | null): boolean => {
    return channel?.archived_at !== null && channel?.archived_at !== undefined
  }

  /**
   * Get archived channel error message
   */
  const getArchivedChannelMessage = (): string => {
    return 'This chat is archived. You can view the conversation but cannot send new messages.'
  }

  /**
   * Normalize message from API response for backward compatibility
   * The API returns sender as a Member with nested model (User)
   */
  const normalizeMessageData = (message: Message, channelId: number): Message => {
    // Extract user info from sender.model if available
    const senderUser = message.sender?.model
    const avatarUrl = senderUser?.avatar_permanent_thumb_url
      || senderUser?.avatar_permanent_url
      || senderUser?.avatar
      || null

    return {
      ...message,
      channel_id: channelId,
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

  const fetchMessages = async (channelId: number, page: number = 1, limit: number = 50) => {
    try {
      chatStore.setLoading(true)
      chatStore.setError(null)

      const response = await api.get<Message[]>(`/chat/channels/${channelId}/messages`, {
        page,
        per_page: limit,
      })

      if (response.success && response.data) {
        // Normalize messages for backward compatibility
        const normalizedMessages = response.data.map(msg =>
          normalizeMessageData(msg, channelId)
        )

        if (page === 1) {
          chatStore.setMessages(channelId, normalizedMessages)
        } else {
          chatStore.prependMessages(channelId, normalizedMessages)
        }
        return normalizedMessages
      }

      throw new Error(response.message || 'Failed to fetch messages')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch messages'
      chatStore.setError(errorMessage)
      console.error('Fetch messages error:', error)
      throw error
    } finally {
      chatStore.setLoading(false)
    }
  }

  /**
   * Custom error class for archived channel operations
   */
  class ArchivedChannelError extends Error {
    constructor(message: string = 'This chat is archived and read-only.') {
      super(message)
      this.name = 'ArchivedChannelError'
    }
  }

  const sendMessage = async (channelId: number, data: SendMessageData) => {
    // Check if channel is archived before attempting to send
    const channel = chatStore.getChannelById(channelId)
    if (channel && isChannelArchived(channel)) {
      const error = new ArchivedChannelError(getArchivedChannelMessage())
      chatStore.setError(error.message)
      throw error
    }

    // Get current user for optimistic message
    const authStore = useAuthStore()
    const currentUser = authStore.user

    try {
      // Transform data to match API expected format
      const payload = {
        data: data.data || data.content || '',
      }

      // Create optimistic message with temporary negative ID
      const tempId = -Date.now()
      const userProfile = currentUser?.profile
      const optimisticMessage: Message = {
        id: tempId,
        sender_type: 'user',
        sender_id: currentUser?.id || 0,
        data: payload.data,
        content: payload.data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        is_read: false,
        sender: null,
        attachments: [],
        link_preview: null,
        channel_id: channelId,
        user_id: currentUser?.id || 0,
        user: userProfile ? {
          id: currentUser?.id || 0,
          first_name: userProfile.first_name || 'You',
          profile_picture_url: userProfile.profile_picture_url || null
        } : undefined,
        message_type: 'text',
        status: 'pending'
      }

      // Add optimistic message to store immediately
      chatStore.addMessage(channelId, optimisticMessage)

      const response = await api.post<Message>(`/chat/channels/${channelId}/messages`, payload)

      // API returns empty data on success, so we keep the optimistic message
      // The real message will come through Ably real-time subscription
      if (response.success) {
        // Update the optimistic message status to sent
        const updatedMessage = { ...optimisticMessage, status: 'sent' as const }
        // Remove the temporary message - real one will arrive via Ably
        // For now, we keep it to show immediate feedback
        return updatedMessage
      }

      // If failed, remove optimistic message
      const messages = chatStore.getMessagesByChannel(channelId)
      chatStore.setMessages(
        channelId,
        messages.filter(m => m.id !== tempId)
      )

      throw new Error(response.message || 'Failed to send message')
    } catch (error: any) {
      // Handle 403 Forbidden specifically for archived channels
      if (error.http_status === HTTP_FORBIDDEN) {
        const archivedError = new ArchivedChannelError(
          'Cannot send message. This chat may be archived or you no longer have access.'
        )
        chatStore.setError(archivedError.message)

        // Mark the channel as archived in the store if we get 403
        chatStore.updateChannel(channelId, { archived_at: new Date().toISOString() })

        throw archivedError
      }

      const errorMessage = error.message || 'Failed to send message'
      chatStore.setError(errorMessage)
      console.error('Send message error:', error)
      throw error
    }
  }

  const sendTextMessage = async (channelId: number, content: string) => {
    return await sendMessage(channelId, { data: content })
  }

  const sendImageMessage = async (channelId: number, mediaUrl: string, content?: string) => {
    return await sendMessage(channelId, {
      data: content || '',
      message_type: 'image',
      media_url: mediaUrl,
    })
  }

  const markMessageAsRead = async (channelId: number, messageId: number) => {
    try {
      const response = await api.post(`/chat/channels/${channelId}/messages/${messageId}/read`)

      if (response.success) {
        chatStore.markMessageAsRead(channelId, messageId)
        return true
      }

      throw new Error(response.message || 'Failed to mark message as read')
    } catch (error: any) {
      console.error('Mark message as read error:', error)
      throw error
    }
  }

  const markChannelAsRead = async (channelId: number) => {
    try {
      const response = await api.post(`/chat/channels/${channelId}/read`)

      if (response.success) {
        chatStore.markChannelAsRead(channelId)
        return true
      }

      throw new Error(response.message || 'Failed to mark channel as read')
    } catch (error: any) {
      console.error('Mark channel as read error:', error)
      throw error
    }
  }

  const deleteMessage = async (channelId: number, messageId: number) => {
    try {
      const response = await api.delete(`/chat/channels/${channelId}/messages/${messageId}`)

      if (response.success) {
        // Remove message from store
        const messages = chatStore.messages[channelId] || []
        chatStore.setMessages(
          channelId,
          messages.filter(m => m.id !== messageId)
        )
        return true
      }

      throw new Error(response.message || 'Failed to delete message')
    } catch (error: any) {
      console.error('Delete message error:', error)
      throw error
    }
  }

  const createChannelForMatch = async (matchId: number) => {
    try {
      chatStore.setLoading(true)
      chatStore.setError(null)

      const response = await api.post<Channel>('/chat/channels', { match_id: matchId })

      if (response.success && response.data) {
        chatStore.addChannel(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to create channel')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create channel'
      chatStore.setError(errorMessage)
      console.error('Create channel error:', error)
      throw error
    } finally {
      chatStore.setLoading(false)
    }
  }

  const setTypingIndicator = (channelId: number, userId: number, isTyping: boolean) => {
    chatStore.setTypingUser(channelId, userId, isTyping)
  }

  // ============================================================================
  // ABLY REAL-TIME INTEGRATION
  // ============================================================================

  /**
   * Subscribe to channel real-time updates via Ably
   * Handles message creation, updates, deletions, and typing indicators
   *
   * @param channelId - Numeric channel ID for store management
   * @param channelUuid - Channel UUID (channel_id) for Ably subscriptions
   */
  const subscribeToChannelUpdates = (channelId: number, channelUuid: string) => {
    // Get current user for deduplication of own optimistic messages
    const authStore = useAuthStore()
    const currentUserId = authStore.user?.id

    console.log(`[Ably] Setting up subscription for channel ${channelId} (UUID: ${channelUuid})`)

    const unsubscribe = subscribeToChannel(channelUuid, {
      onMessage: (event) => {
        // Ably event structure: { data: <payload>, name: 'message:created', ... }
        const rawMessage = event.data as Message
        const messageKey = `${rawMessage.id}`

        console.log(`[Ably] message:created event received:`, {
          messageId: rawMessage.id,
          senderId: rawMessage.sender_id,
          content: rawMessage.data?.substring(0, 50),
          alreadyProcessed: processedMessageIds.value.has(messageKey)
        })

        // Deduplication: Skip if already processed (e.g., from initial fetch)
        if (processedMessageIds.value.has(messageKey)) {
          console.log(`[Ably] Skipping duplicate message: ${rawMessage.id}`)
          return
        }

        // Normalize the message to ensure channel_id, content, user fields are set
        const message = normalizeMessageData(rawMessage, channelId)

        console.log(`[Ably] Normalized message:`, {
          id: message.id,
          channel_id: message.channel_id,
          content: message.content?.substring(0, 50),
          user_id: message.user_id,
          user: message.user
        })

        processedMessageIds.value.add(messageKey)

        // If this message is from the current user, remove any pending optimistic messages
        // This handles the case where we sent a message via API and the real one arrives via Ably
        if (message.sender_id === currentUserId || message.user_id === currentUserId) {
          const existingMessages = chatStore.getMessagesByChannel(channelId)
          const pendingMessages = existingMessages.filter(
            m => m.id < 0 && (m.sender_id === currentUserId || m.user_id === currentUserId) && m.status === 'pending'
          )
          if (pendingMessages.length > 0) {
            console.log(`[Ably] Removing ${pendingMessages.length} optimistic message(s) for user ${currentUserId}`)
            chatStore.setMessages(
              channelId,
              existingMessages.filter(m => !(m.id < 0 && (m.sender_id === currentUserId || m.user_id === currentUserId) && m.status === 'pending'))
            )
          }
        }

        chatStore.addMessage(channelId, message)
        console.log(`[Ably] Message ${message.id} added to store for channel ${channelId}`)
      },
      onUpdate: (event) => {
        const rawMessage = event.data as Message
        console.log(`[Ably] message:updated event received: ${rawMessage.id}`)

        const messages = chatStore.getMessagesByChannel(channelId)
        if (messages.some((m) => m.id === rawMessage.id)) {
          // Normalize the message to ensure channel_id and content are set
          const updatedMessage = normalizeMessageData(rawMessage, channelId)
          chatStore.addMessage(channelId, updatedMessage)
          console.log(`[Ably] Message ${updatedMessage.id} updated in store`)
        }
      },
      onDelete: (event) => {
        const messageId = event.data?.id || event.data
        console.log(`[Ably] message:deleted event received: ${messageId}`)

        const messages = chatStore.getMessagesByChannel(channelId)
        chatStore.setMessages(
          channelId,
          messages.filter((m) => m.id !== messageId)
        )
        // Remove from processed set to allow re-processing if message is somehow re-sent
        processedMessageIds.value.delete(`${messageId}`)
        console.log(`[Ably] Message ${messageId} removed from store`)
      },
      onError: (err) => {
        console.error('[Ably] Channel subscription error:', err)
        chatStore.setError(err.message)
      }
    })

    chatStore.setChannelSubscribed(channelId, true)
    console.log(`[Ably] Successfully subscribed to channel ${channelId}`)
    return unsubscribe
  }

  /**
   * Open channel with Ably real-time sync
   * Fetches history, subscribes to updates, loads presence
   */
  const openChannelWithAbly = async (channelId: number) => {
    console.log(`[Chat] Opening channel ${channelId} with Ably...`)

    try {
      chatStore.setLoading(true)
      chatStore.setSyncStatus(channelId, 'syncing')

      // Fetch channel to get the channel_id UUID for Ably
      const channel = await fetchChannel(channelId)
      if (!channel || !channel.channel_id) {
        throw new Error('Channel not found or missing channel_id UUID')
      }

      console.log(`[Chat] Channel fetched: id=${channel.id}, uuid=${channel.channel_id}`)

      // Clear processed message IDs for this channel to start fresh
      // This prevents stale deduplication data from blocking new messages
      processedMessageIds.value.clear()
      console.log(`[Chat] Cleared processed message IDs`)

      // Fetch message history from API
      const messagesResponse = await fetchMessages(channelId, 1, 50)
      console.log(`[Chat] Fetched ${messagesResponse.length} messages from history`)

      messagesResponse.forEach((msg) => {
        processedMessageIds.value.add(msg.id.toString())
      })
      console.log(`[Chat] Added ${messagesResponse.length} message IDs to processed set`)

      // Subscribe to real-time updates using the channel_id UUID
      subscribeToChannelUpdates(channelId, channel.channel_id)

      // Load online users (presence)
      await loadChannelPresence(channelId, channel.channel_id)

      chatStore.setSyncStatus(channelId, 'synced')
      chatStore.setLastSyncedAt(channelId, new Date().toISOString())
      console.log(`[Chat] Channel ${channelId} (${channel.channel_id}) opened with Ably successfully`)
    } catch (error: any) {
      chatStore.setSyncStatus(channelId, 'error')
      chatStore.setError(error.message)
      console.error('[Chat] Error opening channel with Ably:', error)
      throw error
    } finally {
      chatStore.setLoading(false)
    }
  }

  /**
   * Load online users (presence) in a channel via Ably
   *
   * @param channelId - Numeric channel ID for store management
   * @param channelUuid - Channel UUID (channel_id) for Ably presence
   */
  const loadChannelPresence = async (channelId: number, channelUuid: string) => {
    try {
      // Subscribe to presence changes
      subscribeToPresence(channelUuid, {
        onEnter: (member) => {
          const user: OnlineUser = {
            id: member.data?.userId || 0,
            user_id: member.data?.userId || 0,
            first_name: member.data?.firstName || 'Unknown',
            profile_picture_url: member.data?.avatar || null,
            is_online: true,
            last_seen_at: new Date().toISOString()
          }
          chatStore.addOnlineUser(channelId, user)
        },
        onUpdate: (member) => {
          const user: OnlineUser = {
            id: member.data?.userId || 0,
            user_id: member.data?.userId || 0,
            first_name: member.data?.firstName || 'Unknown',
            profile_picture_url: member.data?.avatar || null,
            is_online: true,
            last_seen_at: new Date().toISOString()
          }
          chatStore.addOnlineUser(channelId, user)
        },
        onLeave: (member) => {
          const userId = member.data?.userId
          if (userId) {
            chatStore.removeOnlineUser(channelId, userId)
          }
        }
      })
    } catch (err) {
      console.warn('Failed to load channel presence:', err)
    }
  }

  /**
   * Publish typing indicator via Ably
   *
   * @param channelId - Numeric channel ID (will be used to look up channel_id UUID)
   * @param isTyping - Whether the user is typing
   */
  const publishTypingViaAbly = async (channelId: number, isTyping: boolean) => {
    try {
      // Get the channel to find the channel_id UUID
      const channel = chatStore.getChannelById(channelId)
      if (!channel || !channel.channel_id) {
        console.warn('Cannot publish typing: channel not found or missing channel_id UUID')
        return
      }

      const authStore = useAuthStore()
      await publishMessage(channel.channel_id, 'typing', {
        userId: authStore.user?.id,
        isTyping,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      console.warn('Failed to publish typing indicator:', err)
    }
  }

  /**
   * Flush queued messages on reconnection
   */
  const flushMessageQueue = async (channelId: number) => {
    const queuedMessages = chatStore.getPendingMessages(channelId)

    if (queuedMessages.length === 0) {
      return
    }

    console.log(`Flushing ${queuedMessages.length} queued messages`)

    for (const queuedMsg of queuedMessages) {
      try {
        chatStore.updateQueuedMessage(queuedMsg.clientId, {
          status: 'sending',
          retryCount: (queuedMsg.retryCount || 0) + 1,
          lastAttemptAt: new Date().toISOString()
        })

        const payload: SendMessageData = {
          data: queuedMsg.content,
          content: queuedMsg.content,
          message_type: queuedMsg.messageType as any,
          media_url: queuedMsg.mediaUrl
        }

        await sendMessage(channelId, payload)
        chatStore.removeMessageFromQueue(queuedMsg.clientId)
      } catch (err) {
        console.warn(`Failed to send queued message:`, err)
      }
    }
  }

  /**
   * Sync messages after reconnection
   */
  const syncAfterReconnect = async (channelId: number) => {
    const lastSyncTime = chatStore.getLastSyncTime(channelId)

    if (!lastSyncTime) {
      return openChannelWithAbly(channelId)
    }

    try {
      chatStore.setSyncStatus(channelId, 'syncing')

      // Fetch messages since last sync
      const response = await api.get<Message[]>(
        `/chat/channels/${channelId}/messages`,
        {
          since: lastSyncTime,
          limit: 100
        }
      )

      if (response.success && response.data) {
        response.data.forEach((msg) => {
          const key = msg.id.toString()
          if (!processedMessageIds.value.has(key)) {
            chatStore.addMessage(channelId, msg)
            processedMessageIds.value.add(key)
          }
        })
      }

      chatStore.setSyncStatus(channelId, 'synced')
      chatStore.setLastSyncedAt(channelId, new Date().toISOString())

      // Flush any queued messages
      await flushMessageQueue(channelId)
    } catch (err) {
      chatStore.setSyncStatus(channelId, 'error')
      console.error('Sync after reconnect error:', err)
    }
  }

  /**
   * Legacy subscribe method for backward compatibility
   * @deprecated Use openChannelWithAbly() instead
   */
  const subscribeToChannelLegacy = (channelId: number, callbacks: {
    onMessage?: (message: Message) => void
    onTyping?: (userId: number, isTyping: boolean) => void
    onRead?: (messageId: number) => void
  }) => {
    // Provide backward compatibility while migrating to Ably
    return {
      unsubscribe: () => {
        // Cleanup subscription
      },
    }
  }

  const uploadChatImage = async (file: File) => {
    try {
      const response = await api.uploadFile('/media', file, { type: 'chat' })

      if (response.success && response.data) {
        return response.data.url
      }

      throw new Error(response.message || 'Failed to upload image')
    } catch (error: any) {
      console.error('Upload chat image error:', error)
      throw error
    }
  }

  return {
    // ========== API METHODS ==========
    fetchChannels,
    fetchChannel,
    fetchMessages,
    sendMessage,
    sendTextMessage,
    sendImageMessage,
    markMessageAsRead,
    markChannelAsRead,
    deleteMessage,
    createChannelForMatch,
    setTypingIndicator,
    uploadChatImage,

    // ========== ARCHIVED CHANNEL METHODS ==========
    toggleArchivedChannels,
    setIncludeArchived,
    isChannelArchived,
    getArchivedChannelMessage,

    // ========== ABLY REAL-TIME METHODS ==========
    openChannelWithAbly,
    subscribeToChannelUpdates,
    subscribeToChannelLegacy,
    loadChannelPresence,
    publishTypingViaAbly,
    flushMessageQueue,
    syncAfterReconnect,

    // ========== COMPUTED STATE ==========
    channels: computed(() => chatStore.sortedChannels),
    currentChannel: computed(() => chatStore.currentChannel),
    messages: computed(() => {
      return chatStore.currentChannel
        ? chatStore.getMessagesByChannel(chatStore.currentChannel.id)
        : []
    }),
    onlineUsers: computed(() => {
      return chatStore.currentChannel
        ? chatStore.getOnlineUsers(chatStore.currentChannel.id)
        : []
    }),
    syncStatus: computed(() => {
      return chatStore.currentChannel
        ? chatStore.getSyncStatus(chatStore.currentChannel.id)
        : 'syncing'
    }),
    isChannelSynced: computed(() => {
      return chatStore.currentChannel
        ? chatStore.isChannelSynced(chatStore.currentChannel.id)
        : false
    }),
    hasQueuedMessages: computed(() => chatStore.hasQueuedMessages),
    pendingMessages: computed(() => {
      return chatStore.currentChannel
        ? chatStore.getPendingMessages(chatStore.currentChannel.id)
        : []
    }),
    loading: computed(() => chatStore.loading),
    error: computed(() => chatStore.error),
    unreadCount: computed(() => chatStore.unreadCount),
    hasUnreadMessages: computed(() => chatStore.hasUnreadMessages),

    // ========== FILTER STATE ==========
    includeArchived: computed(() => includeArchived.value),

    // ========== ACTIVE VS ARCHIVED CHANNELS ==========
    activeChannels: computed(() => {
      return chatStore.sortedChannels.filter(ch => !ch.archived_at)
    }),
    archivedChannels: computed(() => {
      return chatStore.sortedChannels.filter(ch => ch.archived_at !== null)
    }),

    // ========== CURRENT CHANNEL STATE ==========
    isCurrentChannelArchived: computed(() => {
      const channel = chatStore.currentChannel
      return channel ? isChannelArchived(channel) : false
    }),
  }
}
