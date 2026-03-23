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

const NUTRITION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS nutrition_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz,
  image_url text,
  foods jsonb,
  total_calories int DEFAULT 0,
  total_protein numeric DEFAULT 0,
  total_carbs numeric DEFAULT 0,
  total_fat numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;
`

const NUTRITION_POLICY_SQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'nutrition_entries' AND policyname = 'allow_all_nutrition'
  ) THEN
    CREATE POLICY allow_all_nutrition ON nutrition_entries FOR ALL USING (true);
  END IF;
END $$;
`

const DRINK_COLLECTION_SQL = `
CREATE TABLE IF NOT EXISTS drink_collection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  calories int DEFAULT 0,
  alcohol_units numeric DEFAULT 0,
  portion text DEFAULT 'pint',
  image_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE drink_collection ENABLE ROW LEVEL SECURITY;
`

const DRINK_COLLECTION_POLICY_SQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'drink_collection' AND policyname = 'allow_all_drink_collection'
  ) THEN
    CREATE POLICY allow_all_drink_collection ON drink_collection FOR ALL USING (true);
  END IF;
END $$;
`

const HEALTH_SQL = [
  NUTRITION_TABLE_SQL,
  NUTRITION_POLICY_SQL,
  DRINK_COLLECTION_SQL,
  DRINK_COLLECTION_POLICY_SQL,
]

export async function POST() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectRef = parseProjectRef(supabaseUrl)

  if (!serviceRoleKey) {
    return NextResponse.json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 })
  }

  const supabase = createServerSupabaseAdmin()

  // Check which tables are missing
  const missingTables: string[] = []
  for (const table of ['nutrition_entries', 'drink_collection']) {
    const { error } = await supabase.from(table).select('id').limit(1)
    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      missingTables.push(table)
    }
  }

  if (missingTables.length === 0) {
    return NextResponse.json({ ok: true, message: 'All health tables exist', missingTables: [] })
  }

  const results: Array<{ index: number; ok: boolean; error?: string }> = []

  for (let i = 0; i < HEALTH_SQL.length; i++) {
    try {
      await runManagementSql(projectRef, serviceRoleKey, HEALTH_SQL[i])
      results.push({ index: i, ok: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      results.push({ index: i, ok: false, error: message })
    }
  }

  return NextResponse.json({
    ok: true,
    projectRef,
    missingTables,
    results,
    message: 'Health tables setup complete'
  })
}
