'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, formatCost } from '@/lib/api'

/* ── types ── */
type AgentId = 'marg' | 'doc' | 'cindy'
type AgentState = 'active' | 'thinking' | 'idle' | 'offline'

interface AgentInfo {
  id: AgentId
  name: string
  role: string
  accent: string
  glow: string
  state: AgentState
  model: string
  quote: string
  avatar: string
  activities: { time: string; action: string }[]
}

/* ── agent data ── */
const AGENTS: Record<AgentId, AgentInfo> = {
  marg: {
    id: 'marg',
    name: 'Margarita',
    role: 'Orchestrator',
    accent: '#FFD700',
    glow: 'rgba(255, 215, 0, 0.15)',
    state: 'active',
    model: 'Claude Opus 4',
    quote: 'Hey Jake — take it steady today. You\'ve got momentum, just don\'t rush it.',
    avatar: '✨',
    activities: [
      { time: '09:14', action: 'Analysing today\'s schedule' },
      { time: '09:06', action: 'Synced memory to Supabase' },
      { time: '08:58', action: 'Delegated calendar sync to Cindy' },
      { time: '08:45', action: 'Reviewed overnight build with Doc' },
    ],
  },
  doc: {
    id: 'doc',
    name: 'Doc',
    role: 'Builder & Coder',
    accent: '#22C55E',
    glow: 'rgba(34, 197, 94, 0.15)',
    state: 'idle',
    model: 'GPT-4o',
    quote: 'Standing by — ready when you are, boss.',
    avatar: '🔧',
    activities: [
      { time: '09:01', action: 'Standing by for new task' },
      { time: '08:45', action: 'Reviewed Teams rebuild brief' },
      { time: '08:30', action: 'Completed Belongings tab update' },
      { time: '08:12', action: 'Deployed v6.0 to production' },
    ],
  },
  cindy: {
    id: 'cindy',
    name: 'Cindy',
    role: 'Executive Assistant',
    accent: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.15)',
    state: 'thinking',
    model: 'Kimi k2.5',
    quote: 'Calendar synced. 3 events today — you\'re looking organised.',
    avatar: '📋',
    activities: [
      { time: '09:10', action: 'Preparing daily briefing' },
      { time: '09:02', action: 'Synced Google Calendar' },
      { time: '08:55', action: 'Drafted property agent response' },
      { time: '08:40', action: 'Updated weekly schedule' },
    ],
  },
}

/* ── state label ── */
function stateLabel(s: AgentState) {
  switch (s) {
    case 'active': return 'Working'
    case 'thinking': return 'Thinking'
    case 'idle': return 'Idle'
    case 'offline': return 'Offline'
  }
}
function stateColor(s: AgentState) {
  switch (s) {
    case 'active': return '#22C55E'
    case 'thinking': return '#FBBF24'
    case 'idle': return '#6B7280'
    case 'offline': return '#DC2626'
  }
}

/* ── glass panel helper ── */
const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.04)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 20,
  ...extra,
})

/* ── waveform component ── */
function Waveform({ color, bars = 5 }: { color: string; bars?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            background: color,
          }}
          animate={{
            height: [4, 12 + Math.random() * 8, 4],
          }}
          transition={{
            duration: 0.6 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

/* ── agent card ── */
function AgentCard({
  agent,
  isSelected,
  onClick,
}: {
  agent: AgentInfo
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <motion.div
      layout
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        ...glass({
          padding: 0,
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
          border: isSelected
            ? `1px solid ${agent.accent}60`
            : '1px solid rgba(255,255,255,0.08)',
        }),
      }}
    >
      {/* Glow background */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: agent.glow,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ padding: '20px 22px', position: 'relative', zIndex: 1 }}>
        {/* Top row: avatar + name + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          {/* Avatar circle */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${agent.accent}30, ${agent.accent}10)`,
              border: `2px solid ${agent.accent}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            {agent.avatar}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#F0EEE8', fontSize: 17, fontWeight: 700 }}>
                {agent.name}
              </span>
              <motion.div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: stateColor(agent.state),
                  flexShrink: 0,
                }}
                animate={
                  agent.state === 'active'
                    ? { boxShadow: [`0 0 4px ${stateColor(agent.state)}`, `0 0 12px ${stateColor(agent.state)}`, `0 0 4px ${stateColor(agent.state)}`] }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
              {agent.role} · {agent.model}
            </div>
          </div>

          {/* Status badge */}
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 12,
              background: stateColor(agent.state) + '20',
              color: stateColor(agent.state),
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {stateLabel(agent.state)}
          </div>
        </div>

        {/* Speech bubble */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 14,
            padding: '12px 14px',
            marginBottom: 14,
            borderLeft: `3px solid ${agent.accent}60`,
          }}
        >
          <p style={{ color: '#CCCCCC', fontSize: 13, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
            &ldquo;{agent.quote}&rdquo;
          </p>
        </div>

        {/* Waveform + voice indicator */}
        {agent.state === 'active' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Waveform color={agent.accent} />
            <span style={{ color: '#666', fontSize: 11 }}>Voice ready</span>
          </div>
        )}

        {/* Recent activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {agent.activities.slice(0, 3).map((act, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#444', fontFamily: 'monospace', fontSize: 10, flexShrink: 0 }}>
                {act.time}
              </span>
              <span style={{ color: '#888', fontSize: 12 }}>{act.action}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ── detail panel ── */
function DetailPanel({
  agent,
  cost,
  onClose,
}: {
  agent: AgentInfo
  cost: number
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      style={{
        ...glass({ padding: '24px', minHeight: '100%' }),
      }}
    >
      {/* Close */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#F0EEE8', fontSize: 20, fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>
          {agent.name}
        </h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#888', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ×
        </motion.button>
      </div>

      {/* Avatar large */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${agent.accent}30, ${agent.accent}10)`,
            border: `2px solid ${agent.accent}50`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
          }}
        >
          {agent.avatar}
        </div>
        <div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
          {agent.role}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <div style={{ ...glass({ padding: '14px', borderRadius: 14 }) }}>
          <div style={{ color: '#666', fontSize: 11, marginBottom: 4 }}>Model</div>
          <div style={{ color: '#F0EEE8', fontSize: 14, fontWeight: 600 }}>{agent.model}</div>
        </div>
        <div style={{ ...glass({ padding: '14px', borderRadius: 14 }) }}>
          <div style={{ color: '#666', fontSize: 11, marginBottom: 4 }}>Today&apos;s Cost</div>
          <div style={{ color: agent.accent, fontSize: 14, fontWeight: 700 }}>{formatCost(cost)}</div>
        </div>
        <div style={{ ...glass({ padding: '14px', borderRadius: 14 }) }}>
          <div style={{ color: '#666', fontSize: 11, marginBottom: 4 }}>Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: stateColor(agent.state) }} />
            <span style={{ color: '#F0EEE8', fontSize: 14, fontWeight: 600 }}>{stateLabel(agent.state)}</span>
          </div>
        </div>
        <div style={{ ...glass({ padding: '14px', borderRadius: 14 }) }}>
          <div style={{ color: '#666', fontSize: 11, marginBottom: 4 }}>Tasks Today</div>
          <div style={{ color: '#F0EEE8', fontSize: 14, fontWeight: 600 }}>{agent.activities.length}</div>
        </div>
      </div>

      {/* Speech */}
      <div
        style={{
          background: `linear-gradient(135deg, ${agent.accent}10, transparent)`,
          borderRadius: 16,
          padding: '16px',
          marginBottom: 24,
          borderLeft: `3px solid ${agent.accent}`,
        }}
      >
        <p style={{ color: '#CCCCCC', fontSize: 14, margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
          &ldquo;{agent.quote}&rdquo;
        </p>
      </div>

      {/* Activity log */}
      <div>
        <h3 style={{ color: '#F0EEE8', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Activity Log</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {agent.activities.map((act, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                ...glass({ padding: '10px 14px', borderRadius: 12 }),
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ color: '#444', fontFamily: 'monospace', fontSize: 11, flexShrink: 0 }}>
                {act.time}
              </span>
              <span style={{ color: '#AAA', fontSize: 12 }}>{act.action}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ── main ── */
export default function TeamsTab() {
  const [todayCost, setTodayCost] = useState(0)
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const data = await api.costs()
        if (active) setTodayCost(data.total?.cost || 0)
      } catch {
        if (active) setTodayCost(0)
      }
    }
    load()
    const interval = setInterval(load, 60000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateFmt = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeFmt = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const selected = selectedAgent ? AGENTS[selectedAgent] : null

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #0a0a14 0%, #0d0d1a 40%, #0a0a14 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow orbs */}
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.06)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 350, height: 350, borderRadius: '50%', background: 'rgba(168, 85, 247, 0.05)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '24px 20px 60px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Header — Mission Control style */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ color: '#F0EEE8', fontSize: 28, fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>
                Team
              </h1>
              <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                {dayName} · {dateFmt}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#F0EEE8', fontSize: 28, fontWeight: 300, fontFamily: 'monospace', letterSpacing: 2 }}>
                {timeFmt}
              </div>
              <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
                Today: <span style={{ color: '#FFD700', fontWeight: 700 }}>{formatCost(todayCost)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Status bar */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            ...glass({ padding: '12px 18px', marginBottom: 24 }),
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.div
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }}
              animate={{ boxShadow: ['0 0 4px #22C55E', '0 0 12px #22C55E', '0 0 4px #22C55E'] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span style={{ color: '#F0EEE8', fontSize: 13, fontWeight: 600 }}>3 agents online</span>
          </div>
          {(['marg', 'doc', 'cindy'] as AgentId[]).map(id => (
            <motion.button
              key={id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedAgent(prev => prev === id ? null : id)}
              style={{
                padding: '5px 12px',
                borderRadius: 14,
                background: selectedAgent === id ? AGENTS[id].accent + '25' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedAgent === id ? AGENTS[id].accent + '60' : 'rgba(255,255,255,0.08)'}`,
                color: selectedAgent === id ? AGENTS[id].accent : '#888',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: stateColor(AGENTS[id].state) }} />
              {AGENTS[id].name}
            </motion.button>
          ))}
        </motion.div>

        {/* Main content grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: selected ? '1fr 380px' : '1fr',
            gap: 20,
            transition: 'grid-template-columns 0.3s ease',
          }}
        >
          {/* Agent cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {(['marg', 'doc', 'cindy'] as AgentId[]).map((id, idx) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.08 }}
              >
                <AgentCard
                  agent={AGENTS[id]}
                  isSelected={selectedAgent === id}
                  onClick={() => setSelectedAgent(prev => prev === id ? null : id)}
                />
              </motion.div>
            ))}

            {/* Live feed below cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                ...glass({ padding: '18px 20px' }),
                gridColumn: '1 / -1',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <motion.div
                  style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <h3 style={{ color: '#F0EEE8', fontSize: 15, fontWeight: 600, margin: 0, fontFamily: 'var(--font-heading)' }}>
                  Live Activity
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { ts: '09:14', agent: 'Marg', color: '#FFD700', action: 'Analysing today\'s schedule' },
                  { ts: '09:10', agent: 'Cindy', color: '#A855F7', action: 'Preparing 10am briefing' },
                  { ts: '09:06', agent: 'Marg', color: '#FFD700', action: 'Synced memory to Supabase' },
                  { ts: '09:02', agent: 'Cindy', color: '#A855F7', action: 'Synced Google Calendar' },
                  { ts: '09:01', agent: 'Doc', color: '#22C55E', action: 'Standing by — ready for tasks' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <span style={{ color: '#444', fontFamily: 'monospace', fontSize: 11, flexShrink: 0 }}>
                      {item.ts}
                    </span>
                    <span style={{ color: item.color, fontWeight: 700, fontSize: 12, width: 50, flexShrink: 0 }}>
                      {item.agent}
                    </span>
                    <span style={{ color: '#888', fontSize: 12 }}>{item.action}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Detail panel */}
          <AnimatePresence mode="wait">
            {selected && (
              <DetailPanel
                key={selected.id}
                agent={selected}
                cost={todayCost / 3}
                onClose={() => setSelectedAgent(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
