import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const status = req.nextUrl.searchParams.get('status')

  try {
    let query = supabase
      .from('media_list')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ items: [] })
      }
      throw error
    }

    return NextResponse.json({ items: data || [] })
  } catch (error: any) {
    console.error('Get media list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()

  try {
    const body = await req.json()
    const { title, source, author, url, category, recommended_by, notes, status, description } = body

    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('media_list')
      .insert({
        title,
        source: source || null,
        author: author || null,
        url: url || null,
        category,
        recommended_by: recommended_by || null,
        notes: notes || null,
        status: status || 'todo',
        description: description || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, item: data })
  } catch (error: any) {
    console.error('Create media item error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Set completed_at when marking as done
    if (updates.status === 'done' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString()
    }
    // Clear completed_at when moving back from done
    if (updates.status && updates.status !== 'done') {
      updates.completed_at = null
    }

    const { data, error } = await supabase
      .from('media_list')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, item: data })
  } catch (error: any) {
    console.error('Update media item error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()

  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('media_list')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete media item error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
