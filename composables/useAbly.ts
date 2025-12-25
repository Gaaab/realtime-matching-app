/**
 * Ably Real-time Operations Composable
 *
 * Handles channel subscriptions, message publishing, presence tracking,
 * and real-time event management
 */

import type { Realtime, RealtimeChannel } from 'ably'

export interface AblyEventCallback {
  onMessage?: (message: any) => void
  onUpdate?: (message: any) => void
  onDelete?: (messageId: any) => void
  onError?: (error: Error) => void
}

interface ChannelSubscription {
  channel: RealtimeChannel
  unsubscribe: () => void
}

interface PresenceSubscription {
  unsubscribe: () => void
}

export const useAbly = () => {
  const nuxt = useNuxtApp()
  const ably = nuxt.$ably as Realtime | null

  const ablyStore = useAblyStore()
  const subscriptions = ref<Map<string, ChannelSubscription>>(new Map())
  const presenceSubscriptions = ref<Map<string, PresenceSubscription>>(
    new Map()
  )

  /**
   * Check if Ably is available (user is authenticated)
   */
  const isAvailable = computed(() => ably !== null)

  /**
   * Get or create Ably channel
   * Returns null if Ably is not available
   */
  const getChannel = (channelId: string | number): RealtimeChannel | null => {
    if (!ably) {
      console.warn('Ably: Not available, cannot get channel')
      return null
    }
    const channelName = `channel:${channelId}`
    return ably.channels.get(channelName)
  }

  /**
   * Subscribe to channel message updates
   */
  const subscribeToChannel = (
    channelId: string | number,
    callbacks: AblyEventCallback
  ): (() => void) => {
    const channelName = `channel:${channelId}`

    // Check if Ably is available
    if (!ably) {
      console.warn('Ably: Not available, cannot subscribe to channel')
      return () => {
        /* no-op */
      }
    }

    // Check if already subscribed
    if (subscriptions.value.has(channelName)) {
      console.warn(`Already subscribed to ${channelName}`)
      return () => {
        /* no-op */
      }
    }

    try {
      const channel = getChannel(channelId)
      if (!channel) {
        return () => {
          /* no-op */
        }
      }

      // Subscribe to message events
      const messageHandler = (message: any) => {
        if (callbacks.onMessage) {
          callbacks.onMessage(message)
        }
      }

      const updateHandler = (message: any) => {
        if (callbacks.onUpdate) {
          callbacks.onUpdate(message)
        }
      }

      const deleteHandler = (message: any) => {
        if (callbacks.onDelete) {
          callbacks.onDelete(message)
        }
      }

      // Subscribe to different event types
      channel.subscribe('message:created', messageHandler)
      channel.subscribe('message:updated', updateHandler)
      channel.subscribe('message:deleted', deleteHandler)

      // Handle channel errors
      channel.on('error', (error) => {
        if (callbacks.onError) {
          callbacks.onError(new Error(error.message || 'Channel error'))
        }
      })

      // Store subscription for cleanup
      const unsubscribe = () => {
        channel.unsubscribe('message:created', messageHandler)
        channel.unsubscribe('message:updated', updateHandler)
        channel.unsubscribe('message:deleted', deleteHandler)
        subscriptions.value.delete(channelName)
        ablyStore.removeActiveChannel(channelName)
      }

      subscriptions.value.set(channelName, {
        channel,
        unsubscribe
      })

      ablyStore.addActiveChannel(channelName)
      console.log(`Subscribed to ${channelName}`)

      return unsubscribe
    } catch (error: any) {
      console.error(`Failed to subscribe to ${channelName}:`, error)
      if (callbacks.onError) {
        callbacks.onError(error)
      }
      return () => {
        /* no-op */
      }
    }
  }

  /**
   * Unsubscribe from channel
   */
  const unsubscribeFromChannel = (channelId: string | number): void => {
    const channelName = `channel:${channelId}`
    const subscription = subscriptions.value.get(channelName)

    if (subscription) {
      subscription.unsubscribe()
      console.log(`Unsubscribed from ${channelName}`)
    }
  }

  /**
   * Publish message to channel
   */
  const publishMessage = async (
    channelId: string | number,
    eventName: string,
    data: any
  ): Promise<void> => {
    const channelName = `channel:${channelId}`

    try {
      if (!ably) {
        throw new Error('Ably not available. User may not be authenticated.')
      }

      if (!ablyStore.isConnected) {
        throw new Error(
          'Ably not connected. Message will be queued for retry.'
        )
      }

      const channel = getChannel(channelId)
      if (!channel) {
        throw new Error('Failed to get channel')
      }
      await channel.publish(eventName, data)
      console.log(`Published ${eventName} to ${channelName}`)
    } catch (error: any) {
      console.error(`Failed to publish to ${channelName}:`, error)
      throw error
    }
  }

  /**
   * Subscribe to presence updates in a channel
   */
  const subscribeToPresence = (
    channelId: string | number,
    callbacks: {
      onEnter?: (member: any) => void
      onUpdate?: (member: any) => void
      onLeave?: (member: any) => void
      onError?: (error: Error) => void
    }
  ): (() => void) => {
    const channelName = `channel:${channelId}`
    const presenceKey = `${channelName}:presence`

    // Check if Ably is available
    if (!ably) {
      console.warn('Ably: Not available, cannot subscribe to presence')
      return () => {
        /* no-op */
      }
    }

    try {
      const channel = getChannel(channelId)
      if (!channel) {
        return () => {
          /* no-op */
        }
      }
      const presence = channel.presence

      // Subscribe to presence events
      const enterHandler = (presenceMessage: any) => {
        if (callbacks.onEnter) {
          callbacks.onEnter(presenceMessage)
        }
      }

      const updateHandler = (presenceMessage: any) => {
        if (callbacks.onUpdate) {
          callbacks.onUpdate(presenceMessage)
        }
      }

      const leaveHandler = (presenceMessage: any) => {
        if (callbacks.onLeave) {
          callbacks.onLeave(presenceMessage)
        }
      }

      presence.subscribe('enter', enterHandler)
      presence.subscribe('update', updateHandler)
      presence.subscribe('leave', leaveHandler)

      // Handle presence errors
      presence.on('error', (error: any) => {
        if (callbacks.onError) {
          callbacks.onError(new Error(error.message || 'Presence error'))
        }
      })

      // Store subscription for cleanup
      const unsubscribe = () => {
        presence.unsubscribe('enter', enterHandler)
        presence.unsubscribe('update', updateHandler)
        presence.unsubscribe('leave', leaveHandler)
        presenceSubscriptions.value.delete(presenceKey)
      }

      presenceSubscriptions.value.set(presenceKey, { unsubscribe })
      console.log(`Subscribed to presence in ${channelName}`)

      return unsubscribe
    } catch (error: any) {
      console.error(`Failed to subscribe to presence in ${channelName}:`, error)
      if (callbacks.onError) {
        callbacks.onError(error)
      }
      return () => {
        /* no-op */
      }
    }
  }

  /**
   * Update user presence in a channel
   */
  const updatePresence = async (
    channelId: string | number,
    data: any
  ): Promise<void> => {
    const channelName = `channel:${channelId}`

    try {
      const channel = getChannel(channelId)
      if (!channel) {
        throw new Error('Failed to get channel')
      }
      await channel.presence.update(data)
      console.log(`Updated presence in ${channelName}`)
    } catch (error: any) {
      console.error(`Failed to update presence in ${channelName}:`, error)
      throw error
    }
  }

  /**
   * Enter presence in a channel
   */
  const enterPresence = async (
    channelId: string | number,
    data: any
  ): Promise<void> => {
    const channelName = `channel:${channelId}`

    try {
      const channel = getChannel(channelId)
      if (!channel) {
        throw new Error('Failed to get channel')
      }
      await channel.presence.enter(data)
      console.log(`Entered presence in ${channelName}`)
    } catch (error: any) {
      console.error(`Failed to enter presence in ${channelName}:`, error)
      throw error
    }
  }

  /**
   * Leave presence in a channel
   */
  const leavePresence = async (channelId: string | number): Promise<void> => {
    const channelName = `channel:${channelId}`

    try {
      const channel = getChannel(channelId)
      await channel.presence.leave()
      console.log(`Left presence in ${channelName}`)
    } catch (error: any) {
      console.error(`Failed to leave presence in ${channelName}:`, error)
      throw error
    }
  }

  /**
   * Get current presence members in a channel
   */
  const getPresenceMembers = async (
    channelId: string | number
  ): Promise<any[]> => {
    const channelName = `channel:${channelId}`

    try {
      const channel = getChannel(channelId)
      const members = await channel.presence.get()
      return members
    } catch (error: any) {
      console.error(`Failed to get presence members in ${channelName}:`, error)
      throw error
    }
  }

  /**
   * Publish typing indicator
   */
  const publishTyping = async (
    channelId: string | number,
    isTyping: boolean
  ): Promise<void> => {
    try {
      await publishMessage(channelId, 'typing', {
        isTyping,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.warn('Failed to publish typing indicator:', error)
      // Don't throw - typing indicators are non-critical
    }
  }

  /**
   * Clean up all subscriptions
   */
  const cleanup = () => {
    subscriptions.value.forEach((subscription) => {
      subscription.unsubscribe()
    })
    presenceSubscriptions.value.forEach((subscription) => {
      subscription.unsubscribe()
    })
    subscriptions.value.clear()
    presenceSubscriptions.value.clear()
  }

  /**
   * Get connection state
   */
  const isConnected = computed(() => ablyStore.isConnected)

  /**
   * Get error state
   */
  const error = computed(() => ablyStore.connectionError)

  // Cleanup on unmount
  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    // Connection state
    isConnected,
    error,

    // Channel operations
    getChannel,
    subscribeToChannel,
    unsubscribeFromChannel,
    publishMessage,

    // Presence operations
    subscribeToPresence,
    updatePresence,
    enterPresence,
    leavePresence,
    getPresenceMembers,

    // Typing indicator
    publishTyping,

    // Lifecycle
    cleanup
  }
}
