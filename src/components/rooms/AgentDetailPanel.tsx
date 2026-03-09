'use client'

import { motion, AnimatePresence } from 'framer-motion'
import MargCharacter from '@/components/characters/MargCharacter'
import DocCharacter from '@/components/characters/DocCharacter'
import CindyCharacter from '@/components/characters/CindyCharacter'

type AgentState = 'active' | 'thinking' | 'idle' | 'error'

interface Activity {
  time: string
  action: string
  room: string
}

interface AgentInfo {
  id: 'marg' | 'doc' | 'cindy'
  name: string
  role: string
  accent: string
  state: AgentState
  currentRoom: string
  description: string
  model: string
  activities: Activity[]
}

interface AgentDetailPanelProps {
  agent: AgentInfo | null
  onClose: () => void
}

const STATE_LABELS: Record<AgentState, string> = {
  active: 'Active',
  thinking: 'Thinking',
  idle: 'Idle',
  error: 'Error',
}

const STATE_COLORS: Record<AgentState, string> = {
  active: '#22C55E',
  thinking: '#F59E0B',
  idle: '#6B7280',
  error: '#EF4444',
}

function CharacterDisplay({ id, state, accent }: { id: string; state: AgentState; accent: string }) {
  if (id === 'marg') return <MargCharacter size={80} state={state} isSelected={false} />
  if (id === 'doc') return <DocCharacter size={80} state={state} isSelected={false} />
  if (id === 'cindy') return <CindyCharacter size={80} state={state} isSelected={false} />
  return null
}

export default function AgentDetailPanel({ agent, onClose }: AgentDetailPanelProps) {
  return (
    <AnimatePresence>
      {agent && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: '#00000060',
              backdropFilter: 'blur(4px)',
              zIndex: 40,
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              background: '#0a0a0a',
              borderTop: `2px solid ${agent.accent}60`,
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px 40px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: `0 -20px 60px ${agent.accent}30`,
            }}
          >
            {/* Drag handle */}
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: '#333',
              margin: '0 auto 20px',
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <CharacterDisplay id={agent.id} state={agent.state} accent={agent.accent} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h2 style={{ color: agent.accent, fontSize: 24, fontWeight: 700, margin: 0 }}>{agent.name}</h2>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: '#111', borderRadius: 20, padding: '3px 10px',
                    border: `1px solid ${STATE_COLORS[agent.state]}50`,
                  }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: STATE_COLORS[agent.state],
                      boxShadow: `0 0 6px ${STATE_COLORS[agent.state]}`,
                    }} />
                    <span style={{ color: STATE_COLORS[agent.state], fontSize: 11, fontWeight: 600 }}>
                      {STATE_LABELS[agent.state]}
                    </span>
                  </div>
                </div>
                <div style={{ color: 'var(--c-muted)', fontSize: 13, marginBottom: 8 }}>{agent.role}</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: 'var(--c-muted)', fontSize: 12,
                }}>
                  <span>📍</span>
                  <span>Currently in: <span style={{ color: agent.accent }}>{agent.currentRoom}</span></span>
                </div>
                <div style={{ color: 'var(--c-muted)', fontSize: 12, marginTop: 4 }}>
                  <span>🤖 {agent.model}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{
              background: '#111',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 16,
              border: `1px solid ${agent.accent}20`,
            }}>
              <p style={{ color: 'var(--c-text-2)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                {agent.description}
              </p>
            </div>

            {/* Recent Activity */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ color: 'var(--c-text)', fontSize: 13, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Recent Activity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {agent.activities.map((activity, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      background: '#111',
                      borderRadius: 10,
                      padding: '10px 12px',
                      border: `1px solid ${agent.accent}20`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <span style={{ color: 'var(--c-dim)', fontFamily: 'monospace', fontSize: 11, flexShrink: 0, paddingTop: 1 }}>
                      {activity.time}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--c-text)', fontSize: 12, lineHeight: 1.4 }}>{activity.action}</div>
                      <div style={{ color: agent.accent, fontSize: 10, marginTop: 3, opacity: 0.8 }}>
                        {activity.room}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Action button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                background: `${agent.accent}20`,
                border: `1.5px solid ${agent.accent}60`,
                color: agent.accent,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Send Task →
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
