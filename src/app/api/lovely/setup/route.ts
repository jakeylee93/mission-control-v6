import { NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'
import { ensureLovelyTables } from '../_lib/tables'

export async function POST() {
  const supabase = createServerSupabaseAdmin()
  const setup = await ensureLovelyTables(supabase)

  if (!setup.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Failed to setup lovely tables: ${setup.error}`,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, message: 'Lovely tables ready' })
}
