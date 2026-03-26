import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function parseCliOutput(raw: string): unknown[] {
  const lines = raw.split('\n').filter(l => !l.includes('plugins.') && l.trim())
  const json = lines.join('\n').trim()
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) return parsed
    if (parsed && Array.isArray(parsed.skills)) return parsed.skills
    if (parsed && Array.isArray(parsed.data)) return parsed.data
    if (parsed && Array.isArray(parsed.results)) return parsed.results
    return []
  } catch {
    return []
  }
}

// GET ?q=query: live search via openclaw CLI
export async function GET(req: NextRequest) {
  const { execSync } = require('child_process')
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  if (!q.trim()) {
    return NextResponse.json({ ok: true, results: [] })
  }

  try {
    const raw = execSync(`openclaw skills search "${q.replace(/"/g, '\\"')}" --json --limit 20 2>/dev/null`, {
      encoding: 'utf-8',
      timeout: 15000,
    }) as string

    const results = parseCliOutput(raw) as Record<string, unknown>[]

    return NextResponse.json({ ok: true, results })
  } catch {
    return NextResponse.json({ ok: true, results: [], error: 'CLI search unavailable' })
  }
}
