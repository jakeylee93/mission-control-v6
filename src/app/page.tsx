'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, formatCost } from '@/lib/api'

// Keep Tab export for backward compat with Navigation component
export type Tab = 'TEAMS' | 'PLANS' | 'BRAIN' | 'DOCS' | 'BELONGINGS' | 'LOVELY' | 'PROPERTY' | 'CALENDAR' | 'CAPTURE' | 'SYSTEM'

/* ── types ── */
type AgentId = 'marg' | 'doc' | 'cindy'

interface Agent {
  id: AgentId
  name: string
  role: string
  accent: string
  quote: string
  model: string
  initial: string
}

const AGENTS: Record<AgentId, Agent> = {
  marg: {
    id: 'marg', name: 'Margarita', role: 'Orchestrator',
    accent: '#FFD700', model: 'Claude Opus 4', initial: 'M',
    quote: 'Hey Jake — take it steady today. You\'ve got momentum, just don\'t rush it.',
  },
  doc: {
    id: 'doc', name: 'Doc', role: 'Builder',
    accent: '#60A5FA', model: 'GPT-4o', initial: 'D',
    quote: 'Standing by — ready when you are, boss.',
  },
  cindy: {
    id: 'cindy', name: 'Cindy', role: 'Assistant',
    accent: '#C084FC', model: 'Kimi k2.5', initial: 'C',
    quote: 'Calendar synced. 3 events today — you\'re looking organised.',
  },
}

/* ── waveform ── */
function Waveform({ color, bars = 20, h = 24 }: { color: string; bars?: number; h?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, height: h }}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          style={{ width: 2, borderRadius: 1, background: color, opacity: 0.8 }}
          animate={{ height: [2, h * 0.25 + Math.random() * h * 0.65, 2] }}
          transition={{ duration: 0.5 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ── main ── */
export default function Home() {
  const [active, setActive] = useState<AgentId>('marg')
  const [now, setNow] = useState(new Date())
  const [cost, setCost] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let ok = true
    const load = async () => {
      try {
        const d = await api.costs()
        if (ok) setCost(d.total?.cost || 0)
      } catch { if (ok) setCost(0) }
    }
    load()
    const i = setInterval(load, 60000)
    return () => { ok = false; clearInterval(i) }
  }, [])

  const agent = AGENTS[active]
  const others = (['marg', 'doc', 'cindy'] as AgentId[]).filter(id => id !== active)
  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateFmt = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeFmt = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
      color: '#F0EEE8',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient purple glow */}
      <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,80,200,0.08), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>

        {/* ─── Header ─── */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ paddingTop: 48, marginBottom: 32, textAlign: 'center' }}
        >
          <div style={{ color: '#555', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            {dayName} · {dateFmt}
          </div>
          <h1 style={{
            fontSize: 44, fontWeight: 700, margin: 0, letterSpacing: -1,
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          }}>
            Jake
          </h1>
          <div style={{ color: '#666', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 }}>
            Mission Control
          </div>
          <div style={{
            fontSize: 32, fontWeight: 200, fontFamily: 'monospace', letterSpacing: 3,
            marginTop: 12, opacity: 0.8,
          }}>
            {timeFmt}
          </div>
        </motion.header>

        {/* ─── Agent Card ─── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 28,
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            {/* Card glow */}
            <div style={{
              position: 'absolute', top: -80, right: -80, width: 250, height: 250,
              borderRadius: '50%', background: `radial-gradient(circle, ${agent.accent}10, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            {/* Top row: agent name + switcher circles */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                {agent.name}
              </h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {others.map(id => (
                  <motion.button
                    key={id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActive(id)}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${AGENTS[id].accent}25, ${AGENTS[id].accent}10)`,
                      border: `1.5px solid ${AGENTS[id].accent}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', fontSize: 14, fontWeight: 700,
                      color: AGENTS[id].accent,
                    }}
                  >
                    {AGENTS[id].initial}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Avatar + speech bubble */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20, position: 'relative', zIndex: 1 }}>
              {/* Avatar placeholder */}
              <div style={{
                width: 80, height: 80, borderRadius: 20, flexShrink: 0,
                background: `linear-gradient(145deg, ${agent.accent}30, ${agent.accent}10)`,
                border: `2px solid ${agent.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, fontWeight: 700, color: agent.accent,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {agent.initial}
              </div>

              {/* Speech bubble */}
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 18,
                padding: '14px 16px',
                position: 'relative',
              }}>
                {/* Pointer */}
                <div style={{
                  position: 'absolute', left: -7, top: 18,
                  width: 14, height: 14,
                  background: 'rgba(255,255,255,0.05)',
                  transform: 'rotate(45deg)',
                  borderRadius: 3,
                }} />
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#C8C8C8', position: 'relative', zIndex: 1 }}>
                  &ldquo;{agent.quote}&rdquo;
                </p>
              </div>
            </div>

            {/* Mic + waveform */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                style={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                  background: `radial-gradient(circle at 35% 35%, ${agent.accent}45, ${agent.accent}15)`,
                  border: `1.5px solid ${agent.accent}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative',
                }}
              >
                {/* Pulse ring */}
                <motion.div
                  style={{ position: 'absolute', inset: -5, borderRadius: '50%', border: `1px solid ${agent.accent}20` }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.1, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={agent.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="1" width="6" height="11" rx="3" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </motion.div>
              <div style={{ flex: 1 }}>
                <Waveform color={agent.accent} bars={28} h={28} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ─── Schedule ─── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 24,
            padding: '20px 22px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
              Today
            </h3>
            <span style={{ color: '#555', fontSize: 11 }}>
              Cost: <span style={{ color: '#FFD700', fontWeight: 600 }}>{formatCost(cost)}</span>
            </span>
          </div>

          {[
            { time: '10:00', label: 'Team sync & priorities', color: '#6366F1', duration: '1h' },
            { time: '13:00', label: 'N2 Group follow-up call', color: '#22C55E', duration: '1h' },
            { time: '15:00', label: 'Stuart — legal data chat', color: '#F59E0B', duration: '30m' },
            { time: '16:30', label: 'Review Mission Control', color: '#C084FC', duration: '30m' },
          ].map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 0',
              borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{ width: 3, height: 36, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#E0E0E0' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{item.time} · {item.duration}</div>
              </div>
              <div style={{
                padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                background: item.color + '15', color: item.color,
              }}>
                {item.duration}
              </div>
            </div>
          ))}
        </motion.section>

        {/* ─── Ongoing ─── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 24,
            padding: '20px 22px',
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px', fontFamily: "'Space Grotesk', sans-serif" }}>
            Ongoing
          </h3>
          {[
            { text: 'Mission Control redesign', done: false, agent: 'Marg', color: '#FFD700' },
            { text: 'ElevenLabs voice setup', done: true, agent: 'Marg', color: '#FFD700' },
            { text: 'Stuart email — legal data', done: false, agent: 'Marg', color: '#FFD700' },
            { text: 'anyOS vertical pages', done: false, agent: 'Doc', color: '#60A5FA' },
          ].map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0',
              borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: `1.5px solid ${item.done ? '#22C55E' : 'rgba(255,255,255,0.12)'}`,
                background: item.done ? '#22C55E15' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: '#22C55E',
              }}>
                {item.done && '✓'}
              </div>
              <span style={{
                flex: 1, fontSize: 13, color: item.done ? '#555' : '#C0C0C0',
                textDecoration: item.done ? 'line-through' : 'none',
              }}>
                {item.text}
              </span>
              <span style={{ fontSize: 10, color: item.color, fontWeight: 600 }}>{item.agent}</span>
            </div>
          ))}
        </motion.section>

        {/* ─── Quick Actions ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}
        >
          {[
            { icon: '✏️', label: 'Task' },
            { icon: '📅', label: 'Event' },
            { icon: '⚡', label: 'Automate' },
            { icon: '🎤', label: 'Ask' },
          ].map(item => (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 18,
                padding: '14px 8px',
                cursor: 'pointer',
                textAlign: 'center' as const,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ color: '#888', fontSize: 11, fontWeight: 500 }}>{item.label}</div>
            </motion.button>
          ))}
        </motion.div>

        {/* ─── Live Feed ─── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 24,
            padding: '20px 22px',
            marginBottom: 80,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <motion.div
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
              Activity
            </h3>
          </div>
          {[
            { ts: '09:14', who: 'Marg', color: '#FFD700', what: 'Analysing today\'s schedule' },
            { ts: '09:10', who: 'Cindy', color: '#C084FC', what: 'Preparing daily briefing' },
            { ts: '09:06', who: 'Marg', color: '#FFD700', what: 'Synced memory to Supabase' },
            { ts: '09:01', who: 'Doc', color: '#60A5FA', what: 'Standing by' },
          ].map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 0',
              borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.03)' : 'none',
            }}>
              <span style={{ color: '#333', fontFamily: 'monospace', fontSize: 10, flexShrink: 0 }}>{item.ts}</span>
              <span style={{ color: item.color, fontSize: 11, fontWeight: 700, width: 40, flexShrink: 0 }}>{item.who}</span>
              <span style={{ color: '#666', fontSize: 12 }}>{item.what}</span>
            </div>
          ))}
        </motion.section>

      </div>
    </div>
  )
}
