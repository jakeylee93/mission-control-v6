import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  
  try {
    // Force create the table by attempting insert
    const { data, error } = await supabase
      .from('lovely_lager')
      .insert({
        date: '2026-03-22',
        glasses: 1,
        goal: 0,
        log: [new Date().toISOString()],
        drinks: [{
          name: 'Test Drink',
          portion: 'pint',
          calories: 100,
          alcoholUnits: 1.0,
          timestamp: new Date().toISOString()
        }]
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Lager table created and test data inserted',
      data
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to create table'
    })
  }
}