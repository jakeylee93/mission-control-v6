import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { article_id } = body

  if (!article_id) {
    return NextResponse.json({ ok: false, error: 'article_id required' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  const supabase = createServerSupabaseAdmin()

  // Get the article
  const { data: article, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('id', article_id)
    .single()

  if (error || !article) {
    return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 })
  }

  // If already has a good summary (more than the Brave snippet), return it
  if (article.ai_summary) {
    return NextResponse.json({ ok: true, summary: article.ai_summary })
  }

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Summarize this news article in 2-3 sentences. Be concise and informative. Focus on what happened and why it matters.

Title: ${article.title}
Source: ${article.source || 'Unknown'}
Description: ${article.summary || 'No description available'}
URL: ${article.url}

Return ONLY the summary, nothing else.`
      }],
    })

    const summary = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Save the AI summary back to the article
    await supabase
      .from('news_articles')
      .update({ ai_summary: summary })
      .eq('id', article_id)

    return NextResponse.json({ ok: true, summary })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Summary failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
