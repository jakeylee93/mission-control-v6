import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

// ─── Paths ────────────────────────────────────────────────────────────────────
const CONFIG_FILE = path.join(process.cwd(), '..', 'memory', 'usage', 'config.json')
const DAILY_FILE  = path.join(process.cwd(), '..', 'memory', 'costs', 'daily.json')
const HISTORY_FILE = path.join(process.cwd(), '..', 'memory', 'costs', 'history.json')

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getKey(): string {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
    return cfg.moonshot?.key || ''
  } catch { return '' }
}

function maskKey(key: string): string {
  if (!key || key.length < 12) return '***'
  return key.slice(0, 8) + '...' + key.slice(-4)
}

function getLocalTodayKimi(): { cost_gbp: number; calls: number; tokens: number } {
  try {
    const daily = JSON.parse(fs.readFileSync(DAILY_FILE, 'utf8'))
    const today = new Date().toISOString().slice(0, 10)
    if (daily.date !== today) return { cost_gbp: 0, calls: 0, tokens: 0 }
    return {
      cost_gbp: daily.totals?.kimi?.cost_gbp || 0,
      calls:    daily.totals?.kimi?.calls    || 0,
      tokens:   daily.totals?.kimi?.totalTokens || 0,
    }
  } catch { return { cost_gbp: 0, calls: 0, tokens: 0 } }
}

function getWeeklyAvgKimi(): number {
  try {
    const histFile = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
    const days = (histFile.days || []) as Array<{ kimi?: { cost_gbp?: number } }>
    const last7 = days.slice(-7)
    if (!last7.length) return 0
    const sum = last7.reduce((acc, d) => acc + (d.kimi?.cost_gbp || 0), 0)
    return sum / last7.length
  } catch { return 0 }
}

function getAllTimeKimi(): { cost_gbp: number; calls: number } {
  try {
    const histFile = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
    const days = (histFile.days || []) as Array<{ kimi?: { cost_gbp?: number; calls?: number } }>
    return {
      cost_gbp: days.reduce((s, d) => s + (d.kimi?.cost_gbp || 0), 0),
      calls:    days.reduce((s, d) => s + (d.kimi?.calls    || 0), 0),
    }
  } catch { return { cost_gbp: 0, calls: 0 } }
}

// ─── Fetch balance from Moonshot ──────────────────────────────────────────────
async function fetchBalance(key: string) {
  const res = await fetch('https://api.moonshot.cn/v1/users/me/balance', {
    headers: { 'Authorization': `Bearer ${key}` },
    signal: AbortSignal.timeout(10000),
    // @ts-ignore
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => '')}`)
  return res.json()
}

// ─── GET /api/usage/moonshot ──────────────────────────────────────────────────
export async function GET() {
  const key = getKey()
  if (!key) {
    return NextResponse.json({ error: 'Moonshot key not configured' }, { status: 400 })
  }

  const local    = getLocalTodayKimi()
  const weekAvg  = getWeeklyAvgKimi()
  const allTime  = getAllTimeKimi()

  try {
    const data = await fetchBalance(key)
    const cash = data?.data?.cash || {}

    // Moonshot balances are in CNY — convert to GBP (≈ 0.11)
    const CNY_TO_GBP = 0.11
    const balanceCny   = parseFloat(cash.balance || cash.total_balance || '0')
    const consumedCny  = parseFloat(cash.total_consumed || '0')
    const balanceGbp   = balanceCny * CNY_TO_GBP
    const consumedGbp  = consumedCny * CNY_TO_GBP

    return NextResponse.json({
      provider:           'moonshot',
      keyMasked:          maskKey(key),
      balance_cny:        balanceCny,
      balance_gbp:        balanceGbp,
      consumed_cny:       consumedCny,
      consumed_gbp:       consumedGbp,          // real all-time spend from API
      todayLocal_gbp:     local.cost_gbp,
      todayLocal_calls:   local.calls,
      todayLocal_tokens:  local.tokens,
      allTimeLocal_gbp:   allTime.cost_gbp,
      allTimeCalls:       allTime.calls,
      weeklyAvg_gbp:      weekAvg,
      source:             'api',
      updatedAt:          new Date().toISOString(),
    })
  } catch (err: any) {
    // Fallback to local tracked data
    return NextResponse.json({
      provider:           'moonshot',
      keyMasked:          maskKey(key),
      apiError:           err.message,
      todayLocal_gbp:     local.cost_gbp,
      todayLocal_calls:   local.calls,
      todayLocal_tokens:  local.tokens,
      allTimeLocal_gbp:   allTime.cost_gbp,
      allTimeCalls:       allTime.calls,
      weeklyAvg_gbp:      weekAvg,
      source:             'local',
      updatedAt:          new Date().toISOString(),
    })
  }
}
