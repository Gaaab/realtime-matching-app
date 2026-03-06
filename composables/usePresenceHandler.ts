import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'
import type { usePresenceStore } from '~/stores/presence'

export function createPresenceRealtimeHandler(
  presenceStore: ReturnType<typeof usePresenceStore>,
) {
  const handler = (event: ParsedEvent, envelope: RealtimeEnvelope) => {
    if (event.action !== 'presence:changed') return

    const { user_id, status, last_active_at } = envelope.data
    if (!user_id) return

    if (status === 'offline') {
      presenceStore.removePresence(user_id)
    } else {
      presenceStore.updatePresence(user_id, {
        status,
        last_active_at: last_active_at || new Date().toISOString(),
      })
    }
  }

  return { handler }
}
