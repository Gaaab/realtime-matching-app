import type { Realtime, RealtimeChannel } from "ably";
import type {
  ParsedEvent,
  RealtimeEnvelope,
  RealtimeHandler,
  RealtimeScope,
  BroadcastingChannelsResponse,
} from "~/types/realtime";

export function parseEvent(name: string): ParsedEvent {
  if (name.startsWith("chat:")) {
    const parts = name.split(":");
    const uuid = parts[1];
    const action = parts.slice(2).join(":");
    return { scope: "chat", id: uuid, action };
  }
  if (name.startsWith("venue:")) {
    const parts = name.split(":");
    const venueId = parts[1];
    const action = parts.slice(2).join(":");
    return { scope: "venue", id: venueId, action };
  }
  return { scope: "user", id: null, action: name };
}

export function createRealtimeRouter() {
  const handlers = new Map<RealtimeScope, Set<RealtimeHandler>>();

  function registerHandler(scope: RealtimeScope, handler: RealtimeHandler) {
    if (!handlers.has(scope)) {
      handlers.set(scope, new Set());
    }
    handlers.get(scope)!.add(handler);
  }

  function unregisterHandler(scope: RealtimeScope, handler: RealtimeHandler) {
    handlers.get(scope)?.delete(handler);
  }

  function dispatch(parsed: ParsedEvent, envelope: RealtimeEnvelope) {
    const scopeHandlers = handlers.get(parsed.scope);
    if (scopeHandlers) {
      scopeHandlers.forEach((handler) => {
        try {
          handler(parsed, envelope);
        } catch (err) {
          console.error(
            `[Realtime] Handler error for ${parsed.scope}:${parsed.action}:`,
            err,
          );
        }
      });
    }
  }

  function reset() {
    handlers.clear();
  }

  return {
    registerHandler,
    unregisterHandler,
    dispatch,
    reset,
  };
}

// Module-scoped singleton router
const router = createRealtimeRouter();
let channel: RealtimeChannel | null = null;
let channelName: string | null = null;
let isSubscribed = false;

export const useRealtime = () => {
  const nuxt = useNuxtApp();
  const ablyStore = useAblyStore();

  function getAbly(): Realtime | null {
    return nuxt.$ably as Realtime | null;
  }

  async function connect() {
    const ably = getAbly();
    if (!ably || isSubscribed) return;

    try {
      const api = useApi();
      const response = await api.get<BroadcastingChannelsResponse>(
        "/broadcasting/channels",
      );

      if (!response.success || !response.data?.channel) {
        console.error("[Realtime] Failed to get channel name from backend");
        return;
      }

      channelName = response.data.channel;
      channel = ably.channels.get(channelName);

      channel.subscribe((message) => {
        try {
          const envelope = message.data as RealtimeEnvelope;
          if (!envelope?.event) {
            console.warn(
              "[Realtime] Received message without event field:",
              message,
            );
            return;
          }

          const parsed = parseEvent(envelope.event);
          router.dispatch(parsed, envelope);
        } catch (err) {
          console.error("[Realtime] Error processing message:", err);
        }
      });

      isSubscribed = true;
      ablyStore.addActiveChannel(channelName);
    } catch (err) {
      console.error("[Realtime] Failed to connect:", err);
    }
  }

  function disconnect() {
    if (channel && channelName) {
      channel.unsubscribe();
      ablyStore.removeActiveChannel(channelName);
      channel = null;
      channelName = null;
      isSubscribed = false;
    }
  }

  function reset() {
    disconnect();
    router.reset();
  }

  return {
    connect,
    disconnect,
    reset,
    registerHandler: router.registerHandler,
    unregisterHandler: router.unregisterHandler,
    parseEvent,
  };
};
