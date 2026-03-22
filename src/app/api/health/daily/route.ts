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

function parseLagerDrinks(row: { drinks?: unknown; log?: unknown }): LagerDrink[] {
  if (Array.isArray(row.drinks)) return row.drinks as LagerDrink[]
  if (Array.isArray(row.log)) return row.log as LagerDrink[]
  return []
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const searchParams = req.nextUrl.searchParams
  const date = searchParams.get('date') || dateStringUTC(new Date())
  
  try {
    // Get drinks for the day from lovely_lager (single daily row with drinks array)
    const { data: lagerRow, error: lagerError } = await supabase
      .from('lovely_lager')
      .select('*')
      .eq('date', date)
      .maybeSingle()

    if (lagerError && !isMissingTableError(lagerError)) {
      throw new Error(lagerError.message || 'Failed to load drinks')
    }

    const drinks = lagerRow ? parseLagerDrinks(lagerRow) : []
    
    // Get food for the day  
    const { data: foods, error: foodsError } = await supabase
      .from('nutrition_entries')
      .select('*')
      .gte('timestamp', `${date}T00:00:00.000Z`)
      .lt('timestamp', `${date}T23:59:59.999Z`)
      .order('timestamp', { ascending: false })
    
    // Calculate totals
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
