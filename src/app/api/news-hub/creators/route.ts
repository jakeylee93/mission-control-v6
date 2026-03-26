import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = createServerSupabaseAdmin()
  try {
    const { data, error } = await supabase
      .from('news_creators')
      .select('*')
      .order('name', { ascending: true })
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ ok: true, creators: [] })
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, creators: data || [] })
  } catch (e: any) {
    return NextResponse.json({ ok: true, creators: [] })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { name, platform = 'all' } = body
  if (!name?.trim()) {
    return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 400 })
  }
  const supabase = createServerSupabaseAdmin()
  try {
    const { data, error } = await supabase
      .from('news_creators')
      .insert({ name: name.trim(), platform })
      .select()
      .single()
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return NextResponse.json({ ok: false, error: 'Table does not exist' }, { status: 500 })
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, creator: data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { id } = body
  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID is required' }, { status: 400 })
  }
  const supabase = createServerSupabaseAdmin()
  try {
    const { error } = await supabase.from('news_creators').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
