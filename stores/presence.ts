import { defineStore } from 'pinia'

export interface UserPresence {
  userId: number
  status: 'online' | 'offline' | 'away'
  lastActiveAt: string
}

interface PresenceState {
  userPresence: Record<number, UserPresence>
}

export const usePresenceStore = defineStore('presence', {
  state: (): PresenceState => ({
    userPresence: {},
  }),

  getters: {
    isOnline: (state) => {
      return (userId: number): boolean => {
        return state.userPresence[userId]?.status === 'online'
      }
    },

    getPresence: (state) => {
      return (userId: number): UserPresence | null => {
        return state.userPresence[userId] || null
      }
    },
  },

  actions: {
    updatePresence(userId: number, data: { status: string; last_active_at: string }) {
      this.userPresence[userId] = {
        userId,
        status: data.status as UserPresence['status'],
        lastActiveAt: data.last_active_at,
      }
    },

    removePresence(userId: number) {
      delete this.userPresence[userId]
    },

    reset() {
      this.userPresence = {}
    },
  },
})
