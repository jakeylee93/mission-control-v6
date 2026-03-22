import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseAdmin()
    const body = await req.json()
    const { date, drinkIndex } = body

    if (!date || drinkIndex === undefined) {
      return NextResponse.json({ error: 'Missing date or drinkIndex' }, { status: 400 })
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

    const existingLog = currentRow.log || []
    const drinks = []
    const timestamps = []
    
    // Separate drinks from timestamps
    for (const item of existingLog) {
      if (typeof item === 'string') {
        timestamps.push(item)
      } else if (typeof item === 'object' && item.name) {
        drinks.push(item)
      }
    }

    // Remove drink at specified index
    if (drinkIndex >= 0 && drinkIndex < drinks.length) {
      drinks.splice(drinkIndex, 1)
      // Also remove corresponding timestamp if it exists
      if (drinkIndex < timestamps.length) {
        timestamps.splice(drinkIndex, 1)
      }
    } else {
      return NextResponse.json({ error: 'Invalid drink index' }, { status: 400 })
    }

    // Rebuild log
    const newLog = []
    for (let i = 0; i < Math.max(timestamps.length, drinks.length); i++) {
      if (i < timestamps.length) newLog.push(timestamps[i])
      if (i < drinks.length) newLog.push(drinks[i])
    }

    // Update database
    const { data: updated, error: updateError } = await supabase
      .from('lovely_water')
      .update({
        glasses: drinks.length,
        log: newLog,
        updated_at: new Date().toISOString(),
      })
      .eq('date', date)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      deleted: true,
      remaining: drinks.length 
    })

  } catch (error: any) {
    console.error('Delete drink error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}