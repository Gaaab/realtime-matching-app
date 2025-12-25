/**
 * Ably Connection State Store
 *
 * Manages Ably client connection state, errors, and channel subscriptions
 */

import { defineStore } from 'pinia'
import type { ConnectionState, ConnectionMetrics, AblyError as ChatAblyError } from '~/types/chat'

export interface AblyError {
  code: number
  message: string
  statusCode: number
  timestamp: string
}

export interface AblyState {
  connectionState: ConnectionState
  previousState: ConnectionState | null
  isConnected: boolean
  connectionError: AblyError | null
  errorHistory: AblyError[]
  tokenExpiresAt: number | null
  activeChannels: string[]
  metrics: ConnectionMetrics
  isReconnecting: boolean
  reconnectBackoffMs: number
}

export const useAblyStore = defineStore('ably', {
  state: (): AblyState => ({
    connectionState: 'initialized',
    previousState: null,
    isConnected: false,
    connectionError: null,
    errorHistory: [],
    tokenExpiresAt: null,
    activeChannels: [],
    metrics: {
      latency: 0,
      lastPingAt: null,
      reconnectAttempts: 0,
      totalReconnects: 0,
      connectionUptime: 0,
      lastConnectedAt: null,
      lastDisconnectedAt: null
    },
    isReconnecting: false,
    reconnectBackoffMs: 1000
  }),

  getters: {
    /**
     * Check if Ably is ready to use
     */
    isReady: (state) => state.isConnected && !state.connectionError,

    /**
     * Get connection quality based on latency
     */
    connectionQuality: (state): 'excellent' | 'good' | 'poor' | 'unknown' => {
      if (!state.isConnected) return 'unknown'
      if (state.metrics.latency < 100) return 'excellent'
      if (state.metrics.latency < 300) return 'good'
      return 'poor'
    },

    /**
     * Check if showing reconnecting state
     */
    shouldShowReconnecting: (state) => {
      return state.isReconnecting && state.metrics.reconnectAttempts > 0
    },

    /**
     * Get error message for display
     */
    errorMessage: (state) => state.connectionError?.message || null,

    /**
     * Check if token is about to expire (within 5 minutes)
     */
    isTokenExpiringSoon: (state) => {
      if (!state.tokenExpiresAt) return false
      return state.tokenExpiresAt - Date.now() < 5 * 60 * 1000
    },

    /**
     * Get formatted uptime
     */
    formattedUptime: (state) => {
      const uptime = state.metrics.connectionUptime
      const hours = Math.floor(uptime / 3600000)
      const minutes = Math.floor((uptime % 3600000) / 60000)
      const seconds = Math.floor((uptime % 60000) / 1000)
      return `${hours}h ${minutes}m ${seconds}s`
    },

    /**
     * Get recent errors (last 5)
     */
    recentErrors: (state) => state.errorHistory.slice(-5),

    /**
     * Get number of active subscriptions
     */
    activeChannelCount: (state) => state.activeChannels.length,

    /**
     * Check if subscribed to specific channel
     */
    isSubscribedTo: (state) => (channelName: string) => {
      return state.activeChannels.includes(channelName)
    }
  },

  actions: {
    /**
     * Set connection state
     */
    setConnectionState(state: ConnectionState) {
      this.previousState = this.connectionState
      this.connectionState = state
      this.isConnected = state === 'connected'

      if (state === 'connected') {
        this.metrics.lastConnectedAt = new Date().toISOString()
        this.isReconnecting = false
        this.reconnectBackoffMs = 1000

        if (this.previousState === 'disconnected' || this.previousState === 'suspended') {
          this.metrics.totalReconnects++
        }
      } else if (state === 'disconnected') {
        this.metrics.lastDisconnectedAt = new Date().toISOString()
        this.isReconnecting = true
      }
    },

    /**
     * Set connection status (legacy compatibility)
     */
    setConnected(connected: boolean) {
      this.setConnectionState(connected ? 'connected' : 'disconnected')
    },

    /**
     * Set connection error
     */
    setConnectionError(error: AblyError | null) {
      this.connectionError = error

      if (error) {
        this.errorHistory.push({
          ...error,
          timestamp: new Date().toISOString()
        })

        // Keep only last 20 errors
        if (this.errorHistory.length > 20) {
          this.errorHistory = this.errorHistory.slice(-20)
        }

        this.metrics.reconnectAttempts++
      }
    },

    /**
     * Update connection metrics
     */
    updateMetrics(metrics: Partial<ConnectionMetrics>) {
      this.metrics = { ...this.metrics, ...metrics }
    },

    /**
     * Increment reconnect backoff
     */
    incrementReconnectBackoff() {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
      this.reconnectBackoffMs = Math.min(this.reconnectBackoffMs * 2, 30000)
    },

    /**
     * Reset reconnect backoff
     */
    resetReconnectBackoff() {
      this.reconnectBackoffMs = 1000
      this.metrics.reconnectAttempts = 0
    },

    /**
     * Set token expiration timestamp (milliseconds)
     */
    setTokenExpiresAt(timestamp: number | null) {
      this.tokenExpiresAt = timestamp
    },

    /**
     * Add channel to active subscriptions list
     */
    addActiveChannel(channelName: string) {
      if (!this.activeChannels.includes(channelName)) {
        this.activeChannels.push(channelName)
      }
    },

    /**
     * Remove channel from active subscriptions list
     */
    removeActiveChannel(channelName: string) {
      this.activeChannels = this.activeChannels.filter(
        (name) => name !== channelName
      )
    },

    /**
     * Clear all active channels
     */
    clearActiveChannels() {
      this.activeChannels = []
    },

    /**
     * Reset connection state
     */
    reset() {
      this.$reset()
    }
  }
})
