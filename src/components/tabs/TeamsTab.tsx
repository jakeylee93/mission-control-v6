'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { api, formatCost } from '@/lib/api'

type AgentState = 'active' | 'thinking' | 'idle' | 'error'

interface AgentCardData {
  name: string
  role: string
  state: AgentState
  accent: string
  description: string
  inputs: string[]
  outputs: string[]
}

const AGENTS: AgentCardData[] = [
  {
    name: 'Margarita',
    role: 'Orchestrator',
    state: 'active',
    accent: '#FFD700',
    description: 'Coordinates tasks between you and the other agents. The brain of the operation.',
    inputs: ['User commands', 'System events', 'Calendar activity', 'New tasks'],
    outputs: ['Task assignment', 'Automations', 'Dashboard updates', 'Info routing'],
  },
  {
    name: 'Doc',
    role: 'Researcher',
    state: 'idle',
    accent: '#16A34A',
    description: 'Finds information, summarises knowledge, and delivers research when needed.',
    inputs: ['Search queries', 'Knowledge requests', 'Research prompts'],
    outputs: ['Summaries', 'Research reports', 'Relevant links', 'Structured data'],
  },
  {
    name: 'Bish',
    role: 'Builder',
    state: 'idle',
    accent: '#A855F7',
    description: 'Builds features, writes code, and modifies the system on command.',
    inputs: ['Dev requests', 'UI changes', 'Feature builds', 'Coding tasks'],
    outputs: ['Completed code', 'System updates', 'New features', 'Interface mods'],
  },
]

const LIVE_FEED = [
  { ts: '09:14', agent: 'Margarita', color: '#FFD700', action: 'Analysing today schedule' },
  { ts: '09:10', agent: 'Bish', color: '#A855F7', action: 'Updated Brain tab with voice notes' },
  { ts: '09:06', agent: 'Margarita', color: '#FFD700', action: 'Synced memory to Supabase' },
  { ts: '09:01', agent: 'Doc', color: '#16A34A', action: 'Standing by' },
]

function stateColor(state: AgentState) {
  if (state === 'active') return '#22C55E'
  if (state === 'thinking') return '#F59E0B'
  if (state === 'error') return '#EF4444'
  return '#6B7280'
}

function AgentCard({ agent, idx }: { agent: AgentCardData; idx: number }) {
  const dot = stateColor(agent.state)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: idx * 0.06, ease: 'easeOut' }}
      className="card rounded-2xl p-4 md:p-5"
      style={{ borderColor: `${agent.accent}50`, boxShadow: `0 0 22px ${agent.accent}1a` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-2xl font-bold leading-tight" style={{ color: agent.accent }}>{agent.name}</h2>
          <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{agent.role}</div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--c-muted)' }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: dot, boxShadow: `0 0 8px ${dot}` }} />
          {agent.state}
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--c-text-2)' }}>{agent.description}</p>

      <div className="grid grid-cols-1 gap-3 text-xs">
        <div>
          <div className="uppercase tracking-wider text-[10px] font-semibold mb-1.5" style={{ color: agent.accent }}>Inputs</div>
          <div className="flex flex-wrap gap-1.5">
            {agent.inputs.map((input) => (
              <span key={input} className="px-2 py-1 rounded-md" style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>
                {input}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="uppercase tracking-wider text-[10px] font-semibold mb-1.5" style={{ color: agent.accent }}>Outputs</div>
          <div className="flex flex-wrap gap-1.5">
            {agent.outputs.map((output) => (
              <span key={output} className="px-2 py-1 rounded-md" style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>
                {output}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function TeamsTab() {
  const [todayCost, setTodayCost] = useState(0)

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
    return () => {
      active = false
    }
  }, [])

  const onlineCount = useMemo(() => AGENTS.length, [])

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <div className="card rounded-2xl p-3 md:p-4 mb-4 md:mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 text-sm">
            <div className="flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#22C55E', boxShadow: '0 0 10px #22C55E' }} />
              <span className="font-semibold">{onlineCount} agents online</span>
            </div>
            <div style={{ color: 'var(--c-text)' }}>
              <span className="font-semibold">0</span> active tasks
            </div>
            <div style={{ color: 'var(--c-text)' }}>
              Today: <span className="font-semibold text-glow-gold">{formatCost(todayCost)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-5">
          {AGENTS.map((agent, idx) => (
            <AgentCard key={agent.name} agent={agent} idx={idx} />
          ))}
        </div>

        <section className="card rounded-2xl p-4 md:p-5">
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--c-text)' }}>Live Activity</h3>
          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2">
            {LIVE_FEED.map((item, idx) => (
              <div
                key={`${item.agent}-${idx}`}
                className="rounded-lg px-3 py-2"
                style={{ background: 'var(--c-panel)', border: `1px solid ${item.color}3d` }}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono" style={{ color: 'var(--c-dim)' }}>{item.ts}</span>
                  <span style={{ color: item.color, fontWeight: 600 }}>{item.agent}</span>
                  <span style={{ color: 'var(--c-text-2)' }}>{item.action}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
