import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const business = searchParams.get('business')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('news_favorites')
    .select('*, news_articles(*)')
    .order('saved_at', { ascending: false })

  if (business) query = query.eq('business', business)

  const { data, error } = await query

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({ ok: true, favorites: [] })
    }
    return NextResponse.json({ ok: false, error: error.message, favorites: [] })
  }

  return NextResponse.json({ ok: true, favorites: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { article_id, business } = body

  if (!article_id || !business) {
    return NextResponse.json({ ok: false, error: 'article_id and business required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('news_favorites')
    .insert({ article_id, business })
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({ ok: false, error: 'Table not ready yet' })
    }
    return NextResponse.json({ ok: false, error: error.message })
  }

  return NextResponse.json({ ok: true, favorite: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
  }

  const { error } = await supabase.from('news_favorites').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message })
  }

  return NextResponse.json({ ok: true })
}
