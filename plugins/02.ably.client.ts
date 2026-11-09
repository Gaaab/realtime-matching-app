/**
 * Ably Real-time Communication Plugin
 *
 * Initializes Ably client with authentication from backend API
 * Handles token refresh and connection lifecycle
 *
 * Loaded after 01.auth.ts via number prefix, so authStore.initialized
 * is guaranteed to be true when this plugin runs.
 */

import { Realtime, type TokenRequest } from "ably";
import { createVenueRealtimeHandler } from "~/composables/useVenueRealtimeHandler";
import { createMatchRealtimeHandler } from "~/composables/useMatchRealtimeHandler";
import { createChatRealtimeHandler } from "~/composables/useChatRealtimeHandler";
import { createNotificationRealtimeHandler } from "~/composables/useNotificationRealtimeHandler";
import { createPresenceRealtimeHandler } from "~/composables/usePresenceHandler";

declare global {
  interface NuxtApp {
    $ably: Realtime | null;
  }
}

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();

  try {
    // If user is not authenticated, don't initialize Ably
    // Real-time features require authentication
    if (!authStore.user?.id) {
      console.log("Ably: User not authenticated, skipping Ably initialization");
      return {
        provide: {
          ably: null,
        },
      };
    }

    const userId = authStore.user.id.toString();

    // Initialize Ably with token-based auth only (no API key exposed to client)
    // The authCallback will fetch tokens from our backend which includes the correct clientId
    const ably = new Realtime({
      authCallback: async (tokenParams, callback) => {
        try {
          // Fetch token from backend API
          // The backend will include the authenticated user's clientId in the token
          const api = useApi();
          const response = await api.post("/chat/auth", {
            formatted: true,
          });

          if (response.data) {
            callback(null, response.data as TokenRequest);
          } else {
            callback(new Error("No token object in response"), null);
          }
        } catch (error: any) {
          console.error("Ably auth failed:", error);
          callback(error, null);
        }
      },
      // Set clientId to match what the backend will return in the token
      clientId: userId,
      autoConnect: false,

      // Connection options
      realtimeRequestTimeout: 10000,
      disconnectedRetryTimeout: 5000,
      suspendedRetryTimeout: 15000,

      // Logging (disabled in production)
      logLevel: import.meta.dev ? 1 : 0, // 0=error, 1=warning, 2=info, 3=debug
    });

    // Register all domain realtime handlers once (session-lifetime)
    const realtime = useRealtime();
    const venuesStore = useVenuesStore();
    const matchesStore = useMatchesStore();
    const chatStore = useChatStore();
    const notificationsStore = useNotificationsStore();
    const presenceStore = usePresenceStore();

    realtime.registerHandler(
      "venue",
      createVenueRealtimeHandler(venuesStore).handler,
    );
    realtime.registerHandler(
      "user",
      createMatchRealtimeHandler(matchesStore).handler,
    );
    realtime.registerHandler(
      "chat",
      createChatRealtimeHandler(chatStore, new Set(), () => {}).handler,
    );
    realtime.registerHandler(
      "user",
      createNotificationRealtimeHandler(notificationsStore).handler,
    );
    realtime.registerHandler(
      "user",
      createPresenceRealtimeHandler(presenceStore).handler,
    );

    // Connect to Ably
    ably.connect();

    // Connection state monitoring
    ably.connection.on((stateChange) => {
      const ablyStore = useAblyStore();

      switch (stateChange.current) {
        case "connected":
          ablyStore.setConnected(true);
          ablyStore.setConnectionError(null);
          console.log("Ably connected");

          // Subscribe to the multiplexed channel (handlers already registered)
          realtime.connect();
          break;

        case "connecting":
          console.log("Ably connecting...");
          break;

        case "disconnected":
          ablyStore.setConnected(false);
          console.log("Ably disconnected");
          break;

        case "suspended":
          ablyStore.setConnected(false);
          console.warn("Ably suspended - will attempt to reconnect");
          break;

        case "closed":
          ablyStore.setConnected(false);
          console.error("Ably connection closed");
          break;

        case "failed":
          ablyStore.setConnected(false);
          ablyStore.setConnectionError({
            code: stateChange.reason?.code || 0,
            message: stateChange.reason?.message || "Unknown error",
            statusCode: stateChange.reason?.statusCode || 0,
          });
          console.error("Ably connection failed:", stateChange.reason);
          break;
      }
    });

    // Handle errors
    ably.connection.on("error", (error) => {
      const ablyStore = useAblyStore();
      ablyStore.setConnectionError({
        code: error.code || 0,
        message: error.message,
        statusCode: error.statusCode || 0,
      });
      console.error("Ably error:", error);
    });

    // Provide Ably instance globally
    return {
      provide: {
        ably,
      },
    };
  } catch (error: any) {
    console.error("Failed to initialize Ably:", error);

    // Return empty provide to prevent app crash
    return {
      provide: {
        ably: null,
      },
    };
  }
});
