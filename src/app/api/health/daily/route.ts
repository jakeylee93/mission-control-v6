import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

type LagerDrink = {
  name?: string
  calories?: number
  alcoholUnits?: number
  timestamp?: string
}

function dateStringUTC(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const code = String((err as { code?: unknown }).code || '')
  const message = String((err as { message?: unknown }).message || '').toLowerCase()
  return code === '42P01' || code === 'PGRST205' || message.includes('does not exist')
}

function parseDrinkObjects(log: unknown[]): LagerDrink[] {
  const drinks: LagerDrink[] = []
  for (const item of log) {
    if (typeof item === 'object' && item !== null && 'name' in item) {
      drinks.push(item as LagerDrink)
    }
  }
  return drinks
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get('mode')

  // Month summary mode: return which dates have food/drink data
  if (mode === 'month') {
    const month = searchParams.get('month') // format: 2026-03
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 })
    }

    const startDate = `${month}-01`
    const [yearStr, monthStr] = month.split('-')
    const year = parseInt(yearStr)
    const mon = parseInt(monthStr)
    const lastDay = new Date(year, mon, 0).getDate()
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

    try {
      // Get all drink rows for this month from lovely_water (where drinks are stored)
      const { data: drinkRows, error: drinkError } = await supabase
        .from('lovely_water')
        .select('date, log')
        .gte('date', startDate)
        .lte('date', endDate)

      if (drinkError && !isMissingTableError(drinkError)) {
        throw new Error(drinkError.message)
      }

      // Get all food entries for this month
      const { data: foodRows, error: foodError } = await supabase
        .from('nutrition_entries')
        .select('timestamp')
        .gte('timestamp', `${startDate}T00:00:00.000Z`)
        .lte('timestamp', `${endDate}T23:59:59.999Z`)

      if (foodError && !isMissingTableError(foodError)) {
        throw new Error(foodError.message)
      }

      // Build a map of date -> { hasFood, hasDrinks }
      const dateMap: Record<string, { hasFood: boolean; hasDrinks: boolean }> = {}

      // Process drink rows - check if they actually have drink objects in log
      for (const row of drinkRows || []) {
        const log = Array.isArray((row as any).log) ? (row as any).log : []
        const drinks = parseDrinkObjects(log)
        if (drinks.length > 0) {
          const d = (row as any).date as string
          if (!dateMap[d]) dateMap[d] = { hasFood: false, hasDrinks: false }
          dateMap[d].hasDrinks = true
        }
      }

      // Process food rows
      for (const row of foodRows || []) {
        const d = ((row as any).timestamp as string).slice(0, 10)
        if (!dateMap[d]) dateMap[d] = { hasFood: false, hasDrinks: false }
        dateMap[d].hasFood = true
      }

      return NextResponse.json({ month, dates: dateMap })
    } catch (error: any) {
      console.error('Month summary error:', error)
      return NextResponse.json({ error: error.message || 'Failed to load month summary' }, { status: 500 })
    }
  }

  // Single date mode (default)
  const date = searchParams.get('date') || dateStringUTC(new Date())

  try {
    // Get drinks from lovely_water (where the drinks API stores them)
    const { data: waterRow, error: waterError } = await supabase
      .from('lovely_water')
      .select('*')
      .eq('date', date)
      .maybeSingle()

    if (waterError && !isMissingTableError(waterError)) {
      throw new Error(waterError.message || 'Failed to load drinks')
    }

    // Parse drinks from the log field (drink objects mixed with timestamp strings)
    let drinks: LagerDrink[] = []
    if (waterRow) {
      const log = Array.isArray((waterRow as any).log) ? (waterRow as any).log : []
      drinks = parseDrinkObjects(log)
    }

    // Get food for the day
    const { data: foods, error: foodsError } = await supabase
      .from('nutrition_entries')
      .select('*')
      .gte('timestamp', `${date}T00:00:00.000Z`)
      .lt('timestamp', `${date}T23:59:59.999Z`)
      .order('timestamp', { ascending: false })

    if (foodsError && !isMissingTableError(foodsError)) {
      throw new Error(foodsError.message || 'Failed to load foods')
    }

    const drinkTotals = drinks.reduce<{ calories: number; alcoholUnits: number }>((acc, drink) => ({
      calories: acc.calories + (drink.calories || 0),
      alcoholUnits: acc.alcoholUnits + (drink.alcoholUnits || 0)
    }), { calories: 0, alcoholUnits: 0 })

    const foodTotals = (foods || []).reduce((acc, food) => ({
      calories: acc.calories + (food.total_calories || 0),
      protein: acc.protein + (food.total_protein || 0),
      carbs: acc.carbs + (food.total_carbs || 0),
      fat: acc.fat + (food.total_fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

    return NextResponse.json({
      date,
      drinks,
      foods: foods || [],
      totals: {
        calories: drinkTotals.calories + foodTotals.calories,
        alcoholUnits: drinkTotals.alcoholUnits,
        protein: foodTotals.protein,
        carbs: foodTotals.carbs,
        fat: foodTotals.fat
      },
      counts: {
        drinks: drinks.length,
        foods: (foods || []).length
      }
    })

  } catch (error: any) {
    console.error('Daily data error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to load daily data'
    }, { status: 500 })
  }
}
