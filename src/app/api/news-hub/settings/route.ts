import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// Default businesses (used if table doesn't exist yet)
const DEFAULT_BUSINESSES = [
  { id: 'barpeople', name: 'The Bar People', color: '#ef4444', logo_url: null, tone: 'professional', is_client: false },
  { id: 'bookedevents', name: 'Booked Events', color: '#6366f1', logo_url: null, tone: 'professional', is_client: false },
  { id: 'anyvendor', name: 'AnyVendor', color: '#f59e0b', logo_url: null, tone: 'professional', is_client: false },
]

export async function GET() {
  const supabase = createServerSupabaseAdmin()
  
  // Try to fetch from brands table
  const { data: brands, error } = await supabase
    .from('brands')
    .select('*')
    .order('is_client', { ascending: true })
    .order('name')

  if (error || !brands || brands.length === 0) {
    // Fallback to defaults
    return NextResponse.json({ ok: true, businesses: DEFAULT_BUSINESSES })
  }

  return NextResponse.json({ ok: true, businesses: brands })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { name, color, logo_url, tone, is_client, primary_color, secondary_color, font } = body

  if (!name) {
    return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 })
  }

  // Generate a slug id
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const { data, error } = await supabase
    .from('brands')
    .insert({
      id,
      name,
      color: color || '#6366f1',
      logo_url: logo_url || null,
      tone: tone || 'professional',
      is_client: is_client || false,
      primary_color: primary_color || color || '#6366f1',
      secondary_color: secondary_color || null,
      font: font || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, brand: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, brand: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase.from('brands').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
