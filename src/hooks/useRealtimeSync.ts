'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type RealtimeConnectionState,
  type RealtimeEnvelope,
  type RealtimeEvent,
  type RealtimeSnapshot,
} from '@/lib/realtime/types'

const MAX_EVENTS = 40

export interface UseRealtimeSyncState {
  status: RealtimeConnectionState
  connected: boolean
  sessionId: string | null
  lastMessageAt: string | null
  snapshot: RealtimeSnapshot | null
  events: RealtimeEvent[]
}

function mergeEvents(incoming: RealtimeEvent, existing: RealtimeEvent[]): RealtimeEvent[] {
  const next = [incoming, ...existing]
  return next.slice(0, MAX_EVENTS)
}

export function useRealtimeSync(endpoint = '/api/realtime/stream'): UseRealtimeSyncState {
  const [status, setStatus] = useState<RealtimeConnectionState>('connecting')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lastMessageAt, setLastMessageAt] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<RealtimeSnapshot | null>(null)
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)
  const hasOpenedRef = useRef(false)

  useEffect(() => {
    const eventSource = new EventSource(endpoint)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      hasOpenedRef.current = true
      setStatus('live')
    }

    eventSource.onmessage = (message) => {
      try {
        const envelope = JSON.parse(message.data) as RealtimeEnvelope
        setLastMessageAt(new Date().toISOString())

        if (envelope.type === 'connected') {
          setSessionId(envelope.sessionId)
          return
        }

        if (envelope.type === 'snapshot') {
          setSnapshot(envelope.snapshot)
          setEvents(envelope.snapshot.events)
          return
        }

        if (envelope.type === 'event') {
          setEvents((current) => mergeEvents(envelope.event, current))
          return
        }
      } catch {
        setStatus('error')
      }
    }

    eventSource.onerror = () => {
      setStatus(hasOpenedRef.current ? 'reconnecting' : 'error')
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [endpoint])

  return useMemo(
    () => ({
      status,
      connected: status === 'live',
      sessionId,
      lastMessageAt,
      snapshot,
      events,
    }),
    [events, lastMessageAt, sessionId, snapshot, status]
  )
}
