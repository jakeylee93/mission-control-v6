import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseAdmin()
    const body = await req.json()
    const { text, channel, structured } = body

    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const source = channel || 'webchat'

    // Format as structured entry if not already
    let content = text
    if (structured) {
      // Already structured — use as-is
      content = text
    } else if (!text.includes('**What**')) {
      // Auto-structure plain text
      content = `**What**: ${text}`
    }

    const { data, error } = await supabase
      .from('memory_logs')
      .insert([{
        date,
        channel: source,
        content,
        created_at: now.toISOString()
      }])
      .select('*')
      .single()

    if (error) {
      console.error('Memory add error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, entry: data })

  } catch (error: any) {
    console.error('Memory add error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}