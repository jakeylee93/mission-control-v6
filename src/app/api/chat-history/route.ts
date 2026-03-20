import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

type MessageRole = 'user' | 'assistant'

export async function GET(req: NextRequest) {
  try {
    const agent = (req.nextUrl.searchParams.get('agent') || 'marg').toLowerCase()
    const limitParam = Number(req.nextUrl.searchParams.get('limit') || '80')
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 80

    const supabase = createServerSupabaseAdmin()
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, agent, role, content, has_audio, created_at')
      .eq('agent', agent)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      messages: (data || []).reverse(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load chat history'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const agent = String(body?.agent || 'marg').toLowerCase()
    const role = String(body?.role || '') as MessageRole
    const content = String(body?.content || '').trim()
    const hasAudio = Boolean(body?.hasAudio)

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json({ error: 'role must be user or assistant' }, { status: 400 })
    }

    const supabase = createServerSupabaseAdmin()
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        agent,
        role,
        content,
        has_audio: hasAudio,
      })
      .select('id, agent, role, content, has_audio, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save message'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
