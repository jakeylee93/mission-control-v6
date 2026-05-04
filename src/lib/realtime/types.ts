export type RealtimeEventKind = 'task' | 'calendar' | 'agent' | 'activity' | 'alert' | 'system'

export type RealtimeSource = 'live' | 'demo' | 'unavailable'

export type RealtimeConnectionState = 'connecting' | 'live' | 'reconnecting' | 'error'

export interface RealtimeEvent {
  id: string
  kind: RealtimeEventKind
  title: string
  message: string
  timestamp: string
  source: RealtimeSource
}

export interface TaskSnapshot {
  total: number
  overdue: number
  dueToday: number
  inProgress: number
  highPriority: number
  source: RealtimeSource
}

export interface CalendarSnapshot {
  upcomingCount: number
  nextEventTitle: string | null
  nextEventAt: string | null
  source: RealtimeSource
}

export interface AgentSnapshot {
  recentCount: number
  latestAgent: string | null
  latestSummary: string | null
  source: RealtimeSource
}

export interface RealtimeSnapshot {
  generatedAt: string
  tasks: TaskSnapshot
  calendar: CalendarSnapshot
  agents: AgentSnapshot
  alerts: RealtimeEvent[]
  events: RealtimeEvent[]
}

export interface RealtimeEnvelopeBase {
  sentAt: string
}

export interface RealtimeConnectedEnvelope extends RealtimeEnvelopeBase {
  type: 'connected'
  sessionId: string
}

export interface RealtimeSnapshotEnvelope extends RealtimeEnvelopeBase {
  type: 'snapshot'
  snapshot: RealtimeSnapshot
}

export interface RealtimeEventEnvelope extends RealtimeEnvelopeBase {
  type: 'event'
  event: RealtimeEvent
}

export interface RealtimeHeartbeatEnvelope extends RealtimeEnvelopeBase {
  type: 'heartbeat'
}

export type RealtimeEnvelope =
  | RealtimeConnectedEnvelope
  | RealtimeSnapshotEnvelope
  | RealtimeEventEnvelope
  | RealtimeHeartbeatEnvelope
