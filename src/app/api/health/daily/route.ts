import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

function dateStringUTC(date: Date): string {
  return date.getFullYear() + '-' + 
    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(date.getDate()).padStart(2, '0')
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const searchParams = req.nextUrl.searchParams
  const date = searchParams.get('date') || dateStringUTC(new Date())
  
  try {
    // Get drinks for the day
    const { data: drinks, error: drinksError } = await supabase
      .from('quick_drinks')
      .select('*')
      .eq('date', date)
      .order('timestamp', { ascending: false })
    
    // Get food for the day  
    const { data: foods, error: foodsError } = await supabase
      .from('nutrition_entries')
      .select('*')
      .gte('timestamp', `${date}T00:00:00.000Z`)
      .lt('timestamp', `${date}T23:59:59.999Z`)
      .order('timestamp', { ascending: false })
    
    // Calculate totals
    const drinkTotals = (drinks || []).reduce((acc, drink) => ({
      calories: acc.calories + (drink.calories || 0),
      alcoholUnits: acc.alcoholUnits + (drink.alcohol_units || 0)
    }), { calories: 0, alcoholUnits: 0 })
    
    const foodTotals = (foods || []).reduce((acc, food) => ({
      calories: acc.calories + (food.total_calories || 0),
      protein: acc.protein + (food.total_protein || 0),
      carbs: acc.carbs + (food.total_carbs || 0),
      fat: acc.fat + (food.total_fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    
    return NextResponse.json({
      date,
      drinks: drinks || [],
      foods: foods || [],
      totals: {
        calories: drinkTotals.calories + foodTotals.calories,
        alcoholUnits: drinkTotals.alcoholUnits,
        protein: foodTotals.protein,
        carbs: foodTotals.carbs,
        fat: foodTotals.fat
      },
      counts: {
        drinks: (drinks || []).length,
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