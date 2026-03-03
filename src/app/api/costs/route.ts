import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

// ─── Paths ────────────────────────────────────────────────────────────────────
const DAILY_FILE = path.join(process.cwd(), '..', 'memory', 'costs', 'daily.json')
const ACTIVITY_FILE = path.join(process.cwd(), '..', 'mission-control-v2', 'activity.json')

// ─── Pricing (USD per million tokens) → converted to GBP ─────────────────────
const USD_TO_GBP = 0.79

const PRICING: Record<string, { input: number; output: number; provider: 'kimi' | 'claude' }> = {
  // Claude models
  'claude-opus-4-6':        { input: 15,   output: 75,  provider: 'claude' },
  'claude-opus-4':          { input: 15,   output: 75,  provider: 'claude' },
  'claude-sonnet-4-6':      { input: 3,    output: 15,  provider: 'claude' },
  'claude-sonnet-4':        { input: 3,    output: 15,  provider: 'claude' },
  'claude-3-5-sonnet':      { input: 3,    output: 15,  provider: 'claude' },
  'claude-3-5-haiku':       { input: 0.8,  output: 4,   provider: 'claude' },
  'claude-haiku-4-5':       { input: 0.8,  output: 4,   provider: 'claude' },
  'claude-haiku-4':         { input: 0.8,  output: 4,   provider: 'claude' },
  // Kimi / Moonshot models
  'moonshot-v1-8k':         { input: 0.27, output: 0.27, provider: 'kimi' },
  'moonshot-v1-32k':        { input: 0.54, output: 0.54, provider: 'kimi' },
  'moonshot-v1-128k':       { input: 1.08, output: 1.08, provider: 'kimi' },
  'kimi-latest':            { input: 0.54, output: 0.54, provider: 'kimi' },
  'kimi-moonshot':          { input: 0.54, output: 0.54, provider: 'kimi' },
}

function lookupPricing(model: string): { input: number; output: number; provider: 'kimi' | 'claude' } {
  const key = Object.keys(PRICING).find(k => model.toLowerCase().includes(k.toLowerCase()))
  if (key) return PRICING[key]
  // fallback by name hint
  if (model.toLowerCase().includes('kimi') || model.toLowerCase().includes('moonshot')) {
    return { input: 0.54, output: 0.54, provider: 'kimi' }
  }
  return { input: 3, output: 15, provider: 'claude' }
}

function calcCostGBP(inputTokens: number, outputTokens: number, model: string): { cost_gbp: number; provider: 'kimi' | 'claude' } {
  const pricing = lookupPricing(model)
  const cost_usd = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
  return { cost_gbp: cost_usd * USD_TO_GBP, provider: pricing.provider }
}

// ─── daily.json helpers ───────────────────────────────────────────────────────
interface DailyEntry {
  id: string
  timestamp: string
  agent: string
  model: string
  task: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost_gbp: number
  provider: 'kimi' | 'claude'
}

interface DailyFile {
  date: string
  entries: DailyEntry[]
  totals: {
    kimi:   { calls: number; inputTokens: number; outputTokens: number; totalTokens: number; cost_gbp: number }
    claude: { calls: number; inputTokens: number; outputTokens: number; totalTokens: number; cost_gbp: number }
    total:  { calls: number; inputTokens: number; outputTokens: number; totalTokens: number; cost_gbp: number }
  }
}

const EMPTY_PROVIDER = () => ({ calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost_gbp: 0 })

function readDaily(): DailyFile {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const raw = JSON.parse(fs.readFileSync(DAILY_FILE, 'utf8')) as DailyFile
    if (raw.date === today) return raw
  } catch {}
  // New day or missing file — start fresh
  return { date: today, entries: [], totals: { kimi: EMPTY_PROVIDER(), claude: EMPTY_PROVIDER(), total: EMPTY_PROVIDER() } }
}

function writeDaily(data: DailyFile) {
  fs.mkdirSync(path.dirname(DAILY_FILE), { recursive: true })
  fs.writeFileSync(DAILY_FILE, JSON.stringify(data, null, 2))
}

function rebuildTotals(data: DailyFile): DailyFile {
  const kimi   = EMPTY_PROVIDER()
  const claude = EMPTY_PROVIDER()
  for (const e of data.entries) {
    const t = e.provider === 'kimi' ? kimi : claude
    t.calls++
    t.inputTokens  += e.inputTokens  || 0
    t.outputTokens += e.outputTokens || 0
    t.totalTokens  += e.totalTokens  || 0
    t.cost_gbp     += e.cost_gbp     || 0
  }
  return {
    ...data,
    totals: {
      kimi,
      claude,
      total: {
        calls:        kimi.calls        + claude.calls,
        inputTokens:  kimi.inputTokens  + claude.inputTokens,
        outputTokens: kimi.outputTokens + claude.outputTokens,
        totalTokens:  kimi.totalTokens  + claude.totalTokens,
        cost_gbp:     kimi.cost_gbp     + claude.cost_gbp,
      },
    },
  }
}

// ─── Activity.json fallback (legacy — provides call counts, no real costs) ────
function readActivityFallback() {
  if (!fs.existsSync(ACTIVITY_FILE)) return null
  try {
    const all = JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf8')) as any[]
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    return all.filter(e => new Date(e.timestamp) >= todayStart)
  } catch { return null }
}

// ─── GET /api/costs ───────────────────────────────────────────────────────────
export async function GET() {
  const daily = readDaily()

  // If no entries today, supplement with activity.json call counts (costs stay 0)
  const totalCalls = daily.totals.total.calls
  let legacyCalls = 0
  if (totalCalls === 0) {
    const fallback = readActivityFallback()
    legacyCalls = fallback?.length || 0
  }

  const brainCalls  = daily.totals.kimi.calls
  const musclesCalls = daily.totals.claude.calls

  return NextResponse.json({
    brain: {
      calls:  brainCalls,
      tokens: daily.totals.kimi.totalTokens,
      cost:   daily.totals.kimi.cost_gbp,
      inputTokens:  daily.totals.kimi.inputTokens,
      outputTokens: daily.totals.kimi.outputTokens,
    },
    muscles: {
      calls:  musclesCalls,
      tokens: daily.totals.claude.totalTokens,
      cost:   daily.totals.claude.cost_gbp,
      inputTokens:  daily.totals.claude.inputTokens,
      outputTokens: daily.totals.claude.outputTokens,
    },
    total: {
      calls:  daily.totals.total.calls || legacyCalls,
      tokens: daily.totals.total.totalTokens,
      cost:   daily.totals.total.cost_gbp,
      inputTokens:  daily.totals.total.inputTokens,
      outputTokens: daily.totals.total.outputTokens,
    },
    entries: daily.entries.slice(-20), // last 20 for display
    date: daily.date,
    hasRealData: daily.entries.length > 0,
  })
}

// ─── POST /api/costs — log a cost entry ──────────────────────────────────────
// Body: { model, agent, task?, inputTokens, outputTokens }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { model, agent, task, inputTokens, outputTokens } = body as {
      model: string
      agent?: string
      task?: string
      inputTokens: number
      outputTokens: number
    }

    if (!model || inputTokens === undefined || outputTokens === undefined) {
      return NextResponse.json({ error: 'model, inputTokens, outputTokens are required' }, { status: 400 })
    }

    const { cost_gbp, provider } = calcCostGBP(Number(inputTokens), Number(outputTokens), model)
    const totalTokens = Number(inputTokens) + Number(outputTokens)

    const entry: DailyEntry = {
      id: `cost-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent: agent || (provider === 'kimi' ? 'Margarita' : 'Martini'),
      model,
      task: task || 'API call',
      inputTokens:  Number(inputTokens),
      outputTokens: Number(outputTokens),
      totalTokens,
      cost_gbp,
      provider,
    }

    const daily = readDaily()
    daily.entries.push(entry)
    const updated = rebuildTotals(daily)
    writeDaily(updated)

    return NextResponse.json({
      ok: true,
      entry,
      totals: updated.totals,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
