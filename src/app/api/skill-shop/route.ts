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

function autoCategory(slug: string, summary: string): string {
  const text = (slug + ' ' + summary).toLowerCase()
  if (/event|hospitality|bar|venue|ticket|booking/.test(text)) return 'recommended'
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
  'coding', 'social media', 'productivity', 'events', 'CRM',
  'git', 'deploy', 'messaging', 'scheduling', 'analytics',
]

const INSTALLED_SLUGS = new Set([
  'coding-agent', 'github', 'gog', 'weather', 'skill-creator', 'healthcheck',
  'video-frames', 'openai-whisper-api', 'openai-image-gen', 'nano-banana-pro',
  'gh-issues', 'acp-router', 'node-connect',
])

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

// POST: refresh cache by fetching from ClawHub API directly
export async function POST() {
  const supabase = createServerSupabaseAdmin()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectRef = parseProjectRef(supabaseUrl)

  // Ensure table exists
  const { error: tableCheck } = await supabase.from('skill_shop').select('id').limit(1)
  if (tableCheck) {
    if (!serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY not set, cannot create table' },
        { status: 500 }
      )
    }
    try {
      await runManagementSql(projectRef, serviceRoleKey, SKILL_SHOP_TABLE_SQL)
      await runManagementSql(projectRef, serviceRoleKey, SKILL_SHOP_POLICY_SQL)
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: `Table creation failed: ${err instanceof Error ? err.message : err}` },
        { status: 500 }
      )
    }
  }

  // Fetch skills from ClawHub API for each search term
  const allSkills: ClawHubResult[] = []

  for (const term of SEARCH_TERMS) {
    try {
      const res = await fetch(
        `https://clawhub.ai/api/v1/search?q=${encodeURIComponent(term)}&limit=15`,
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

  if (unique.length === 0) {
    return NextResponse.json({ ok: true, count: 0, message: 'No skills found from ClawHub' })
  }

  // Build rows for upsert
  const now = new Date().toISOString()
  const rows = unique.map(skill => ({
    slug: skill.slug,
    display_name: skill.displayName || skill.slug,
    summary: skill.summary || null,
    category: autoCategory(skill.slug, skill.summary || ''),
    is_installed: INSTALLED_SLUGS.has(skill.slug),
    trust_level: 'looks-ok',
    source: 'clawhub',
    updated_at: skill.updatedAt || now,
    cached_at: now,
  }))

  const { error: upsertError } = await supabase
    .from('skill_shop')
    .upsert(rows, { onConflict: 'slug' })

  if (upsertError) {
    return NextResponse.json({ ok: false, error: upsertError.message })
  }

  return NextResponse.json({ ok: true, count: rows.length })
}
