import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const brandId = searchParams.get('brand_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from('news_industries').select('*').order('name')
  if (brandId) query = query.eq('brand_id', brandId)

  const { data, error } = await query

  if (error) {
    if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json({ ok: true, industries: [] })
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, industries: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { name, brand_id } = await req.json()

  const { data, error } = await supabase
    .from('news_industries')
    .insert({ name, brand_id: brand_id || null })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, industry: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { id } = await req.json()

  const { error } = await supabase.from('news_industries').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
