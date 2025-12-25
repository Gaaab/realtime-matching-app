/**
 * Ably Real-time Communication Plugin
 *
 * Initializes Ably client with authentication from backend API
 * Handles token refresh and connection lifecycle
 *
 * IMPORTANT: This plugin depends on the auth plugin being initialized first.
 * It waits for authStore.initialized to be true before connecting.
 */

import { Realtime, type TokenRequest } from 'ably'

declare global {
  interface NuxtApp {
    $ably: Realtime | null
  }
}

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  try {
    // Wait for auth initialization to complete AND user to be loaded
    // This ensures user data is loaded from storage and profile is fetched
    let maxWaitTime = 10000 // 10 seconds max wait
    const waitInterval = 50
    let iterations = 0

    console.log('[Ably] Waiting for user authentication...')

    // Wait for BOTH initialized flag AND user to be present
    while ((!authStore.initialized || !authStore.user?.id) && maxWaitTime > 0) {
      iterations++
      if (iterations % 20 === 0) { // Log every 1 second
        console.log(`[Ably] Still waiting... initialized=${authStore.initialized}, hasUser=${!!authStore.user?.id}`)
      }
      await new Promise(resolve => setTimeout(resolve, waitInterval))
      maxWaitTime -= waitInterval
    }

    // If still no user after waiting, skip Ably initialization
    if (!authStore.user?.id) {
      console.warn('[Ably] User ID not available after waiting, skipping Ably initialization')
      console.log(`[Ably] Final state: initialized=${authStore.initialized}, user=${authStore.user}`)
      return {
        provide: {
          ably: null
        }
      }
    }

    const userId = authStore.user.id.toString()
    console.log(`[Ably] User loaded successfully! Initializing with user ID ${userId}`)

    // Initialize Ably with token-based auth only (no API key exposed to client)
    // The authCallback will fetch tokens from our backend which includes the correct clientId
    const ably = new Realtime({
      authCallback: async (tokenParams, callback) => {
        try {
          // Fetch token from backend API
          // The backend will include the authenticated user's clientId in the token
          const api = useApi()
          const response = await api.post('/chat/auth', {
            formatted: true,
          })

          if (response.data) {
            console.log('Ably: Received token from backend with clientId:', (response.data as any).clientId)
            callback(null, response.data as TokenRequest)
          } else {
            callback(new Error('No token object in response'), null)
          }
        } catch (error: any) {
          console.error('Ably auth failed:', error)
          callback(error, null)
        }
      },
      // IMPORTANT: Do NOT set clientId here - let the token from backend provide it
      // This prevents mismatch errors between local clientId and token clientId
      autoConnect: false,

      // Connection options
      realtimeRequestTimeout: 10000,
      disconnectedRetryTimeout: 5000,
      suspendedRetryTimeout: 15000,

      // Logging (disabled in production)
      logLevel: import.meta.dev ? 1 : 0, // 0=error, 1=warning, 2=info, 3=debug
    })

    // Connect to Ably
    ably.connect()

    // Connection state monitoring
    ably.connection.on((stateChange) => {
      const ablyStore = useAblyStore()

      switch (stateChange.current) {
        case 'connected':
          ablyStore.setConnected(true)
          ablyStore.setConnectionError(null)
          console.log('Ably connected')
          break

        case 'connecting':
          console.log('Ably connecting...')
          break

        case 'disconnected':
          ablyStore.setConnected(false)
          console.log('Ably disconnected')
          break

        case 'suspended':
          ablyStore.setConnected(false)
          console.warn('Ably suspended - will attempt to reconnect')
          break

        case 'closed':
          ablyStore.setConnected(false)
          console.error('Ably connection closed')
          break

        case 'failed':
          ablyStore.setConnected(false)
          ablyStore.setConnectionError({
            code: stateChange.reason?.code || 0,
            message: stateChange.reason?.message || 'Unknown error',
            statusCode: stateChange.reason?.statusCode || 0
          })
          console.error('Ably connection failed:', stateChange.reason)
          break
      }
    })

    // Handle errors
    ably.connection.on('error', (error) => {
      const ablyStore = useAblyStore()
      ablyStore.setConnectionError({
        code: error.code || 0,
        message: error.message,
        statusCode: error.statusCode || 0
      })
      console.error('Ably error:', error)
    })

    // Provide Ably instance globally
    return {
      provide: {
        ably
      }
    }
  } catch (error: any) {
    console.error('Failed to initialize Ably:', error)

    // Return empty provide to prevent app crash
    return {
      provide: {
        ably: null
      }
    }
  }
})
