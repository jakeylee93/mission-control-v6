import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { loadDailyCosts, loadHistoryDays } from '@/lib/costs-store'

const CONFIG_FILE = path.join(process.cwd(), '..', 'memory', 'usage', 'config.json')
const ANTHROPIC_BASE = 'https://api.anthropic.com/v1'
const ANTHROPIC_VERSION = '2023-06-01'
const GBP_RATE = 0.79

type JsonObject = Record<string, unknown>

function readConfigKey(): string {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) as { anthropic?: { key?: string } }
    return cfg.anthropic?.key?.trim() || ''
  } catch {
    return ''
  }
}

function getKey(): string {
  return process.env.ANTHROPIC_ADMIN_API_KEY?.trim()
    || process.env.ANTHROPIC_API_KEY?.trim()
    || readConfigKey()
}

function maskKey(key: string): string {
  if (!key || key.length < 12) return '***'
  return `${key.slice(0, 10)}...${key.slice(-4)}`
}

function isAdminKey(key: string): boolean {
  return key.startsWith('sk-ant-admin')
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number.parseFloat(value)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function getByPath(obj: JsonObject, pathParts: string[]): unknown {
  let curr: unknown = obj
  for (const part of pathParts) {
    if (!curr || typeof curr !== 'object') return undefined
    curr = (curr as JsonObject)[part]
  }
  return curr
}

async function anthropicFetch(pathname: string): Promise<JsonObject> {
  const key = getKey()
  const res = await fetch(`${ANTHROPIC_BASE}${pathname}`, {
    headers: {
      'x-api-key': key,
      'anthropic-version': ANTHROPIC_VERSION,
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

function extractUsageTotals(payload: JsonObject): { input: number; output: number } {
  const rows = ((payload.data as unknown[]) || (payload.usage as unknown[]) || []) as JsonObject[]
  let input = 0
  let output = 0

  for (const row of rows) {
    input += asNumber(row.input_tokens)
    output += asNumber(row.output_tokens)
  }

  if (input === 0 && output === 0) {
    input = asNumber(getByPath(payload, ['totals', 'input_tokens']))
    output = asNumber(getByPath(payload, ['totals', 'output_tokens']))
  }

  return { input, output }
}

export async function GET() {
  const key = getKey()
  if (!key) {
    return NextResponse.json({ error: 'Anthropic key not configured' }, { status: 400 })
  }

  const [{ daily }, { days }] = await Promise.all([loadDailyCosts(), loadHistoryDays()])
  const localToday = daily.totals.claude
  const allTime = days.reduce((acc, d) => {
    acc.calls += d.claude?.calls || 0
    acc.cost_gbp += d.claude?.cost_gbp || 0
    return acc
  }, { calls: 0, cost_gbp: 0 })

  const weekRows = days.slice(-7)
  const weeklyAvg = weekRows.length
    ? weekRows.reduce((sum, d) => sum + (d.claude?.cost_gbp || 0), 0) / weekRows.length
    : 0

  const keyType: 'inference' | 'admin' = isAdminKey(key) ? 'admin' : 'inference'
  if (keyType === 'inference') {
    return NextResponse.json({
      provider: 'anthropic',
      keyMasked: maskKey(key),
      keyType,
      note: 'Inference keys cannot read org usage. Showing self-logged totals.',
      apiTodayCost_gbp: null,
      apiInputTokens: null,
      apiOutputTokens: null,
      todayLocal_gbp: localToday.cost_gbp,
      todayLocal_calls: localToday.calls,
      todayLocal_tokens: localToday.totalTokens,
      allTimeLocal_gbp: allTime.cost_gbp,
      allTimeCalls: allTime.calls,
      weeklyAvg_gbp: weeklyAvg,
      source: 'local',
      updatedAt: new Date().toISOString(),
    })
  }

  const today = new Date().toISOString().slice(0, 10)
  const errors: string[] = []
  let usage: JsonObject | null = null

  const candidatePaths = [
    `/organizations/usage?start_date=${today}&end_date=${today}`,
    `/usage?start_date=${today}&end_date=${today}`,
  ]

  for (const p of candidatePaths) {
    try {
      usage = await anthropicFetch(p)
      break
    } catch (error) {
      const message = error instanceof Error ? error.message : 'request failed'
      errors.push(message)
    }
  }

  let apiInputTokens: number | null = null
  let apiOutputTokens: number | null = null
  let apiTodayCost_gbp: number | null = null

  if (usage) {
    const totals = extractUsageTotals(usage)
    apiInputTokens = totals.input
    apiOutputTokens = totals.output
    const usd = (totals.input * 3 + totals.output * 15) / 1_000_000
    apiTodayCost_gbp = usd * GBP_RATE
  }

  return NextResponse.json({
    provider: 'anthropic',
    keyMasked: maskKey(key),
    keyType,
    note: usage ? 'Usage API available.' : 'Usage API unavailable. Showing self-logged totals.',
    apiTodayCost_gbp,
    apiInputTokens,
    apiOutputTokens,
    todayLocal_gbp: localToday.cost_gbp,
    todayLocal_calls: localToday.calls,
    todayLocal_tokens: localToday.totalTokens,
    allTimeLocal_gbp: allTime.cost_gbp,
    allTimeCalls: allTime.calls,
    weeklyAvg_gbp: weeklyAvg,
    source: usage ? 'api' : 'local',
    apiErrors: errors.length ? errors : undefined,
    updatedAt: new Date().toISOString(),
  })
}
