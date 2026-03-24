import { NextResponse } from 'next/server'
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

const MEDIA_LIST_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS media_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source text,
  author text,
  url text,
  category text NOT NULL,
  recommended_by text,
  notes text,
  status text DEFAULT 'todo',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  description text
);
ALTER TABLE media_list ENABLE ROW LEVEL SECURITY;
`

const MEDIA_LIST_POLICY_SQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_list' AND policyname = 'allow_all_media_list'
  ) THEN
    CREATE POLICY allow_all_media_list ON media_list FOR ALL USING (true);
  END IF;
END $$;
`

const SEED_SQL = `
INSERT INTO media_list (title, source, author, url, category, recommended_by, status, description)
SELECT
  'Anthropic vs OpenAI / The Future of Warfare',
  'The Rest Is Politics',
  'Rory Stewart & Matt Clifford',
  'https://podcasts.apple.com/gb/podcast/the-rest-is-politics/id1611374685?i=1000753375113',
  'podcast',
  'Simon',
  'todo',
  'Is Europe sleepwalking into American AI dependency? Are we building toward a world where AI genuinely thinks for itself? And as AI becomes the backbone of modern warfare, who is really in control?'
WHERE NOT EXISTS (
  SELECT 1 FROM media_list WHERE title = 'Anthropic vs OpenAI / The Future of Warfare'
);
`

const SETUP_SQL = [
  MEDIA_LIST_TABLE_SQL,
  MEDIA_LIST_POLICY_SQL,
  SEED_SQL,
]

export async function POST() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectRef = parseProjectRef(supabaseUrl)

  if (!serviceRoleKey) {
    return NextResponse.json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 })
  }

  const supabase = createServerSupabaseAdmin()

  // Check if table exists
  const { error } = await supabase.from('media_list').select('id').limit(1)
  if (!error) {
    return NextResponse.json({ ok: true, message: 'media_list table already exists' })
  }

  const results: Array<{ index: number; ok: boolean; error?: string }> = []

  for (let i = 0; i < SETUP_SQL.length; i++) {
    try {
      await runManagementSql(projectRef, serviceRoleKey, SETUP_SQL[i])
      results.push({ index: i, ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      results.push({ index: i, ok: false, error: message })
    }
  }

  return NextResponse.json({
    ok: true,
    projectRef,
    results,
    message: 'Media list table setup complete'
  })
}
