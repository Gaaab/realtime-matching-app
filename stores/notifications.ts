import { defineStore } from 'pinia'
import type { AppNotification } from '~/types/notification'

interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
}

export const useNotificationsStore = defineStore('notifications', {
  state: (): NotificationsState => ({
    notifications: [],
    unreadCount: 0,
  }),

  getters: {
    hasUnread: (state) => state.unreadCount > 0,

    recentNotifications: (state) => {
      return [...state.notifications]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50)
    },
  },

  actions: {
    addNotification(notification: AppNotification) {
      const exists = this.notifications.find(n => n.id === notification.id)
      if (!exists) {
        this.notifications.unshift(notification)
        if (!notification.read_at) {
          this.unreadCount++
        }
      }
    },

    markRead(notificationId: string) {
      const notification = this.notifications.find(n => n.id === notificationId)
      if (notification && !notification.read_at) {
        notification.read_at = new Date().toISOString()
        this.unreadCount = Math.max(0, this.unreadCount - 1)
      }
    },

    markAllRead() {
      this.notifications.forEach(n => {
        if (!n.read_at) {
          n.read_at = new Date().toISOString()
        }
      })
      this.unreadCount = 0
    },

    setNotifications(notifications: AppNotification[]) {
      this.notifications = notifications
      this.unreadCount = notifications.filter(n => !n.read_at).length
    },

    reset() {
      this.notifications = []
      this.unreadCount = 0
    },
  },
})
