import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = createServerSupabaseAdmin()
  const { data, error } = await supabase
    .from('news_industries')
    .select('*')
    .order('name')

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
  const { name } = await req.json()

  const { data, error } = await supabase
    .from('news_industries')
    .insert({ name })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, industry: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { id } = await req.json()

  const { error } = await supabase
    .from('news_industries')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
