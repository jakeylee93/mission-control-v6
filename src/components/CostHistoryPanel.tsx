'use client'

import { useState, useEffect, useCallback } from 'react'
import { api, formatCost, type CostTotal, type CostTrends, type CostHistoryDay } from '@/lib/api'

// ─── Mini bar chart ──────────────────────────────────────────────────────────
function BarChart({ days, maxCost }: { days: CostHistoryDay[]; maxCost: number }) {
  if (!days.length) return null
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex items-end gap-px h-16 w-full mt-2">
      {days.map((d) => {
        const pct = maxCost > 0 ? (d.cost_gbp / maxCost) * 100 : 0
        const isToday = d.date === today
        const label = d.date.slice(5) // MM-DD
        return (
          <div
            key={d.date}
            className="group relative flex-1 flex flex-col justify-end"
            title={`${d.date}\n£${d.cost_gbp.toFixed(4)}\n${d.calls} calls`}
          >
            {/* Bar */}
            <div
              className="rounded-sm transition-all duration-300"
              style={{
                height: `${Math.max(pct, 2)}%`,
                background: isToday
                  ? 'var(--c-gold)'
                  : d.claude > d.kimi
                  ? 'var(--c-purple)'
                  : 'var(--c-green)',
                opacity: pct < 2 ? 0.3 : 0.8,
              }}
            />
            {/* Tooltip */}
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none"
            >
              <div
                className="text-[9px] leading-tight rounded px-1.5 py-1 whitespace-nowrap"
                style={{
                  background: 'var(--c-surface)',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-text)',
                }}
              >
                <div className="font-bold">{label}</div>
                <div style={{ color: 'var(--c-gold)' }}>{formatCost(d.cost_gbp)}</div>
                <div style={{ color: 'var(--c-dim)' }}>{d.calls} calls</div>
              </div>
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '4px solid var(--c-border)',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stat pill ───────────────────────────────────────────────────────────────
function StatPill({
  label,
  value,
  sub,
  color,
  change,
}: {
  label: string
  value: string
  sub?: string
  color?: string
  change?: number | null
}) {
  const changeColor = change == null ? undefined : change > 0 ? '#ef4444' : '#22c55e'
  const changeStr =
    change == null
      ? null
      : `${change > 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(0)}%`

  return (
    <div
      className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
    >
      <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-dim)' }}>
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold leading-none" style={{ color: color || 'var(--c-text)' }}>
          {value}
        </span>
        {changeStr && (
          <span className="text-[10px] font-semibold" style={{ color: changeColor }}>
            {changeStr}
          </span>
        )}
      </div>
      {sub && (
        <div className="text-[10px]" style={{ color: 'var(--c-muted)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ─── Trend indicator ─────────────────────────────────────────────────────────
function TrendBadge({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'flat') return <span style={{ color: 'var(--c-dim)' }}>→ stable</span>
  if (trend === 'up')   return <span style={{ color: '#ef4444' }}>↑ rising</span>
  return <span style={{ color: '#22c55e' }}>↓ falling</span>
}

// ─── Main panel ──────────────────────────────────────────────────────────────
export default function CostHistoryPanel() {
  const [total, setTotal]   = useState<CostTotal | null>(null)
  const [trends, setTrends] = useState<CostTrends | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [t, tr] = await Promise.all([api.costsTotal(), api.costsTrends()])
      setTotal(t)
      setTrends(tr)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const last30 = trends?.last30 || []
  const maxCost = Math.max(...last30.map(d => d.cost_gbp), 0.001)

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
            Cost History
          </div>
          <div className="text-[10px]" style={{ color: 'var(--c-dim)' }}>
            {total ? `${total.activeDays} active days tracked` : 'Loading…'}
            {trends && <> · trend: <TrendBadge trend={trends.trend} /></>}
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-[10px] px-2 py-1 rounded"
          style={{
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            color: 'var(--c-dim)',
            opacity: loading ? 0.5 : 1,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? '↻' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div className="text-xs mb-3" style={{ color: '#ef4444' }}>
          Error: {error}
        </div>
      )}

      {/* Stats grid */}
      {total && trends && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3 sm:grid-cols-4">
            <StatPill
              label="All Time"
              value={formatCost(total.allTime.cost_gbp)}
              sub={`${total.allTime.calls} calls total`}
              color="var(--c-gold)"
            />
            <StatPill
              label="Daily Avg"
              value={formatCost(total.dailyAvg)}
              sub={`over ${total.activeDays} days`}
            />
            <StatPill
              label="This Week"
              value={formatCost(trends.thisWeek.cost)}
              sub={`vs £${trends.lastWeek.cost.toFixed(4)} last week`}
              change={trends.weekChange}
            />
            <StatPill
              label="This Month"
              value={formatCost(trends.thisMonth.cost)}
              sub={`vs £${trends.lastMonth.cost.toFixed(4)} last month`}
              change={trends.monthChange}
            />
          </div>

          {/* Provider split */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
            >
              <div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-dim)' }}>
                  Kimi / Moonshot
                </div>
                <div className="text-sm font-bold" style={{ color: 'var(--c-green)' }}>
                  {formatCost(total.kimi.cost_gbp)}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--c-muted)' }}>
                  {total.kimi.calls} calls all time
                </div>
              </div>
              <div className="text-2xl opacity-30">🧠</div>
            </div>
            <div
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
            >
              <div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-dim)' }}>
                  Claude / Anthropic
                </div>
                <div className="text-sm font-bold" style={{ color: 'var(--c-purple)' }}>
                  {formatCost(total.claude.cost_gbp)}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--c-muted)' }}>
                  {total.claude.calls} calls all time
                </div>
              </div>
              <div className="text-2xl opacity-30">💪</div>
            </div>
          </div>

          {/* Bar chart */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-dim)' }}>
                Last 30 days
              </div>
              <div className="flex items-center gap-3 text-[9px]" style={{ color: 'var(--c-dim)' }}>
                <span>
                  <span
                    className="inline-block w-2 h-2 rounded-sm mr-1"
                    style={{ background: 'var(--c-gold)' }}
                  />
                  Today
                </span>
                <span>
                  <span
                    className="inline-block w-2 h-2 rounded-sm mr-1"
                    style={{ background: 'var(--c-purple)' }}
                  />
                  Claude
                </span>
                <span>
                  <span
                    className="inline-block w-2 h-2 rounded-sm mr-1"
                    style={{ background: 'var(--c-green)' }}
                  />
                  Kimi
                </span>
              </div>
            </div>
            <BarChart days={last30} maxCost={maxCost} />
            <div className="flex justify-between mt-1 text-[9px]" style={{ color: 'var(--c-muted)' }}>
              <span>{last30[0]?.date?.slice(5) || ''}</span>
              <span>{last30[last30.length - 1]?.date?.slice(5) || ''}</span>
            </div>
          </div>
        </>
      )}

      {loading && !total && (
        <div className="text-xs text-center py-6" style={{ color: 'var(--c-dim)' }}>
          Loading cost history…
        </div>
      )}
    </div>
  )
}
