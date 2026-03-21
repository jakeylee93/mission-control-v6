import { NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'
import { LOVELY_SQL_STATEMENTS, isMissingTableError } from '../lovely/_lib/tables'

export const runtime = 'nodejs'

const DEFAULT_PROJECT_REF = 'nrdlpdsoeksdybrshvst'

const CHAT_MESSAGES_SQL = `
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent text NOT NULL DEFAULT 'marg',
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  has_audio boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_agent ON chat_messages(agent);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
`

const CHAT_MESSAGES_POLICY_SQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_messages'
      AND policyname = 'allow_all_chat_messages'
  ) THEN
    CREATE POLICY allow_all_chat_messages ON chat_messages FOR ALL USING (true);
  END IF;
END
$$;
`

const CHAT_QUICK_LOG_SQL = `
CREATE TABLE IF NOT EXISTS chat_quick_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_quick_log ENABLE ROW LEVEL SECURITY;
`

const CHAT_QUICK_LOG_POLICY_SQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_quick_log'
      AND policyname = 'allow_all_chat'
  ) THEN
    CREATE POLICY allow_all_chat ON chat_quick_log FOR ALL USING (true);
  END IF;
END
$$;
`

const TABLE_CHECKS: Array<{ table: string; select: string }> = [
  { table: 'lovely_checkins', select: 'id' },
  { table: 'lovely_water', select: 'id' },
  { table: 'lovely_lager', select: 'id' },
  { table: 'chat_messages', select: 'id' },
  { table: 'chat_quick_log', select: 'id' },
]

const SETUP_SQL = [
  ...LOVELY_SQL_STATEMENTS,
  CHAT_MESSAGES_SQL,
  CHAT_MESSAGES_POLICY_SQL,
  CHAT_QUICK_LOG_SQL,
  CHAT_QUICK_LOG_POLICY_SQL,
]

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

  const bodyText = await response.text()
  let body: unknown = null
  if (bodyText) {
    try {
      body = JSON.parse(bodyText)
    } catch {
      body = bodyText
    }
  }

  if (!response.ok) {
    let message = `Supabase Management API error (${response.status})`
    if (body && typeof body === 'object' && 'message' in body) {
      const maybeMessage = (body as { message?: unknown }).message
      if (typeof maybeMessage === 'string' && maybeMessage) {
        message = maybeMessage
      }
    }
    throw new Error(message)
  }

  return body
}

export async function POST() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectRef = parseProjectRef(supabaseUrl)

  if (!serviceRoleKey) {
    return NextResponse.json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 })
  }

  const supabase = createServerSupabaseAdmin()
  const missingTables: string[] = []

  for (const check of TABLE_CHECKS) {
    const { error } = await supabase.from(check.table).select(check.select).limit(1)
    if (error && isMissingTableError(error)) {
      missingTables.push(check.table)
    }
  }

  const statements = missingTables.length ? SETUP_SQL : []
  const results: Array<{ index: number; ok: boolean; error?: string }> = []

  for (let i = 0; i < statements.length; i += 1) {
    const sql = statements[i]
    try {
      await runManagementSql(projectRef, serviceRoleKey, sql)
      results.push({ index: i, ok: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown setup error'
      results.push({ index: i, ok: false, error: message })
      return NextResponse.json(
        {
          ok: false,
          projectRef,
          missingTables,
          completedStatements: i,
          error: message,
          results,
        },
        { status: 500 },
      )
    }
  }

  return NextResponse.json({
    ok: true,
    projectRef,
    missingTables,
    ranStatements: statements.length,
    message: statements.length ? 'Database setup complete' : 'All required tables already exist',
    results,
  })
}
