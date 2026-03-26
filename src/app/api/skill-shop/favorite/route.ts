import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// POST { slug, favorite, display_name?, summary?, category? }: toggle is_favorite in Supabase
// If skill doesn't exist yet (e.g. from live search), upsert it first
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { slug, favorite, display_name, summary, category } = body

  if (!slug) {
    return NextResponse.json({ ok: false, error: 'slug is required' }, { status: 400 })
  }

  // Upsert: if skill exists update favorite, if not insert it with favorite set
  const { data, error } = await supabase
    .from('skill_shop')
    .upsert({
      slug,
      is_favorite: Boolean(favorite),
      ...(display_name ? { display_name } : {}),
      ...(summary ? { summary } : {}),
      ...(category ? { category } : {}),
      source: 'clawhub',
      cached_at: new Date().toISOString(),
    }, { onConflict: 'slug' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, skill: data })
}
