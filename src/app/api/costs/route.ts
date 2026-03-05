import { NextRequest, NextResponse } from 'next/server'
import {
  calcCostGBP,
  fallbackLegacyCallsIfNeeded,
  inferProvider,
  loadDailyCosts,
  loadDayTrend,
  rebuildDailyTotals,
  writeDailyLocal,
  writeSupabaseCostEntry,
  type CostEntry,
} from '@/lib/costs-store'

// GET /api/costs
export async function GET() {
  const { daily, modelBreakdown, source, hasRealData } = await loadDailyCosts()
  const last7Days = await loadDayTrend(7)

  const totalCalls = fallbackLegacyCallsIfNeeded(daily.totals.total.calls)

  return NextResponse.json({
    moonshot: {
      calls: daily.totals.kimi.calls,
      tokens: daily.totals.kimi.totalTokens,
      cost: daily.totals.kimi.cost_gbp,
      inputTokens: daily.totals.kimi.inputTokens,
      outputTokens: daily.totals.kimi.outputTokens,
    },
    anthropic: {
      calls: daily.totals.claude.calls,
      tokens: daily.totals.claude.totalTokens,
      cost: daily.totals.claude.cost_gbp,
      inputTokens: daily.totals.claude.inputTokens,
      outputTokens: daily.totals.claude.outputTokens,
    },
    openai: {
      calls: daily.totals.openai.calls,
      tokens: daily.totals.openai.totalTokens,
      cost: daily.totals.openai.cost_gbp,
      inputTokens: daily.totals.openai.inputTokens,
      outputTokens: daily.totals.openai.outputTokens,
    },
    brain: {
      calls: daily.totals.kimi.calls,
      tokens: daily.totals.kimi.totalTokens,
      cost: daily.totals.kimi.cost_gbp,
      inputTokens: daily.totals.kimi.inputTokens,
      outputTokens: daily.totals.kimi.outputTokens,
    },
    muscles: {
      calls: daily.totals.claude.calls,
      tokens: daily.totals.claude.totalTokens,
      cost: daily.totals.claude.cost_gbp,
      inputTokens: daily.totals.claude.inputTokens,
      outputTokens: daily.totals.claude.outputTokens,
    },
    total: {
      calls: totalCalls,
      tokens: daily.totals.total.totalTokens,
      cost: daily.totals.total.cost_gbp,
      inputTokens: daily.totals.total.inputTokens,
      outputTokens: daily.totals.total.outputTokens,
    },
    entries: daily.entries.slice(-20),
    modelBreakdown,
    last7Days,
    avgCostPerCall: totalCalls > 0 ? daily.totals.total.cost_gbp / totalCalls : 0,
    currentModel: daily.entries[daily.entries.length - 1]?.model || null,
    date: daily.date,
    source,
    hasRealData,
  })
}

// POST /api/costs
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

    const input = Number(inputTokens)
    const output = Number(outputTokens)
    if (!Number.isFinite(input) || !Number.isFinite(output) || input < 0 || output < 0) {
      return NextResponse.json({ error: 'inputTokens and outputTokens must be non-negative numbers' }, { status: 400 })
    }

    const provider = inferProvider(model)
    const entry: CostEntry = {
      id: `cost-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent: agent || (provider === 'kimi' ? 'Margarita' : provider === 'openai' ? 'Bish' : 'Martini'),
      model,
      task: task || 'API call',
      inputTokens: input,
      outputTokens: output,
      totalTokens: input + output,
      cost_gbp: calcCostGBP(input, output, model),
      provider,
    }

    const { daily } = await loadDailyCosts()
    daily.entries.push(entry)
    const updated = rebuildDailyTotals(daily)
    writeDailyLocal(updated)

    await writeSupabaseCostEntry(entry)

    return NextResponse.json({
      ok: true,
      entry,
      totals: updated.totals,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to log cost'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
