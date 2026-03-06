import { usePresenceStore } from '~/stores/presence'
import { createPresenceRealtimeHandler } from '~/composables/usePresenceHandler'

export const usePresence = () => {
  const presenceStore = usePresenceStore()
  const { registerHandler, unregisterHandler } = useRealtime()

  const { handler: presenceRealtimeHandler } = createPresenceRealtimeHandler(presenceStore)
  registerHandler('user', presenceRealtimeHandler)

  const isOnline = (userId: number) => presenceStore.isOnline(userId)
  const getPresence = (userId: number) => presenceStore.getPresence(userId)

  onBeforeUnmount(() => {
    unregisterHandler('user', presenceRealtimeHandler)
  })

  return {
    isOnline,
    getPresence,
  }
}
