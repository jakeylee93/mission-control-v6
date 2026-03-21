import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const SYSTEM_PROMPT = "You are a helpful assistant for Jake. Keep answers concise and practical. You are embedded in Mission Control, Jake's personal dashboard."

type ChatRole = 'user' | 'assistant'
type ChatMessage = { role: ChatRole; content: string }

function normalizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return []
  const normalized = history
    .filter((item): item is { role: string; content: string } => {
      if (!item || typeof item !== 'object') return false
      const maybe = item as { role?: unknown; content?: unknown }
      return typeof maybe.role === 'string' && typeof maybe.content === 'string'
    })
    .map((item): ChatMessage => ({
      role: (item.role === 'assistant' ? 'assistant' : 'user') as ChatRole,
      content: item.content.trim(),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-10)

  return normalized
}

async function persistMessage(role: ChatRole, content: string) {
  try {
    const supabase = createServerSupabaseAdmin()
    const { error } = await supabase.from('chat_quick_log').insert({ role, content })
    if (!error) return

    const maybeMissingTable =
      error.code === '42P01' ||
      error.code === 'PGRST205' ||
      error.code === 'PGRST204' ||
      /chat_quick_log|relation|table/i.test(error.message || '')

    if (!maybeMissingTable) {
      console.error('Failed to persist chat_quick_log message:', error)
    }
  } catch (error) {
    console.error('Unexpected error persisting chat_quick_log message:', error)
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
    }

    const body = await req.json()
    const message = String(body?.message || '').trim()
    const history = normalizeHistory(body?.history)

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 })
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message },
    ]

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 500,
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.text()
      console.error('OpenAI chat-quick error:', err)
      return NextResponse.json({ error: 'OpenAI API error' }, { status: 500 })
    }

    const data = await openaiRes.json()
    const text = String(data?.choices?.[0]?.message?.content || '').trim() || 'Sorry, I could not generate a response.'

    await persistMessage('user', message)
    await persistMessage('assistant', text)

    return NextResponse.json({ text })
  } catch (error) {
    console.error('chat-quick route error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
