import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// GET ?q=query: live search via ClawHub API
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  if (!q.trim()) {
    return NextResponse.json({ ok: true, results: [] })
  }

  try {
    const res = await fetch(
      `https://clawhub.ai/api/v1/search?q=${encodeURIComponent(q)}&limit=20`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return NextResponse.json({ ok: true, results: [], error: 'ClawHub API unavailable' })
    }

    const data = await res.json()
    const results = Array.isArray(data.results) ? data.results : []

    return NextResponse.json({ ok: true, results })
  } catch {
    return NextResponse.json({ ok: true, results: [], error: 'ClawHub API unavailable' })
  }
}
