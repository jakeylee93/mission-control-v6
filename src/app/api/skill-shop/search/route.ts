import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function isLatinText(text: string): boolean {
  if (!text) return true
  const latinChars = text.match(/[a-zA-Z]/g)
  return latinChars !== null && latinChars.length > 0
}

// GET ?q=query: live search via ClawHub API, filter out non-Latin results
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

    // Filter out Chinese-only (non-Latin) skills
    const filtered = results.filter((s: { displayName?: string; slug?: string; summary?: string }) => {
      const nameOk = isLatinText(s.displayName || s.slug || '')
      const summaryOk = !s.summary || isLatinText(s.summary)
      return nameOk || summaryOk
    })

    return NextResponse.json({ ok: true, results: filtered })
  } catch {
    return NextResponse.json({ ok: true, results: [], error: 'ClawHub API unavailable' })
  }
}
