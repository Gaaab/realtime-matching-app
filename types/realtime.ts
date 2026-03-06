export type RealtimeScope = 'chat' | 'venue' | 'user'

export interface ParsedEvent {
  scope: RealtimeScope
  id: string | null
  action: string
}

export interface RealtimeEnvelope {
  event: string
  data: Record<string, any>
  meta: {
    timestamp: string
    version: string
    source: string
  }
}

export type RealtimeHandler = (event: ParsedEvent, envelope: RealtimeEnvelope) => void

export interface BroadcastingChannelsResponse {
  channel: string
}
