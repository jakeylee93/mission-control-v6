import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseAdmin()
    const body = await req.json()
    const { date, drinkIndex, updates } = body

    if (!date || drinkIndex === undefined || !updates) {
      return NextResponse.json({ error: 'Missing date, drinkIndex, or updates' }, { status: 400 })
    }

    // Get current data
    const { data: currentRow, error: currentError } = await supabase
      .from('lovely_water')
      .select('*')
      .eq('date', date)
      .maybeSingle()

    if (currentError) {
      return NextResponse.json({ error: currentError.message }, { status: 500 })
    }

    if (!currentRow) {
      return NextResponse.json({ error: 'No data found for this date' }, { status: 404 })
    }

    const existingLog = (currentRow as any).log || []
    const drinks: any[] = []
    const timestamps: string[] = []

    for (const item of existingLog) {
      if (typeof item === 'string') {
        timestamps.push(item)
      } else if (typeof item === 'object' && item.name) {
        drinks.push(item)
      }
    }

    if (drinkIndex < 0 || drinkIndex >= drinks.length) {
      return NextResponse.json({ error: 'Invalid drink index' }, { status: 400 })
    }

    // Apply updates to the drink
    const drink = drinks[drinkIndex]
    if (updates.quantity !== undefined) {
      drink.quantity = updates.quantity
    }
    if (updates.name !== undefined) {
      drink.name = updates.name
    }
    if (updates.calories !== undefined) {
      drink.calories = updates.calories
    }
    if (updates.alcoholUnits !== undefined) {
      drink.alcoholUnits = updates.alcoholUnits
    }
    if (updates.portion !== undefined) {
      drink.portion = updates.portion
    }

    drinks[drinkIndex] = drink

    // Rebuild log - interleave timestamps and drinks
    const newLog: any[] = []
    for (let i = 0; i < Math.max(timestamps.length, drinks.length); i++) {
      if (i < timestamps.length) newLog.push(timestamps[i])
      if (i < drinks.length) newLog.push(drinks[i])
    }

    // Update database
    const { error: updateError } = await supabase
      .from('lovely_water')
      .update({
        log: newLog,
        updated_at: new Date().toISOString(),
      })
      .eq('date', date)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, drink: drinks[drinkIndex] })

  } catch (error: any) {
    console.error('Update drink error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}