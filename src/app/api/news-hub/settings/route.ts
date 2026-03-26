import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BUSINESSES = [
  { id: 'barpeople', name: 'The Bar People', color: '#ef4444' },
  { id: 'bookedevents', name: 'Booked Events', color: '#6366f1' },
  { id: 'futureclimbing', name: 'Future Climbing', color: '#22c55e' },
  { id: 'anyos', name: 'anyOS', color: '#f59e0b' },
]

export async function GET() {
  return NextResponse.json({ ok: true, businesses: BUSINESSES })
}
