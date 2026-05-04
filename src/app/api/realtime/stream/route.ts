import { NextRequest, NextResponse } from 'next/server'
import {
  type AgentSnapshot,
  type CalendarSnapshot,
  type RealtimeEnvelope,
  type RealtimeEvent,
  type RealtimeEventKind,
  type RealtimeSource,
  type RealtimeSnapshot,
  type TaskSnapshot,
} from '@/lib/realtime/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface TasksApiResponse {
  total: number
  overdue: number
  dueToday: number
  inProgress: number
  highPriority: number
}

interface CalendarApiEvent {
  id?: string
  summary?: string
  title?: string
  start?: string
}

interface CalendarApiResponse {
  events?: CalendarApiEvent[]
  error?: string
}

interface ActivityApiEntry {
  id?: string
  actor?: string
  action?: string
  message?: string
  timestamp?: string
}

interface AlertsApiAlert {
  id?: string
  type?: string
  message?: string
  urgency?: 'high' | 'medium' | 'low'
}

interface AlertsApiResponse {
  alerts?: AlertsApiAlert[]
}

const STREAM_INTERVAL_MS = 15000
const MAX_EVENT_HISTORY = 25
const encoder = new TextEncoder()

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) return null
    const data: unknown = await response.json()
    return data as T
  } catch {
    return null
  }
}

function toEvent(kind: RealtimeEventKind, title: string, message: string, source: RealtimeSource): RealtimeEvent {
  return {
    id: randomId(kind),
    kind,
    title,
    message,
    timestamp: new Date().toISOString(),
    source,
  }
}

function demoCalendarSnapshot(): CalendarSnapshot {
  const start = new Date()
  start.setMinutes(start.getMinutes() + 45)

  return {
    upcomingCount: 1,
    nextEventTitle: 'Demo: Mission control standup',
    nextEventAt: start.toISOString(),
    source: 'demo',
  }
}

function demoAlerts(): RealtimeEvent[] {
  return [
    toEvent('alert', 'Demo alert', 'Push/webhook alerts pending provider setup. Local realtime feed is active.', 'demo'),
  ]
}

function normalizeAgentName(raw: string | null): string | null {
  if (!raw) return null
  const value = raw.trim()
  if (value.length === 0) return null
  return value[0].toUpperCase() + value.slice(1)
}

function mapUrgencyPrefix(urgency?: 'high' | 'medium' | 'low'): string {
  if (urgency === 'high') return 'High'
  if (urgency === 'medium') return 'Medium'
  return 'Low'
}

async function buildSnapshot(origin: string): Promise<RealtimeSnapshot> {
  const [tasksResponse, calendarResponse, activityResponse, alertsResponse] = await Promise.all([
    fetchJson<TasksApiResponse>(`${origin}/api/tasks`),
    fetchJson<CalendarApiResponse>(`${origin}/api/calendar/events`),
    fetchJson<ActivityApiEntry[]>(`${origin}/api/activity?limit=6`),
    fetchJson<AlertsApiResponse>(`${origin}/api/alerts`),
  ])

  const tasks: TaskSnapshot = tasksResponse
    ? {
        total: Number(tasksResponse.total || 0),
        overdue: Number(tasksResponse.overdue || 0),
        dueToday: Number(tasksResponse.dueToday || 0),
        inProgress: Number(tasksResponse.inProgress || 0),
        highPriority: Number(tasksResponse.highPriority || 0),
        source: 'live',
      }
    : {
        total: 0,
        overdue: 0,
        dueToday: 0,
        inProgress: 0,
        highPriority: 0,
        source: 'unavailable',
      }

  const calendarEvents = Array.isArray(calendarResponse?.events) ? calendarResponse.events : []
  const calendar: CalendarSnapshot = calendarEvents.length > 0
    ? {
        upcomingCount: calendarEvents.length,
        nextEventTitle: calendarEvents[0].summary || calendarEvents[0].title || 'Untitled event',
        nextEventAt: calendarEvents[0].start || null,
        source: 'live',
      }
    : calendarResponse?.error
      ? {
          ...demoCalendarSnapshot(),
          source: 'demo',
        }
      : {
          upcomingCount: 0,
          nextEventTitle: null,
          nextEventAt: null,
          source: 'live',
        }

  const activityEntries = Array.isArray(activityResponse) ? activityResponse : []
  const latestActivity = activityEntries[0]
  const latestAgent = normalizeAgentName(
    typeof latestActivity?.actor === 'string'
      ? latestActivity.actor
      : typeof latestActivity?.message === 'string'
        ? latestActivity.message.split(' ')[0] || null
        : null
  )

  const agents: AgentSnapshot = {
    recentCount: activityEntries.length,
    latestAgent,
    latestSummary: latestActivity?.action || latestActivity?.message || null,
    source: activityEntries.length > 0 ? 'live' : 'demo',
  }

  const activityEvents: RealtimeEvent[] = activityEntries.length > 0
    ? activityEntries.slice(0, 5).map((entry) =>
        toEvent(
          'agent',
          normalizeAgentName(entry.actor || null) || 'Agent activity',
          entry.action || entry.message || 'Updated mission control state.',
          'live'
        )
      )
    : [toEvent('agent', 'Demo agent event', 'No local activity stream found. Showing demo feed semantics.', 'demo')]

  const rawAlerts = Array.isArray(alertsResponse?.alerts) ? alertsResponse.alerts : []
  const alerts: RealtimeEvent[] = rawAlerts.length > 0
    ? rawAlerts.slice(0, 5).map((alert) =>
        toEvent(
          'alert',
          `${mapUrgencyPrefix(alert.urgency)} priority alert`,
          typeof alert.message === 'string' ? alert.message : 'Alert event',
          'live'
        )
      )
    : demoAlerts()

  const taskEvents: RealtimeEvent[] = [
    toEvent(
      'task',
      'Task pulse',
      tasks.source === 'live'
        ? `${tasks.overdue} overdue, ${tasks.dueToday} due today, ${tasks.inProgress} in progress.`
        : 'Task source unavailable. Waiting for /api/tasks.',
      tasks.source
    ),
  ]

  const calendarEventsOut: RealtimeEvent[] = [
    toEvent(
      'calendar',
      'Calendar pulse',
      calendar.nextEventTitle && calendar.nextEventAt
        ? `${calendar.nextEventTitle} at ${new Date(calendar.nextEventAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`
        : calendar.source === 'demo'
          ? 'Calendar auth missing. Showing demo event metadata.'
          : 'No upcoming events in next 30 days.',
      calendar.source
    ),
  ]

  const events = [...alerts, ...taskEvents, ...calendarEventsOut, ...activityEvents].slice(0, MAX_EVENT_HISTORY)

  return {
    generatedAt: new Date().toISOString(),
    tasks,
    calendar,
    agents,
    alerts,
    events,
  }
}

function snapshotFingerprint(snapshot: RealtimeSnapshot): string {
  const firstEvent = snapshot.events[0]
  return JSON.stringify({
    overdue: snapshot.tasks.overdue,
    dueToday: snapshot.tasks.dueToday,
    inProgress: snapshot.tasks.inProgress,
    nextEventTitle: snapshot.calendar.nextEventTitle,
    nextEventAt: snapshot.calendar.nextEventAt,
    latestAgent: snapshot.agents.latestAgent,
    latestSummary: snapshot.agents.latestSummary,
    firstEventMessage: firstEvent?.message || null,
  })
}

function buildDeltaEvents(previous: RealtimeSnapshot | null, next: RealtimeSnapshot): RealtimeEvent[] {
  if (!previous) {
    return next.events.slice(0, 6)
  }

  const events: RealtimeEvent[] = []

  if (
    previous.tasks.overdue !== next.tasks.overdue ||
    previous.tasks.dueToday !== next.tasks.dueToday ||
    previous.tasks.inProgress !== next.tasks.inProgress
  ) {
    events.push(
      toEvent(
        'task',
        'Task counts changed',
        `${next.tasks.overdue} overdue, ${next.tasks.dueToday} due today, ${next.tasks.inProgress} in progress.`,
        next.tasks.source
      )
    )
  }

  if (
    previous.calendar.nextEventTitle !== next.calendar.nextEventTitle ||
    previous.calendar.nextEventAt !== next.calendar.nextEventAt
  ) {
    events.push(
      toEvent(
        'calendar',
        'Next calendar event updated',
        next.calendar.nextEventTitle && next.calendar.nextEventAt
          ? `${next.calendar.nextEventTitle} at ${new Date(next.calendar.nextEventAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`
          : 'Calendar now has no upcoming events.',
        next.calendar.source
      )
    )
  }

  if (previous.agents.latestSummary !== next.agents.latestSummary) {
    events.push(
      toEvent(
        'agent',
        next.agents.latestAgent || 'Agent activity',
        next.agents.latestSummary || 'Agent feed changed.',
        next.agents.source
      )
    )
  }

  const previousAlert = previous.alerts[0]?.message || null
  const nextAlert = next.alerts[0]?.message || null
  if (previousAlert !== nextAlert && nextAlert) {
    events.push(toEvent('alert', 'Alert update', nextAlert, next.alerts[0].source))
  }

  return events
}

function writeEnvelope(controller: ReadableStreamDefaultController<Uint8Array>, envelope: RealtimeEnvelope): boolean {
  try {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(envelope)}\n\n`))
    return true
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const sessionId = randomId('rt')

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      let previousSnapshot: RealtimeSnapshot | null = null
      let lastFingerprint = ''

      const sendHeartbeat = () => {
        if (closed) return
        writeEnvelope(controller, { type: 'heartbeat', sentAt: new Date().toISOString() })
      }

      const poll = async () => {
        if (closed) return

        const snapshot = await buildSnapshot(origin)
        const fingerprint = snapshotFingerprint(snapshot)

        if (!previousSnapshot) {
          const connectedWritten = writeEnvelope(controller, {
            type: 'connected',
            sessionId,
            sentAt: new Date().toISOString(),
          })

          if (!connectedWritten) {
            closed = true
            return
          }

          const snapshotWritten = writeEnvelope(controller, {
            type: 'snapshot',
            snapshot,
            sentAt: new Date().toISOString(),
          })

          if (!snapshotWritten) {
            closed = true
            return
          }

          previousSnapshot = snapshot
          lastFingerprint = fingerprint
          return
        }

        if (fingerprint !== lastFingerprint) {
          const deltaEvents = buildDeltaEvents(previousSnapshot, snapshot)
          const snapshotWritten = writeEnvelope(controller, {
            type: 'snapshot',
            snapshot,
            sentAt: new Date().toISOString(),
          })

          if (!snapshotWritten) {
            closed = true
            return
          }

          for (const event of deltaEvents) {
            const eventWritten = writeEnvelope(controller, {
              type: 'event',
              event,
              sentAt: new Date().toISOString(),
            })
            if (!eventWritten) {
              closed = true
              return
            }
          }
        } else {
          sendHeartbeat()
        }

        previousSnapshot = snapshot
        lastFingerprint = fingerprint
      }

      void poll()
      const interval = setInterval(() => {
        void poll()
      }, STREAM_INTERVAL_MS)

      return () => {
        closed = true
        clearInterval(interval)
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
