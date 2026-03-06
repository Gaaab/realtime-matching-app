import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'
import type { AppNotification } from '~/types/notification'
import type { useNotificationsStore } from '~/stores/notifications'

export function createNotificationRealtimeHandler(
  notificationsStore: ReturnType<typeof useNotificationsStore>,
) {
  const handler = (event: ParsedEvent, envelope: RealtimeEnvelope): AppNotification | null => {
    if (event.action !== 'notification:created') return null

    const notification: AppNotification = {
      id: envelope.data.id || crypto.randomUUID(),
      type: envelope.data.type || 'general',
      title: envelope.data.title || 'New Notification',
      body: envelope.data.body || '',
      data: envelope.data,
      read_at: null,
      created_at: envelope.meta.timestamp || new Date().toISOString(),
    }

    notificationsStore.addNotification(notification)
    return notification
  }

  return { handler }
}
