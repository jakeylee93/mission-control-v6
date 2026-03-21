import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'
import { dateStringUTC, isMissingTableError } from '../_lib/tables'

type LagerRow = {
  id: string
  date: string
  glasses: number
  goal: number
  log: string[] | null
  created_at: string
  updated_at: string
}

type LagerResponse = {
  glasses: number
  goal: number
  log: string[]
}

const DEFAULT_LAGER: LagerResponse = {
  glasses: 0,
  goal: 0,
  log: [],
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function toLagerResponse(row: LagerRow | null): LagerResponse {
  if (!row) return DEFAULT_LAGER

  return {
    glasses: Number(row.glasses) || 0,
    goal: Number(row.goal) || 0,
    log: Array.isArray(row.log) ? row.log : [],
  }
}

function safeLogInput(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const requestedDate = req.nextUrl.searchParams.get('date')
  const date = isValidDateString(requestedDate) ? requestedDate : dateStringUTC(new Date())

  const { data, error } = await supabase
    .from('lovely_lager')
    .select('*')
    .eq('date', date)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(DEFAULT_LAGER)
    }

    return NextResponse.json({ error: error.message || 'Failed to load lager intake' }, { status: 500 })
  }

  return NextResponse.json(toLagerResponse(data as LagerRow | null))
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json().catch(() => ({}))
  const action = typeof body?.action === 'string' ? body.action : ''
  const date = isValidDateString(body?.date) ? body.date : dateStringUTC(new Date())

  if (action !== 'drink' && action !== 'reset') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: currentRow, error: currentError } = await supabase
    .from('lovely_lager')
    .select('*')
    .eq('date', date)
    .maybeSingle()

  if (currentError) {
    if (isMissingTableError(currentError)) {
      return NextResponse.json({ ok: false, ...DEFAULT_LAGER, error: 'Lager table is missing' })
    }

    return NextResponse.json({ error: currentError.message || 'Failed to load current lager record' }, { status: 500 })
  }

  const existing = (currentRow as LagerRow | null) ?? null
  const existingLog = safeLogInput(existing?.log)
  const now = new Date().toISOString()

  const next =
    action === 'drink'
      ? {
          glasses: (Number(existing?.glasses) || 0) + 1,
          goal: Number(existing?.goal) || 0,
          log: [...existingLog, now],
        }
      : {
          glasses: 0,
          goal: Number(existing?.goal) || 0,
          log: [],
        }

  const { data: upserted, error: upsertError } = await supabase
    .from('lovely_lager')
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
      return NextResponse.json({ ok: false, ...DEFAULT_LAGER, error: 'Lager table is not ready yet' })
    }

    return NextResponse.json({ error: upsertError.message || 'Failed to save lager intake' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ...toLagerResponse(upserted as LagerRow) })
}
