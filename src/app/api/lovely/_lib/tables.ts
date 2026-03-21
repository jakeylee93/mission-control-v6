import type { SupabaseClient } from '@supabase/supabase-js'

const CHECKINS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS lovely_checkins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date text NOT NULL,
  mood integer NOT NULL DEFAULT 3,
  energy integer NOT NULL DEFAULT 3,
  sleep numeric NOT NULL DEFAULT 7,
  gratitude text DEFAULT '',
  wins text DEFAULT '',
  note text DEFAULT '',
  self_care text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lovely_date ON lovely_checkins(date);
ALTER TABLE lovely_checkins ENABLE ROW LEVEL SECURITY;
`

const CHECKINS_POLICY_SQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lovely_checkins'
      AND policyname = 'allow_all'
  ) THEN
    CREATE POLICY allow_all ON lovely_checkins FOR ALL USING (true);
  END IF;
END
$$;
`

const WATER_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS lovely_water (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date text NOT NULL,
  glasses integer NOT NULL DEFAULT 0,
  goal integer NOT NULL DEFAULT 8,
  log jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_water_date ON lovely_water(date);
ALTER TABLE lovely_water ENABLE ROW LEVEL SECURITY;
`

const WATER_POLICY_SQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lovely_water'
      AND policyname = 'allow_all_water'
  ) THEN
    CREATE POLICY allow_all_water ON lovely_water FOR ALL USING (true);
  END IF;
END
$$;
`

const SQL_STATEMENTS = [CHECKINS_TABLE_SQL, CHECKINS_POLICY_SQL, WATER_TABLE_SQL, WATER_POLICY_SQL]

const RPC_FUNCTIONS = ['exec_sql', 'execute_sql', 'run_sql', 'query_sql']

export function dateStringUTC(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function extractErrorCode(err: unknown): string {
  if (!err || typeof err !== 'object') return ''
  const maybeCode = (err as { code?: unknown }).code
  return typeof maybeCode === 'string' ? maybeCode : ''
}

function extractErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return ''
  const maybeMessage = (err as { message?: unknown }).message
  return typeof maybeMessage === 'string' ? maybeMessage : ''
}

export function isMissingTableError(err: unknown): boolean {
  const code = extractErrorCode(err)
  const message = extractErrorMessage(err).toLowerCase()

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('relation')
  )
}

async function executeSqlViaRpc(supabase: SupabaseClient, sql: string): Promise<void> {
  let lastError: unknown = null
  const payloads = [{ sql }, { query: sql }, { query_text: sql }]

  for (const fn of RPC_FUNCTIONS) {
    for (const payload of payloads) {
      const { error } = await supabase.rpc(fn, payload)
      if (!error) return
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error(extractErrorMessage(lastError) || 'SQL RPC execution failed')
}

export async function ensureLovelyTables(supabase: SupabaseClient): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const sql of SQL_STATEMENTS) {
    try {
      await executeSqlViaRpc(supabase, sql)
    } catch (error) {
      return {
        ok: false,
        error: extractErrorMessage(error) || 'Unable to run Lovely setup SQL via RPC',
      }
    }
  }

  return { ok: true }
}
