import { NextRequest, NextResponse } from 'next/server'

interface DrinkOption {
  name: string
  calories: number
  alcoholUnits: number
  image?: string
}

const DRINK_OPTIONS: { [key: string]: DrinkOption } = {
  'stella-artois': { name: 'Stella Artois', calories: 154, alcoholUnits: 1.4 },
  'peroni': { name: 'Peroni', calories: 142, alcoholUnits: 1.4 },
  'corona': { name: 'Corona', calories: 148, alcoholUnits: 1.4 },
  'guinness': { name: 'Guinness', calories: 125, alcoholUnits: 1.2 },
  'wine-red': { name: 'Red Wine (125ml)', calories: 85, alcoholUnits: 1.6 },
  'wine-white': { name: 'White Wine (125ml)', calories: 82, alcoholUnits: 1.5 },
  'prosecco': { name: 'Prosecco (125ml)', calories: 89, alcoholUnits: 1.4 },
  'vodka-tonic': { name: 'Vodka Tonic', calories: 110, alcoholUnits: 1.0 },
  'gin-tonic': { name: 'Gin & Tonic', calories: 115, alcoholUnits: 1.0 },
  'whiskey': { name: 'Whiskey (25ml)', calories: 61, alcoholUnits: 1.0 },
}

type LagerActionInput = {
  name: string
  portion: string
  calories: number
  alcoholUnits: number
}

export async function GET() {
  return NextResponse.json({ drinks: DRINK_OPTIONS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { actionType, itemKey, customDrink, quantity = 1, portionSize = 'pint' } = body
    
    if (actionType !== 'alcohol') {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 })
    }
    
    let drink
    if (customDrink) {
      // Use custom drink data
      drink = {
        name: customDrink.name,
        calories: customDrink.calories,
        alcoholUnits: customDrink.alcoholUnits
      }
    } else {
      // Use predefined drink
      drink = DRINK_OPTIONS[itemKey]
      if (!drink) {
        return NextResponse.json({ error: 'Invalid drink' }, { status: 400 })
      }
    }
    
    const date = new Date().toISOString().slice(0, 10)
    
    // Adjust values for portion size
    let portionMultiplier = 1
    if (portionSize === 'half-pint') portionMultiplier = 0.5
    
    const adjustedCalories = Math.round(drink.calories * quantity * portionMultiplier)
    const adjustedUnits = drink.alcoholUnits * quantity * portionMultiplier
    
    const drinkPayload: LagerActionInput = {
      name: drink.name,
      portion: portionSize,
      calories: adjustedCalories,
      alcoholUnits: adjustedUnits,
    }

    // Use the drinks API logic directly instead of internal fetch call
    const { createServerSupabaseAdmin } = await import('@/lib/supabase')
    const supabase = createServerSupabaseAdmin()
    
    // Get current drinks data 
    const { data: currentRow, error: currentError } = await supabase
      .from('lovely_water')  // Using water table as drinks storage
      .select('*')
      .eq('date', date)
      .maybeSingle()

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

    const newDrink = {
      name: drinkPayload.name,
      portion: drinkPayload.portion,
      calories: drinkPayload.calories,
      alcoholUnits: drinkPayload.alcoholUnits,
      timestamp: now
    }
    
    // Combine timestamps and drink objects in log field
    const nextLog = [...existingTimestamps, now, ...existingDrinks, newDrink]

    const { data: upserted, error: upsertError } = await supabase
      .from('lovely_water')
      .upsert(
        {
          date,
          glasses: (Number(existing?.glasses) || 0) + 1,
          goal: Number(existing?.goal) || 8,
          log: nextLog,
          updated_at: now,
        },
        { onConflict: 'date' },
      )
      .select('*')
      .single()

    if (upsertError) {
      console.error('Direct Supabase error:', upsertError)
      return NextResponse.json({ error: `Database save failed: ${upsertError.message}` }, { status: 500 })
    }

    console.log('✅ Direct Supabase save success:', upserted)
    
    return NextResponse.json({ 
      success: true, 
      action: {
        item_name: drink.name,
        calories: adjustedCalories,
        alcohol_units: adjustedUnits,
        quantity,
        portion_size: portionSize
      },
      saved: true
    })
    
  } catch (error: any) {
    console.error('Quick action error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to add quick action'
    }, { status: 500 })
  }
}
