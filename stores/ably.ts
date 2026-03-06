/**
 * Ably Connection State Store
 *
 * Manages Ably client connection state and errors.
 * With channel multiplexing, activeChannels typically contains a single
 * multiplexed user channel (e.g. "user.{userId}").
 */

import { defineStore } from "pinia";

export interface AblyError {
  code: number;
  message: string;
  statusCode: number;
}

export interface AblyState {
  isConnected: boolean;
  connectionError: AblyError | null;
  tokenExpiresAt: number | null;
  connectionAttempts: number;
  lastConnectionTime: string | null;
  activeChannels: string[];
}

export const useAblyStore = defineStore("ably", {
  state: (): AblyState => ({
    isConnected: false,
    connectionError: null,
    tokenExpiresAt: null,
    connectionAttempts: 0,
    lastConnectionTime: null,
    activeChannels: [],
  }),

  getters: {
    /**
     * Check if Ably is ready to use
     */
    isReady: (state) => state.isConnected && state.connectionError === null,

    /**
     * Get error message for display
     */
    errorMessage: (state) => state.connectionError?.message || null,

    /**
     * Check if token is about to expire (within 5 minutes)
     */
    isTokenExpiringSoon: (state) => {
      if (!state.tokenExpiresAt) return false;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      return state.tokenExpiresAt - now < fiveMinutes;
    },

    /**
     * Get number of active subscriptions
     */
    activeChannelCount: (state) => state.activeChannels.length,

    /**
     * Check if subscribed to specific channel
     */
    isSubscribedTo: (state) => (channelName: string) => {
      return state.activeChannels.includes(channelName);
    },
  },

  actions: {
    /**
     * Set connection status
     */
    setConnected(connected: boolean) {
      this.isConnected = connected;
      if (connected) {
        this.lastConnectionTime = new Date().toISOString();
        this.connectionAttempts = 0;
      }
    },

    /**
     * Set connection error
     */
    setConnectionError(error: AblyError | null) {
      this.connectionError = error;
      if (error) {
        this.connectionAttempts++;
      }
    },

    /**
     * Set token expiration timestamp (milliseconds)
     */
    setTokenExpiresAt(timestamp: number | null) {
      this.tokenExpiresAt = timestamp;
    },

    /**
     * Add channel to active subscriptions list
     */
    addActiveChannel(channelName: string) {
      if (!this.activeChannels.includes(channelName)) {
        this.activeChannels.push(channelName);
      }
    },

    /**
     * Remove channel from active subscriptions list
     */
    removeActiveChannel(channelName: string) {
      this.activeChannels = this.activeChannels.filter(
        (name) => name !== channelName,
      );
    },

    /**
     * Clear all active channels
     */
    clearActiveChannels() {
      this.activeChannels = [];
    },

    /**
     * Reset connection state
     */
    reset() {
      this.isConnected = false;
      this.connectionError = null;
      this.tokenExpiresAt = null;
      this.connectionAttempts = 0;
      this.lastConnectionTime = null;
      this.activeChannels = [];
    },
  },
});
