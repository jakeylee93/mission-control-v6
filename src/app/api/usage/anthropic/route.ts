import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

// ─── Paths ────────────────────────────────────────────────────────────────────
const CONFIG_FILE  = path.join(process.cwd(), '..', 'memory', 'usage', 'config.json')
const DAILY_FILE   = path.join(process.cwd(), '..', 'memory', 'costs', 'daily.json')
const HISTORY_FILE = path.join(process.cwd(), '..', 'memory', 'costs', 'history.json')

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getKey(): string {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
    return cfg.anthropic?.key || ''
  } catch { return '' }
}

function maskKey(key: string): string {
  if (!key || key.length < 20) return '***'
  return key.slice(0, 14) + '...' + key.slice(-4)
}

// Standard inference keys (sk-ant-api03-...) cannot access billing/usage APIs.
// Admin API keys (sk-ant-admin...) are required for usage/billing endpoints.
function isStandardInferenceKey(key: string): boolean {
  return key.startsWith('sk-ant-api03-') || key.startsWith('sk-ant-api')
}

function getLocalTodayClaude(): { cost_gbp: number; calls: number; tokens: number } {
  try {
    const daily = JSON.parse(fs.readFileSync(DAILY_FILE, 'utf8'))
    const today = new Date().toISOString().slice(0, 10)
    if (daily.date !== today) return { cost_gbp: 0, calls: 0, tokens: 0 }
    return {
      cost_gbp: daily.totals?.claude?.cost_gbp || 0,
      calls:    daily.totals?.claude?.calls    || 0,
      tokens:   daily.totals?.claude?.totalTokens || 0,
    }
  } catch { return { cost_gbp: 0, calls: 0, tokens: 0 } }
}

function getWeeklyAvgClaude(): number {
  try {
    const histFile = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
    const days = (histFile.days || []) as Array<{ claude?: { cost_gbp?: number } }>
    const last7 = days.slice(-7)
    if (!last7.length) return 0
    const sum = last7.reduce((acc, d) => acc + (d.claude?.cost_gbp || 0), 0)
    return sum / last7.length
  } catch { return 0 }
}

function getAllTimeClaude(): { cost_gbp: number; calls: number } {
  try {
    const histFile = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
    const days = (histFile.days || []) as Array<{ claude?: { cost_gbp?: number; calls?: number } }>
    return {
      cost_gbp: days.reduce((s, d) => s + (d.claude?.cost_gbp || 0), 0),
      calls:    days.reduce((s, d) => s + (d.claude?.calls    || 0), 0),
    }
  } catch { return { cost_gbp: 0, calls: 0 } }
}

// ─── GET /api/usage/anthropic ─────────────────────────────────────────────────
export async function GET() {
  const key = getKey()
  if (!key) {
    return NextResponse.json({ error: 'Anthropic key not configured' }, { status: 400 })
  }

  const local    = getLocalTodayClaude()
  const weekAvg  = getWeeklyAvgClaude()
  const allTime  = getAllTimeClaude()

  // Standard inference keys cannot access billing/usage APIs — skip API calls entirely.
  // To get real usage data, an Admin API key (sk-ant-admin...) is required.
  if (isStandardInferenceKey(key)) {
    return NextResponse.json({
      provider:           'anthropic',
      keyMasked:          maskKey(key),
      keyType:            'inference',
      note:               'Standard API key — billing data not accessible. Use an Admin API key for real usage. Local tracking shown.',
      balance_gbp:        null,
      apiTodayCost_gbp:   null,
      apiInputTokens:     null,
      apiOutputTokens:    null,
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

  // Admin key path — try usage + org endpoints
  const ANTHROPIC_BASE    = 'https://api.anthropic.com/v1'
  const ANTHROPIC_VERSION = '2023-06-01'
  const GBP_RATE          = 0.79

  async function anthropicFetch(p: string) {
    const res = await fetch(`${ANTHROPIC_BASE}${p}`, {
      headers: {
        'x-api-key':         key,
        'anthropic-version': ANTHROPIC_VERSION,
        'Content-Type':      'application/json',
      },
      signal: AbortSignal.timeout(10000),
      // @ts-ignore
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
    }
    return res.json()
  }

  let usageData: any = null
  let orgData: any   = null
  const errors: string[] = []
  const today = new Date().toISOString().slice(0, 10)

  try {
    usageData = await anthropicFetch(
      `/usage?start_date=${today}&end_date=${today}&include_breakdown=false`
    )
  } catch (e: any) {
    errors.push(`usage: ${e.message}`)
  }

  if (!usageData) {
    try {
      orgData = await anthropicFetch('/organizations')
    } catch (e: any) {
      errors.push(`org: ${e.message}`)
    }
  }

  let apiCost_usd    = 0
  let apiInputTokens  = 0
  let apiOutputTokens = 0

  if (usageData) {
    const entries = usageData?.data || usageData?.usage || []
    for (const entry of entries) {
      apiInputTokens  += entry.input_tokens  || 0
      apiOutputTokens += entry.output_tokens || 0
    }
    apiCost_usd = (apiInputTokens * 3 + apiOutputTokens * 15) / 1_000_000
  }

  const apiCost_gbp = apiCost_usd * GBP_RATE

  let balance_usd: number | null = null
  let balance_gbp: number | null = null
  if (orgData) {
    const balance = orgData?.billing?.credits_remaining || orgData?.credit_balance || orgData?.balance
    if (typeof balance === 'number') {
      balance_usd = balance
      balance_gbp = balance * GBP_RATE
    }
  }

  return NextResponse.json({
    provider:           'anthropic',
    keyMasked:          maskKey(key),
    keyType:            'admin',
    balance_gbp:        balance_gbp,
    apiTodayCost_gbp:   apiCost_gbp > 0 ? apiCost_gbp : null,
    apiInputTokens:     apiInputTokens || null,
    apiOutputTokens:    apiOutputTokens || null,
    todayLocal_gbp:     local.cost_gbp,
    todayLocal_calls:   local.calls,
    todayLocal_tokens:  local.tokens,
    allTimeLocal_gbp:   allTime.cost_gbp,
    allTimeCalls:       allTime.calls,
    weeklyAvg_gbp:      weekAvg,
    source:             usageData ? 'api' : 'local',
    apiErrors:          errors.length ? errors : undefined,
    updatedAt:          new Date().toISOString(),
  })
}
