'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type CalView = 'WEEK' | 'AGENDA'

interface CalEvent {
  id: string
  title: string
  start: string
  end: string
  isAllDay: boolean
  date: string
  endDate?: string
  time?: string
  calendar: string
  calendarId: string
  color: string
  description?: string
  location?: string
}

interface CalendarInfo {
  id: string
  name: string
  color: string
  primary: boolean
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')}${suffix}`
}

function daysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function ConnectPrompt({ onConnect, expired }: { onConnect: () => void; expired?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: expired ? 'rgba(220,38,38,0.08)' : 'rgba(255,215,0,0.08)',
          border: `1px solid ${expired ? 'rgba(220,38,38,0.3)' : 'rgba(255,215,0,0.2)'}`,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke={expired ? '#DC2626' : '#FFD700'} strokeWidth="1.5" className="w-8 h-8">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <div className="text-center max-w-sm">
        <h3 className="text-lg font-semibold mb-2 font-heading" style={{ color: 'var(--c-text)' }}>
          {expired ? 'Session Expired' : 'Connect Google Calendar'}
        </h3>
        <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
          {expired
            ? 'Your Google Calendar session has expired. Reconnect to reload your events.'
            : 'Link your Google account to see all your calendars — Personal, Jobs, Bar People and more.'}
        </p>
      </div>
      <button
        onClick={onConnect}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
        style={{ background: '#FFD700', color: '#000' }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        {expired ? 'Reconnect with Google' : 'Connect with Google'}
      </button>
      <p className="text-[11px] text-center max-w-xs" style={{ color: 'var(--c-dim)' }}>
        Read-only access. Your events are never modified.
      </p>
    </div>
  )
}

function WeekView({ events, weekStart }: { events: CalEvent[]; weekStart: Date }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="card overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--c-border)' }}>
        {days.map((day) => {
          const iso = day.toISOString().slice(0, 10)
          const isToday = iso === todayStr
          return (
            <div
              key={iso}
              className="flex flex-col items-center py-3 gap-1"
              style={{ borderRight: '1px solid var(--c-border)' }}
            >
              <span className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: isToday ? '#FFD700' : 'var(--c-muted)' }}>
                {DAYS[day.getDay()]}
              </span>
              <span
                className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full leading-none`}
                style={{
                  background: isToday ? '#FFD700' : 'transparent',
                  color: isToday ? '#000' : 'var(--c-text)',
                }}
              >
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>
      {/* Events per day */}
      <div className="grid grid-cols-7 min-h-[180px]">
        {days.map((day) => {
          const iso = day.toISOString().slice(0, 10)
          const dayEvents = events.filter((e) => {
            if (e.isAllDay) {
              return e.date <= iso && (!e.endDate || e.endDate >= iso)
            }
            return e.date === iso
          })
          return (
            <div
              key={iso}
              className="p-1 flex flex-col gap-1"
              style={{ borderRight: '1px solid var(--c-border)', minHeight: '120px' }}
            >
              {dayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded px-1 py-0.5 text-[10px] leading-tight cursor-default"
                  style={{
                    background: ev.color + '22',
                    borderLeft: `2px solid ${ev.color}`,
                    color: 'var(--c-text)',
                  }}
                  title={`${ev.title}${ev.time ? ` at ${formatTime(ev.time)}` : ''}${ev.location ? ` • ${ev.location}` : ''}`}
                >
                  {ev.time && (
                    <span style={{ color: ev.color }} className="font-semibold block">
                      {formatTime(ev.time)}
                    </span>
                  )}
                  <span className="block truncate">{ev.title}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AgendaView({ events }: { events: CalEvent[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = events.filter((e) => e.date >= today).slice(0, 40)

  if (upcoming.length === 0) {
    return (
      <div className="card p-8 text-center" style={{ color: 'var(--c-muted)' }}>
        <div className="text-2xl mb-2">📅</div>
        <div className="text-sm">No upcoming events in the next 30 days</div>
      </div>
    )
  }

  // Group by date
  const grouped: Record<string, CalEvent[]> = {}
  upcoming.forEach((ev) => {
    if (!grouped[ev.date]) grouped[ev.date] = []
    grouped[ev.date].push(ev)
  })

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(grouped).map(([date, dayEvents]) => {
        const diff = daysUntil(date)
        const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : formatDate(date)
        const isToday = diff === 0
        const isSoon = diff <= 2
        return (
          <div key={date} className="card overflow-hidden">
            <div
              className="px-4 py-2.5 flex items-center justify-between"
              style={{
                background: isToday ? 'rgba(255,215,0,0.06)' : 'var(--c-surface)',
                borderBottom: '1px solid var(--c-border)',
              }}
            >
              <span
                className="text-xs font-semibold tracking-wide"
                style={{ color: isToday ? '#FFD700' : isSoon ? '#A855F7' : 'var(--c-text-2)' }}
              >
                {label}
              </span>
              {diff > 0 && (
                <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>
                  in {diff} day{diff !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--c-border)' }}>
              {dayEvents.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 px-4 py-3">
                  <div
                    className="w-1 self-stretch rounded-full mt-0.5 shrink-0"
                    style={{ background: ev.color, minHeight: '16px' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--c-text)' }}>
                      {ev.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {ev.time ? (
                        <span className="text-[11px] font-semibold" style={{ color: ev.color }}>
                          {formatTime(ev.time)}
                        </span>
                      ) : (
                        <span className="text-[11px]" style={{ color: 'var(--c-muted)' }}>All day</span>
                      )}
                      <span className="text-[11px]" style={{ color: 'var(--c-dim)' }}>
                        {ev.calendar}
                      </span>
                      {ev.location && (
                        <span className="text-[11px] truncate" style={{ color: 'var(--c-muted)' }}>
                          📍 {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CalendarTab() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<CalEvent[]>([])
  const [calendars, setCalendars] = useState<CalendarInfo[]>([])
  const [view, setView] = useState<CalView>('AGENDA')
  const [weekOffset, setWeekOffset] = useState(0)
  const [hiddenCals, setHiddenCals] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  const [tokenExpired, setTokenExpired] = useState(false)

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/status')
      const data = await res.json()
      console.log('[Calendar] status:', data)
      if (data.connected && data.expired) {
        setTokenExpired(true)
        setConnected(false)
      } else {
        setTokenExpired(false)
        setConnected(data.connected)
      }
    } catch (e) {
      console.error('[Calendar] status check failed:', e)
      setConnected(false)
    }
  }, [])

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/calendar/events')
      console.log('[Calendar] events response status:', res.status)
      if (res.status === 401) {
        const body = await res.json().catch(() => ({}))
        console.warn('[Calendar] 401 from events:', body)
        if (body.error === 'token_expired') setTokenExpired(true)
        setConnected(false)
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.error) {
        console.error('[Calendar] events error:', data.error)
        setError(data.error)
      } else {
        console.log('[Calendar] loaded', data.events?.length, 'events from', data.calendars?.length, 'calendars')
        setEvents(data.events || [])
        setCalendars(data.calendars || [])
      }
    } catch (e) {
      console.error('[Calendar] fetch failed:', e)
      setError(String(e))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  useEffect(() => {
    if (connected) loadEvents()
    else setLoading(false)
  }, [connected, loadEvents])

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/calendar/auth')
      const { authUrl } = await res.json()
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=600')
      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch('/api/calendar/status')
          const status = await statusRes.json()
          if (status.connected) {
            clearInterval(poll)
            popup?.close()
            setConnected(true)
          }
        } catch {}
      }, 1500)
      // Stop polling after 3 min
      setTimeout(() => clearInterval(poll), 180000)
    } catch (e) {
      setError(String(e))
    }
  }

  // Compute week start for week view
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + weekOffset * 7)
  weekStart.setHours(0, 0, 0, 0)

  const toggleCal = (id: string) => {
    setHiddenCals((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const visibleEvents = events.filter((e) => !hiddenCals.has(e.calendarId))

  const nextEvent = visibleEvents.find((e) => e.date >= new Date().toISOString().slice(0, 10))

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold font-heading" style={{ color: 'var(--c-text)' }}>Calendar</h1>
            {nextEvent && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                Next: <span style={{ color: '#FFD700' }}>{nextEvent.title}</span>
                {' '}— {nextEvent.time ? formatTime(nextEvent.time) : 'All day'} on {formatDate(nextEvent.date)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {connected && (
              <>
                {/* View toggle */}
                <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
                  {(['WEEK', 'AGENDA'] as CalView[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className="px-3 py-1.5 text-[11px] font-semibold tracking-wider transition-all"
                      style={{
                        background: view === v ? '#FFD700' : 'transparent',
                        color: view === v ? '#000' : 'var(--c-muted)',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <button
                  onClick={loadEvents}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}
                  title="Refresh"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Not connected */}
        {connected === false && (
          <ConnectPrompt onConnect={handleConnect} expired={tokenExpired} />
        )}

        {/* Loading */}
        {connected && loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#FFD700', borderTopColor: 'transparent' }} />
              <span className="text-sm" style={{ color: 'var(--c-muted)' }}>Loading calendars...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card p-4 mb-4" style={{ borderColor: '#DC2626' }}>
            <div className="text-sm" style={{ color: '#DC2626' }}>Error: {error}</div>
          </div>
        )}

        {/* Connected + loaded */}
        {connected && !loading && (
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            {/* Sidebar: Calendar list */}
            <div className="lg:w-56 shrink-0">
              <div className="card p-4">
                <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>
                  My Calendars
                </div>
                <div className="flex flex-col gap-2">
                  {calendars.map((cal) => (
                    <button
                      key={cal.id}
                      onClick={() => toggleCal(cal.id!)}
                      className="flex items-center gap-2.5 text-left transition-all rounded-lg px-2 py-1.5 -mx-2"
                      style={{ opacity: hiddenCals.has(cal.id!) ? 0.4 : 1 }}
                    >
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{
                          background: hiddenCals.has(cal.id!) ? 'transparent' : cal.color,
                          border: `2px solid ${cal.color}`,
                        }}
                      />
                      <span className="text-xs truncate" style={{ color: 'var(--c-text)' }}>
                        {cal.name}
                        {cal.primary && (
                          <span className="ml-1 text-[9px]" style={{ color: 'var(--c-dim)' }}>primary</span>
                        )}
                      </span>
                    </button>
                  ))}
                  {calendars.length === 0 && (
                    <div className="text-xs" style={{ color: 'var(--c-dim)' }}>No calendars found</div>
                  )}
                </div>
              </div>
            </div>

            {/* Main view */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {view === 'WEEK' && (
                    <>
                      {/* Week nav */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => setWeekOffset((p) => p - 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>
                        <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                          {weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {' – '}
                          {new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <button
                          onClick={() => setWeekOffset((p) => p + 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </div>
                      <WeekView events={visibleEvents} weekStart={weekStart} />
                    </>
                  )}
                  {view === 'AGENDA' && <AgendaView events={visibleEvents} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
