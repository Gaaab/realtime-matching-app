import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// parseEvent is a pure function — we test it directly
// We need to extract it or test through the composable
// For now, we'll test the module export

describe('useRealtime', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('parseEvent', () => {
    // We need parseEvent to be importable. The composable returns it.
    // Since useRealtime depends on Nuxt context (useNuxtApp, useAblyStore),
    // we mock those and get parseEvent from the return.

    // However, parseEvent is a pure function that should be testable standalone.
    // Let's import it as a standalone export.

    it('parses chat events with channel UUID and action', async () => {
      const { parseEvent } = await import('~/composables/useRealtime')

      const result = parseEvent('chat:abc-123:message:created')

      expect(result).toEqual({
        scope: 'chat',
        id: 'abc-123',
        action: 'message:created',
      })
    })

    it('parses chat events with simple action', async () => {
      const { parseEvent } = await import('~/composables/useRealtime')

      const result = parseEvent('chat:abc-123:typing:started')

      expect(result).toEqual({
        scope: 'chat',
        id: 'abc-123',
        action: 'typing:started',
      })
    })

    it('parses venue events with venue id and action', async () => {
      const { parseEvent } = await import('~/composables/useRealtime')

      const result = parseEvent('venue:42:user_checked_in')

      expect(result).toEqual({
        scope: 'venue',
        id: '42',
        action: 'user_checked_in',
      })
    })

    it('parses user-scoped events with no id', async () => {
      const { parseEvent } = await import('~/composables/useRealtime')

      const result = parseEvent('match:created')

      expect(result).toEqual({
        scope: 'user',
        id: null,
        action: 'match:created',
      })
    })

    it('parses notification events as user scope', async () => {
      const { parseEvent } = await import('~/composables/useRealtime')

      const result = parseEvent('notification:created')

      expect(result).toEqual({
        scope: 'user',
        id: null,
        action: 'notification:created',
      })
    })

    it('parses presence events as user scope', async () => {
      const { parseEvent } = await import('~/composables/useRealtime')

      const result = parseEvent('presence:changed')

      expect(result).toEqual({
        scope: 'user',
        id: null,
        action: 'presence:changed',
      })
    })
  })

  describe('handler registration and dispatch', () => {
    it('registers a handler and dispatches events to it', async () => {
      const { createRealtimeRouter } = await import('~/composables/useRealtime')
      const router = createRealtimeRouter()

      const handler = vi.fn()
      router.registerHandler('chat', handler)

      const parsed = { scope: 'chat' as const, id: 'abc', action: 'message:created' }
      const envelope = {
        event: 'chat:abc:message:created',
        data: { id: 1, content: 'hello' },
        meta: { timestamp: '2026-01-01T00:00:00Z', version: '1', source: 'api' },
      }

      router.dispatch(parsed, envelope)

      expect(handler).toHaveBeenCalledWith(parsed, envelope)
    })

    it('does not dispatch events to wrong scope handler', async () => {
      const { createRealtimeRouter } = await import('~/composables/useRealtime')
      const router = createRealtimeRouter()

      const chatHandler = vi.fn()
      const venueHandler = vi.fn()
      router.registerHandler('chat', chatHandler)
      router.registerHandler('venue', venueHandler)

      const parsed = { scope: 'chat' as const, id: 'abc', action: 'message:created' }
      const envelope = {
        event: 'chat:abc:message:created',
        data: {},
        meta: { timestamp: '', version: '1', source: 'api' },
      }

      router.dispatch(parsed, envelope)

      expect(chatHandler).toHaveBeenCalledOnce()
      expect(venueHandler).not.toHaveBeenCalled()
    })

    it('dispatches to multiple handlers for same scope', async () => {
      const { createRealtimeRouter } = await import('~/composables/useRealtime')
      const router = createRealtimeRouter()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      router.registerHandler('user', handler1)
      router.registerHandler('user', handler2)

      const parsed = { scope: 'user' as const, id: null, action: 'match:created' }
      const envelope = {
        event: 'match:created',
        data: {},
        meta: { timestamp: '', version: '1', source: 'api' },
      }

      router.dispatch(parsed, envelope)

      expect(handler1).toHaveBeenCalledOnce()
      expect(handler2).toHaveBeenCalledOnce()
    })

    it('unregisters a handler so it stops receiving events', async () => {
      const { createRealtimeRouter } = await import('~/composables/useRealtime')
      const router = createRealtimeRouter()

      const handler = vi.fn()
      router.registerHandler('chat', handler)
      router.unregisterHandler('chat', handler)

      const parsed = { scope: 'chat' as const, id: 'abc', action: 'message:created' }
      const envelope = {
        event: 'chat:abc:message:created',
        data: {},
        meta: { timestamp: '', version: '1', source: 'api' },
      }

      router.dispatch(parsed, envelope)

      expect(handler).not.toHaveBeenCalled()
    })

    it('catches handler errors without breaking other handlers', async () => {
      const { createRealtimeRouter } = await import('~/composables/useRealtime')
      const router = createRealtimeRouter()

      const errorHandler = vi.fn(() => { throw new Error('handler boom') })
      const goodHandler = vi.fn()
      router.registerHandler('user', errorHandler)
      router.registerHandler('user', goodHandler)

      const parsed = { scope: 'user' as const, id: null, action: 'test' }
      const envelope = {
        event: 'test',
        data: {},
        meta: { timestamp: '', version: '1', source: 'api' },
      }

      router.dispatch(parsed, envelope)

      expect(errorHandler).toHaveBeenCalledOnce()
      expect(goodHandler).toHaveBeenCalledOnce()
    })

    it('reset clears all handlers', async () => {
      const { createRealtimeRouter } = await import('~/composables/useRealtime')
      const router = createRealtimeRouter()

      const handler = vi.fn()
      router.registerHandler('chat', handler)

      router.reset()

      const parsed = { scope: 'chat' as const, id: 'abc', action: 'test' }
      const envelope = {
        event: 'test',
        data: {},
        meta: { timestamp: '', version: '1', source: 'api' },
      }

      router.dispatch(parsed, envelope)

      expect(handler).not.toHaveBeenCalled()
    })
  })
})
