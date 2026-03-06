import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePresenceStore } from '~/stores/presence'
import { createPresenceRealtimeHandler } from '~/composables/usePresenceHandler'
import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'

function makeEnvelope(event: string, data: Record<string, any>): RealtimeEnvelope {
  return {
    event,
    data,
    meta: { timestamp: '2026-01-01T00:00:00Z', version: '1', source: 'api' },
  }
}

function makeParsed(action: string): ParsedEvent {
  return { scope: 'user', id: null, action }
}

describe('createPresenceRealtimeHandler', () => {
  let presenceStore: ReturnType<typeof usePresenceStore>
  let handler: ReturnType<typeof createPresenceRealtimeHandler>['handler']

  beforeEach(() => {
    setActivePinia(createPinia())
    presenceStore = usePresenceStore()
    const result = createPresenceRealtimeHandler(presenceStore)
    handler = result.handler
  })

  it('updates presence on presence:changed with online status', () => {
    handler(
      makeParsed('presence:changed'),
      makeEnvelope('presence:changed', {
        user_id: 42,
        status: 'online',
        last_active_at: '2026-01-01T00:00:00Z',
      })
    )

    expect(presenceStore.isOnline(42)).toBe(true)
    const presence = presenceStore.getPresence(42)
    expect(presence?.status).toBe('online')
  })

  it('removes presence on presence:changed with offline status', () => {
    presenceStore.updatePresence(42, { status: 'online', last_active_at: '2026-01-01T00:00:00Z' })

    handler(
      makeParsed('presence:changed'),
      makeEnvelope('presence:changed', {
        user_id: 42,
        status: 'offline',
        last_active_at: '2026-01-01T01:00:00Z',
      })
    )

    expect(presenceStore.isOnline(42)).toBe(false)
    expect(presenceStore.getPresence(42)).toBeNull()
  })

  it('updates presence to away status', () => {
    handler(
      makeParsed('presence:changed'),
      makeEnvelope('presence:changed', {
        user_id: 42,
        status: 'away',
        last_active_at: '2026-01-01T00:00:00Z',
      })
    )

    expect(presenceStore.isOnline(42)).toBe(false)
    expect(presenceStore.getPresence(42)?.status).toBe('away')
  })

  it('ignores non-presence events', () => {
    handler(
      makeParsed('match:created'),
      makeEnvelope('match:created', { user_id: 42, status: 'online' })
    )

    expect(presenceStore.getPresence(42)).toBeNull()
  })

  it('ignores presence events without user_id', () => {
    handler(
      makeParsed('presence:changed'),
      makeEnvelope('presence:changed', { status: 'online' })
    )

    expect(Object.keys(presenceStore.userPresence)).toHaveLength(0)
  })

  it('defaults last_active_at when missing', () => {
    handler(
      makeParsed('presence:changed'),
      makeEnvelope('presence:changed', {
        user_id: 42,
        status: 'online',
      })
    )

    const presence = presenceStore.getPresence(42)
    expect(presence?.lastActiveAt).toBeTruthy()
  })
})
