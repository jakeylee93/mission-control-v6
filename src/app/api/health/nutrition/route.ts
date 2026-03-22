import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

function dateStringUTC(date: Date): string {
  return date.getFullYear() + '-' + 
    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(date.getDate()).padStart(2, '0')
}

function isMissingTableError(error: any): boolean {
  return error?.code === '42P01' || 
    error?.code === 'PGRST204' || 
    error?.code === 'PGRST205' || 
    (error?.message && /nutrition_entries|relation|table/i.test(error.message))
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const searchParams = req.nextUrl.searchParams
  const date = searchParams.get('date') || dateStringUTC(new Date())
  
  try {
    const { data, error } = await supabase
      .from('nutrition_entries')
      .select('*')
      .gte('timestamp', `${date}T00:00:00.000Z`)
      .lt('timestamp', `${date}T23:59:59.999Z`)
      .order('timestamp', { ascending: false })
    
    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ entries: [], needsSetup: true })
      }
      throw error
    }
    
    return NextResponse.json({ entries: data || [] })
  } catch (error: any) {
    console.error('Failed to load nutrition entries:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to load nutrition entries' 
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  
  try {
    const body = await req.json()
    const entry = {
      timestamp: body.timestamp || new Date().toISOString(),
      image_url: body.image_url || null,
      foods: body.foods || [],
      total_calories: body.total_calories || 0,
      total_protein: body.total_protein || 0,
      total_carbs: body.total_carbs || 0,
      total_fat: body.total_fat || 0,
    }
    
    const { data, error } = await supabase
      .from('nutrition_entries')
      .insert(entry)
      .select()
      .single()
    
    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ 
          error: 'Nutrition table needs setup. Run setup first.' 
        }, { status: 400 })
      }
      throw error
    }
    
    return NextResponse.json({ entry: data })
  } catch (error: any) {
    console.error('Failed to create nutrition entry:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to create nutrition entry' 
    }, { status: 500 })
  }
}