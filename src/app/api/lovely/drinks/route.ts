import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'
import { dateStringUTC, ensureLovelyTables, isMissingTableError } from '../_lib/tables'

type DrinksRow = {
  id: string
  date: string
  glasses: number
  goal: number
  log: string[] | null
  drinks: any[] | null
  created_at: string
  updated_at: string
}

type DrinksResponse = {
  glasses: number
  goal: number
  log: string[]
  drinks: any[]
}

const DEFAULT_DRINKS: DrinksResponse = {
  glasses: 0,
  goal: 0,
  log: [],
  drinks: [],
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function toDrinksResponse(row: DrinksRow | null): DrinksResponse {
  if (!row) return DEFAULT_DRINKS

  return {
    glasses: Number(row.glasses) || 0,
    goal: Number(row.goal) || 0,
    log: Array.isArray(row.log) ? row.log : [],
    drinks: Array.isArray(row.drinks) ? row.drinks : [],
  }
}

function safeLogInput(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function safeDrinksInput(value: unknown): any[] {
  if (!Array.isArray(value)) return []
  return value
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const requestedDate = req.nextUrl.searchParams.get('date')
  const date = isValidDateString(requestedDate) ? requestedDate : dateStringUTC(new Date())

  // Use lovely_water table but with drinks data (reuse working table)
  const { data, error } = await supabase
    .from('lovely_water')
    .select('*')
    .eq('date', date)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(DEFAULT_DRINKS)
    }

    return NextResponse.json({ error: error.message || 'Failed to load drinks' }, { status: 500 })
  }

  // Convert water row to drinks format
  // Use log field to store drink details as JSON
  const waterRow = data as any
  if (waterRow) {
    const log = waterRow.log || []
    const drinks = []
    const timestamps = []
    
    // Separate drink objects from timestamp strings
    for (const item of log) {
      if (typeof item === 'string') {
        timestamps.push(item)
      } else if (typeof item === 'object' && item.name) {
        drinks.push(item)
      }
    }
    
    return NextResponse.json({
      glasses: waterRow.glasses || 0,
      goal: 0,
      log: timestamps,
      drinks: drinks
    })
  }

  return NextResponse.json(DEFAULT_DRINKS)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json().catch(() => ({}))
  const action = typeof body?.action === 'string' ? body.action : ''
  const date = isValidDateString(body?.date) ? body.date : dateStringUTC(new Date())
  
  const drinkName = body?.drinkName || 'Generic drink'
  const portion = body?.portion || 'pint'
  const calories = body?.calories || 0
  const alcoholUnits = body?.alcoholUnits || 0

  if (action !== 'add-drink' && action !== 'reset') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Use lovely_water table but store drinks data in it
  const { data: currentRow, error: currentError } = await supabase
    .from('lovely_water')
    .select('*')
    .eq('date', date)
    .maybeSingle()

  if (currentError && !isMissingTableError(currentError)) {
    return NextResponse.json({ error: currentError.message || 'Failed to load current drinks' }, { status: 500 })
  }

  const existing = (currentRow as any) ?? null
  const existingLog = existing?.log || []
  const now = new Date().toISOString()

  // Separate existing drinks from timestamps
  const existingDrinks = []
  const existingTimestamps = []
  
  for (const item of existingLog) {
    if (typeof item === 'string') {
      existingTimestamps.push(item)
    } else if (typeof item === 'object' && item.name) {
      existingDrinks.push(item)
    }
  }

  let next: any
  
  if (action === 'add-drink') {
    const newDrink = {
      name: drinkName,
      portion: portion,
      calories: calories,
      alcoholUnits: alcoholUnits,
      timestamp: now
    }
    
    // Combine timestamps and drink objects in log field
    next = {
      glasses: (Number(existing?.glasses) || 0) + 1,
      goal: Number(existing?.goal) || 8,
      log: [...existingTimestamps, now, ...existingDrinks, newDrink],
    }
  } else {
    // Reset
    next = {
      glasses: 0,
      goal: Number(existing?.goal) || 8,
      log: [],
    }
  }

  const { data: upserted, error: upsertError } = await supabase
    .from('lovely_water')
    .upsert(
      {
        date,
        glasses: next.glasses,
        goal: next.goal,
        log: next.log, // Store both timestamps and drink objects here
        updated_at: now,
      },
      { onConflict: 'date' },
    )
    .select('*')
    .single()

  if (upsertError) {
    return NextResponse.json({ 
      ok: false, 
      ...DEFAULT_DRINKS, 
      error: 'Drinks save failed: ' + upsertError.message 
    })
  }

  // Parse the response
  const savedLog = upserted.log || []
  const savedDrinks = []
  const savedTimestamps = []
  
  for (const item of savedLog) {
    if (typeof item === 'string') {
      savedTimestamps.push(item)
    } else if (typeof item === 'object' && item.name) {
      savedDrinks.push(item)
    }
  }

  return NextResponse.json({ 
    ok: true, 
    glasses: upserted.glasses,
    goal: upserted.goal || 0,
    log: savedTimestamps,
    drinks: savedDrinks
  })
}