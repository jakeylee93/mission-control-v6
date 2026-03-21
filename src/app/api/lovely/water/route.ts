import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'
import { dateStringUTC, ensureLovelyTables, isMissingTableError } from '../_lib/tables'

type WaterRow = {
  id: string
  date: string
  glasses: number
  goal: number
  log: string[] | null
  created_at: string
  updated_at: string
}

type WaterResponse = {
  glasses: number
  goal: number
  log: string[]
}

const DEFAULT_WATER: WaterResponse = {
  glasses: 0,
  goal: 8,
  log: [],
}

function toWaterResponse(row: WaterRow | null): WaterResponse {
  if (!row) return DEFAULT_WATER

  return {
    glasses: Number(row.glasses) || 0,
    goal: Number(row.goal) || 8,
    log: Array.isArray(row.log) ? row.log : [],
  }
}

function safeLogInput(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export async function GET() {
  const supabase = createServerSupabaseAdmin()
  const date = dateStringUTC(new Date())

  const { data, error } = await supabase
    .from('lovely_water')
    .select('*')
    .eq('date', date)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(DEFAULT_WATER)
    }

    return NextResponse.json({ error: error.message || 'Failed to load water intake' }, { status: 500 })
  }

  return NextResponse.json(toWaterResponse(data as WaterRow | null))
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const date = dateStringUTC(new Date())
  const body = await req.json().catch(() => ({}))
  const action = typeof body?.action === 'string' ? body.action : ''

  if (action !== 'drink' && action !== 'reset') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: currentRow, error: currentError } = await supabase
    .from('lovely_water')
    .select('*')
    .eq('date', date)
    .maybeSingle()

  if (currentError && !isMissingTableError(currentError)) {
    return NextResponse.json({ error: currentError.message || 'Failed to load current water record' }, { status: 500 })
  }

  if (currentError && isMissingTableError(currentError)) {
    const setup = await ensureLovelyTables(supabase)
    if (!setup.ok) {
      return NextResponse.json(
        {
          error: `Water table is missing and setup failed: ${setup.error}`,
          ...DEFAULT_WATER,
        },
        { status: 200 },
      )
    }
  }

  const existing = (currentRow as WaterRow | null) ?? null
  const existingLog = safeLogInput(existing?.log)
  const now = new Date().toISOString()

  const next =
    action === 'drink'
      ? {
          glasses: (Number(existing?.glasses) || 0) + 1,
          goal: Number(existing?.goal) || 8,
          log: [...existingLog, now],
        }
      : {
          glasses: 0,
          goal: Number(existing?.goal) || 8,
          log: [],
        }

  const { data: upserted, error: upsertError } = await supabase
    .from('lovely_water')
    .upsert(
      {
        date,
        glasses: next.glasses,
        goal: next.goal,
        log: next.log,
        updated_at: now,
      },
      { onConflict: 'date' },
    )
    .select('*')
    .single()

  if (upsertError) {
    if (isMissingTableError(upsertError)) {
      return NextResponse.json({
        ...DEFAULT_WATER,
        error: 'Water table is not ready yet. Run POST /api/lovely/setup.',
      })
    }

    return NextResponse.json({ error: upsertError.message || 'Failed to save water intake' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ...toWaterResponse(upserted as WaterRow) })
}
