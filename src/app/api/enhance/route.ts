import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const PROMPTS: Record<string, string> = {
  summarize: `You are a concise assistant. Summarize the following text into key points only.
Be very brief — 1-3 bullet points or a single short sentence.
Strip filler words, hesitations, and redundancy.
Return only the summary, no preamble.`,

  enhance: `You are a clarity assistant. Rewrite the following text to be clear, professional, and actionable.
Fix grammar, remove filler words like "um", "like", "uh". Keep the core meaning intact.
If it's a task or reminder, make it actionable. If it's a note, make it clear.
Return only the rewritten text, no preamble.`,

  expand: `You are a detail-extraction assistant. Expand the following text by:
- Identifying the full context and intent
- Extracting any implied tasks, subtasks, or deadlines
- Adding structure if it's a plan or to-do
- Flagging any missing information that should be clarified
Return a structured, expanded version with clear sections if needed.`,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, type } = body

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const validTypes = ['summarize', 'enhance', 'expand']
    const enhancementType = validTypes.includes(type) ? type : 'enhance'

    const systemPrompt = PROMPTS[enhancementType]

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: text.trim(),
        },
      ],
      system: systemPrompt,
    })

    const enhancedText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n')

    return NextResponse.json({
      ok: true,
      originalText: text.trim(),
      enhancedText,
      enhancementType,
      timestamp: new Date().toISOString(),
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    })
  } catch (err: unknown) {
    console.error('Enhance API error:', err)
    const message = err instanceof Error ? err.message : 'Enhancement failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
