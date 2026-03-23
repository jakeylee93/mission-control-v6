import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerSupabaseAdmin()

  try {
    const { data, error } = await supabase
      .from('drink_collection')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ drinks: {}, grouped: {} })
      }
      throw error
    }

    // Group by category
    const grouped: Record<string, typeof data> = {}
    for (const drink of data || []) {
      const cat = drink.category || 'beer'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(drink)
    }

    return NextResponse.json({ drinks: data || [], grouped })
  } catch (error: any) {
    console.error('Get drink collection error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()

  try {
    const body = await req.json()
    const { category, name, calories, alcohol_units, portion, image_url } = body

    if (!category || !name) {
      return NextResponse.json({ error: 'Category and name are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('drink_collection')
      .insert({
        category,
        name,
        calories: calories || 0,
        alcohol_units: alcohol_units || 0,
        portion: portion || 'pint',
        image_url: image_url || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, drink: data })
  } catch (error: any) {
    console.error('Add drink to collection error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()

  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('drink_collection')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete drink from collection error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
