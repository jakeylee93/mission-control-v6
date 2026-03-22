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
    const { actionType, itemKey, quantity = 1, portionSize = 'pint' } = body
    
    if (actionType !== 'alcohol') {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 })
    }
    
    const drink = DRINK_OPTIONS[itemKey]
    if (!drink) {
      return NextResponse.json({ error: 'Invalid drink' }, { status: 400 })
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

    const drinksUrl = new URL('/api/lovely/drinks', req.url)
    const drinksResponse = await fetch(drinksUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        action: 'add-drink',
        date,
        drinkName: drinkPayload.name,
        portion: drinkPayload.portion,
        calories: drinkPayload.calories,
        alcoholUnits: drinkPayload.alcoholUnits,
      }),
    })

    const drinksResult = await drinksResponse.json().catch(() => null)
    if (!drinksResponse.ok || !drinksResult?.ok) {
      const details =
        (drinksResult && typeof drinksResult.error === 'string' && drinksResult.error) ||
        `Drinks save failed (${drinksResponse.status})`
      return NextResponse.json({ error: details }, { status: 500 })
    }
    
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
    
    // Better error details for debugging
    const errorDetails = {
      error: error.message || 'Failed to add quick action',
      timestamp: new Date().toISOString(),
      action: actionType,
      item: itemKey,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
    
    return NextResponse.json(errorDetails, { status: 500 })
  }
}
