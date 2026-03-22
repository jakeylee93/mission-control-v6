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
    const { actionType, itemKey, quantity = 1 } = body
    
    if (actionType !== 'alcohol') {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 })
    }
    
    const drink = DRINK_OPTIONS[itemKey]
    if (!drink) {
      return NextResponse.json({ error: 'Invalid drink' }, { status: 400 })
    }
    
    const date = dateStringUTC(new Date())
    const now = new Date().toISOString()
    
    // Create quick action entry
    const { data: actionData, error: actionError } = await supabase
      .from('quick_actions')
      .insert({
        date,
        action_type: 'alcohol',
        item_name: drink.name,
        quantity,
        calories: drink.calories * quantity,
        alcohol_units: drink.alcoholUnits * quantity,
        timestamp: now
      })
      .select()
      .single()
    
    if (actionError) {
      // Try to setup tables if missing
      if (actionError.code === '42P01') {
        const setupRes = await fetch(`${req.nextUrl.origin}/api/health/setup`, {
          method: 'POST'
        })
        
        if (setupRes.ok) {
          // Retry the insert
          const { data: retryData, error: retryError } = await supabase
            .from('quick_actions')
            .insert({
              date,
              action_type: 'alcohol',
              item_name: drink.name,
              quantity,
              calories: drink.calories * quantity,
              alcohol_units: drink.alcoholUnits * quantity,
              timestamp: now
            })
            .select()
            .single()
          
          if (retryError) {
            throw retryError
          }
          
          // Sync with lovely app
          await updateLovelyLager(supabase, drink.alcoholUnits * quantity, date)
          
          return NextResponse.json({ success: true, action: retryData })
        }
      }
      
      throw actionError
    }
    
    // Sync with lovely app
    await updateLovelyLager(supabase, drink.alcoholUnits * quantity, date)
    
    return NextResponse.json({ success: true, action: actionData })
    
  } catch (error: any) {
    console.error('Quick action error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to add quick action'
    }, { status: 500 })
  }
}