import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { searchParams } = new URL(req.url)

  const category = searchParams.get('category')
  const business = searchParams.get('business')
  const trending = searchParams.get('trending') === 'true'
  const archived = searchParams.get('archived') === 'true'
  const limit = parseInt(searchParams.get('limit') || '80', 10)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('news_articles')
    .select('*')
    .order('published_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (business) query = query.eq('business', business)
  if (trending) query = query.eq('is_trending', true)
  
  // By default hide articles older than 7 days (archived), unless asking for archived
  if (!archived) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('published_at', sevenDaysAgo)
  }

  const { data, error } = await query.limit(limit)

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({ ok: true, articles: [] })
    }
    return NextResponse.json({ ok: false, error: error.message, articles: [] })
  }

  return NextResponse.json({ ok: true, articles: data || [] })
}
