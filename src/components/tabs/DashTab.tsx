'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { api, formatCost, formatTokens, timeAgo, type ActivityEntry, type AgentStatus, type CalendarEvent, type CostSummary } from '@/lib/api'

const FEED_TYPES = ['ALL', 'CHAT', 'TASK', 'API', 'ERROR'] as const
type FeedFilter = typeof FEED_TYPES[number]

const agentConfig = {
  Margarita: { role: 'Brain', model: 'Kimi', color: '#FFD700', icon: '🧠', subtitle: 'Memory & Coordination' },
  Martini: { role: 'Muscles', model: 'Claude', color: '#A855F7', icon: '⚡', subtitle: 'Building & Tasks' },
  Doc: { role: 'Research', model: 'Brave', color: '#16A34A', icon: '🔍', subtitle: 'Search & Discovery' },
}

function StatusDot({ state }: { state: string }) {
  const cls = state === 'active' ? 'dot-active' : state === 'thinking' ? 'dot-thinking' : 'dot-idle'
  return <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />
}

function AgentCard({ name, data }: { name: string; data: AgentStatus }) {
  const cfg = agentConfig[name as keyof typeof agentConfig]
  if (!cfg) return null
  const lastTask = data.entries24h?.[0]?.task || 'No recent activity'

  return (
    <div className="card p-4 flex flex-col gap-2 card-glow-purple transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{cfg.icon}</span>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{name}</div>
            <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{cfg.role} / {cfg.model}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusDot state={data.state} />
          <span className="text-xs" style={{ color: data.state === 'active' ? '#16A34A' : data.state === 'thinking' ? '#A855F7' : 'var(--c-dim)' }}>
            {data.state}
          </span>
        </div>
      </div>
      <div className="text-xs truncate" style={{ color: 'var(--c-muted)' }} title={lastTask}>{lastTask}</div>
      <div className="flex gap-3 text-xs border-t pt-2 mt-1" style={{ color: 'var(--c-dim)', borderColor: 'var(--c-border)' }}>
        <span>{data.entries24h?.length || 0} calls</span>
        <span>{formatTokens(data.tokens24h || 0)} tokens</span>
        <span className="ml-auto" style={{ color: cfg.color }}>{formatCost(data.cost24h || 0)}</span>
      </div>
    </div>
  )
}

function FeedItem({ entry }: { entry: ActivityEntry }) {
  const typeClass: Record<string, string> = {
    chat: 'feed-chat',
    task: 'feed-task',
    api: 'feed-api',
    error: 'feed-error',
  }
  const borderClass = typeClass[entry.type?.toLowerCase()] || 'feed-api'
  const typeColor: Record<string, string> = {
    chat: '#FFD700',
    task: '#A855F7',
    api: '#16A34A',
    error: '#DC2626',
  }
  const color = typeColor[entry.type?.toLowerCase()] || 'var(--c-muted)'

  return (
    <div className={`border-l-2 pl-3 py-1.5 ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono px-1.5 py-0.5 rounded text-[10px] mr-2 font-semibold"
            style={{ color, background: color + '18' }}>
            {(entry.type || 'API').toUpperCase()}
          </span>
          <span className="text-xs truncate" style={{ color: 'var(--c-text)' }}>{entry.task || 'Unknown'}</span>
        </div>
        <span className="text-[10px] shrink-0" style={{ color: 'var(--c-dim)' }}>{timeAgo(entry.timestamp)}</span>
      </div>
      <div className="text-[10px] mt-0.5 pl-0.5" style={{ color: 'var(--c-muted)' }}>{entry.agent || 'System'}</div>
    </div>
  )
}

function CalendarStrip({ events }: { events: CalendarEvent[] }) {
  const today = new Date()
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {week.map((day) => {
        const iso = day.toISOString().slice(0, 10)
        const dayEvents = events.filter((e) => e.date === iso || (e.date <= iso && e.endDate && e.endDate >= iso))
        const isToday = iso === today.toISOString().slice(0, 10)
        return (
          <div
            key={iso}
            className="flex-shrink-0 w-12 rounded-lg p-2 text-center transition-all"
            style={{
              background: isToday ? 'rgba(255,215,0,0.08)' : 'var(--c-surface)',
              border: `1px solid ${isToday ? 'rgba(255,215,0,0.3)' : 'var(--c-border)'}`,
            }}
          >
            <div
              className="text-[10px] font-medium"
              style={{ color: isToday ? '#FFD700' : 'var(--c-muted)' }}
            >
              {day.toLocaleDateString('en', { weekday: 'short' }).toUpperCase()}
            </div>
            <div
              className="text-lg font-bold leading-tight"
              style={{ color: isToday ? '#FFD700' : 'var(--c-text)' }}
            >
              {day.getDate()}
            </div>
            {dayEvents.length > 0 && (
              <div className="flex flex-col gap-0.5 mt-1">
                {dayEvents.slice(0, 2).map((e, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full mx-auto" style={{ background: e.color || '#A855F7' }} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function DashTab() {
  const [costs, setCosts] = useState<CostSummary | null>(null)
  const [agents, setAgents] = useState<Record<string, AgentStatus>>({})
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('ALL')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [c, a, act, ev] = await Promise.allSettled([
        api.costs(),
        api.agents(),
        api.activity(100),
        api.calendarEvents(),
      ])
      if (c.status === 'fulfilled') setCosts(c.value)
      if (a.status === 'fulfilled') setAgents(a.value)
      if (act.status === 'fulfilled') setActivity(act.value)
      if (ev.status === 'fulfilled') setEvents(ev.value)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [load])

  const filteredActivity = feedFilter === 'ALL'
    ? activity
    : activity.filter((e) => e.type?.toUpperCase() === feedFilter)

  const upcomingEvents = events
    .filter((e) => e.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)

  const keyEvent = upcomingEvents[0]

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">

        {/* Daily Snapshot Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* AI Compute Cost */}
          <div className="card p-4">
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>AI Compute Today</div>
            <div className="text-2xl font-bold text-glow-gold" style={{ color: '#FFD700' }}>
              {costs ? formatCost(costs.total.cost) : '£0.00'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>{formatTokens(costs?.total.tokens || 0)} tokens</div>
          </div>
          {/* Calls */}
          <div className="card p-4">
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>API Calls</div>
            <div className="text-2xl font-bold text-glow-purple" style={{ color: '#A855F7' }}>
              {costs?.total.calls || 0}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>calls today</div>
          </div>
          {/* AI Agents */}
          <div className="card p-4">
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>AI Agents</div>
            <div className="text-2xl font-bold text-glow-green" style={{ color: '#16A34A' }}>
              {Object.values(agents).filter((a) => a.state === 'active' || a.state === 'thinking').length}
              <span className="text-sm ml-1" style={{ color: 'var(--c-muted)' }}>/ {Object.keys(agents).length}</span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>active now</div>
          </div>
          {/* Key Event */}
          <div className="card p-4">
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>Next Event</div>
            {keyEvent ? (
              <>
                <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--c-text)' }}>{keyEvent.title}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>{keyEvent.date}</div>
              </>
            ) : (
              <div className="text-sm" style={{ color: 'var(--c-muted)' }}>No upcoming</div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

          {/* Left Column: AI Team + Calendar + Tasks */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* AI Team */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--c-muted)' }}>AI Team</h2>
                <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>24h activity</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Margarita', 'Martini', 'Doc'].map((name) => (
                  <AgentCard
                    key={name}
                    name={name}
                    data={agents[name] || { name, state: 'idle', cost24h: 0, tokens24h: 0, entries24h: [] }}
                  />
                ))}
              </div>
            </section>

            {/* Calendar */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--c-muted)' }}>Calendar</h2>
                <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>Next 7 days</span>
              </div>
              <div className="card p-4">
                <CalendarStrip events={events} />
                {upcomingEvents.length > 0 && (
                  <div className="mt-3 pt-3 flex flex-col gap-1.5" style={{ borderTop: '1px solid var(--c-border)' }}>
                    {upcomingEvents.map((e) => (
                      <div key={e.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color || '#A855F7' }} />
                        <span className="text-xs flex-1 truncate" style={{ color: 'var(--c-text)' }}>{e.title}</span>
                        <span className="text-[10px]" style={{ color: 'var(--c-muted)' }}>{e.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* System Cost Breakdown */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--c-muted)' }}>Cost Breakdown</h2>
              </div>
              <div className="card p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>Brain (Kimi)</div>
                  <div className="text-xl font-bold" style={{ color: '#FFD700' }}>{costs ? formatCost(costs.brain.cost) : '—'}</div>
                  <div className="text-[10px]" style={{ color: 'var(--c-dim)' }}>{costs?.brain.calls || 0} calls</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>Muscles (Claude)</div>
                  <div className="text-xl font-bold" style={{ color: '#A855F7' }}>{costs ? formatCost(costs.muscles.cost) : '—'}</div>
                  <div className="text-[10px]" style={{ color: 'var(--c-dim)' }}>{costs?.muscles.calls || 0} calls</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>Total</div>
                  <div className="text-xl font-bold text-glow-gold" style={{ color: '#FFD700' }}>{costs ? formatCost(costs.total.cost) : '—'}</div>
                  <div className="text-[10px]" style={{ color: 'var(--c-dim)' }}>{costs?.total.calls || 0} calls</div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: System Feed */}
          <div className="flex flex-col gap-4">
            <section className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--c-muted)' }}>System Feed</h2>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full dot-active" />
                  <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>live</span>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1 mb-3 flex-wrap">
                {FEED_TYPES.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFeedFilter(f)}
                    className="text-[10px] px-2 py-1 rounded font-semibold tracking-wider transition-all"
                    style={{
                      background: feedFilter === f ? '#FFD700' : 'var(--c-surface)',
                      color: feedFilter === f ? '#000' : 'var(--c-muted)',
                      border: '1px solid',
                      borderColor: feedFilter === f ? '#FFD700' : 'var(--c-border)',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="card p-3 overflow-y-auto flex flex-col gap-2" style={{ maxHeight: '500px' }}>
                {loading ? (
                  <div className="text-xs text-center py-8" style={{ color: 'var(--c-dim)' }}>Loading...</div>
                ) : filteredActivity.length === 0 ? (
                  <div className="text-xs text-center py-8" style={{ color: 'var(--c-dim)' }}>No events</div>
                ) : (
                  filteredActivity.slice(0, 60).map((entry) => (
                    <FeedItem key={entry.id} entry={entry} />
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
