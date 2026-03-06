import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '~/stores/chat'
import { createChatRealtimeHandler } from '~/composables/useChatRealtimeHandler'
import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'
import type { Channel, Message } from '~/types/chat'

function makeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 1,
    match_id: 10,
    channel_id: 'abc-123-uuid',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    participants: [],
    ...overrides,
  }
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 100,
    channel_id: 1,
    sender_id: 42,
    content: 'Hello',
    message_type: 'text',
    read_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeEnvelope(event: string, data: Record<string, any>): RealtimeEnvelope {
  return {
    event,
    data,
    meta: { timestamp: '2026-01-01T00:00:00Z', version: '1', source: 'api' },
  }
}

function makeParsed(action: string, id: string = 'abc-123-uuid'): ParsedEvent {
  return { scope: 'chat', id, action }
}

describe('createChatRealtimeHandler', () => {
  let chatStore: ReturnType<typeof useChatStore>
  let handler: ReturnType<typeof createChatRealtimeHandler>['handler']
  let processedIds: Set<string>

  beforeEach(() => {
    setActivePinia(createPinia())
    chatStore = useChatStore()
    chatStore.addChannel(makeChannel())
    processedIds = new Set()
    const result = createChatRealtimeHandler(chatStore, processedIds)
    handler = result.handler
  })

  describe('message:created', () => {
    it('adds a new message to the store', () => {
      const message = makeMessage({ id: 200 })

      handler(
        makeParsed('message:created'),
        makeEnvelope('chat:abc-123-uuid:message:created', message)
      )

      const messages = chatStore.getMessagesByChannel(1)
      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe(200)
    })

    it('deduplicates messages by id', () => {
      const message = makeMessage({ id: 200 })

      handler(
        makeParsed('message:created'),
        makeEnvelope('chat:abc-123-uuid:message:created', message)
      )
      handler(
        makeParsed('message:created'),
        makeEnvelope('chat:abc-123-uuid:message:created', message)
      )

      const messages = chatStore.getMessagesByChannel(1)
      expect(messages).toHaveLength(1)
    })

    it('tracks processed message ids', () => {
      const message = makeMessage({ id: 200 })

      handler(
        makeParsed('message:created'),
        makeEnvelope('chat:abc-123-uuid:message:created', message)
      )

      expect(processedIds.has('200')).toBe(true)
    })
  })

  describe('message:updated', () => {
    it('updates an existing message in the store', () => {
      const original = makeMessage({ id: 200, content: 'Original' })
      chatStore.addMessage(1, original)

      const updated = makeMessage({ id: 200, content: 'Updated' })

      handler(
        makeParsed('message:updated'),
        makeEnvelope('chat:abc-123-uuid:message:updated', updated)
      )

      const messages = chatStore.getMessagesByChannel(1)
      expect(messages[0].content).toBe('Updated')
    })
  })

  describe('message:deleted', () => {
    it('removes a message from the store', () => {
      chatStore.addMessage(1, makeMessage({ id: 200 }))
      chatStore.addMessage(1, makeMessage({ id: 201 }))

      handler(
        makeParsed('message:deleted'),
        makeEnvelope('chat:abc-123-uuid:message:deleted', { id: 200 })
      )

      const messages = chatStore.getMessagesByChannel(1)
      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe(201)
    })
  })

  describe('typing:started', () => {
    it('sets typing user in the store', () => {
      handler(
        makeParsed('typing:started'),
        makeEnvelope('chat:abc-123-uuid:typing:started', { user_id: 42 })
      )

      expect(chatStore.getTypingUsersInChannel(1)).toContain(42)
    })
  })

  describe('typing:stopped', () => {
    it('removes typing user from the store', () => {
      chatStore.setTypingUser(1, 42, true)

      handler(
        makeParsed('typing:stopped'),
        makeEnvelope('chat:abc-123-uuid:typing:stopped', { user_id: 42 })
      )

      expect(chatStore.getTypingUsersInChannel(1)).not.toContain(42)
    })
  })

  describe('unknown channel', () => {
    it('ignores events for unknown channel UUIDs', () => {
      const message = makeMessage({ id: 200 })

      handler(
        makeParsed('message:created', 'unknown-uuid'),
        makeEnvelope('chat:unknown-uuid:message:created', message)
      )

      expect(chatStore.getMessagesByChannel(1)).toHaveLength(0)
    })
  })

  describe('null event id', () => {
    it('ignores events without a channel UUID', () => {
      const message = makeMessage({ id: 200 })

      handler(
        { scope: 'chat', id: null, action: 'message:created' },
        makeEnvelope('chat::message:created', message)
      )

      expect(chatStore.getMessagesByChannel(1)).toHaveLength(0)
    })
  })
})
