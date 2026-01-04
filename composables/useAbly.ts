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
   *
   * @param channelIdentifier - The channel UUID (channel_id) used by backend for broadcasting
   */
  const getChannel = (channelIdentifier: string): RealtimeChannel | null => {
    if (!ably) {
      console.warn('Ably: Not available, cannot get channel')
      return null
    }
    // Backend uses the channel_id UUID directly as the channel name
    return ably.channels.get(channelIdentifier)
  }

  /**
   * Subscribe to channel message updates
   *
   * @param channelIdentifier - The channel UUID (channel_id) to subscribe to
   * @param callbacks - Event callbacks for messages, updates, deletes, errors
   */
  const subscribeToChannel = (
    channelIdentifier: string,
    callbacks: AblyEventCallback
  ): (() => void) => {
    console.log(`[useAbly] subscribeToChannel called for: ${channelIdentifier}`)

    // Check if Ably is available
    if (!ably) {
      console.warn('[useAbly] Ably client not available, cannot subscribe to channel')
      return () => {
        /* no-op */
      }
    }

    console.log(`[useAbly] Ably connection state: ${ably.connection.state}`)

    // Check if already subscribed
    if (subscriptions.value.has(channelIdentifier)) {
      console.warn(`[useAbly] Already subscribed to ${channelIdentifier}, returning existing subscription`)
      return () => {
        /* no-op */
      }
    }

    try {
      const channel = getChannel(channelIdentifier)
      if (!channel) {
        console.error(`[useAbly] Failed to get channel: ${channelIdentifier}`)
        return () => {
          /* no-op */
        }
      }

      console.log(`[useAbly] Got Ably channel object for: ${channelIdentifier}`)

      // Subscribe to message events
      const messageHandler = (message: any) => {
        console.log(`[useAbly] Received message:created event on channel ${channelIdentifier}:`, {
          name: message.name,
          hasData: !!message.data,
          dataType: typeof message.data,
          messageId: message.data?.id
        })
        if (callbacks.onMessage) {
          callbacks.onMessage(message)
        }
      }

      const updateHandler = (message: any) => {
        console.log(`[useAbly] Received message:updated event on channel ${channelIdentifier}`)
        if (callbacks.onUpdate) {
          callbacks.onUpdate(message)
        }
      }

      const deleteHandler = (message: any) => {
        console.log(`[useAbly] Received message:deleted event on channel ${channelIdentifier}`)
        if (callbacks.onDelete) {
          callbacks.onDelete(message)
        }
      }

      // Subscribe to different event types
      channel.subscribe('message:created', messageHandler)
      channel.subscribe('message:updated', updateHandler)
      channel.subscribe('message:deleted', deleteHandler)

      console.log(`[useAbly] Subscribed to events: message:created, message:updated, message:deleted`)

      // Monitor channel state changes (including errors via 'failed' state)
      channel.on((stateChange) => {
        console.log(`[useAbly] Channel ${channelIdentifier} state changed:`, {
          current: stateChange.current,
          previous: stateChange.previous,
          reason: stateChange.reason?.message
        })

        // Handle failed state as an error
        if (stateChange.current === 'failed' && stateChange.reason) {
          console.error(`[useAbly] Channel error on ${channelIdentifier}:`, stateChange.reason)
          if (callbacks.onError) {
            callbacks.onError(new Error(stateChange.reason.message || 'Channel error'))
          }
        }
      })

      // Store subscription for cleanup
      const unsubscribe = () => {
        console.log(`[useAbly] Unsubscribing from channel: ${channelIdentifier}`)
        channel.unsubscribe('message:created', messageHandler)
        channel.unsubscribe('message:updated', updateHandler)
        channel.unsubscribe('message:deleted', deleteHandler)
        subscriptions.value.delete(channelIdentifier)
        ablyStore.removeActiveChannel(channelIdentifier)
      }

      subscriptions.value.set(channelIdentifier, {
        channel,
        unsubscribe
      })

      ablyStore.addActiveChannel(channelIdentifier)
      console.log(`[useAbly] Successfully subscribed to channel: ${channelIdentifier}`)

      return unsubscribe
    } catch (error: any) {
      console.error(`[useAbly] Failed to subscribe to ${channelIdentifier}:`, error)
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
   *
   * @param channelIdentifier - The channel UUID (channel_id) to unsubscribe from
   */
  const unsubscribeFromChannel = (channelIdentifier: string): void => {
    const subscription = subscriptions.value.get(channelIdentifier)

    if (subscription) {
      subscription.unsubscribe()
      console.log(`Unsubscribed from channel: ${channelIdentifier}`)
    }
  }

  /**
   * Publish message to channel
   *
   * @param channelIdentifier - The channel UUID (channel_id) to publish to
   * @param eventName - The event name (e.g., 'typing', 'message:created')
   * @param data - The event payload
   */
  const publishMessage = async (
    channelIdentifier: string,
    eventName: string,
    data: any
  ): Promise<void> => {
    try {
      if (!ably) {
        throw new Error('Ably not available. User may not be authenticated.')
      }

      if (!ablyStore.isConnected) {
        throw new Error(
          'Ably not connected. Message will be queued for retry.'
        )
      }

      const channel = getChannel(channelIdentifier)
      if (!channel) {
        throw new Error('Failed to get channel')
      }
      await channel.publish(eventName, data)
      console.log(`Published ${eventName} to channel: ${channelIdentifier}`)
    } catch (error: any) {
      console.error(`Failed to publish to ${channelIdentifier}:`, error)
      throw error
    }
  }

  /**
   * Subscribe to presence updates in a channel
   *
   * @param channelIdentifier - The channel UUID (channel_id) to subscribe to presence
   * @param callbacks - Callbacks for presence enter/update/leave/error events
   */
  const subscribeToPresence = (
    channelIdentifier: string,
    callbacks: {
      onEnter?: (member: any) => void
      onUpdate?: (member: any) => void
      onLeave?: (member: any) => void
      onError?: (error: Error) => void
    }
  ): (() => void) => {
    const presenceKey = `${channelIdentifier}:presence`

    // Check if Ably is available
    if (!ably) {
      console.warn('Ably: Not available, cannot subscribe to presence')
      return () => {
        /* no-op */
      }
    }

    try {
      const channel = getChannel(channelIdentifier)
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

      // Note: Presence errors are handled through the channel's state changes
      // and will be caught by the try/catch block

      // Store subscription for cleanup
      const unsubscribe = () => {
        presence.unsubscribe('enter', enterHandler)
        presence.unsubscribe('update', updateHandler)
        presence.unsubscribe('leave', leaveHandler)
        presenceSubscriptions.value.delete(presenceKey)
      }

      presenceSubscriptions.value.set(presenceKey, { unsubscribe })
      console.log(`Subscribed to presence in channel: ${channelIdentifier}`)

      return unsubscribe
    } catch (error: any) {
      console.error(`Failed to subscribe to presence in ${channelIdentifier}:`, error)
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
   *
   * @param channelIdentifier - The channel UUID (channel_id)
   * @param data - Presence data to update
   */
  const updatePresence = async (
    channelIdentifier: string,
    data: any
  ): Promise<void> => {
    try {
      const channel = getChannel(channelIdentifier)
      if (!channel) {
        throw new Error('Failed to get channel')
      }
      await channel.presence.update(data)
      console.log(`Updated presence in channel: ${channelIdentifier}`)
    } catch (error: any) {
      console.error(`Failed to update presence in ${channelIdentifier}:`, error)
      throw error
    }
  }

  /**
   * Enter presence in a channel
   *
   * @param channelIdentifier - The channel UUID (channel_id)
   * @param data - Presence data to send on enter
   */
  const enterPresence = async (
    channelIdentifier: string,
    data: any
  ): Promise<void> => {
    try {
      const channel = getChannel(channelIdentifier)
      if (!channel) {
        throw new Error('Failed to get channel')
      }
      await channel.presence.enter(data)
      console.log(`Entered presence in channel: ${channelIdentifier}`)
    } catch (error: any) {
      console.error(`Failed to enter presence in ${channelIdentifier}:`, error)
      throw error
    }
  }

  /**
   * Leave presence in a channel
   *
   * @param channelIdentifier - The channel UUID (channel_id)
   */
  const leavePresence = async (channelIdentifier: string): Promise<void> => {
    try {
      const channel = getChannel(channelIdentifier)
      if (!channel) {
        throw new Error('Failed to get channel')
      }
      await channel.presence.leave()
      console.log(`Left presence in channel: ${channelIdentifier}`)
    } catch (error: any) {
      console.error(`Failed to leave presence in ${channelIdentifier}:`, error)
      throw error
    }
  }

  /**
   * Get current presence members in a channel
   *
   * @param channelIdentifier - The channel UUID (channel_id)
   */
  const getPresenceMembers = async (
    channelIdentifier: string
  ): Promise<any[]> => {
    try {
      const channel = getChannel(channelIdentifier)
      if (!channel) {
        throw new Error('Failed to get channel')
      }
      const members = await channel.presence.get()
      return members
    } catch (error: any) {
      console.error(`Failed to get presence members in ${channelIdentifier}:`, error)
      throw error
    }
  }

  /**
   * Publish typing indicator
   *
   * @param channelIdentifier - The channel UUID (channel_id)
   * @param isTyping - Whether the user is typing
   */
  const publishTyping = async (
    channelIdentifier: string,
    isTyping: boolean
  ): Promise<void> => {
    try {
      await publishMessage(channelIdentifier, 'typing', {
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
    isAvailable,
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
