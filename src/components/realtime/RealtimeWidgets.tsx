'use client'

import { useEffect, useMemo, useState } from 'react'
import type { RealtimeEvent, RealtimeSource } from '@/lib/realtime/types'
import type { UseRealtimeSyncState } from '@/hooks/useRealtimeSync'

function sourceLabel(source: RealtimeSource): string {
  if (source === 'live') return 'Live source'
  if (source === 'demo') return 'Demo fallback'
  return 'Source unavailable'
}

function statusClasses(connected: boolean): string {
  return connected
    ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
    : 'border-amber-300/30 bg-amber-500/10 text-amber-200'
}

function eventIcon(event: RealtimeEvent): string {
  if (event.kind === 'task') return '✅'
  if (event.kind === 'calendar') return '📅'
  if (event.kind === 'agent') return '🤖'
  if (event.kind === 'activity') return '📡'
  if (event.kind === 'alert') return '⚠️'
  return 'ℹ️'
}

function formatClock(iso: string | null): string {
  if (!iso) return 'No events yet'
  const date = new Date(iso)
  if (Number.isNaN(date.valueOf())) return 'No events yet'
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function RealtimeStatusPill({ realtime }: { realtime: UseRealtimeSyncState }) {
  return (
    <div className={`rounded-full border px-3 py-1 text-[11px] ${statusClasses(realtime.connected)}`}>
      {realtime.connected ? 'Realtime connected' : 'Realtime reconnecting'}
    </div>
  )
}

export function RealtimeSummaryStrip({ realtime }: { realtime: UseRealtimeSyncState }) {
  const task = realtime.snapshot?.tasks
  const calendar = realtime.snapshot?.calendar
  const agents = realtime.snapshot?.agents

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">Tasks</p>
        <p className="mt-1 text-sm font-medium text-white">
          {task ? `${task.overdue} overdue · ${task.dueToday} today` : 'Waiting for task stream'}
        </p>
        <p className="mt-1 text-xs text-slate-500">{task ? sourceLabel(task.source) : 'Connecting to realtime stream'}</p>
      </article>
      <article className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">Calendar</p>
        <p className="mt-1 text-sm font-medium text-white">
          {calendar?.nextEventTitle ? calendar.nextEventTitle : 'No upcoming events'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {calendar ? `${sourceLabel(calendar.source)} · ${calendar.nextEventAt ? formatClock(calendar.nextEventAt) : 'No time'}` : 'Connecting'}
        </p>
      </article>
      <article className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">Agent activity</p>
        <p className="mt-1 text-sm font-medium text-white">
          {agents?.latestAgent ? `${agents.latestAgent}: ${agents.latestSummary || 'activity updated'}` : 'No recent agent activity'}
        </p>
        <p className="mt-1 text-xs text-slate-500">{agents ? sourceLabel(agents.source) : 'Connecting'}</p>
      </article>
    </div>
  )
}

export function RealtimeEventList({ events, title, maxItems = 8 }: { events: RealtimeEvent[]; title: string; maxItems?: number }) {
  const subset = useMemo(() => events.slice(0, maxItems), [events, maxItems])

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-3">
      <p className="text-sm font-medium text-white">{title}</p>
      <div className="mt-3 space-y-2">
        {subset.length === 0 && <p className="text-xs text-slate-500">Waiting for realtime updates.</p>}
        {subset.map((event) => (
          <article key={event.id} className="rounded-lg border border-white/10 bg-black/15 px-3 py-2">
            <div className="flex items-start gap-2">
              <span aria-hidden="true">{eventIcon(event)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white">{event.title}</p>
                <p className="mt-0.5 text-xs text-slate-300">{event.message}</p>
                <p className="mt-1 text-[11px] text-slate-500">{sourceLabel(event.source)} · {formatClock(event.timestamp)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export function LocalNotificationSettings() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setSupported(false)
      setPermission('unsupported')
      return
    }

    setSupported(true)
    setPermission(window.Notification.permission)
  }, [])

  const requestPermission = async () => {
    if (!supported) return
    setRequesting(true)
    try {
      const result = await window.Notification.requestPermission()
      setPermission(result)
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-3">
      <p className="text-sm font-medium text-white">Browser notifications</p>
      <p className="mt-1 text-xs text-slate-300">
        Local permission and state are available now. External web push delivery is pending service worker + push provider credentials.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-300">
          {supported ? `Permission: ${permission}` : 'Notifications unsupported in this browser'}
        </span>
        {supported && permission !== 'granted' && (
          <button
            type="button"
            onClick={() => {
              void requestPermission()
            }}
            disabled={requesting}
            className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {requesting ? 'Requesting...' : 'Enable'}
          </button>
        )}
      </div>
    </div>
  )
}
