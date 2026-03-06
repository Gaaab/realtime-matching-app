import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePresenceStore } from '~/stores/presence'

describe('presence store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty state', () => {
    const store = usePresenceStore()
    expect(store.userPresence).toEqual({})
  })

  describe('updatePresence', () => {
    it('adds a new user presence entry', () => {
      const store = usePresenceStore()

      store.updatePresence(42, { status: 'online', last_active_at: '2026-01-01T00:00:00Z' })

      expect(store.userPresence[42]).toEqual({
        userId: 42,
        status: 'online',
        lastActiveAt: '2026-01-01T00:00:00Z',
      })
    })

    it('updates an existing user presence', () => {
      const store = usePresenceStore()
      store.updatePresence(42, { status: 'online', last_active_at: '2026-01-01T00:00:00Z' })

      store.updatePresence(42, { status: 'away', last_active_at: '2026-01-01T01:00:00Z' })

      expect(store.userPresence[42].status).toBe('away')
      expect(store.userPresence[42].lastActiveAt).toBe('2026-01-01T01:00:00Z')
    })
  })

  describe('removePresence', () => {
    it('removes a user presence entry', () => {
      const store = usePresenceStore()
      store.updatePresence(42, { status: 'online', last_active_at: '2026-01-01T00:00:00Z' })

      store.removePresence(42)

      expect(store.userPresence[42]).toBeUndefined()
    })

    it('is a no-op for unknown user', () => {
      const store = usePresenceStore()
      store.removePresence(999)
      expect(store.userPresence).toEqual({})
    })
  })

  describe('isOnline getter', () => {
    it('returns true for online users', () => {
      const store = usePresenceStore()
      store.updatePresence(1, { status: 'online', last_active_at: '2026-01-01T00:00:00Z' })

      expect(store.isOnline(1)).toBe(true)
    })

    it('returns false for away users', () => {
      const store = usePresenceStore()
      store.updatePresence(1, { status: 'away', last_active_at: '2026-01-01T00:00:00Z' })

      expect(store.isOnline(1)).toBe(false)
    })

    it('returns false for unknown users', () => {
      const store = usePresenceStore()
      expect(store.isOnline(999)).toBe(false)
    })
  })

  describe('getPresence getter', () => {
    it('returns presence for known user', () => {
      const store = usePresenceStore()
      store.updatePresence(5, { status: 'online', last_active_at: '2026-01-01T00:00:00Z' })

      const presence = store.getPresence(5)
      expect(presence).toEqual({
        userId: 5,
        status: 'online',
        lastActiveAt: '2026-01-01T00:00:00Z',
      })
    })

    it('returns null for unknown user', () => {
      const store = usePresenceStore()
      expect(store.getPresence(999)).toBeNull()
    })
  })

  describe('reset', () => {
    it('clears all presence data', () => {
      const store = usePresenceStore()
      store.updatePresence(1, { status: 'online', last_active_at: '2026-01-01T00:00:00Z' })
      store.updatePresence(2, { status: 'away', last_active_at: '2026-01-01T00:00:00Z' })

      store.reset()

      expect(store.userPresence).toEqual({})
    })
  })
})
