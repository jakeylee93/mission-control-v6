import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

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

function dateStringUTC(date: Date): string {
  return date.getFullYear() + '-' + 
    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(date.getDate()).padStart(2, '0')
}

async function updateLovelyLager(supabase: any, alcoholUnits: number, date: string) {
  try {
    // Get current lager count
    const { data: current } = await supabase
      .from('lovely_lager')
      .select('*')
      .eq('date', date)
      .maybeSingle()
    
    const currentGlasses = current?.glasses || 0
    const currentLog = current?.log || []
    const now = new Date().toISOString()
    
    // Convert alcohol units to "glasses" (rough estimate: 1 unit = 1 glass)
    const glassesToAdd = Math.round(alcoholUnits)
    
    await supabase
      .from('lovely_lager')
      .upsert({
        date,
        glasses: currentGlasses + glassesToAdd,
        goal: current?.goal || 0,
        log: [...currentLog, now],
        updated_at: now
      }, { onConflict: 'date' })
      
  } catch (error) {
    console.error('Failed to sync with lovely lager:', error)
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ drinks: DRINK_OPTIONS })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  
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
    
    const date = dateStringUTC(new Date())
    const now = new Date().toISOString()
    
    // Adjust values for portion size
    let portionMultiplier = 1
    if (portionSize === 'half-pint') portionMultiplier = 0.5
    
    const adjustedCalories = Math.round(drink.calories * quantity * portionMultiplier)
    const adjustedUnits = drink.alcoholUnits * quantity * portionMultiplier
    
    // Save to quick_drinks table
    const drinkEntry = {
      date,
      drink_name: drink.name,
      quantity,
      portion_size: portionSize,
      calories: adjustedCalories,
      alcohol_units: adjustedUnits,
      timestamp: now
    }
    
    const { data: drinkData, error: drinkError } = await supabase
      .from('quick_drinks')
      .insert(drinkEntry)
      .select()
      .single()
    
    // Even if save fails, try to sync with lovely app
    try {
      await updateLovelyLager(supabase, adjustedUnits, date)
    } catch (lagerError) {
      console.error('Lovely sync failed:', lagerError)
    }
    
    if (drinkError) {
      console.error('Drink save error:', drinkError)
      return NextResponse.json({ 
        success: true, // Still return success for UI
        action: {
          item_name: drink.name,
          calories: adjustedCalories,
          alcohol_units: adjustedUnits,
          quantity,
          portion_size: portionSize
        },
        saved: false,
        error: 'Database save failed'
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      action: drinkData,
      saved: true
    })
    
  } catch (error: any) {
    console.error('Quick action error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to add quick action'
    }, { status: 500 })
  }
}