import { NextResponse } from 'next/server'
import { readHistory, saveHistory, archiveToday } from '@/lib/costs-history'

// GET /api/costs/history?days=30
export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('days') || '30', 10)

  let history = readHistory()
  history = archiveToday(history)
  saveHistory(history)

  const days = history.days.slice(-limit)

  return NextResponse.json({
    days,
    total: history.days.length,
    oldest: history.days[0]?.date || null,
    newest: history.days[history.days.length - 1]?.date || null,
  })
}
