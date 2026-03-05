import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { loadDailyCosts, loadHistoryDays } from '@/lib/costs-store'

const CONFIG_FILE = path.join(process.cwd(), '..', 'memory', 'usage', 'config.json')
const MOONSHOT_BASE = process.env.MOONSHOT_BASE_URL?.trim() || 'https://api.moonshot.cn/v1'
const CNY_TO_GBP = 0.11

type JsonObject = Record<string, unknown>

function readConfigKey(): string {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) as { moonshot?: { key?: string } }
    return cfg.moonshot?.key?.trim() || ''
  } catch {
    return ''
  }
}

function getKey(): string {
  return process.env.MOONSHOT_API_KEY?.trim() || readConfigKey()
}

function maskKey(key: string): string {
  if (!key || key.length < 12) return '***'
  return `${key.slice(0, 8)}...${key.slice(-4)}`
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number.parseFloat(value)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

async function moonshotFetch(pathname: string, key: string): Promise<JsonObject> {
  const res = await fetch(`${MOONSHOT_BASE}${pathname}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${pathname}: ${body.slice(0, 180)}`)
  }

  return res.json() as Promise<JsonObject>
}

function extractBalance(payload: JsonObject): {
  balanceCny: number | null
  consumedCny: number | null
} {
  const data = (payload.data as JsonObject) || payload
  const cash = (data.cash as JsonObject) || data

  const balance = asNumber(cash.balance ?? cash.total_balance ?? data.balance)
  const consumed = asNumber(cash.total_consumed ?? data.total_consumed ?? data.consumed)

  return {
    balanceCny: balance > 0 ? balance : null,
    consumedCny: consumed > 0 ? consumed : null,
  }
}

export async function GET() {
  const key = getKey()
  if (!key) {
    return NextResponse.json({ error: 'Moonshot key not configured' }, { status: 400 })
  }

  const [{ daily }, { days }] = await Promise.all([loadDailyCosts(), loadHistoryDays()])
  const localToday = daily.totals.kimi
  const allTime = days.reduce((acc, d) => {
    acc.calls += d.kimi?.calls || 0
    acc.cost_gbp += d.kimi?.cost_gbp || 0
    return acc
  }, { calls: 0, cost_gbp: 0 })

  const weekRows = days.slice(-7)
  const weeklyAvg = weekRows.length
    ? weekRows.reduce((sum, d) => sum + (d.kimi?.cost_gbp || 0), 0) / weekRows.length
    : 0

  const errors: string[] = []
  let balancePayload: JsonObject | null = null

  const candidatePaths = ['/users/me/balance', '/account/balance']
  for (const p of candidatePaths) {
    try {
      balancePayload = await moonshotFetch(p, key)
      break
    } catch (error) {
      const message = error instanceof Error ? error.message : 'request failed'
      errors.push(message)
    }
  }

  const extracted = balancePayload ? extractBalance(balancePayload) : { balanceCny: null, consumedCny: null }

  return NextResponse.json({
    provider: 'moonshot',
    keyMasked: maskKey(key),
    balance_cny: extracted.balanceCny,
    balance_gbp: extracted.balanceCny != null ? extracted.balanceCny * CNY_TO_GBP : null,
    consumed_cny: extracted.consumedCny,
    consumed_gbp: extracted.consumedCny != null ? extracted.consumedCny * CNY_TO_GBP : null,
    todayLocal_gbp: localToday.cost_gbp,
    todayLocal_calls: localToday.calls,
    todayLocal_tokens: localToday.totalTokens,
    allTimeLocal_gbp: allTime.cost_gbp,
    allTimeCalls: allTime.calls,
    weeklyAvg_gbp: weeklyAvg,
    source: balancePayload ? 'api' : 'local',
    apiError: errors[0],
    updatedAt: new Date().toISOString(),
  })
}
