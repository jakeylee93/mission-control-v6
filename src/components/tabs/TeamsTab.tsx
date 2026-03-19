'use client'

import { useEffect, useState } from 'react'
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
  gradient: string
  state: AgentState
  model: string
  quote: string
  initial: string
  activities: { time: string; action: string }[]
}

const AGENTS: Record<AgentId, AgentInfo> = {
  marg: {
    id: 'marg', name: 'Margarita', role: 'Orchestrator', accent: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD70040, #FF8C0020)',
    state: 'active', model: 'Claude Opus 4', initial: 'M',
    quote: 'Hey Jake — take it steady today. You\'ve got momentum, just don\'t rush it.',
    activities: [
      { time: '09:14', action: 'Analysing today\'s schedule' },
      { time: '09:06', action: 'Synced memory to Supabase' },
      { time: '08:58', action: 'Delegated calendar sync to Cindy' },
      { time: '08:45', action: 'Reviewed overnight build with Doc' },
    ],
  },
  doc: {
    id: 'doc', name: 'Doc', role: 'Builder & Coder', accent: '#60A5FA',
    gradient: 'linear-gradient(135deg, #60A5FA40, #3B82F620)',
    state: 'idle', model: 'GPT-4o', initial: 'D',
    quote: 'Standing by — ready when you are, boss.',
    activities: [
      { time: '09:01', action: 'Standing by for new task' },
      { time: '08:45', action: 'Reviewed Teams rebuild brief' },
      { time: '08:30', action: 'Completed Belongings tab update' },
      { time: '08:12', action: 'Deployed v6.0 to production' },
    ],
  },
  cindy: {
    id: 'cindy', name: 'Cindy', role: 'Executive Assistant', accent: '#C084FC',
    gradient: 'linear-gradient(135deg, #C084FC40, #A855F720)',
    state: 'thinking', model: 'Kimi k2.5', initial: 'C',
    quote: 'Calendar synced. 3 events today — you\'re looking organised.',
    activities: [
      { time: '09:10', action: 'Preparing daily briefing' },
      { time: '09:02', action: 'Synced Google Calendar' },
      { time: '08:55', action: 'Drafted property agent response' },
      { time: '08:40', action: 'Updated weekly schedule' },
    ],
  },
}

function stateLabel(s: AgentState) {
  return s === 'active' ? 'Working' : s === 'thinking' ? 'Thinking' : s === 'idle' ? 'Idle' : 'Offline'
}
function stateColor(s: AgentState) {
  return s === 'active' ? '#22C55E' : s === 'thinking' ? '#FBBF24' : s === 'idle' ? '#6B7280' : '#DC2626'
}

/* ── glass helper ── */
const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 24,
  ...extra,
})

/* ── waveform ── */
function Waveform({ color, bars = 24, height = 32 }: { color: string; bars?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, height }}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          style={{ width: 2.5, borderRadius: 2, background: color, opacity: 0.7 }}
          animate={{ height: [3, height * 0.3 + Math.random() * height * 0.6, 3] }}
          transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ── mic button ── */
function MicButton({ accent }: { accent: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: 64, height: 64, borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${accent}50, ${accent}20)`,
        border: `2px solid ${accent}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative',
      }}
    >
      {/* Glow ring */}
      <motion.div
        style={{
          position: 'absolute', inset: -6, borderRadius: '50%',
          border: `1.5px solid ${accent}30`,
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
      <motion.div
        style={{
          position: 'absolute', inset: -14, borderRadius: '50%',
          border: `1px solid ${accent}15`,
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {/* Mic icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="1" width="6" height="11" rx="3" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </motion.div>
  )
}

/* ── avatar circle ── */
function Avatar({ agent, size = 72 }: { agent: AgentInfo; size?: number }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Outer glow */}
      <motion.div
        style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          background: `radial-gradient(circle, ${agent.accent}25, transparent 70%)`,
        }}
        animate={agent.state === 'active' ? { opacity: [0.5, 1, 0.5] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div
        style={{
          width: size, height: size, borderRadius: '50%',
          background: agent.gradient,
          border: `2px solid ${agent.accent}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, fontWeight: 700, color: agent.accent,
          fontFamily: 'var(--font-heading)',
          position: 'relative', zIndex: 1,
        }}
      >
        {agent.initial}
      </div>
      {/* Status dot */}
      <div
        style={{
          position: 'absolute', bottom: 2, right: 2, width: 14, height: 14,
          borderRadius: '50%', background: stateColor(agent.state),
          border: '2.5px solid #0d0d1a', zIndex: 2,
        }}
      />
    </div>
  )
}

/* ── main hero card (active agent) ── */
function HeroCard({ agent }: { agent: AgentInfo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        ...glass({ padding: '28px', position: 'relative', overflow: 'hidden' }),
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -60, right: -60, width: 250, height: 250,
        borderRadius: '50%', background: `radial-gradient(circle, ${agent.accent}12, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, left: -40, width: 200, height: 200,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Agent header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
          <Avatar agent={agent} size={80} />
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#F0EEE8', fontSize: 24, fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>
              {agent.name}
            </h2>
            <div style={{ color: '#777', fontSize: 13, marginTop: 3 }}>
              {agent.role} · <span style={{ color: agent.accent }}>{agent.model}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <motion.div
                style={{ width: 8, height: 8, borderRadius: '50%', background: stateColor(agent.state) }}
                animate={{ boxShadow: [`0 0 4px ${stateColor(agent.state)}`, `0 0 14px ${stateColor(agent.state)}`, `0 0 4px ${stateColor(agent.state)}`] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span style={{ color: stateColor(agent.state), fontSize: 12, fontWeight: 600 }}>{stateLabel(agent.state)}</span>
            </div>
          </div>
        </div>

        {/* Speech bubble */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 18,
          padding: '16px 18px',
          marginBottom: 20,
          position: 'relative',
        }}>
          {/* Bubble pointer */}
          <div style={{
            position: 'absolute', top: -8, left: 40,
            width: 16, height: 16, borderRadius: 4,
            background: 'rgba(255,255,255,0.04)',
            transform: 'rotate(45deg)',
          }} />
          <p style={{ color: '#C8C8C8', fontSize: 15, margin: 0, lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
            &ldquo;{agent.quote}&rdquo;
          </p>
        </div>

        {/* Voice interface */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', padding: '8px 0' }}>
          <Waveform color={agent.accent} bars={16} height={28} />
          <MicButton accent={agent.accent} />
          <Waveform color={agent.accent} bars={16} height={28} />
        </div>
      </div>
    </motion.div>
  )
}

/* ── agent switch pill ── */
function AgentPill({ agent, isActive, onClick }: { agent: AgentInfo; isActive: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', borderRadius: 16,
        background: isActive ? `${agent.accent}15` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isActive ? agent.accent + '50' : 'rgba(255,255,255,0.06)'}`,
        cursor: 'pointer', flex: 1, minWidth: 0,
        transition: 'all 0.2s ease',
      }}
    >
      <Avatar agent={agent} size={38} />
      <div style={{ textAlign: 'left', minWidth: 0 }}>
        <div style={{ color: isActive ? agent.accent : '#AAA', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {agent.name}
        </div>
        <div style={{ color: '#555', fontSize: 11 }}>{agent.role}</div>
      </div>
    </motion.button>
  )
}

/* ── schedule item ── */
function ScheduleItem({ time, label, accent }: { time: string; label: string; accent: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: 4, height: 32, borderRadius: 2, background: accent, flexShrink: 0 }} />
      <div>
        <div style={{ color: '#F0EEE8', fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ color: '#555', fontSize: 11 }}>{time}</div>
      </div>
    </div>
  )
}

/* ── quick action ── */
function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.06)' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        ...glass({ padding: '14px 10px', borderRadius: 16, textAlign: 'center' as const }),
        cursor: 'pointer', flex: 1, minWidth: 70,
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ color: '#AAA', fontSize: 11, fontWeight: 500 }}>{label}</div>
    </motion.button>
  )
}

/* ── main component ── */
export default function TeamsTab() {
  const [todayCost, setTodayCost] = useState(0)
  const [activeAgent, setActiveAgent] = useState<AgentId>('marg')
  const [now, setNow] = useState(new Date())
  const [showDetail, setShowDetail] = useState(false)

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
      } catch { if (active) setTodayCost(0) }
    }
    load()
    const interval = setInterval(load, 60000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateFmt = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  const timeFmt = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const agent = AGENTS[activeAgent]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #080810 0%, #0d0d1f 30%, #10081a 60%, #080810 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', top: -150, left: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -200, right: -100, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: -200, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,215,0,0.03), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '20px 16px 80px', maxWidth: 520, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 28, paddingTop: 8 }}
        >
          <div style={{ color: '#555', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
            {dayName} · {dateFmt}
          </div>
          <h1 style={{ color: '#F0EEE8', fontSize: 28, fontWeight: 700, margin: '4px 0', fontFamily: 'var(--font-heading)' }}>
            Jake
          </h1>
          <div style={{ color: '#666', fontSize: 13 }}>Mission Control</div>
          <div style={{
            color: '#F0EEE8', fontSize: 42, fontWeight: 200, fontFamily: 'monospace',
            letterSpacing: 4, marginTop: 8, opacity: 0.9,
          }}>
            {timeFmt}
          </div>
          <div style={{ color: '#555', fontSize: 12, marginTop: 6 }}>
            Today: <span style={{ color: '#FFD700', fontWeight: 600 }}>{formatCost(todayCost)}</span>
          </div>
        </motion.div>

        {/* Active agent hero card */}
        <AnimatePresence mode="wait">
          <HeroCard key={activeAgent} agent={agent} />
        </AnimatePresence>

        {/* Agent switcher */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 20 }}
        >
          {(['marg', 'doc', 'cindy'] as AgentId[]).map(id => (
            <AgentPill
              key={id}
              agent={AGENTS[id]}
              isActive={activeAgent === id}
              onClick={() => setActiveAgent(id)}
            />
          ))}
        </motion.div>

        {/* Schedule section */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ ...glass({ padding: '18px 20px', marginBottom: 16 }) }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ color: '#F0EEE8', fontSize: 15, fontWeight: 600, margin: 0, fontFamily: 'var(--font-heading)' }}>
              Schedule
            </h3>
            <span style={{ color: '#555', fontSize: 11 }}>Today</span>
          </div>
          <ScheduleItem time="10:00 - 11:00" label="Team sync & priorities" accent="#6366F1" />
          <ScheduleItem time="13:00 - 14:00" label="N2 Group follow-up" accent="#22C55E" />
          <ScheduleItem time="16:00 - 16:30" label="Review Mission Control build" accent="#FFD700" />
        </motion.div>

        {/* To-Dos section */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ ...glass({ padding: '18px 20px', marginBottom: 16 }) }}
        >
          <h3 style={{ color: '#F0EEE8', fontSize: 15, fontWeight: 600, margin: '0 0 12px', fontFamily: 'var(--font-heading)' }}>
            Ongoing
          </h3>
          {[
            { text: 'Mission Control Teams redesign', done: false },
            { text: 'ElevenLabs voice setup', done: true },
            { text: 'Stuart email — legal data enrichment', done: false },
            { text: 'anyOS vertical product pages', done: false },
          ].map((todo, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5,
                border: `1.5px solid ${todo.done ? '#22C55E' : 'rgba(255,255,255,0.15)'}`,
                background: todo.done ? '#22C55E20' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 11, color: '#22C55E',
              }}>
                {todo.done && '✓'}
              </div>
              <span style={{
                color: todo.done ? '#555' : '#BBBBBB', fontSize: 13,
                textDecoration: todo.done ? 'line-through' : 'none',
              }}>
                {todo.text}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', gap: 10, marginBottom: 20 }}
        >
          <QuickAction icon="✏️" label="Add Task" />
          <QuickAction icon="📅" label="Add Event" />
          <QuickAction icon="⚡" label="Automate" />
          <QuickAction icon="🎤" label="Ask Agent" />
        </motion.div>

        {/* Voice chat section */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ ...glass({ padding: '18px 20px', marginBottom: 20 }) }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <motion.div
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <h3 style={{ color: '#F0EEE8', fontSize: 15, fontWeight: 600, margin: 0, fontFamily: 'var(--font-heading)' }}>
              Voice Chat
            </h3>
          </div>
          {/* Voice messages as waveforms */}
          {[
            { from: 'You', color: '#6366F1', time: '09:12' },
            { from: 'Marg', color: '#FFD700', time: '09:12' },
            { from: 'You', color: '#6366F1', time: '09:08' },
          ].map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', marginBottom: 8, borderRadius: 12,
              background: `${msg.color}08`,
            }}>
              <span style={{ color: msg.color, fontSize: 11, fontWeight: 600, width: 36, flexShrink: 0 }}>
                {msg.from}
              </span>
              <div style={{ flex: 1 }}>
                <Waveform color={msg.color} bars={20} height={20} />
              </div>
              <span style={{ color: '#444', fontSize: 10, fontFamily: 'monospace' }}>{msg.time}</span>
            </div>
          ))}
        </motion.div>

        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ ...glass({ padding: '18px 20px' }) }}
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
          {[
            { ts: '09:14', agent: 'Marg', color: '#FFD700', action: 'Analysing today\'s schedule' },
            { ts: '09:10', agent: 'Cindy', color: '#C084FC', action: 'Preparing 10am briefing' },
            { ts: '09:06', agent: 'Marg', color: '#FFD700', action: 'Synced memory to Supabase' },
            { ts: '09:02', agent: 'Cindy', color: '#C084FC', action: 'Synced Google Calendar' },
            { ts: '09:01', agent: 'Doc', color: '#60A5FA', action: 'Standing by — ready for tasks' },
          ].map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 0', borderBottom: idx < 4 ? '1px solid rgba(255,255,255,0.03)' : 'none',
            }}>
              <span style={{ color: '#333', fontFamily: 'monospace', fontSize: 10, flexShrink: 0 }}>{item.ts}</span>
              <span style={{ color: item.color, fontWeight: 700, fontSize: 11, width: 44, flexShrink: 0 }}>{item.agent}</span>
              <span style={{ color: '#777', fontSize: 12 }}>{item.action}</span>
            </div>
          ))}
        </motion.div>

        {/* Bottom nav — mode switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            padding: '12px 16px 24px',
            background: 'linear-gradient(to top, rgba(8,8,16,0.98), rgba(8,8,16,0.8), transparent)',
            display: 'flex', justifyContent: 'center', gap: 8,
            zIndex: 10,
          }}
        >
          {['Business', 'Personal', 'Laboratory'].map((mode, idx) => (
            <motion.button
              key={mode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '8px 20px', borderRadius: 14,
                background: idx === 0 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${idx === 0 ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                color: idx === 0 ? '#818CF8' : '#555',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {mode}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
