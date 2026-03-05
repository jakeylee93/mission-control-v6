import { NextResponse } from 'next/server'
import { loadHistoryDays } from '@/lib/costs-store'

function sumCost(days: Array<{ total?: { cost_gbp?: number } }>): number {
  return days.reduce((s, d) => s + (d.total?.cost_gbp || 0), 0)
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() - day)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// GET /api/costs/trends
export async function GET() {
  const { days } = await loadHistoryDays()
  const now = new Date()

  const thisWeekStart = getWeekStart(now)
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7)

  const thisWeekStr = thisWeekStart.toISOString().slice(0, 10)
  const lastWeekStr = lastWeekStart.toISOString().slice(0, 10)

  const thisWeekDays = days.filter((d) => d.date >= thisWeekStr)
  const lastWeekDays = days.filter((d) => d.date >= lastWeekStr && d.date < thisWeekStr)

  const thisWeekCost = sumCost(thisWeekDays)
  const lastWeekCost = sumCost(lastWeekDays)
  const weekChange = lastWeekCost > 0 ? ((thisWeekCost - lastWeekCost) / lastWeekCost) * 100 : null

  const thisMonthStr = now.toISOString().slice(0, 7)
  const lastMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const lastMonthStr = lastMonthDate.toISOString().slice(0, 7)

  const thisMonthDays = days.filter((d) => d.date.startsWith(thisMonthStr))
  const lastMonthDays = days.filter((d) => d.date.startsWith(lastMonthStr))

  const thisMonthCost = sumCost(thisMonthDays)
  const lastMonthCost = sumCost(lastMonthDays)
  const monthChange = lastMonthCost > 0 ? ((thisMonthCost - lastMonthCost) / lastMonthCost) * 100 : null

  const last7 = days.slice(-7)
  let trend: 'up' | 'down' | 'flat' = 'flat'
  if (last7.length >= 2) {
    const first = last7[0].total?.cost_gbp || 0
    const last = last7[last7.length - 1].total?.cost_gbp || 0
    if (last > first * 1.1) trend = 'up'
    else if (last < first * 0.9) trend = 'down'
  }

  const last30 = days.slice(-30).map((d) => ({
    date: d.date,
    cost_gbp: d.total?.cost_gbp || 0,
    calls: d.total?.calls || 0,
    kimi: d.kimi?.cost_gbp || 0,
    claude: d.claude?.cost_gbp || 0,
    openai: d.openai?.cost_gbp || 0,
  }))

  return NextResponse.json({
    thisWeek: { cost: thisWeekCost, days: thisWeekDays.length },
    lastWeek: { cost: lastWeekCost, days: lastWeekDays.length },
    weekChange,
    thisMonth: { cost: thisMonthCost, days: thisMonthDays.length },
    lastMonth: { cost: lastMonthCost, days: lastMonthDays.length },
    monthChange,
    trend,
    last30,
  })
}
