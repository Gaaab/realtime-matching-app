import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationsStore } from '~/stores/notifications'
import { createNotificationRealtimeHandler } from '~/composables/useNotificationRealtimeHandler'
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

describe('createNotificationRealtimeHandler', () => {
  let notificationsStore: ReturnType<typeof useNotificationsStore>
  let handler: ReturnType<typeof createNotificationRealtimeHandler>['handler']

  beforeEach(() => {
    setActivePinia(createPinia())
    notificationsStore = useNotificationsStore()
    const result = createNotificationRealtimeHandler(notificationsStore)
    handler = result.handler
  })

  it('adds a notification on notification:created', () => {
    handler(
      makeParsed('notification:created'),
      makeEnvelope('notification:created', {
        id: 'n-1',
        type: 'match',
        title: 'New Match!',
        body: 'You have a new match',
      })
    )

    expect(notificationsStore.notifications).toHaveLength(1)
    expect(notificationsStore.notifications[0].title).toBe('New Match!')
    expect(notificationsStore.unreadCount).toBe(1)
  })

  it('uses defaults for missing fields', () => {
    handler(
      makeParsed('notification:created'),
      makeEnvelope('notification:created', {})
    )

    const notification = notificationsStore.notifications[0]
    expect(notification.type).toBe('general')
    expect(notification.title).toBe('New Notification')
    expect(notification.body).toBe('')
    expect(notification.id).toBeTruthy()
  })

  it('uses envelope timestamp for created_at', () => {
    handler(
      makeParsed('notification:created'),
      makeEnvelope('notification:created', { id: 'n-2', title: 'Test' })
    )

    expect(notificationsStore.notifications[0].created_at).toBe('2026-01-01T00:00:00Z')
  })

  it('notification is unread by default', () => {
    handler(
      makeParsed('notification:created'),
      makeEnvelope('notification:created', { id: 'n-3', title: 'Test' })
    )

    expect(notificationsStore.notifications[0].read_at).toBeNull()
  })

  it('ignores non-notification events', () => {
    handler(
      makeParsed('match:created'),
      makeEnvelope('match:created', { id: 'n-4', title: 'Test' })
    )

    expect(notificationsStore.notifications).toHaveLength(0)
  })

  it('returns the created notification for toast display', () => {
    const result = handler(
      makeParsed('notification:created'),
      makeEnvelope('notification:created', {
        id: 'n-5',
        title: 'Hello',
        body: 'World',
      })
    )

    expect(result?.title).toBe('Hello')
    expect(result?.body).toBe('World')
  })
})
