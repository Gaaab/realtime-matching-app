import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMatchesStore } from '~/stores/matches'
import { createMatchRealtimeHandler } from '~/composables/useMatchRealtimeHandler'
import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'
import type { Match, ProfileReveal } from '~/types/match'

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    user_id: 10,
    matched_user_id: 20,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Match
}

function makeReveal(overrides: Partial<ProfileReveal> = {}): ProfileReveal {
  return {
    id: 1,
    user_id: 10,
    revealed_user_id: 20,
    reveal_type: 'full',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as ProfileReveal
}

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

describe('createMatchRealtimeHandler', () => {
  let matchesStore: ReturnType<typeof useMatchesStore>
  let handler: ReturnType<typeof createMatchRealtimeHandler>['handler']

  beforeEach(() => {
    setActivePinia(createPinia())
    matchesStore = useMatchesStore()
    const result = createMatchRealtimeHandler(matchesStore)
    handler = result.handler
  })

  it('adds a match on match:created', () => {
    const match = makeMatch({ id: 5 })

    handler(makeParsed('match:created'), makeEnvelope('match:created', match))

    expect(matchesStore.matches).toHaveLength(1)
    expect(matchesStore.matches[0].id).toBe(5)
  })

  it('removes a match on match:unmatched', () => {
    matchesStore.addMatch(makeMatch({ id: 5 }))

    handler(
      makeParsed('match:unmatched'),
      makeEnvelope('match:unmatched', { match_id: 5 })
    )

    expect(matchesStore.matches).toHaveLength(0)
  })

  it('updates match expiry on match:chat_renewed', () => {
    matchesStore.addMatch(makeMatch({ id: 5 }))

    handler(
      makeParsed('match:chat_renewed'),
      makeEnvelope('match:chat_renewed', { match_id: 5, expires_at: '2026-06-01T00:00:00Z' })
    )

    const match = matchesStore.matches.find(m => m.id === 5)
    expect(match?.expires_at).toBe('2026-06-01T00:00:00Z')
  })

  it('adds a reveal on profile:revealed', () => {
    const reveal = makeReveal({ id: 10 })

    handler(makeParsed('profile:revealed'), makeEnvelope('profile:revealed', reveal))

    expect(matchesStore.reveals).toHaveLength(1)
    expect(matchesStore.reveals[0].id).toBe(10)
  })

  it('removes a reveal on profile:unrevealed', () => {
    matchesStore.addReveal(makeReveal({ id: 10 }))
    matchesStore.addReveal(makeReveal({ id: 11 }))

    handler(
      makeParsed('profile:unrevealed'),
      makeEnvelope('profile:unrevealed', { id: 10 })
    )

    expect(matchesStore.reveals).toHaveLength(1)
    expect(matchesStore.reveals[0].id).toBe(11)
  })

  it('ignores unknown actions', () => {
    handler(
      makeParsed('unknown:action'),
      makeEnvelope('unknown:action', { foo: 'bar' })
    )

    expect(matchesStore.matches).toHaveLength(0)
    expect(matchesStore.reveals).toHaveLength(0)
  })
})
