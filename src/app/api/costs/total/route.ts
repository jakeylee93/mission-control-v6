import { NextResponse } from 'next/server'
import { readHistory, saveHistory, archiveToday } from '@/lib/costs-history'

// GET /api/costs/total
export async function GET() {
  let history = readHistory()
  history = archiveToday(history)
  saveHistory(history)

  const days = history.days

  const allTime  = { calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost_gbp: 0 }
  const kimiAll  = { calls: 0, cost_gbp: 0 }
  const claudeAll = { calls: 0, cost_gbp: 0 }

  for (const d of days) {
    allTime.calls        += d.total?.calls        || 0
    allTime.inputTokens  += d.total?.inputTokens  || 0
    allTime.outputTokens += d.total?.outputTokens || 0
    allTime.totalTokens  += d.total?.totalTokens  || 0
    allTime.cost_gbp     += d.total?.cost_gbp     || 0
    kimiAll.cost_gbp     += d.kimi?.cost_gbp      || 0
    kimiAll.calls        += d.kimi?.calls         || 0
    claudeAll.cost_gbp   += d.claude?.cost_gbp    || 0
    claudeAll.calls      += d.claude?.calls       || 0
  }

  const daysWithCost = days.filter(d => (d.total?.cost_gbp || 0) > 0)
  const dailyAvg = daysWithCost.length > 0 ? allTime.cost_gbp / daysWithCost.length : 0

  return NextResponse.json({
    allTime,
    kimi:   kimiAll,
    claude: claudeAll,
    dailyAvg,
    activeDays: daysWithCost.length,
    totalDays:  days.length,
    firstDate:  days[0]?.date || null,
    lastDate:   days[days.length - 1]?.date || null,
  })
}
