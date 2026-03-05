import { NextResponse } from 'next/server'
import { loadHistoryDays } from '@/lib/costs-store'

// GET /api/costs/history?days=30
export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('days') || '30', 10)

  const { days: allDays } = await loadHistoryDays()

  const days = allDays.slice(-limit).map((d) => ({
    date: d.date,
    cost_gbp: d.total?.cost_gbp || 0,
    calls: d.total?.calls || 0,
    kimi: d.kimi?.cost_gbp || 0,
    claude: d.claude?.cost_gbp || 0,
    openai: d.openai?.cost_gbp || 0,
  }))

  return NextResponse.json({
    days,
    total: allDays.length,
    oldest: allDays[0]?.date || null,
    newest: allDays[allDays.length - 1]?.date || null,
  })
}
