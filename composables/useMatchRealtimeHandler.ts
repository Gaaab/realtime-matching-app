import type { ParsedEvent, RealtimeEnvelope } from '~/types/realtime'
import type { Match, ProfileReveal } from '~/types/match'
import type { useMatchesStore } from '~/stores/matches'

export function createMatchRealtimeHandler(
  matchesStore: ReturnType<typeof useMatchesStore>,
) {
  const handler = (event: ParsedEvent, envelope: RealtimeEnvelope) => {
    switch (event.action) {
      case 'match:created': {
        const match = envelope.data as Match
        matchesStore.addMatch(match)
        break
      }
      case 'match:unmatched': {
        const matchId = envelope.data.match_id || envelope.data.id
        if (matchId) matchesStore.removeMatch(matchId)
        break
      }
      case 'match:chat_renewed': {
        const matchId = envelope.data.match_id || envelope.data.id
        if (matchId) {
          matchesStore.updateMatch(matchId, {
            expires_at: envelope.data.expires_at,
          })
        }
        break
      }
      case 'profile:revealed': {
        const reveal = envelope.data as ProfileReveal
        matchesStore.addReveal(reveal)
        break
      }
      case 'profile:unrevealed': {
        const revealId = envelope.data.id
        const reveals = matchesStore.reveals.filter(r => r.id !== revealId)
        matchesStore.setReveals(reveals)
        break
      }
    }
  }

  return { handler }
}
