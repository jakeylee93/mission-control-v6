'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, formatCost, formatTokens, timeAgo, type ActivityEntry, type CalendarEvent, type CostEntry } from '@/lib/api'

interface SubAgent {
  id: string
  name: string
  role: string
  color: string
  entries: CostEntry[]
  isActive: boolean
}

const KNOWN_AGENTS = [
  { id: 'margarita', name: 'Margarita', role: 'Orchestrator', color: '#FFD700' },
  { id: 'bish', name: 'Bish', role: 'Builder', color: '#A855F7' },
  { id: 'doc', name: 'Doc', role: 'Researcher', color: '#16A34A' },
] as const

const FEED_TYPES = ['ALL', 'CHAT', 'TASK', 'API', 'ERROR'] as const
type FeedFilter = typeof FEED_TYPES[number]

function CrabAvatar({
  color,
  state,
  size = 64,
}: {
  color: string
  state: 'idle' | 'working' | 'done' | 'error'
  size?: number
}) {
  const shellFill = `${color}22`
  const shellStroke = color
  const eyeColor = state === 'error' ? '#EF4444' : '#E5E7EB'
  const stateClass = state === 'working'
    ? 'crab-working'
    : state === 'done'
      ? 'crab-done'
      : state === 'error'
        ? 'crab-error'
        : 'crab-idle'

  return (
    <div className={`crab-shell ${stateClass}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 96 96"
        width={size}
        height={size}
        role="img"
        aria-label="Neon crab avatar"
        style={{ filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 14px ${color}99)` }}
      >
        <g fill="none" stroke={shellStroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 58 L20 50 L30 58" />
          <path d="M20 68 L32 56 L42 66" />
          <path d="M86 58 L76 50 L66 58" />
          <path d="M76 68 L64 56 L54 66" />
        </g>
        <g className="crab-claw-left" fill="none" stroke={shellStroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M25 43 C16 34, 11 30, 14 24 C20 22, 24 26, 28 32" />
          <path d="M14 24 L9 20 M14 24 L8 27" />
        </g>
        <g className="crab-claw-right" fill="none" stroke={shellStroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M71 43 C80 34, 85 30, 82 24 C76 22, 72 26, 68 32" />
          <path d="M82 24 L87 20 M82 24 L88 27" />
        </g>
        <path d="M24 46 C24 34, 35 28, 48 28 C61 28, 72 34, 72 46 C72 58, 61 66, 48 66 C35 66, 24 58, 24 46 Z" fill={shellFill} stroke={shellStroke} strokeWidth="3" />
        <path d="M36 30 L36 22 M60 30 L60 22" stroke={shellStroke} strokeWidth="3" strokeLinecap="round" />
        <circle cx="36" cy="20" r="4" fill={eyeColor} stroke={shellStroke} strokeWidth="2" />
        <circle cx="60" cy="20" r="4" fill={eyeColor} stroke={shellStroke} strokeWidth="2" />
        <path d="M42 52 Q48 56 54 52" stroke={shellStroke} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function FeedItem({ entry }: { entry: ActivityEntry }) {
  const typeColor: Record<string, string> = {
    chat: '#FFD700',
    task: '#A855F7',
    api: '#16A34A',
    error: '#DC2626',
  }
  const color = typeColor[entry.type?.toLowerCase()] || 'var(--c-muted)'
  const borderClass = `feed-${entry.type?.toLowerCase() || 'api'}`

  return (
    <div className={`border-l-2 pl-3 py-1.5 ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded text-[10px] mr-2 font-semibold"
            style={{ color, background: color + '18' }}
          >
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
            <div className="text-[10px] font-medium" style={{ color: isToday ? '#FFD700' : 'var(--c-muted)' }}>
              {day.toLocaleDateString('en', { weekday: 'short' }).toUpperCase()}
            </div>
            <div className="text-lg font-bold leading-tight" style={{ color: isToday ? '#FFD700' : 'var(--c-text)' }}>
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

function AgentCard({
  agent,
  isOpen,
  expandedEntryId,
  onToggleCard,
  onToggleEntry,
}: {
  agent: SubAgent
  isOpen: boolean
  expandedEntryId: string | null
  onToggleCard: () => void
  onToggleEntry: (entryId: string) => void
}) {
  const crabState: 'idle' | 'working' = agent.isActive ? 'working' : 'idle'

  return (
    <motion.div
      className="card p-4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ borderColor: agent.color + '88', boxShadow: `0 0 24px ${agent.color}33` }}
      style={{ borderColor: 'var(--c-border)' }}
    >
      <button onClick={onToggleCard} className="w-full text-left">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <CrabAvatar color={agent.color} state={crabState} />
            <div className="min-w-0">
              <div className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>{agent.name}</div>
              <div className="text-[10px]" style={{ color: agent.color }}>{agent.role}</div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--c-dim)' }}>
                {agent.entries.length} entries
              </div>
            </div>
          </div>
          <span className="text-[10px]" style={{ color: 'var(--c-muted)' }}>
            {isOpen ? 'Collapse' : 'Expand'}
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--c-border)' }}>
              {agent.entries.length === 0 ? (
                <div className="text-xs py-8 text-center" style={{ color: 'var(--c-dim)' }}>No activity yet</div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-1.5">
                  {agent.entries.map((entry) => {
                    const open = expandedEntryId === entry.id
                    return (
                      <motion.div
                        key={entry.id}
                        layout
                        className="rounded-lg"
                        style={{
                          background: 'var(--c-panel)',
                          border: `1px solid ${agent.color}40`,
                        }}
                      >
                        <button
                          onClick={() => onToggleEntry(entry.id)}
                          className="w-full text-left px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold truncate" style={{ color: agent.color }}>
                              {entry.task || 'Untitled task'}
                            </span>
                            <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--c-dim)' }}>
                              {formatCost(entry.cost_gbp)}
                            </span>
                          </div>
                          <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--c-muted)' }}>
                            {entry.model}
                          </div>
                        </button>

                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 text-[10px] font-mono" style={{ color: 'var(--c-muted)' }}>
                                <div>task: {entry.task || 'Untitled task'}</div>
                                <div>model: {entry.model}</div>
                                <div>input: {formatTokens(entry.inputTokens)}</div>
                                <div>output: {formatTokens(entry.outputTokens)}</div>
                                <div style={{ color: agent.color }}>cost: {formatCost(entry.cost_gbp)}</div>
                                <div>timestamp: {new Date(entry.timestamp).toLocaleString()}</div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function DashTab() {
  const [agentEntries, setAgentEntries] = useState<Record<string, CostEntry[]>>({})
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('ALL')
  const [loading, setLoading] = useState(true)
  const [openAgentIds, setOpenAgentIds] = useState<Record<string, boolean>>({
    margarita: true,
    bish: true,
    doc: true,
  })
  const [expandedEntryIds, setExpandedEntryIds] = useState<Record<string, string | null>>({
    margarita: null,
    bish: null,
    doc: null,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [costsResult, activityResult, eventsResult] = await Promise.allSettled([
        api.costs(),
        api.activity(100),
        api.calendarEvents(),
      ])

      if (costsResult.status === 'fulfilled') {
        const sortedEntries = [...(costsResult.value.entries || [])].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        const grouped: Record<string, CostEntry[]> = { Margarita: [], Bish: [], Doc: [] }

        for (const entry of sortedEntries) {
          const normalized = (entry.agent || '').trim().toLowerCase()
          if (normalized === 'margarita') grouped.Margarita.push(entry)
          if (normalized === 'bish') grouped.Bish.push(entry)
          if (normalized === 'doc') grouped.Doc.push(entry)
        }

        setAgentEntries(grouped)
      }

      if (activityResult.status === 'fulfilled') setActivity(activityResult.value)
      if (eventsResult.status === 'fulfilled') setEvents(eventsResult.value)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [load])

  const agents: SubAgent[] = KNOWN_AGENTS.map((base) => {
    const entries = agentEntries[base.name] || []
    const latest = entries[0]
    const isActive = latest ? Date.now() - new Date(latest.timestamp).getTime() < 1000 * 60 * 30 : false
    return {
      ...base,
      entries,
      isActive,
    }
  })

  const filteredActivity = feedFilter === 'ALL'
    ? activity
    : activity.filter((e) => e.type?.toUpperCase() === feedFilter)

  const upcomingEvents = events
    .filter((e) => e.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--c-muted)' }}>
              Command Centre
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full dot-active" />
              <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>live</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isOpen={!!openAgentIds[agent.id]}
                expandedEntryId={expandedEntryIds[agent.id] || null}
                onToggleCard={() => {
                  setOpenAgentIds((prev) => ({ ...prev, [agent.id]: !prev[agent.id] }))
                }}
                onToggleEntry={(entryId) => {
                  setExpandedEntryIds((prev) => ({
                    ...prev,
                    [agent.id]: prev[agent.id] === entryId ? null : entryId,
                  }))
                }}
              />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
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
          </div>

          <div className="flex flex-col gap-4">
            <section className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--c-muted)' }}>System Feed</h2>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full dot-active" />
                  <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>live</span>
                </div>
              </div>

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

      <style jsx global>{`
        .crab-shell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transform-origin: center;
        }
        .crab-idle {
          animation: crab-wobble 3s ease-in-out infinite;
        }
        .crab-working {
          animation: crab-jiggle 1s ease-in-out infinite;
        }
        .crab-working .crab-claw-left {
          animation: crab-claw-left 0.45s ease-in-out infinite alternate;
          transform-origin: 25px 43px;
        }
        .crab-working .crab-claw-right {
          animation: crab-claw-right 0.45s ease-in-out infinite alternate;
          transform-origin: 71px 43px;
        }
        .crab-done,
        .crab-error {
          animation: crab-glow-pulse 2s ease-in-out infinite;
        }
        .crab-error {
          filter: hue-rotate(-25deg) saturate(1.3);
        }
        @keyframes crab-wobble {
          0% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-3px) rotate(-4deg); }
          50% { transform: translateX(0) rotate(0deg); }
          75% { transform: translateX(3px) rotate(4deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        @keyframes crab-jiggle {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          20% { transform: translate(-1px, 1px) rotate(-2deg) scale(1.02); }
          40% { transform: translate(1px, -1px) rotate(2deg) scale(1.04); }
          60% { transform: translate(-1px, 0) rotate(-1deg) scale(1.02); }
          80% { transform: translate(1px, 1px) rotate(1deg) scale(1.03); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }
        @keyframes crab-glow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.88; }
          50% { transform: scale(1.03); opacity: 1; }
        }
        @keyframes crab-claw-left {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-12deg); }
        }
        @keyframes crab-claw-right {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(12deg); }
        }
      `}</style>
    </div>
  )
}
