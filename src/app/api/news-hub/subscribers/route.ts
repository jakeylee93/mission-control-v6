import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const brandId = searchParams.get('brand_id')
  const listId = searchParams.get('list_id')

  if (listId) {
    // Get subscribers for a specific list
    const { data, error } = await supabase
      .from('subscriber_members')
      .select('*, subscribers(*)')
      .eq('list_id', listId)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.message?.includes('does not exist')) return NextResponse.json({ ok: true, subscribers: [] })
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, subscribers: data || [] })
  }

  // Get subscriber lists for a brand
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from('subscriber_lists').select('*').order('name')
  if (brandId) query = query.eq('brand_id', brandId)

  const { data, error } = await query
  if (error) {
    if (error.message?.includes('does not exist')) return NextResponse.json({ ok: true, lists: [] })
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, lists: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const body = await req.json()

  if (body.action === 'create_list') {
    const { name, brand_id, description } = body
    const { data, error } = await supabase
      .from('subscriber_lists')
      .insert({ name, brand_id, description: description || null })
      .select()
      .single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, list: data })
  }

  if (body.action === 'add_subscriber') {
    const { list_id, email, name, tags } = body
    // Upsert subscriber
    const { data: sub, error: subErr } = await supabase
      .from('subscribers')
      .upsert({ email, name: name || null }, { onConflict: 'email' })
      .select()
      .single()

    if (subErr) return NextResponse.json({ ok: false, error: subErr.message }, { status: 500 })

    // Link to list
    const { error: linkErr } = await supabase
      .from('subscriber_members')
      .upsert({ list_id, subscriber_id: sub.id, tags: tags || null }, { onConflict: 'list_id,subscriber_id' })

    if (linkErr) return NextResponse.json({ ok: false, error: linkErr.message }, { status: 500 })
    return NextResponse.json({ ok: true, subscriber: sub })
  }

  if (body.action === 'import_csv') {
    const { list_id, rows } = body
    if (!Array.isArray(rows)) return NextResponse.json({ ok: false, error: 'rows must be array' }, { status: 400 })

    let imported = 0
    for (const row of rows) {
      if (!row.email) continue
      const { data: sub } = await supabase
        .from('subscribers')
        .upsert({ email: row.email, name: row.name || null }, { onConflict: 'email' })
        .select()
        .single()

      if (sub) {
        await supabase
          .from('subscriber_members')
          .upsert({ list_id, subscriber_id: sub.id }, { onConflict: 'list_id,subscriber_id' })
        imported++
      }
    }
    return NextResponse.json({ ok: true, imported })
  }

  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const { id, type } = await req.json()

  if (type === 'list') {
    await supabase.from('subscriber_members').delete().eq('list_id', id)
    const { error } = await supabase.from('subscriber_lists').delete().eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase.from('subscriber_members').delete().eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
