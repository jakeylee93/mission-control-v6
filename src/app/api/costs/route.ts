import { NextResponse } from 'next/server'

interface CostData {
  brain: number
  muscles: number
  total: number
  daily: { date: string; amount: number }[]
  byAgent: { name: string; amount: number; color: string }[]
  projection: { month: string; projected: number; actual?: number }[]
}

// Mock cost data with trends
const MOCK_COSTS: CostData = {
  brain: 2.45,
  muscles: 1.75,
  total: 4.20,
  daily: [
    { date: '2026-04-25', amount: 3.80 },
    { date: '2026-04-26', amount: 5.20 },
    { date: '2026-04-27', amount: 4.10 },
    { date: '2026-04-28', amount: 6.50 },
    { date: '2026-04-29', amount: 3.90 },
    { date: '2026-04-30', amount: 5.80 },
    { date: '2026-05-01', amount: 4.20 },
  ],
  byAgent: [
    { name: 'Margarita', amount: 847.20, color: '#FFD700' },
    { name: 'Doc', amount: 124.50, color: '#60A5FA' },
    { name: 'Cindy', amount: 31.80, color: '#C084FC' },
  ],
  projection: [
    { month: 'Jan', projected: 800, actual: 750 },
    { month: 'Feb', projected: 850, actual: 920 },
    { month: 'Mar', projected: 900, actual: 880 },
    { month: 'Apr', projected: 950, actual: 1003 },
    { month: 'May', projected: 1000 },
    { month: 'Jun', projected: 1100 },
  ],
}

export async function GET() {
  return NextResponse.json(MOCK_COSTS)
}
