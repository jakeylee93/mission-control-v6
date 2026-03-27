import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const business = searchParams.get('business')
  const archived = searchParams.get('archived') === 'true'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('news_favorites')
    .select('*, news_articles(*)')
    .order('saved_at', { ascending: false })

  if (business) query = query.eq('business', business)
  if (archived) {
    query = query.eq('is_archived', true)
  } else {
    query = query.or('is_archived.is.null,is_archived.eq.false')
  }

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
    .insert({ article_id, business, is_archived: false })
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

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { id, is_archived } = body

  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('news_favorites')
    .update({ is_archived: is_archived ?? true })
    .eq('id', id)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { id } = await req.json()

  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('news_favorites').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message })
  return NextResponse.json({ ok: true })
}
