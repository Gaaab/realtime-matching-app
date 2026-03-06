import { useChatStore } from "~/stores/chat";
import type {
  Channel,
  Message,
  SendMessageData,
  PendingMessage,
  OnlineUser,
} from "~/types/chat";
import { createChatRealtimeHandler } from "~/composables/useChatRealtimeHandler";

export const useChat = () => {
  const api = useApi();
  const chatStore = useChatStore();

  const processedMessageIds = ref<Set<string>>(new Set());
  const processingMessageIds = ref<Set<string>>(new Set());

  // Register realtime event handler for chat events
  const { registerHandler, unregisterHandler } = useRealtime();
  const { handler: chatRealtimeHandler } = createChatRealtimeHandler(
    chatStore,
    processedMessageIds.value,
  );
  registerHandler("chat", chatRealtimeHandler);

  const fetchChannels = async () => {
    try {
      chatStore.setLoading(true);
      chatStore.setError(null);

      const response = await api.get<Channel[]>("/chat/channels");

      if (response.success && response.data) {
        chatStore.setChannels(response.data);
        return response.data;
      }

      throw new Error(response.message || "Failed to fetch channels");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch channels";
      chatStore.setError(errorMessage);
      console.error("Fetch channels error:", error);
      throw error;
    } finally {
      chatStore.setLoading(false);
    }
  };

  const fetchChannel = async (channelId: number) => {
    try {
      chatStore.setLoading(true);
      chatStore.setError(null);

      const response = await api.get<Channel>(`/chat/channels/${channelId}`);

      if (response.success && response.data) {
        chatStore.addChannel(response.data);
        chatStore.setCurrentChannel(response.data);
        return response.data;
      }

      throw new Error(response.message || "Failed to fetch channel");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch channel";
      chatStore.setError(errorMessage);
      console.error("Fetch channel error:", error);
      throw error;
    } finally {
      chatStore.setLoading(false);
    }
  };

  const fetchMessages = async (
    channelId: number,
    page: number = 1,
    limit: number = 50,
  ) => {
    try {
      chatStore.setLoading(true);
      chatStore.setError(null);

      const response = await api.get<Message[]>(
        `/chat/channels/${channelId}/messages`,
        {
          page,
          limit,
        },
      );

      if (response.success && response.data) {
        if (page === 1) {
          chatStore.setMessages(channelId, response.data);
        } else {
          chatStore.prependMessages(channelId, response.data);
        }
        return response.data;
      }

      throw new Error(response.message || "Failed to fetch messages");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch messages";
      chatStore.setError(errorMessage);
      console.error("Fetch messages error:", error);
      throw error;
    } finally {
      chatStore.setLoading(false);
    }
  };

  const sendMessage = async (channelId: number, data: SendMessageData) => {
    try {
      const response = await api.post<Message>(
        `/chat/channels/${channelId}/messages`,
        data,
      );

      if (response.success && response.data) {
        chatStore.addMessage(channelId, response.data);
        return response.data;
      }

      throw new Error(response.message || "Failed to send message");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send message";
      chatStore.setError(errorMessage);
      console.error("Send message error:", error);
      throw error;
    }
  };

  const sendTextMessage = async (channelId: number, content: string) => {
    return await sendMessage(channelId, { content, message_type: "text" });
  };

  const sendImageMessage = async (
    channelId: number,
    mediaUrl: string,
    content?: string,
  ) => {
    return await sendMessage(channelId, {
      content: content || "",
      message_type: "image",
      media_url: mediaUrl,
    });
  };

  const markMessageAsRead = async (channelId: number, messageId: number) => {
    try {
      const response = await api.post(
        `/chat/channels/${channelId}/messages/${messageId}/read`,
      );

      if (response.success) {
        chatStore.markMessageAsRead(channelId, messageId);
        return true;
      }

      throw new Error(response.message || "Failed to mark message as read");
    } catch (error: any) {
      console.error("Mark message as read error:", error);
      throw error;
    }
  };

  const markChannelAsRead = async (channelId: number) => {
    try {
      const response = await api.post(`/chat/channels/${channelId}/read`);

      if (response.success) {
        chatStore.markChannelAsRead(channelId);
        return true;
      }

      throw new Error(response.message || "Failed to mark channel as read");
    } catch (error: any) {
      console.error("Mark channel as read error:", error);
      throw error;
    }
  };

  const deleteMessage = async (channelId: number, messageId: number) => {
    try {
      const response = await api.delete(
        `/chat/channels/${channelId}/messages/${messageId}`,
      );

      if (response.success) {
        // Remove message from store
        const messages = chatStore.messages[channelId] || [];
        chatStore.setMessages(
          channelId,
          messages.filter((m) => m.id !== messageId),
        );
        return true;
      }

      throw new Error(response.message || "Failed to delete message");
    } catch (error: any) {
      console.error("Delete message error:", error);
      throw error;
    }
  };

  const createChannelForMatch = async (matchId: number) => {
    try {
      chatStore.setLoading(true);
      chatStore.setError(null);

      const response = await api.post<Channel>("/chat/channels", {
        match_id: matchId,
      });

      if (response.success && response.data) {
        chatStore.addChannel(response.data);
        return response.data;
      }

      throw new Error(response.message || "Failed to create channel");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create channel";
      chatStore.setError(errorMessage);
      console.error("Create channel error:", error);
      throw error;
    } finally {
      chatStore.setLoading(false);
    }
  };

  const setTypingIndicator = (
    channelId: number,
    userId: number,
    isTyping: boolean,
  ) => {
    chatStore.setTypingUser(channelId, userId, isTyping);
  };

  // ============================================================================
  // REAL-TIME INTEGRATION (via multiplexed channel)
  // ============================================================================

  const subscribeToChannelUpdates = (_channelId: number) => {
    // No-op: chat events are handled by the global realtime handler
    chatStore.setChannelSubscribed(_channelId, true);
    return () => {};
  };

  const openChannelWithAbly = async (channelId: number) => {
    try {
      chatStore.setLoading(true);
      chatStore.setSyncStatus(channelId, "syncing");

      const messagesResponse = await fetchMessages(channelId, 1, 50);
      messagesResponse.forEach((msg) => {
        processedMessageIds.value.add(msg.id.toString());
      });

      // Mark channel as subscribed (events come through global realtime handler)
      chatStore.setChannelSubscribed(channelId, true);

      chatStore.setSyncStatus(channelId, "synced");
      chatStore.setLastSyncedAt(channelId, new Date().toISOString());
    } catch (error: any) {
      chatStore.setSyncStatus(channelId, "error");
      chatStore.setError(error.message);
      throw error;
    } finally {
      chatStore.setLoading(false);
    }
  };

  const loadChannelPresence = async (_channelId: number) => {
    // Presence is now handled by the presence store via realtime events
  };

  const publishTypingViaAbly = async (channelId: number, isTyping: boolean) => {
    try {
      const channel = chatStore.channels.find((c) => c.id === channelId);
      if (!channel) return;

      await api.post(`/chat/channels/${channel.id}/typing`, {
        is_typing: isTyping,
      });
    } catch (err) {
      console.warn("Failed to publish typing indicator:", err);
    }
  };

  const flushMessageQueue = async (channelId: number) => {
    const queuedMessages = chatStore.getPendingMessages(channelId);

    if (queuedMessages.length === 0) {
      return;
    }

    for (const queuedMsg of queuedMessages) {
      try {
        chatStore.updateQueuedMessage(queuedMsg.clientId, {
          status: "sending",
          retryCount: (queuedMsg.retryCount || 0) + 1,
          lastAttemptAt: new Date().toISOString(),
        });

        const payload: SendMessageData = {
          content: queuedMsg.content,
          message_type: queuedMsg.messageType as any,
          media_url: queuedMsg.mediaUrl,
        };

        await sendMessage(channelId, payload);
        chatStore.removeMessageFromQueue(queuedMsg.clientId);
      } catch (err) {
        console.warn(`Failed to send queued message:`, err);
      }
    }
  };

  const syncAfterReconnect = async (channelId: number) => {
    const lastSyncTime = chatStore.getLastSyncTime(channelId);

    if (!lastSyncTime) {
      return openChannelWithAbly(channelId);
    }

    try {
      chatStore.setSyncStatus(channelId, "syncing");

      const response = await api.get<Message[]>(
        `/chat/channels/${channelId}/messages`,
        {
          since: lastSyncTime,
          limit: 100,
        },
      );

      if (response.success && response.data) {
        response.data.forEach((msg) => {
          const key = msg.id.toString();
          if (!processedMessageIds.value.has(key)) {
            chatStore.addMessage(channelId, msg);
            processedMessageIds.value.add(key);
          }
        });
      }

      chatStore.setSyncStatus(channelId, "synced");
      chatStore.setLastSyncedAt(channelId, new Date().toISOString());

      await flushMessageQueue(channelId);
    } catch (err) {
      chatStore.setSyncStatus(channelId, "error");
      console.error("Sync after reconnect error:", err);
    }
  };

  const uploadChatImage = async (file: File) => {
    try {
      const response = await api.uploadFile("/media", file, { type: "chat" });

      if (response.success && response.data) {
        return response.data.url;
      }

      throw new Error(response.message || "Failed to upload image");
    } catch (error: any) {
      console.error("Upload chat image error:", error);
      throw error;
    }
  };

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

    // ========== REAL-TIME METHODS ==========
    openChannelWithAbly,
    subscribeToChannelUpdates,
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
        : [];
    }),
    onlineUsers: computed(() => {
      return chatStore.currentChannel
        ? chatStore.getOnlineUsers(chatStore.currentChannel.id)
        : [];
    }),
    syncStatus: computed(() => {
      return chatStore.currentChannel
        ? chatStore.getSyncStatus(chatStore.currentChannel.id)
        : "syncing";
    }),
    isChannelSynced: computed(() => {
      return chatStore.currentChannel
        ? chatStore.isChannelSynced(chatStore.currentChannel.id)
        : false;
    }),
    hasQueuedMessages: computed(() => chatStore.hasQueuedMessages),
    pendingMessages: computed(() => {
      return chatStore.currentChannel
        ? chatStore.getPendingMessages(chatStore.currentChannel.id)
        : [];
    }),
    loading: computed(() => chatStore.loading),
    error: computed(() => chatStore.error),
    unreadCount: computed(() => chatStore.unreadCount),
    hasUnreadMessages: computed(() => chatStore.hasUnreadMessages),
  };
};
