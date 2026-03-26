import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// POST { slug, favorite: boolean }: toggle is_favorite in Supabase
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { slug, favorite } = body

  if (!slug) {
    return NextResponse.json({ ok: false, error: 'slug is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('skill_shop')
    .update({ is_favorite: Boolean(favorite) })
    .eq('slug', slug)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, skill: data })
}
