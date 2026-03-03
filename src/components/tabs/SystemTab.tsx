'use client'

import { useState, useEffect, useCallback } from 'react'
import { api, formatCost, formatTokens, type CostSummary, type AgentStatus, type ApiService, type CostEntry } from '@/lib/api'

const agentDefs = [
  {
    name: 'Margarita',
    role: 'Brain',
    model: 'Kimi / Moonshot AI',
    icon: '🧠',
    color: '#FFD700',
    specialty: ['Memory', 'Chat', 'Coordination', 'Thinking'],
  },
  {
    name: 'Martini',
    role: 'Muscles',
    model: 'Claude / Anthropic',
    icon: '⚡',
    color: '#A855F7',
    specialty: ['Building', 'Coding', 'Tasks'],
  },
  {
    name: 'Doc',
    role: 'Research',
    model: 'Brave Search',
    icon: '🔍',
    color: '#16A34A',
    specialty: ['Search', 'Research', 'Discovery'],
  },
]

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    connected: { bg: 'rgba(22,163,74,0.12)', text: '#16A34A' },
    configured: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' },
    error: { bg: 'rgba(220,38,38,0.12)', text: '#DC2626' },
    idle: { bg: 'rgba(102,102,102,0.12)', text: '#666' },
  }
  const s = map[status] || map.idle
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider"
      style={{ background: s.bg, color: s.text }}
    >
      {status}
    </span>
  )
}

function UsageRow({ label, calls, tokens, cost, color }: { label: string; calls: number; tokens: number; cost: number; color: string }) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{formatCost(cost)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--c-dim)' }}>Calls</div>
          <div className="text-base font-bold" style={{ color: 'var(--c-text)' }}>{calls}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--c-dim)' }}>Tokens</div>
          <div className="text-base font-bold" style={{ color: 'var(--c-text)' }}>{formatTokens(tokens)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--c-dim)' }}>Cost</div>
          <div className="text-base font-bold" style={{ color }}>{formatCost(cost)}</div>
        </div>
      </div>
      {tokens === 0 && (
        <div className="text-[10px] px-2 py-1 rounded font-mono" style={{ color: 'var(--c-dim)', background: 'var(--c-panel)' }}>
          POST /api/costs · {'{'}model, inputTokens, outputTokens, agent{'}'}
        </div>
      )}
    </div>
  )
}

export default function SystemTab() {
  const [costs, setCosts] = useState<CostSummary | null>(null)
  const [agents, setAgents] = useState<Record<string, AgentStatus>>({})
  const [apis, setApis] = useState<ApiService[]>([])
  const [costEntries, setCostEntries] = useState<CostEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [c, a, sv] = await Promise.allSettled([
      api.costs(),
      api.agents(),
      api.apisStatus(),
    ])
    if (c.status === 'fulfilled') {
      setCosts(c.value)
      setCostEntries(c.value.entries || [])
    }
    if (a.status === 'fulfilled') setAgents(a.value)
    if (sv.status === 'fulfilled') setApis(sv.value)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [load])

  const totalCost = costs?.total.cost || 0

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[1200px] mx-auto">

        {/* Header: Total cost */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>System Status</div>
            <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--c-text)' }}>AI Core + APIs</h1>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>Total Cost Today</div>
            <div className="text-4xl font-bold text-glow-gold tabular-nums" style={{ color: '#FFD700' }}>
              {formatCost(totalCost)}
            </div>
            <div className="text-xs" style={{ color: 'var(--c-dim)' }}>
              {costs?.total.calls || 0} API calls · {formatTokens(costs?.total.tokens || 0)} tokens
            </div>
          </div>
        </div>

        {/* Real API Usage — per provider */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--c-muted)' }}>
            API Usage Today
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <UsageRow
              label="Margarita · Kimi / Moonshot AI"
              calls={costs?.brain.calls || 0}
              tokens={costs?.brain.tokens || 0}
              cost={costs?.brain.cost || 0}
              color="#FFD700"
            />
            <UsageRow
              label="Martini · Claude / Anthropic"
              calls={costs?.muscles.calls || 0}
              tokens={costs?.muscles.tokens || 0}
              cost={costs?.muscles.cost || 0}
              color="#A855F7"
            />
          </div>
        </section>

        {/* AI Core Section */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--c-muted)' }}>AI Core</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agentDefs.map((def) => {
              const data = agents[def.name]
              const state = data?.state || 'idle'
              const cost = data?.cost24h || 0
              const tokens = data?.tokens24h || 0
              const calls = data?.entries24h?.length || 0

              return (
                <div
                  key={def.name}
                  className="card p-5 flex flex-col gap-4 transition-all duration-200"
                  style={{
                    borderColor: state === 'active' ? def.color + '40' : 'var(--c-border)',
                    boxShadow: state === 'active' ? `0 0 20px ${def.color}18` : 'none',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: def.color + '14', border: `1px solid ${def.color}30` }}
                      >
                        {def.icon}
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: def.color }}>{def.name}</div>
                        <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{def.role} · {def.model}</div>
                      </div>
                    </div>
                    <StatusPill status={state} />
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1">
                    {def.specialty.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: '1px solid var(--c-border)' }}>
                    <div className="text-center">
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--c-dim)' }}>Calls</div>
                      <div className="text-lg font-bold" style={{ color: 'var(--c-text)' }}>{calls}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--c-dim)' }}>Tokens</div>
                      <div className="text-lg font-bold" style={{ color: 'var(--c-text)' }}>{formatTokens(tokens)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--c-dim)' }}>Cost</div>
                      <div className="text-lg font-bold" style={{ color: def.color }}>{formatCost(cost)}</div>
                    </div>
                  </div>

                  {/* Last activity */}
                  {data?.entries24h?.[0] && (
                    <div className="text-[10px] truncate pt-2" style={{ color: 'var(--c-dim)', borderTop: '1px solid var(--c-surface)' }}>
                      ↳ {data.entries24h[0].task}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Supporting APIs */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--c-muted)' }}>Supporting APIs</h2>
          <div className="card overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--c-dim)' }}>Loading...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                    <th className="text-left text-[10px] uppercase tracking-wider px-4 py-3" style={{ color: 'var(--c-dim)' }}>Service</th>
                    <th className="text-left text-[10px] uppercase tracking-wider px-4 py-3 hidden sm:table-cell" style={{ color: 'var(--c-dim)' }}>Model</th>
                    <th className="text-left text-[10px] uppercase tracking-wider px-4 py-3" style={{ color: 'var(--c-dim)' }}>Status</th>
                    <th className="text-right text-[10px] uppercase tracking-wider px-4 py-3 hidden md:table-cell" style={{ color: 'var(--c-dim)' }}>Last Used</th>
                  </tr>
                </thead>
                <tbody>
                  {apis.map((svc, i) => (
                    <tr
                      key={svc.id}
                      className="transition-colors"
                      style={{
                        borderBottom: i < apis.length - 1 ? '1px solid var(--c-surface)' : 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-panel)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                            style={{ background: (svc.color || '#666') + '18' }}
                          >
                            {svc.icon || '⚙️'}
                          </div>
                          <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>{svc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: 'var(--c-muted)' }}>{svc.model || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={svc.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-right hidden md:table-cell" style={{ color: 'var(--c-dim)' }}>
                        {svc.lastUsed ? new Date(svc.lastUsed).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Cost Distribution bars */}
        {costs && (
          <section className="mt-6">
            <h2 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--c-muted)' }}>Cost Distribution</h2>
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: '#FFD700' }}>Brain (Kimi) · {costs.brain.calls} calls · {formatTokens(costs.brain.tokens)} tok</span>
                    <span className="font-mono font-bold" style={{ color: '#FFD700' }}>{formatCost(costs.brain.cost)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--c-panel)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: costs.total.cost > 0 ? `${(costs.brain.cost / costs.total.cost) * 100}%` : '0%',
                        background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: '#A855F7' }}>Muscles (Claude) · {costs.muscles.calls} calls · {formatTokens(costs.muscles.tokens)} tok</span>
                    <span className="font-mono font-bold" style={{ color: '#A855F7' }}>{formatCost(costs.muscles.cost)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--c-panel)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: costs.total.cost > 0 ? `${(costs.muscles.cost / costs.total.cost) * 100}%` : '0%',
                        background: 'linear-gradient(90deg, #A855F7, #7C3AED)',
                      }}
                    />
                  </div>
                </div>
              </div>
              {/* Pricing reference */}
              <div className="mt-4 pt-3 grid grid-cols-2 gap-2 text-[10px]" style={{ borderTop: '1px solid var(--c-border)', color: 'var(--c-dim)' }}>
                <div>
                  <div className="font-semibold mb-1" style={{ color: 'var(--c-muted)' }}>Kimi pricing (per 1M tok)</div>
                  <div>moonshot-v1-8k · $0.27 in/out</div>
                  <div>moonshot-v1-32k · $0.54 in/out</div>
                  <div>moonshot-v1-128k · $1.08 in/out</div>
                </div>
                <div>
                  <div className="font-semibold mb-1" style={{ color: 'var(--c-muted)' }}>Claude pricing (per 1M tok)</div>
                  <div>Haiku 4.5 · $0.80 in / $4 out</div>
                  <div>Sonnet 4.6 · $3 in / $15 out</div>
                  <div>Opus 4.6 · $15 in / $75 out</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent API Cost Log */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--c-muted)' }}>Recent API Calls</h2>
            <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: 'var(--c-surface)', color: 'var(--c-dim)', border: '1px solid var(--c-border)' }}>
              POST /api/costs to log
            </span>
          </div>
          <div className="card overflow-hidden">
            {costEntries.length === 0 ? (
              <div className="p-6">
                <div className="text-xs mb-3" style={{ color: 'var(--c-muted)' }}>No API calls logged today. Use the endpoint to track costs:</div>
                <pre className="text-[10px] p-3 rounded overflow-x-auto" style={{ background: 'var(--c-panel)', color: '#FFD700', border: '1px solid var(--c-border)' }}>{`curl -X POST http://localhost:3001/api/costs \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-4-6",
    "agent": "Martini",
    "task": "Build Mission Control",
    "inputTokens": 12500,
    "outputTokens": 3200
  }'`}</pre>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                    <th className="text-left text-[10px] uppercase tracking-wider px-4 py-2" style={{ color: 'var(--c-dim)' }}>Time</th>
                    <th className="text-left text-[10px] uppercase tracking-wider px-4 py-2" style={{ color: 'var(--c-dim)' }}>Agent</th>
                    <th className="text-left text-[10px] uppercase tracking-wider px-4 py-2 hidden sm:table-cell" style={{ color: 'var(--c-dim)' }}>Model</th>
                    <th className="text-left text-[10px] uppercase tracking-wider px-4 py-2 hidden md:table-cell" style={{ color: 'var(--c-dim)' }}>Task</th>
                    <th className="text-right text-[10px] uppercase tracking-wider px-4 py-2" style={{ color: 'var(--c-dim)' }}>Tokens</th>
                    <th className="text-right text-[10px] uppercase tracking-wider px-4 py-2" style={{ color: 'var(--c-dim)' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {[...costEntries].reverse().map((entry, i) => {
                    const color = entry.provider === 'kimi' ? '#FFD700' : '#A855F7'
                    return (
                      <tr
                        key={entry.id}
                        style={{ borderBottom: i < costEntries.length - 1 ? '1px solid var(--c-surface)' : 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-panel)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      >
                        <td className="px-4 py-2 text-[10px] font-mono" style={{ color: 'var(--c-dim)' }}>
                          {new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2 text-xs font-semibold" style={{ color }}>{entry.agent}</td>
                        <td className="px-4 py-2 text-[10px] hidden sm:table-cell" style={{ color: 'var(--c-muted)' }}>{entry.model}</td>
                        <td className="px-4 py-2 text-[10px] hidden md:table-cell truncate max-w-[200px]" style={{ color: 'var(--c-muted)' }}>{entry.task}</td>
                        <td className="px-4 py-2 text-xs text-right font-mono" style={{ color: 'var(--c-text)' }}>{formatTokens(entry.totalTokens)}</td>
                        <td className="px-4 py-2 text-xs text-right font-mono font-bold" style={{ color }}>{formatCost(entry.cost_gbp)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
