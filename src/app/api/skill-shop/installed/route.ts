import { NextResponse } from 'next/server'

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

// GET: run openclaw skills list --json and return installed skills
export async function GET() {
  const { execSync } = require('child_process')

  try {
    const raw = execSync('openclaw skills list --json 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 15000,
    }) as string

    const skills = parseCliOutput(raw) as Record<string, unknown>[]

    const formatted = skills.map(s => ({
      slug: (s.slug || s.name || '') as string,
      name: (s.display_name || s.name || s.slug || 'Unknown') as string,
      description: (s.description || s.summary || null) as string | null,
      source: ((s.source || 'clawhub') as string).toLowerCase(),
      eligible: s.eligible !== false,
      missing: (s.missing_bins || s.missing_env || s.requirements_missing || []) as string[],
    }))

    return NextResponse.json({ ok: true, skills: formatted })
  } catch {
    return NextResponse.json({ ok: true, skills: [], error: 'CLI not available' })
  }
}
