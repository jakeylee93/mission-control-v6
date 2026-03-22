import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'
import { dateStringUTC, ensureLovelyTables, isMissingTableError } from '../_lib/tables'

type DrinkEntry = {
  name: string
  portion: string
  calories: number
  alcoholUnits: number
  timestamp: string
}

type LagerRow = {
  id: string
  date: string
  glasses: number
  goal: number
  log: unknown[] | null
  drinks?: unknown[] | null
  created_at: string
  updated_at: string
}

type LagerResponse = {
  glasses: number
  goal: number
  log: string[]
  drinks: DrinkEntry[]
}

const DEFAULT_LAGER: LagerResponse = {
  glasses: 0,
  goal: 0,
  log: [],
  drinks: [],
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function toLagerResponse(row: LagerRow | null): LagerResponse {
  if (!row) return DEFAULT_LAGER

  const drinks = parseDrinkEntries(row.drinks, row.log)
  const legacyLog = safeLogInput(row.log)

  return {
    glasses: Number(row.glasses) || 0,
    goal: Number(row.goal) || 0,
    log: drinks.length > 0 ? drinks.map((drink) => drink.timestamp) : legacyLog,
    drinks,
  }
}

function safeLogInput(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function asNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function asDrinkEntry(value: unknown): DrinkEntry | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Partial<DrinkEntry> & { [key: string]: unknown }

  const name = typeof row.name === 'string' ? row.name : ''
  const portion = typeof row.portion === 'string' ? row.portion : 'pint'
  const timestamp = typeof row.timestamp === 'string' ? row.timestamp : ''

  if (!name || !timestamp) return null

  return {
    name,
    portion,
    calories: asNumber(row.calories),
    alcoholUnits: asNumber(row.alcoholUnits),
    timestamp,
  }
}

function parseDrinkEntries(drinks: unknown, log: unknown): DrinkEntry[] {
  if (Array.isArray(drinks)) {
    return drinks.map(asDrinkEntry).filter((item): item is DrinkEntry => Boolean(item))
  }

  if (Array.isArray(log)) {
    return log.map(asDrinkEntry).filter((item): item is DrinkEntry => Boolean(item))
  }

  return []
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: unknown }).code
  const message = String((error as { message?: unknown }).message || '').toLowerCase()
  return code === '42703' || message.includes(`column "${columnName.toLowerCase()}"`)
}

async function ensureLovelyTablesWithFallback(supabase: ReturnType<typeof createServerSupabaseAdmin>, req: NextRequest) {
  const setup = await ensureLovelyTables(supabase)
  if (setup.ok) return setup

  try {
    const response = await fetch(new URL('/api/setup', req.url), { method: 'POST', cache: 'no-store' })
    const body = await response.json().catch(() => null)
    if (response.ok && body?.ok) {
      return { ok: true as const }
    }

    const setupError = body && typeof body.error === 'string' ? body.error : ''
    return { ok: false as const, error: setupError || setup.error }
  } catch {
    return setup
  }
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

  const drinkName = typeof body?.drinkName === 'string' ? body.drinkName : 'Generic drink'
  const portion = typeof body?.portion === 'string' ? body.portion : 'pint'
  const calories = asNumber(body?.calories)
  const alcoholUnits = asNumber(body?.alcoholUnits)

  if (action !== 'drink' && action !== 'reset' && action !== 'add-drink') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: currentRow, error: currentError } = await supabase
    .from('lovely_lager')
    .select('*')
    .eq('date', date)
    .maybeSingle()

  if (currentError && !isMissingTableError(currentError)) {
    return NextResponse.json({ error: currentError.message || 'Failed to load current lager record' }, { status: 500 })
  }

  if (currentError && isMissingTableError(currentError)) {
    const setup = await ensureLovelyTablesWithFallback(supabase, req)
    if (!setup.ok) {
      return NextResponse.json({ ok: false, ...DEFAULT_LAGER, error: `Lager setup failed: ${setup.error}` })
    }
  }

  const existing = (currentRow as LagerRow | null) ?? null
  const existingDrinks = parseDrinkEntries(existing?.drinks, existing?.log)
  const existingLog = (() => {
    const legacy = safeLogInput(existing?.log)
    if (legacy.length > 0) return legacy
    return existingDrinks.map((item) => item.timestamp)
  })()
  const now = new Date().toISOString()

  let next: { glasses: number; goal: number; log: unknown[]; drinks: DrinkEntry[] }

  if (action === 'add-drink') {
    const newDrink: DrinkEntry = {
      name: drinkName,
      portion,
      calories,
      alcoholUnits,
      timestamp: now,
    }
    next = {
      glasses: (Number(existing?.glasses) || 0) + 1,
      goal: Number(existing?.goal) || 0,
      log: [...existingLog, now],
      drinks: [...existingDrinks, newDrink],
    }
  } else if (action === 'drink') {
    next = {
      glasses: (Number(existing?.glasses) || 0) + 1,
      goal: Number(existing?.goal) || 0,
      log: [...existingLog, now],
      drinks: existingDrinks,
    }
  } else {
    next = {
      glasses: 0,
      goal: Number(existing?.goal) || 0,
      log: [],
      drinks: [],
    }
  }

  let { data: upserted, error: upsertError } = await supabase
    .from('lovely_lager')
    .upsert(
      {
        date,
        glasses: next.glasses,
        goal: next.goal,
        log: next.log,
        drinks: next.drinks,
        updated_at: now,
      },
      { onConflict: 'date' },
    )
    .select('*')
    .single()

  if (upsertError && isMissingColumnError(upsertError, 'drinks')) {
    const setup = await ensureLovelyTablesWithFallback(supabase, req)
    if (setup.ok) {
      const retry = await supabase
        .from('lovely_lager')
        .upsert(
          {
            date,
            glasses: next.glasses,
            goal: next.goal,
            log: next.log,
            drinks: next.drinks,
            updated_at: now,
          },
          { onConflict: 'date' },
        )
        .select('*')
        .single()
      upserted = retry.data
      upsertError = retry.error
    }
  }

  if (upsertError && isMissingColumnError(upsertError, 'drinks')) {
    const fallback = await supabase
      .from('lovely_lager')
      .upsert(
        {
          date,
          glasses: next.glasses,
          goal: next.goal,
          log: next.drinks,
          updated_at: now,
        },
        { onConflict: 'date' },
      )
      .select('*')
      .single()
    upserted = fallback.data
    upsertError = fallback.error
  }

  if (upsertError) {
    if (isMissingTableError(upsertError)) {
      const setup = await ensureLovelyTablesWithFallback(supabase, req)
      if (setup.ok) {
        const retry = await supabase
          .from('lovely_lager')
          .upsert(
            {
              date,
              glasses: next.glasses,
              goal: next.goal,
              log: next.log,
              drinks: next.drinks,
              updated_at: now,
            },
            { onConflict: 'date' },
          )
          .select('*')
          .single()
        upserted = retry.data
        upsertError = retry.error
      } else {
        return NextResponse.json({ ok: false, ...DEFAULT_LAGER, error: `Lager table is not ready yet: ${setup.error}` })
      }
    }
  }

  if (upsertError) {
    if (isMissingTableError(upsertError)) {
      return NextResponse.json({ ok: false, ...DEFAULT_LAGER, error: 'Lager table is not ready yet' })
    }

    return NextResponse.json({ error: upsertError.message || 'Failed to save lager intake' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ...toLagerResponse(upserted as LagerRow) })
}
