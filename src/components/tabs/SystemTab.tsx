'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, formatCost, formatTokens, type CostEntry, type CostHistory, type CostSummary, type CostTrends } from '@/lib/api'

type ViewPeriod = 'daily' | 'weekly' | 'monthly'
type ProviderKey = 'kimi' | 'claude' | 'openai'

interface ProviderTotals {
  calls: number
  inputTokens: number
  outputTokens: number
  cost: number
}

const PROVIDER_META: Record<ProviderKey, { label: string; accent: string }> = {
  claude: { label: 'Anthropic', accent: '#A855F7' },
  openai: { label: 'OpenAI', accent: '#16A34A' },
  kimi: { label: 'Moonshot', accent: '#FFD700' },
}

const PERIOD_BUTTONS: Array<{ key: ViewPeriod; label: string }> = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
]

export default function SystemTab() {
  const [costs, setCosts] = useState<CostSummary | null>(null)
  const [trends, setTrends] = useState<CostTrends | null>(null)
  const [history, setHistory] = useState<CostHistory | null>(null)
  const [period, setPeriod] = useState<ViewPeriod>('daily')
  const [loading, setLoading] = useState(true)
  const [hoverSparkIdx, setHoverSparkIdx] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [costsRes, trendsRes, historyRes] = await Promise.allSettled([
        api.costs(),
        api.costsTrends(),
        api.costsHistory(30),
      ])

      if (costsRes.status === 'fulfilled') setCosts(costsRes.value)
      if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value)
      if (historyRes.status === 'fulfilled') setHistory(historyRes.value)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [load])

  const allEntries = useMemo(() => {
    return [...(costs?.entries || [])].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }, [costs?.entries])

  const filteredEntries = useMemo(() => {
    const now = new Date()
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(dayStart)
    weekStart.setDate(dayStart.getDate() - ((dayStart.getDay() + 6) % 7))
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const start = period === 'daily' ? dayStart : period === 'weekly' ? weekStart : monthStart
    return allEntries.filter((entry) => new Date(entry.timestamp) >= start)
  }, [allEntries, period])

  const totals = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => {
      acc.calls += 1
      acc.inputTokens += entry.inputTokens
      acc.outputTokens += entry.outputTokens
      acc.cost += entry.cost_gbp
      return acc
    }, { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 })
  }, [filteredEntries])

  const providerTotals = useMemo<Record<ProviderKey, ProviderTotals>>(() => {
    const base: Record<ProviderKey, ProviderTotals> = {
      claude: { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      openai: { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      kimi: { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
    }

    for (const entry of filteredEntries) {
      const provider = entry.provider as ProviderKey
      if (!base[provider]) continue
      base[provider].calls += 1
      base[provider].inputTokens += entry.inputTokens
      base[provider].outputTokens += entry.outputTokens
      base[provider].cost += entry.cost_gbp
    }

    return base
  }, [filteredEntries])

  const modelBreakdown = useMemo(() => {
    const grouped: Record<string, {
      model: string
      provider: ProviderKey
      calls: number
      inputTokens: number
      outputTokens: number
      cost_gbp: number
    }> = {}

    for (const entry of filteredEntries) {
      const key = `${entry.provider}-${entry.model}`
      if (!grouped[key]) {
        grouped[key] = {
          model: entry.model,
          provider: entry.provider,
          calls: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost_gbp: 0,
        }
      }
      grouped[key].calls += 1
      grouped[key].inputTokens += entry.inputTokens
      grouped[key].outputTokens += entry.outputTokens
      grouped[key].cost_gbp += entry.cost_gbp
    }

    return Object.values(grouped).sort((a, b) => b.cost_gbp - a.cost_gbp)
  }, [filteredEntries])

  const sparkData = useMemo(() => {
    const source = history?.days?.length ? history.days : costs?.last7Days || []
    const sliced = source.slice(-7)

    if (sliced.length > 0) return sliced

    return Array.from({ length: 7 }, (_, idx) => ({
      date: `D${idx + 1}`,
      cost_gbp: 0,
      calls: 0,
      kimi: 0,
      claude: 0,
      openai: 0,
    }))
  }, [history?.days, costs?.last7Days])

  const sparkLines = useMemo(() => {
    const maxTotal = Math.max(...sparkData.map((d) => d.cost_gbp), 0.001)
    const maxKimi = Math.max(...sparkData.map((d) => d.kimi || 0), 0.001)
    const maxClaude = Math.max(...sparkData.map((d) => d.claude || 0), 0.001)
    const maxOpenAI = Math.max(...sparkData.map((d) => d.openai || 0), 0.001)

    const toLine = (valueGetter: (item: typeof sparkData[number]) => number, max: number) => sparkData.map((item, i) => {
      const x = sparkData.length <= 1 ? 0 : (i / (sparkData.length - 1)) * 100
      const y = 32 - (valueGetter(item) / max) * 28
      return `${x},${Math.max(2, Math.min(32, y))}`
    }).join(' ')

    return {
      total: toLine((d) => d.cost_gbp, maxTotal),
      kimi: toLine((d) => d.kimi || 0, maxKimi),
      claude: toLine((d) => d.claude || 0, maxClaude),
      openai: toLine((d) => d.openai || 0, maxOpenAI),
    }
  }, [sparkData])

  const currentModel = allEntries[0]?.model || (costs?.currentModel ?? 'No calls yet')
  const avgCostPerCall = totals.calls > 0 ? totals.cost / totals.calls : 0
  const recentEntries = allEntries.slice(0, 30)
  const hoverPoint = hoverSparkIdx != null ? sparkData[hoverSparkIdx] : null

  const periodComparison = useMemo(() => {
    if (period === 'weekly') {
      return trends?.weekChange == null
        ? 'vs last week: —'
        : `vs last week: ${trends.weekChange >= 0 ? '+' : ''}${trends.weekChange.toFixed(1)}%`
    }

    if (period === 'monthly') {
      return trends?.monthChange == null
        ? 'vs last month: —'
        : `vs last month: ${trends.monthChange >= 0 ? '+' : ''}${trends.monthChange.toFixed(1)}%`
    }

    const today = sparkData[sparkData.length - 1]?.cost_gbp || 0
    const yesterday = sparkData[sparkData.length - 2]?.cost_gbp || 0
    if (yesterday <= 0) return 'vs yesterday: —'

    const pct = ((today - yesterday) / yesterday) * 100
    return `vs yesterday: ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
  }, [period, trends?.weekChange, trends?.monthChange, sparkData])

  const comparisonColor = periodComparison.includes('+') ? '#F59E0B' : periodComparison.includes('-') ? '#16A34A' : 'var(--c-dim)'

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>System Analytics</div>
            <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--c-text)' }}>Cost Intelligence</h1>
          </div>
          <button
            onClick={load}
            className="w-8 h-8 rounded-full inline-flex items-center justify-center transition-colors"
            style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-muted)' }}
            aria-label="Refresh analytics"
            title="Refresh analytics"
          >
            <svg className={loading ? 'cost-refresh-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          <div className="flex items-center gap-1">
            {PERIOD_BUTTONS.map((item) => (
              <button
                key={item.key}
                onClick={() => setPeriod(item.key)}
                className="text-[10px] px-2 py-1 rounded font-semibold tracking-wider transition-all"
                style={{
                  background: period === item.key ? '#FFD700' : 'var(--c-surface)',
                  color: period === item.key ? '#000' : 'var(--c-muted)',
                  border: '1px solid',
                  borderColor: period === item.key ? '#FFD700' : 'var(--c-border)',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono" style={{ color: comparisonColor }}>{periodComparison}</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <motion.div className="card p-4" whileHover={{ y: -2 }} style={{ boxShadow: '0 0 24px rgba(255,215,0,0.08)' }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>Total Spend</div>
            <div className="text-3xl font-bold tabular-nums" style={{ color: '#FFD700' }}>{formatCost(totals.cost)}</div>
            <div className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--c-muted)' }}>{formatTokens(totals.inputTokens + totals.outputTokens)} tokens</div>
          </motion.div>

          <motion.div className="card p-4" whileHover={{ y: -2 }} style={{ boxShadow: '0 0 24px rgba(168,85,247,0.08)' }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>API Calls</div>
            <div className="text-3xl font-bold tabular-nums" style={{ color: '#A855F7' }}>{totals.calls}</div>
            <div className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--c-muted)' }}>in selected period</div>
          </motion.div>

          <motion.div className="card p-4" whileHover={{ y: -2 }} style={{ boxShadow: '0 0 24px rgba(22,163,74,0.08)' }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>Avg Cost / Call</div>
            <div className="text-3xl font-bold tabular-nums" style={{ color: '#16A34A' }}>{formatCost(avgCostPerCall)}</div>
            <div className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--c-muted)' }}>GBP</div>
          </motion.div>

          <motion.div className="card p-4" whileHover={{ y: -2 }} style={{ boxShadow: '0 0 24px rgba(255,215,0,0.08)' }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>Current Model</div>
            <div className="text-base md:text-lg font-semibold truncate" style={{ color: '#FFD700' }}>{currentModel}</div>
            <div className="text-[11px] mt-1 font-mono" style={{ color: 'var(--c-muted)' }}>most recent</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {(['claude', 'openai', 'kimi'] as ProviderKey[]).map((provider) => {
            const totalsForProvider = providerTotals[provider]
            const meta = PROVIDER_META[provider]

            return (
              <motion.div
                key={provider}
                className="rounded-xl p-4"
                style={{
                  background: `linear-gradient(145deg, ${meta.accent}16, var(--c-surface) 40%)`,
                  border: `1px solid ${meta.accent}55`,
                }}
                whileHover={{ y: -2, boxShadow: `0 0 24px ${meta.accent}33` }}
              >
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-muted)' }}>{meta.label}</div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: meta.accent }}>{formatCost(totalsForProvider.cost)}</div>
                <div className="text-[11px] mt-1 font-mono" style={{ color: 'var(--c-dim)' }}>{totalsForProvider.calls} calls</div>
                <div className="text-[10px] mt-1 font-mono" style={{ color: 'var(--c-muted)' }}>
                  in {formatTokens(totalsForProvider.inputTokens)} · out {formatTokens(totalsForProvider.outputTokens)}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>7-Day Spend Trend</h2>
            <span className="text-[10px] font-mono" style={{ color: comparisonColor }}>{periodComparison}</span>
          </div>

          <svg
            viewBox="0 0 100 34"
            className="w-full h-20"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const relX = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
              const idx = Math.round(relX * (sparkData.length - 1))
              setHoverSparkIdx(idx)
            }}
            onMouseLeave={() => setHoverSparkIdx(null)}
          >
            <polyline fill="none" stroke="rgba(255,215,0,0.2)" strokeWidth="1" points="0,32 100,32" />
            <polyline fill="none" stroke="rgba(168,85,247,0.45)" strokeWidth="1.3" points={sparkLines.claude} />
            <polyline fill="none" stroke="rgba(22,163,74,0.45)" strokeWidth="1.3" points={sparkLines.openai} />
            <polyline fill="none" stroke="rgba(255,215,0,0.45)" strokeWidth="1.3" points={sparkLines.kimi} />
            <polyline fill="none" stroke="#FFD700" strokeWidth="2.2" points={sparkLines.total} />
            {hoverSparkIdx != null && (
              <line
                x1={(sparkData.length <= 1 ? 0 : (hoverSparkIdx / (sparkData.length - 1)) * 100)}
                x2={(sparkData.length <= 1 ? 0 : (hoverSparkIdx / (sparkData.length - 1)) * 100)}
                y1={0}
                y2={34}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.6"
              />
            )}
          </svg>

          <AnimatePresence mode="wait">
            {hoverPoint && (
              <motion.div
                key={hoverPoint.date}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="text-[10px] mb-1 font-mono"
                style={{ color: 'var(--c-muted)' }}
              >
                {hoverPoint.date}: total {formatCost(hoverPoint.cost_gbp)} | Anthropic {formatCost(hoverPoint.claude || 0)} | OpenAI {formatCost(hoverPoint.openai || 0)} | Moonshot {formatCost(hoverPoint.kimi || 0)}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-1 flex justify-between text-[10px]" style={{ color: 'var(--c-dim)' }}>
            <span>{sparkData[0]?.date}</span>
            <span>{sparkData[sparkData.length - 1]?.date}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 card p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>Per Model Breakdown</h2>
              <div className="text-[10px] font-mono" style={{ color: 'var(--c-dim)' }}>
                {formatCost(totals.cost)} · {totals.calls} calls
              </div>
            </div>

            {modelBreakdown.length === 0 ? (
              <div className="text-[10px]" style={{ color: 'var(--c-dim)' }}>No model calls logged for this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                      <th className="text-left py-1.5" style={{ color: 'var(--c-dim)' }}>Model</th>
                      <th className="text-right py-1.5" style={{ color: 'var(--c-dim)' }}>Calls</th>
                      <th className="text-right py-1.5" style={{ color: 'var(--c-dim)' }}>Input</th>
                      <th className="text-right py-1.5" style={{ color: 'var(--c-dim)' }}>Output</th>
                      <th className="text-right py-1.5" style={{ color: 'var(--c-dim)' }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelBreakdown.map((row, i) => {
                      const rowColor = row.provider === 'kimi' ? '#FFD700' : row.provider === 'openai' ? '#16A34A' : '#A855F7'
                      return (
                        <tr key={`${row.provider}-${row.model}`} style={{ borderBottom: i < modelBreakdown.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                          <td className="py-1.5">
                            <span className="font-semibold" style={{ color: rowColor }}>{row.model}</span>
                          </td>
                          <td className="py-1.5 text-right font-mono" style={{ color: 'var(--c-muted)' }}>{row.calls}</td>
                          <td className="py-1.5 text-right font-mono" style={{ color: 'var(--c-muted)' }}>{formatTokens(row.inputTokens)}</td>
                          <td className="py-1.5 text-right font-mono" style={{ color: 'var(--c-muted)' }}>{formatTokens(row.outputTokens)}</td>
                          <td className="py-1.5 text-right font-mono font-bold tabular-nums" style={{ color: rowColor }}>{formatCost(row.cost_gbp)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card p-4">
            <h2 className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>Live Cost Activity</h2>

            {recentEntries.length === 0 ? (
              <div className="text-[10px]" style={{ color: 'var(--c-dim)' }}>No cost entries yet</div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto flex flex-col gap-1.5 pr-1">
                {recentEntries.map((entry: CostEntry) => {
                  const accent = entry.provider === 'kimi' ? '#FFD700' : entry.provider === 'openai' ? '#16A34A' : '#A855F7'
                  return (
                    <motion.div
                      key={entry.id}
                      className="rounded-md px-2 py-1.5"
                      style={{ background: 'var(--c-panel)', border: `1px solid ${accent}33` }}
                      whileHover={{ y: -1 }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] font-semibold truncate" style={{ color: accent }}>
                          {entry.model}
                        </div>
                        <div className="text-[10px] font-mono font-bold tabular-nums" style={{ color: accent }}>
                          {formatCost(entry.cost_gbp)}
                        </div>
                      </div>
                      <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--c-muted)' }}>
                        {entry.agent} · {entry.task || 'Untitled task'}
                      </div>
                      <div className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--c-dim)' }}>
                        {new Date(entry.timestamp).toLocaleString()} · in {formatTokens(entry.inputTokens)} · out {formatTokens(entry.outputTokens)}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <style jsx global>{`
        .cost-refresh-spin {
          animation: cost-refresh-spin 0.9s linear infinite;
        }
        @keyframes cost-refresh-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
