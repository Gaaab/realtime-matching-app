import type { ParsedEvent, RealtimeEnvelope } from "~/types/realtime";
import type { Message } from "~/types/chat";
import type { useChatStore } from "~/stores/chat";

export function createChatRealtimeHandler(
  chatStore: ReturnType<typeof useChatStore>,
  processedMessageIds: Set<string>,
  trackProcessedId?: (id: string) => void,
) {
  const trackId =
    trackProcessedId || ((id: string) => processedMessageIds.add(id));

  const handler = (event: ParsedEvent, envelope: RealtimeEnvelope) => {
    const channelUuid = event.id;
    if (!channelUuid) return;

    const channel = chatStore.channels.find(
      (c) => c.channel_id === channelUuid,
    );
    if (!channel) return;

    const channelId = channel.id;

    switch (event.action) {
      case "message:created": {
        const message = envelope.data as Message;
        const messageKey = `${message.id}`;
        if (processedMessageIds.has(messageKey)) return;
        trackId(messageKey);
        chatStore.addMessage(channelId, message);
        break;
      }
      case "message:updated": {
        const updatedMessage = envelope.data as Message;
        chatStore.addMessage(channelId, updatedMessage);
        break;
      }
      case "message:deleted": {
        const messageId = envelope.data.id;
        const messages = chatStore.getMessagesByChannel(channelId);
        chatStore.setMessages(
          channelId,
          messages.filter((m) => m.id !== messageId),
        );
        break;
      }
      case "typing:started": {
        const userId = envelope.data.user_id;
        if (userId) chatStore.setTypingUser(channelId, userId, true);
        break;
      }
      case "typing:stopped": {
        const userId = envelope.data.user_id;
        if (userId) chatStore.setTypingUser(channelId, userId, false);
        break;
      }
    }
  };

  return { handler };
}
