import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET: return all items from skill_build_queue ordered by created_at desc
export async function GET() {
  const supabase = createServerSupabaseAdmin()

  const { data, error } = await supabase
    .from('skill_build_queue')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, items: [] })
  }

  return NextResponse.json({ ok: true, items: data || [] })
}

// POST { slug, display_name, summary, user_note }: add to build queue
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { slug, display_name, summary, user_note } = body

  if (!slug) {
    return NextResponse.json({ ok: false, error: 'slug is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('skill_build_queue')
    .insert({
      slug,
      display_name: display_name || slug,
      summary: summary || null,
      user_note: user_note || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, item: data })
}

// PATCH { id, status, acknowledged_at }: update queue item status
export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { id, status, acknowledged_at } = body

  if (!id) {
    return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = {}
  if (status !== undefined) updates.status = status
  if (acknowledged_at !== undefined) updates.acknowledged_at = acknowledged_at

  const { data, error } = await supabase
    .from('skill_build_queue')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, item: data })
}
