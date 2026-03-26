import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const DEFAULT_PROJECT_REF = 'nrdlpdsoeksdybrshvst'

function parseProjectRef(url: string | undefined): string {
  if (!url) return DEFAULT_PROJECT_REF
  try {
    const host = new URL(url).host
    return host.split('.')[0] || DEFAULT_PROJECT_REF
  } catch {
    return DEFAULT_PROJECT_REF
  }
}

async function runManagementSql(projectRef: string, accessToken: string, query: string) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    cache: 'no-store',
  })
  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`Supabase Management API error (${response.status}): ${bodyText}`)
  }
  return await response.json()
}

const SKILL_SHOP_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS skill_shop (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text,
  summary text,
  category text,
  is_installed boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  marg_rating integer,
  marg_notes text,
  trust_level text DEFAULT 'unknown',
  source text DEFAULT 'clawhub',
  updated_at timestamptz DEFAULT now(),
  cached_at timestamptz DEFAULT now()
);
ALTER TABLE skill_shop ENABLE ROW LEVEL SECURITY;
`

const SKILL_SHOP_POLICY_SQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'skill_shop' AND policyname = 'allow_all_skill_shop'
  ) THEN
    CREATE POLICY allow_all_skill_shop ON skill_shop FOR ALL USING (true);
  END IF;
END $$;
`

function autoCategory(skill: Record<string, unknown>): string {
  const text = ((skill.summary || skill.description || skill.display_name || skill.name || '') as string).toLowerCase()
  if (/event|hospitality|bar|venue|ticket|booking/.test(text)) return 'recommended'
  if (/business|crm|sales|marketing|revenue|invoice|client/.test(text)) return 'business'
  if (/automat|workflow|trigger|pipeline|zap/.test(text)) return 'automation'
  if (/email|slack|discord|chat|message|telegram|whatsapp/.test(text)) return 'communication'
  if (/code|dev|git|deploy|build|test|debug|api|github/.test(text)) return 'dev-tools'
  if (/schedule|calendar|task|health|habit|remind|product/.test(text)) return 'productivity'
  return 'other'
}

function autoTrust(skill: Record<string, unknown>): string {
  const src = ((skill.source || '') as string).toLowerCase()
  if (src === 'bundled') return 'verified'
  if (src === 'clawhub') return 'looks-ok'
  return 'unknown'
}

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

// GET: return cached skills from Supabase
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { searchParams } = new URL(req.url)

  const category = searchParams.get('category')
  const favorites = searchParams.get('favorites') === 'true'
  const installed = searchParams.get('installed') === 'true'
  const search = searchParams.get('search')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from('skill_shop').select('*').order('cached_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (favorites) query = query.eq('is_favorite', true)
  if (installed) query = query.eq('is_installed', true)
  if (search) query = query.or(`display_name.ilike.%${search}%,summary.ilike.%${search}%`)

  const { data, error } = await query.limit(300)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, skills: [] })
  }

  return NextResponse.json({ ok: true, skills: data || [] })
}

// POST: setup table if needed, run CLI searches, cache results
export async function POST() {
  const { execSync } = require('child_process')
  const supabase = createServerSupabaseAdmin()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectRef = parseProjectRef(supabaseUrl)

  // Ensure table exists
  const { error: tableCheck } = await supabase.from('skill_shop').select('id').limit(1)
  if (tableCheck) {
    if (!serviceRoleKey) {
      return NextResponse.json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY not set, cannot create table' }, { status: 500 })
    }
    try {
      await runManagementSql(projectRef, serviceRoleKey, SKILL_SHOP_TABLE_SQL)
      await runManagementSql(projectRef, serviceRoleKey, SKILL_SHOP_POLICY_SQL)
    } catch (err) {
      return NextResponse.json({ ok: false, error: `Table creation failed: ${err instanceof Error ? err.message : err}` }, { status: 500 })
    }
  }

  // Get installed skills first
  const installedSlugs = new Set<string>()
  try {
    const raw = execSync('openclaw skills list --json 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 15000,
    }) as string
    const list = parseCliOutput(raw) as Record<string, unknown>[]
    list.forEach(s => {
      const slug = (s.slug || s.name || '') as string
      if (slug) installedSlugs.add(slug.toLowerCase())
    })
  } catch {
    // CLI not available or no skills installed
  }

  // Search for skills across multiple categories
  const SEARCH_TERMS = [
    'automation', 'email', 'business', 'calendar', 'health',
    'coding', 'social media', 'productivity', 'events', 'CRM',
    'git', 'deploy', 'messaging', 'scheduling', 'analytics',
  ]

  const allSkills: Record<string, unknown>[] = []

  for (const term of SEARCH_TERMS) {
    try {
      const raw = execSync(`openclaw skills search "${term}" --json --limit 20 2>/dev/null`, {
        encoding: 'utf-8',
        timeout: 15000,
      }) as string
      const results = parseCliOutput(raw) as Record<string, unknown>[]
      allSkills.push(...results)
    } catch {
      // Search term returned no results
    }
  }

  // Also get full list
  try {
    const raw = execSync('openclaw skills list --json --all 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 15000,
    }) as string
    const results = parseCliOutput(raw) as Record<string, unknown>[]
    allSkills.push(...results)
  } catch {}

  // Deduplicate by slug
  const seen = new Set<string>()
  const unique = allSkills.filter(s => {
    const slug = ((s.slug || s.name || '') as string).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (!slug || seen.has(slug)) return false
    seen.add(slug)
    return true
  })

  if (unique.length === 0) {
    return NextResponse.json({ ok: true, count: 0, installed: installedSlugs.size, message: 'No skills found from CLI' })
  }

  // Build rows for upsert
  const rows = unique.map(skill => {
    const rawSlug = ((skill.slug || skill.name || '') as string)
    const slug = rawSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const src = ((skill.source || 'clawhub') as string).toLowerCase()
    return {
      slug,
      display_name: (skill.display_name || skill.name || slug) as string,
      summary: (skill.summary || skill.description || null) as string | null,
      category: (skill.category || autoCategory(skill)) as string,
      is_installed: installedSlugs.has(slug),
      trust_level: autoTrust(skill),
      source: src === 'bundled' ? 'bundled' : src === 'custom' ? 'custom' : 'clawhub',
      updated_at: new Date().toISOString(),
      cached_at: new Date().toISOString(),
    }
  }).filter(r => r.slug)

  // Update installed status for already-cached skills
  if (installedSlugs.size > 0) {
    // Mark installed
    await supabase.from('skill_shop').update({ is_installed: true }).in('slug', Array.from(installedSlugs))
    // Mark not installed (except ones we just found)
    const newSlugs = rows.map(r => r.slug)
    const allKnownSlugs = Array.from(new Set(Array.from(installedSlugs).concat(newSlugs)))
    await supabase.from('skill_shop').update({ is_installed: false }).not('slug', 'in', `(${allKnownSlugs.map(s => `"${s}"`).join(',')})`)
  }

  const { error: upsertError } = await supabase.from('skill_shop').upsert(rows, { onConflict: 'slug' })
  if (upsertError) {
    return NextResponse.json({ ok: false, error: upsertError.message })
  }

  return NextResponse.json({ ok: true, count: rows.length, installed: installedSlugs.size })
}
