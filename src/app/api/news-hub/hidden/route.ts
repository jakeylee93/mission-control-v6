import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET — list hidden article IDs for a business/brand
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const business = searchParams.get('business')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('news_hidden_articles')
    .select('article_id')

  if (business) query = query.eq('business', business)

  const { data, error } = await query

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({ ok: true, hidden: [] })
    }
    return NextResponse.json({ ok: false, error: error.message, hidden: [] })
  }

  return NextResponse.json({ ok: true, hidden: (data || []).map((r: { article_id: string }) => r.article_id) })
}

// POST — hide an article
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { article_id, business } = body

  if (!article_id || !business) {
    return NextResponse.json({ ok: false, error: 'article_id and business required' }, { status: 400 })
  }

  // Upsert — ignore if already hidden
  const { error } = await supabase
    .from('news_hidden_articles')
    .upsert({ article_id, business }, { onConflict: 'article_id,business' })

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json({ ok: false, error: 'Table not ready — run the SQL to create news_hidden_articles' })
    }
    return NextResponse.json({ ok: false, error: error.message })
  }

  return NextResponse.json({ ok: true })
}

// DELETE — unhide an article
export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { article_id, business } = await req.json()

  if (!article_id) return NextResponse.json({ ok: false, error: 'article_id required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from('news_hidden_articles').delete().eq('article_id', article_id)
  if (business) query = query.eq('business', business)

  const { error } = await query
  if (error) return NextResponse.json({ ok: false, error: error.message })
  return NextResponse.json({ ok: true })
}
