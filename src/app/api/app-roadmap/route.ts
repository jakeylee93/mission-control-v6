import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = createServerSupabaseAdmin()
  const { data, error } = await supabase
    .from('app_roadmap')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json({ ok: true, apps: [] })
    }
    return NextResponse.json({ ok: false, error: error.message, apps: [] })
  }

  return NextResponse.json({ ok: true, apps: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { name, description, icon, status, phases, ideas, fixes, category } = body

  if (!name?.trim()) {
    return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('app_roadmap')
    .insert({
      name,
      description: description || '',
      icon: icon || '📱',
      status: status || 'idea',
      category: category || 'business',
      phases: phases || [],
      ideas: ideas || [],
      fixes: fixes || [],
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message })
  }

  return NextResponse.json({ ok: true, app: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

  // Always update the timestamp
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('app_roadmap')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message })
  return NextResponse.json({ ok: true, app: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { id } = await req.json()

  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('app_roadmap').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message })
  return NextResponse.json({ ok: true })
}
