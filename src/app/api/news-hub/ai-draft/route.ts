import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, title, brand_name, brand_tone, sections, section_index, section_text, context } = body

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  const client = new Anthropic({ apiKey })

  if (action === 'draft') {
    // Generate a full newsletter draft from a title
    const prompt = `You are writing a professional email newsletter for "${brand_name || 'the business'}".
Tone: ${brand_tone || 'professional, warm, and engaging'}.

The newsletter title is: "${title}"

${context ? `IMPORTANT — Use ONLY these real articles/content as the basis for the newsletter. Do NOT invent or hallucinate content:\n${context}\n` : ''}
Generate a newsletter with 4-6 sections. Each section should have:
- A heading (short, punchy)
- Body text (2-4 sentences, engaging and informative)
- An optional call-to-action text

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "subject_line": "The email subject line",
  "sections": [
    {
      "type": "hero",
      "heading": "Main headline",
      "body": "Opening paragraph text",
      "image_url": null,
      "cta_text": null,
      "cta_url": null
    },
    {
      "type": "text",
      "heading": "Section heading",
      "body": "Section content",
      "image_url": null,
      "cta_text": "Read More",
      "cta_url": null
    }
  ]
}

Section types can be: "hero", "text", "image", "offer", "cta", "divider".
Make it compelling and on-brand. Do NOT include unsubscribe or footer sections — those are added automatically.`

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      // Try to parse JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ ok: false, error: 'Failed to parse AI response' }, { status: 500 })
      }

      const parsed = JSON.parse(jsonMatch[0])
      return NextResponse.json({ ok: true, ...parsed })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI generation failed'
      return NextResponse.json({ ok: false, error: message }, { status: 500 })
    }
  }

  if (action === 'enhance') {
    // Enhance a specific section's text
    const prompt = `Improve this newsletter section text. Make it more engaging, professional, and compelling.
Brand: ${brand_name || 'Business'}
Tone: ${brand_tone || 'professional and warm'}

Original text:
"${section_text}"

Return ONLY the improved text, nothing else. Keep it roughly the same length. Don't add quotes around it.`

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      return NextResponse.json({ ok: true, enhanced_text: text.trim() })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Enhancement failed'
      return NextResponse.json({ ok: false, error: message }, { status: 500 })
    }
  }

  if (action === 'enhance_all') {
    // Enhance all sections
    const prompt = `Improve this entire newsletter. Make each section more engaging and compelling.
Brand: ${brand_name || 'Business'}
Tone: ${brand_tone || 'professional and warm'}

Current sections:
${JSON.stringify(sections, null, 2)}

Return ONLY valid JSON — an array of the improved sections in the same format. Keep the same structure, just improve the text.`

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        return NextResponse.json({ ok: false, error: 'Failed to parse AI response' }, { status: 500 })
      }

      const enhanced = JSON.parse(jsonMatch[0])
      return NextResponse.json({ ok: true, sections: enhanced })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Enhancement failed'
      return NextResponse.json({ ok: false, error: message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: false, error: 'Unknown action. Use: draft, enhance, enhance_all' }, { status: 400 })
}
