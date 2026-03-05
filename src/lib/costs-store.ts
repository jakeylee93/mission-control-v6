import fs from 'fs'
import path from 'path'
import { archiveToday, readHistory, saveHistory, type HistoryDay } from '@/lib/costs-history'

export type Provider = 'kimi' | 'claude' | 'openai'

export interface CostEntry {
  id: string
  timestamp: string
  agent: string
  model: string
  task: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost_gbp: number
  provider: Provider
}

export interface ProviderTotals {
  calls: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost_gbp: number
}

export interface DailyCosts {
  date: string
  entries: CostEntry[]
  totals: {
    kimi: ProviderTotals
    claude: ProviderTotals
    openai: ProviderTotals
    total: ProviderTotals
  }
}

export interface ModelBreakdown {
  model: string
  provider: Provider
  calls: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost_gbp: number
}

export interface DayTrend {
  date: string
  cost_gbp: number
  calls: number
  kimi: number
  claude: number
  openai: number
}

const DAILY_FILE = path.join(process.cwd(), '..', 'memory', 'costs', 'daily.json')
const ACTIVITY_FILE = path.join(process.cwd(), '..', 'mission-control-v2', 'activity.json')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nrdlpdsoeksdybrshvst.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZGxwZHNvZWtzZHlicnNodnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NzQwNDEsImV4cCI6MjA4ODE1MDA0MX0.RxYy4tdYZQRxkDVF36XdNiKZPfjNVsbgDTe5fhwilI0'

const USD_TO_GBP = 0.79

const PRICING: Record<string, { input: number; output: number; provider: Provider }> = {
  'claude-opus-4-6': { input: 15, output: 75, provider: 'claude' },
  'claude-opus-4': { input: 15, output: 75, provider: 'claude' },
  'claude-sonnet-4-6': { input: 3, output: 15, provider: 'claude' },
  'claude-sonnet-4': { input: 3, output: 15, provider: 'claude' },
  'claude-3-5-sonnet': { input: 3, output: 15, provider: 'claude' },
  'claude-3-5-haiku': { input: 0.8, output: 4, provider: 'claude' },
  'claude-haiku-4-5': { input: 0.8, output: 4, provider: 'claude' },
  'claude-haiku-4': { input: 0.8, output: 4, provider: 'claude' },
  'moonshot-v1-8k': { input: 0.27, output: 0.27, provider: 'kimi' },
  'moonshot-v1-32k': { input: 0.54, output: 0.54, provider: 'kimi' },
  'moonshot-v1-128k': { input: 1.08, output: 1.08, provider: 'kimi' },
  'kimi-latest': { input: 0.54, output: 0.54, provider: 'kimi' },
  'kimi-moonshot': { input: 0.54, output: 0.54, provider: 'kimi' },
  'gpt-4.1': { input: 2, output: 8, provider: 'openai' },
  'gpt-4o': { input: 2.5, output: 10, provider: 'openai' },
  'gpt-4o-mini': { input: 0.15, output: 0.6, provider: 'openai' },
  'gpt-5': { input: 1.25, output: 10, provider: 'openai' },
  'o3': { input: 10, output: 40, provider: 'openai' },
  'o4-mini': { input: 1.1, output: 4.4, provider: 'openai' },
  'codex': { input: 1.5, output: 6, provider: 'openai' },
}

const EMPTY_PROVIDER = (): ProviderTotals => ({ calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost_gbp: 0 })

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const n = parseFloat(value)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function toTimestamp(value: unknown): string {
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  }
  return new Date().toISOString()
}

function lookupPricing(model: string): { input: number; output: number; provider: Provider } {
  const lower = model.toLowerCase()
  const key = Object.keys(PRICING).find((k) => lower.includes(k))
  if (key) return PRICING[key]
  if (lower.includes('kimi') || lower.includes('moonshot')) return { input: 0.54, output: 0.54, provider: 'kimi' }
  if (lower.includes('gpt') || lower.includes('openai') || lower.includes('o3') || lower.includes('o4') || lower.includes('codex')) {
    return { input: 1.5, output: 6, provider: 'openai' }
  }
  return { input: 3, output: 15, provider: 'claude' }
}

export function inferProvider(model: string, rowProvider?: unknown): Provider {
  if (rowProvider === 'kimi' || rowProvider === 'claude' || rowProvider === 'openai') return rowProvider
  if (rowProvider === 'moonshot') return 'kimi'
  if (rowProvider === 'anthropic') return 'claude'
  return lookupPricing(model).provider
}

export function calcCostGBP(inputTokens: number, outputTokens: number, model: string): number {
  const pricing = lookupPricing(model)
  const costUsd = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
  return costUsd * USD_TO_GBP
}

function getField(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key]
  }
  return undefined
}

function normalizeRow(row: Record<string, unknown>): CostEntry | null {
  const model = String(getField(row, ['model', 'model_name', 'ai_model', 'llm_model']) || 'unknown-model')
  const timestamp = toTimestamp(getField(row, ['timestamp', 'created_at', 'logged_at', 'time', 'date']))

  const inputTokens = toNumber(getField(row, ['input_tokens', 'inputTokens', 'prompt_tokens', 'promptTokens']))
  const outputTokens = toNumber(getField(row, ['output_tokens', 'outputTokens', 'completion_tokens', 'completionTokens']))

  const explicitTotal = toNumber(getField(row, ['total_tokens', 'totalTokens', 'tokens', 'token_count']))
  const totalTokens = explicitTotal > 0 ? explicitTotal : (inputTokens + outputTokens)

  const provider = inferProvider(model, getField(row, ['provider', 'vendor']))

  const gbpDirect = toNumber(getField(row, ['cost_gbp', 'gbp_cost', 'spend_gbp', 'price_gbp']))
  const usdCost = toNumber(getField(row, ['cost_usd', 'spend_usd', 'price_usd']))
  const genericCost = toNumber(getField(row, ['cost', 'price', 'spend']))

  const currency = String(getField(row, ['currency']) || '').toUpperCase()
  let costGbp = gbpDirect
  if (costGbp <= 0 && usdCost > 0) costGbp = usdCost * USD_TO_GBP
  if (costGbp <= 0 && genericCost > 0 && currency === 'USD') costGbp = genericCost * USD_TO_GBP
  if (costGbp <= 0 && genericCost > 0 && currency === 'GBP') costGbp = genericCost
  if (costGbp <= 0 && (inputTokens > 0 || outputTokens > 0)) costGbp = calcCostGBP(inputTokens, outputTokens, model)

  return {
    id: String(getField(row, ['id', 'entry_id']) || `cost-${timestamp}-${model}`),
    timestamp,
    agent: String(
      getField(row, ['agent', 'agent_name', 'worker'])
      || (provider === 'kimi' ? 'Margarita' : provider === 'openai' ? 'Bish' : 'Martini')
    ),
    model,
    task: String(getField(row, ['task', 'action', 'endpoint']) || 'API call'),
    inputTokens,
    outputTokens,
    totalTokens,
    cost_gbp: costGbp,
    provider,
  }
}

function readDailyLocal(): DailyCosts {
  const today = todayUtc()
  try {
    const raw = JSON.parse(fs.readFileSync(DAILY_FILE, 'utf8')) as DailyCosts
    if (raw.date === today) return raw
  } catch {}

  return {
    date: today,
    entries: [],
    totals: {
      kimi: EMPTY_PROVIDER(),
      claude: EMPTY_PROVIDER(),
      openai: EMPTY_PROVIDER(),
      total: EMPTY_PROVIDER(),
    },
  }
}

function readActivityFallbackCalls(): number {
  if (!fs.existsSync(ACTIVITY_FILE)) return 0
  try {
    const all = JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf8')) as Array<{ timestamp?: string }>
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    return all.filter((e) => {
      if (!e.timestamp) return false
      const ts = new Date(e.timestamp).getTime()
      return Number.isFinite(ts) && ts >= todayStart.getTime()
    }).length
  } catch {
    return 0
  }
}

async function fetchSupabaseRows(): Promise<Record<string, unknown>[] | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null

  try {
    const url = `${SUPABASE_URL}/rest/v1/costs?select=*&limit=5000`
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data)) return null
    return data as Record<string, unknown>[]
  } catch {
    return null
  }
}

function aggregateEntries(entries: CostEntry[]): DailyCosts {
  const kimi = EMPTY_PROVIDER()
  const claude = EMPTY_PROVIDER()
  const openai = EMPTY_PROVIDER()

  for (const entry of entries) {
    const target = entry.provider === 'kimi'
      ? kimi
      : entry.provider === 'openai'
        ? openai
        : claude
    target.calls += 1
    target.inputTokens += entry.inputTokens
    target.outputTokens += entry.outputTokens
    target.totalTokens += entry.totalTokens
    target.cost_gbp += entry.cost_gbp
  }

  return {
    date: todayUtc(),
    entries,
    totals: {
      kimi,
      claude,
      openai,
      total: {
        calls: kimi.calls + claude.calls + openai.calls,
        inputTokens: kimi.inputTokens + claude.inputTokens + openai.inputTokens,
        outputTokens: kimi.outputTokens + claude.outputTokens + openai.outputTokens,
        totalTokens: kimi.totalTokens + claude.totalTokens + openai.totalTokens,
        cost_gbp: kimi.cost_gbp + claude.cost_gbp + openai.cost_gbp,
      },
    },
  }
}

function buildModelBreakdown(entries: CostEntry[]): ModelBreakdown[] {
  const map = new Map<string, ModelBreakdown>()

  for (const entry of entries) {
    const key = `${entry.provider}::${entry.model}`
    const current = map.get(key) || {
      model: entry.model,
      provider: entry.provider,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cost_gbp: 0,
    }

    current.calls += 1
    current.inputTokens += entry.inputTokens
    current.outputTokens += entry.outputTokens
    current.totalTokens += entry.totalTokens
    current.cost_gbp += entry.cost_gbp

    map.set(key, current)
  }

  return Array.from(map.values()).sort((a, b) => b.cost_gbp - a.cost_gbp)
}

function dateKey(timestamp: string): string {
  return timestamp.slice(0, 10)
}

function historyFromEntries(entries: CostEntry[]): HistoryDay[] {
  const map = new Map<string, HistoryDay>()

  for (const entry of entries) {
    const day = dateKey(entry.timestamp)
    const current = map.get(day) || {
      date: day,
      kimi: EMPTY_PROVIDER(),
      claude: EMPTY_PROVIDER(),
      openai: EMPTY_PROVIDER(),
      total: EMPTY_PROVIDER(),
    }

    const providerTotals = entry.provider === 'kimi'
      ? current.kimi
      : entry.provider === 'openai'
        ? current.openai
        : current.claude
    providerTotals.calls += 1
    providerTotals.inputTokens += entry.inputTokens
    providerTotals.outputTokens += entry.outputTokens
    providerTotals.totalTokens += entry.totalTokens
    providerTotals.cost_gbp += entry.cost_gbp

    current.total.calls = current.kimi.calls + current.claude.calls + current.openai.calls
    current.total.inputTokens = current.kimi.inputTokens + current.claude.inputTokens + current.openai.inputTokens
    current.total.outputTokens = current.kimi.outputTokens + current.claude.outputTokens + current.openai.outputTokens
    current.total.totalTokens = current.kimi.totalTokens + current.claude.totalTokens + current.openai.totalTokens
    current.total.cost_gbp = current.kimi.cost_gbp + current.claude.cost_gbp + current.openai.cost_gbp

    map.set(day, current)
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export async function loadHistoryDays(): Promise<{ days: HistoryDay[]; source: 'supabase' | 'local' }> {
  const rows = await fetchSupabaseRows()
  if (rows && rows.length > 0) {
    const entries = rows.map(normalizeRow).filter((row): row is CostEntry => Boolean(row))
    return { days: historyFromEntries(entries), source: 'supabase' }
  }

  let history = readHistory()
  history = archiveToday(history)
  saveHistory(history)
  return { days: history.days, source: 'local' }
}

export async function loadDailyCosts(): Promise<{
  daily: DailyCosts
  modelBreakdown: ModelBreakdown[]
  source: 'supabase' | 'local'
  hasRealData: boolean
}> {
  const today = todayUtc()
  const rows = await fetchSupabaseRows()

  if (rows && rows.length > 0) {
    const entries = rows
      .map(normalizeRow)
      .filter((row): row is CostEntry => Boolean(row))
      .filter((row) => dateKey(row.timestamp) === today)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    const daily = aggregateEntries(entries)
    return {
      daily,
      modelBreakdown: buildModelBreakdown(entries),
      source: 'supabase',
      hasRealData: entries.length > 0,
    }
  }

  const daily = readDailyLocal()
  return {
    daily,
    modelBreakdown: buildModelBreakdown(daily.entries),
    source: 'local',
    hasRealData: daily.entries.length > 0,
  }
}

export async function loadDayTrend(days = 7): Promise<DayTrend[]> {
  const history = await loadHistoryDays()
  return history.days.slice(-days).map((d) => ({
    date: d.date,
    cost_gbp: d.total?.cost_gbp || 0,
    calls: d.total?.calls || 0,
    kimi: d.kimi?.cost_gbp || 0,
    claude: d.claude?.cost_gbp || 0,
    openai: d.openai?.cost_gbp || 0,
  }))
}

export function fallbackLegacyCallsIfNeeded(totalCalls: number): number {
  if (totalCalls > 0) return totalCalls
  return readActivityFallbackCalls()
}

export async function writeSupabaseCostEntry(entry: CostEntry): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return

  const variants: Array<Record<string, unknown>> = [
    {
      id: entry.id,
      timestamp: entry.timestamp,
      created_at: entry.timestamp,
      agent: entry.agent,
      model: entry.model,
      task: entry.task,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      total_tokens: entry.totalTokens,
      cost_gbp: entry.cost_gbp,
      provider: entry.provider,
    },
    {
      id: entry.id,
      timestamp: entry.timestamp,
      agent: entry.agent,
      model: entry.model,
      task: entry.task,
      inputTokens: entry.inputTokens,
      outputTokens: entry.outputTokens,
      totalTokens: entry.totalTokens,
      cost_gbp: entry.cost_gbp,
      provider: entry.provider,
    },
  ]

  for (const payload of variants) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/costs`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) return
    } catch {}
  }
}

export function writeDailyLocal(data: DailyCosts) {
  fs.mkdirSync(path.dirname(DAILY_FILE), { recursive: true })
  fs.writeFileSync(DAILY_FILE, JSON.stringify(data, null, 2))
}

export function rebuildDailyTotals(data: DailyCosts): DailyCosts {
  return aggregateEntries(data.entries)
}
