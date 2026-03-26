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
  is_favorite boolean DEFAULT false,
  marg_rating integer,
  marg_notes text,
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

const SKILL_BUILD_QUEUE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS skill_build_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  display_name text,
  summary text,
  user_note text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz
);
ALTER TABLE skill_build_queue ENABLE ROW LEVEL SECURITY;
`

const SKILL_BUILD_QUEUE_POLICY_SQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'skill_build_queue' AND policyname = 'allow_all_skill_build_queue'
  ) THEN
    CREATE POLICY allow_all_skill_build_queue ON skill_build_queue FOR ALL USING (true);
  END IF;
END $$;
`

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
export async function POST() {
  const supabase = createServerSupabaseAdmin()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectRef = parseProjectRef(supabaseUrl)

  // Ensure skill_shop table exists
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

  // Ensure skill_build_queue table exists
  const { error: queueTableCheck } = await supabase.from('skill_build_queue').select('id').limit(1)
  if (queueTableCheck && serviceRoleKey) {
    try {
      await runManagementSql(projectRef, serviceRoleKey, SKILL_BUILD_QUEUE_TABLE_SQL)
      await runManagementSql(projectRef, serviceRoleKey, SKILL_BUILD_QUEUE_POLICY_SQL)
    } catch {
      // Queue table creation failure is non-fatal
    }
  }

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
