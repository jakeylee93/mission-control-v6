import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

function isLatinText(text: string): boolean {
  if (!text) return true
  // Filter out skills where the text has no Latin characters at all
  const latinChars = text.match(/[a-zA-Z]/g)
  return latinChars !== null && latinChars.length > 0
}

function autoCategory(slug: string, summary: string): string {
  const text = (slug + ' ' + summary).toLowerCase()
  if (/event|hospitality|bar|venue|ticket|booking|catering/.test(text)) return 'recommended'
  if (/business|crm|sales|marketing|revenue|invoice|client/.test(text)) return 'business'
  if (/automat|workflow|trigger|pipeline|zap/.test(text)) return 'automation'
  if (/email|slack|discord|chat|message|telegram|whatsapp/.test(text)) return 'communication'
  if (/code|dev|git|deploy|build|test|debug|api|github/.test(text)) return 'dev-tools'
  if (/schedule|calendar|task|health|habit|remind|product/.test(text)) return 'productivity'
  return 'other'
}

interface ClawHubResult {
  score: number
  slug: string
  displayName: string
  summary: string
  version: string
  updatedAt: string
}

const SEARCH_TERMS = [
  'automation', 'email', 'business', 'calendar', 'health',
  'scheduling', 'productivity', 'events', 'hospitality', 'CRM',
  'social media', 'content creation', 'analytics', 'project management',
  'customer service',
]

// GET: return cached skills from Supabase
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { searchParams } = new URL(req.url)

  const category = searchParams.get('category')
  const favorites = searchParams.get('favorites') === 'true'
  const search = searchParams.get('search')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from('skill_shop').select('*').order('cached_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (favorites) query = query.eq('is_favorite', true)
  if (search) query = query.or(`display_name.ilike.%${search}%,summary.ilike.%${search}%`)

  const { data, error } = await query.limit(300)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, skills: [] })
  }

  return NextResponse.json({ ok: true, skills: data || [] })
}

// POST: refresh cache by fetching from ClawHub API
// Tables are created by /api/setup on app load — no table creation here
export async function POST() {
  const supabase = createServerSupabaseAdmin()

  // Fetch skills from ClawHub API for each search term
  const allSkills: ClawHubResult[] = []

  for (const term of SEARCH_TERMS) {
    try {
      const res = await fetch(
        `https://clawhub.ai/api/v1/search?q=${encodeURIComponent(term)}&limit=20`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const data = await res.json()
        const results: ClawHubResult[] = Array.isArray(data.results) ? data.results : []
        allSkills.push(...results)
      }
    } catch {
      // Term search failed, continue
    }
  }

  // Deduplicate by slug
  const seen = new Set<string>()
  const unique = allSkills.filter(s => {
    if (!s.slug || seen.has(s.slug)) return false
    seen.add(s.slug)
    return true
  })

  // Filter out Chinese-only (non-Latin) skills
  const latinOnly = unique.filter(s => {
    const nameOk = isLatinText(s.displayName || s.slug)
    const summaryOk = !s.summary || isLatinText(s.summary)
    return nameOk || summaryOk
  })

  if (latinOnly.length === 0) {
    return NextResponse.json({ ok: true, count: 0, message: 'No skills found from ClawHub' })
  }

  // Build rows for upsert — preserve favorites and marg data
  const now = new Date().toISOString()
  const rows = latinOnly.map(skill => ({
    slug: skill.slug,
    display_name: skill.displayName || skill.slug,
    summary: skill.summary || null,
    category: autoCategory(skill.slug, skill.summary || ''),
    source: 'clawhub',
    updated_at: skill.updatedAt || now,
    cached_at: now,
  }))

  const { error: upsertError } = await supabase
    .from('skill_shop')
    .upsert(rows, {
      onConflict: 'slug',
      ignoreDuplicates: false,
    })

  if (upsertError) {
    return NextResponse.json({ ok: false, error: upsertError.message })
  }

  return NextResponse.json({ ok: true, count: rows.length })
}
