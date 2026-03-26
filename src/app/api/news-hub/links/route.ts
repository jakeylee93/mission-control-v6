import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const business = searchParams.get('business')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('news_links')
    .select('*')
    .order('added_at', { ascending: false })

  if (business) query = query.eq('business', business)

  const { data, error } = await query

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({ ok: true, links: [] })
    }
    return NextResponse.json({ ok: false, error: error.message, links: [] })
  }

  return NextResponse.json({ ok: true, links: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { url, title, notes, source_platform, category, business } = body

  if (!url || !business) {
    return NextResponse.json({ ok: false, error: 'url and business required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('news_links')
    .insert({ url, title, notes, source_platform, category, business })
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({ ok: false, error: 'Table not ready yet' })
    }
    return NextResponse.json({ ok: false, error: error.message })
  }

  return NextResponse.json({ ok: true, link: data })
}
