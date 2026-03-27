import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const brandId = searchParams.get('brand_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from('email_templates').select('*').order('name')
  if (brandId) query = query.eq('brand_id', brandId)

  const { data, error } = await query
  if (error) {
    if (error.message?.includes('does not exist')) return NextResponse.json({ ok: true, templates: [] })
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, templates: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()
  const { name, brand_id, sections, header_image, footer_html, primary_color, secondary_color } = body

  if (!name || !brand_id) {
    return NextResponse.json({ ok: false, error: 'name and brand_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      name,
      brand_id,
      sections: sections || [
        { type: 'hero', heading: 'Newsletter Title', body: 'Your intro text here...', image_url: null, cta_text: null, cta_url: null },
        { type: 'text', heading: 'Section Heading', body: 'Your content here...', image_url: null, cta_text: null, cta_url: null },
        { type: 'offer', heading: 'Special Offer', body: 'Describe your offer...', image_url: null, cta_text: 'Learn More', cta_url: null },
      ],
      header_image: header_image || null,
      footer_html: footer_html || null,
      primary_color: primary_color || '#6366f1',
      secondary_color: secondary_color || '#f0eee8',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, template: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('email_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, template: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { id } = await req.json()
  const { error } = await supabase.from('email_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
