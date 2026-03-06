import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationsStore } from '~/stores/notifications'
import type { AppNotification } from '~/types/notification'

function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: '1',
    type: 'general',
    title: 'Test',
    body: 'Test body',
    data: {},
    read_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('notifications store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty state', () => {
    const store = useNotificationsStore()
    expect(store.notifications).toEqual([])
    expect(store.unreadCount).toBe(0)
    expect(store.hasUnread).toBe(false)
  })

  describe('addNotification', () => {
    it('adds an unread notification and increments unread count', () => {
      const store = useNotificationsStore()
      const notification = makeNotification()

      store.addNotification(notification)

      expect(store.notifications).toHaveLength(1)
      expect(store.unreadCount).toBe(1)
      expect(store.hasUnread).toBe(true)
    })

    it('adds a read notification without incrementing unread count', () => {
      const store = useNotificationsStore()
      const notification = makeNotification({ read_at: '2026-01-01T01:00:00Z' })

      store.addNotification(notification)

      expect(store.notifications).toHaveLength(1)
      expect(store.unreadCount).toBe(0)
    })

    it('deduplicates by id', () => {
      const store = useNotificationsStore()
      const notification = makeNotification({ id: 'dup-1' })

      store.addNotification(notification)
      store.addNotification(notification)

      expect(store.notifications).toHaveLength(1)
      expect(store.unreadCount).toBe(1)
    })

    it('prepends new notifications', () => {
      const store = useNotificationsStore()
      store.addNotification(makeNotification({ id: '1', title: 'First' }))
      store.addNotification(makeNotification({ id: '2', title: 'Second' }))

      expect(store.notifications[0].title).toBe('Second')
    })
  })

  describe('markRead', () => {
    it('marks a notification as read and decrements unread count', () => {
      const store = useNotificationsStore()
      store.addNotification(makeNotification({ id: 'r1' }))

      store.markRead('r1')

      expect(store.notifications[0].read_at).toBeTruthy()
      expect(store.unreadCount).toBe(0)
    })

    it('does not decrement below zero', () => {
      const store = useNotificationsStore()
      store.addNotification(makeNotification({ id: 'r2', read_at: '2026-01-01T00:00:00Z' }))

      store.markRead('r2')

      expect(store.unreadCount).toBe(0)
    })

    it('is a no-op for unknown notification id', () => {
      const store = useNotificationsStore()
      store.addNotification(makeNotification({ id: 'r3' }))

      store.markRead('nonexistent')

      expect(store.unreadCount).toBe(1)
    })
  })

  describe('markAllRead', () => {
    it('marks all notifications as read and resets unread count', () => {
      const store = useNotificationsStore()
      store.addNotification(makeNotification({ id: '1' }))
      store.addNotification(makeNotification({ id: '2' }))

      store.markAllRead()

      expect(store.unreadCount).toBe(0)
      store.notifications.forEach(n => {
        expect(n.read_at).toBeTruthy()
      })
    })
  })

  describe('setNotifications', () => {
    it('replaces all notifications and recalculates unread count', () => {
      const store = useNotificationsStore()
      store.addNotification(makeNotification({ id: 'old' }))

      const newList = [
        makeNotification({ id: 'a', read_at: null }),
        makeNotification({ id: 'b', read_at: '2026-01-01T00:00:00Z' }),
        makeNotification({ id: 'c', read_at: null }),
      ]

      store.setNotifications(newList)

      expect(store.notifications).toHaveLength(3)
      expect(store.unreadCount).toBe(2)
    })
  })

  describe('recentNotifications', () => {
    it('returns notifications sorted by created_at descending', () => {
      const store = useNotificationsStore()
      store.setNotifications([
        makeNotification({ id: 'old', created_at: '2026-01-01T00:00:00Z' }),
        makeNotification({ id: 'new', created_at: '2026-03-01T00:00:00Z' }),
        makeNotification({ id: 'mid', created_at: '2026-02-01T00:00:00Z' }),
      ])

      const recent = store.recentNotifications
      expect(recent[0].id).toBe('new')
      expect(recent[1].id).toBe('mid')
      expect(recent[2].id).toBe('old')
    })

    it('limits to 50 notifications', () => {
      const store = useNotificationsStore()
      const many = Array.from({ length: 60 }, (_, i) =>
        makeNotification({ id: `n-${i}`, created_at: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z` })
      )
      store.setNotifications(many)

      expect(store.recentNotifications).toHaveLength(50)
    })
  })

  describe('reset', () => {
    it('clears all state', () => {
      const store = useNotificationsStore()
      store.addNotification(makeNotification())

      store.reset()

      expect(store.notifications).toEqual([])
      expect(store.unreadCount).toBe(0)
    })
  })
})
