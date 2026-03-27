import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const brandId = searchParams.get('brand_id')
  const folder = searchParams.get('folder')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (brandId) query = query.eq('brand_id', brandId)
  if (folder) query = query.eq('folder', folder)

  const { data, error } = await query.limit(50)

  if (error) {
    if (error.message?.includes('does not exist')) return NextResponse.json({ ok: true, campaigns: [] })
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, campaigns: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { title, brand_id, folder, template_id, sections, subject_line, list_id, scheduled_at, status } = body

  if (!title || !brand_id) {
    return NextResponse.json({ ok: false, error: 'title and brand_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      title,
      brand_id,
      folder: folder || 'newsletters',
      template_id: template_id || null,
      sections: sections || [],
      subject_line: subject_line || title,
      list_id: list_id || null,
      scheduled_at: scheduled_at || null,
      status: status || 'draft',
      html_content: null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, campaign: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, campaign: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { id } = await req.json()

  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
