import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY!

const VOICES: Record<string, string> = {
  marg: process.env.ELEVENLABS_VOICE_MARG || 'VqnUrcwd7BwWj50MKEoX',
  doc: process.env.ELEVENLABS_VOICE_DOC || 'onwK4e9ZLuTAKqWW03F9',
  cindy: process.env.ELEVENLABS_VOICE_CINDY || 'pFZP5JQG7iQjIQuC4Bku',
}

const SYSTEM_PROMPTS: Record<string, string> = {
  marg: `You are Margarita (Marg), Jake's AI orchestrator and executive assistant. You're sharp, warm, slightly cheeky — like a trusted EA who genuinely cares. Keep voice replies SHORT — 1-3 sentences max. No filler, no "Great question!". Be real, be helpful, be brief.`,
  doc: `You are Doc, Jake's builder and coder agent. You're calm, technical, and witty. Named after a real doctor. Keep voice replies SHORT — 1-3 sentences max. Be direct and practical.`,
  cindy: `You are Cindy, Jake's executive assistant agent. You handle calendar, emails, and organisation. You're precise, reliable, and one step ahead. Keep voice replies SHORT — 1-3 sentences max.`,
}

async function persistMessage(params: {
  agent: string
  role: 'user' | 'assistant'
  content: string
  hasAudio?: boolean
}) {
  try {
    const supabase = createServerSupabaseAdmin()
    await supabase.from('chat_messages').insert({
      agent: params.agent,
      role: params.role,
      content: params.content,
      has_audio: Boolean(params.hasAudio),
    })
  } catch (error) {
    console.error('Failed to persist chat message:', error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, agent = 'marg', history = [] } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'No message' }, { status: 400 })
    }

    const normalizedAgent = String(agent || 'marg').toLowerCase()
    await persistMessage({
      agent: normalizedAgent,
      role: 'user',
      content: String(message).trim(),
      hasAudio: false,
    })

    // Build messages array
    const messages = [
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // Call Claude
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: agent === 'marg' ? 'claude-sonnet-4-20250514' : agent === 'doc' ? 'claude-sonnet-4-20250514' : 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM_PROMPTS[normalizedAgent] || SYSTEM_PROMPTS.marg,
        messages,
      }),
    })

    if (!claudeRes.ok) {
      const err = await claudeRes.text()
      console.error('Claude error:', err)
      return NextResponse.json({ error: 'Claude API error' }, { status: 500 })
    }

    const claudeData = await claudeRes.json()
    const text = claudeData.content?.[0]?.text || 'Sorry, I couldn\'t generate a response.'

    // Call ElevenLabs TTS
    const voiceId = VOICES[agent] || VOICES.marg
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_v3',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    })

    if (!ttsRes.ok) {
      // Return text only if TTS fails
      const ttsErr = await ttsRes.text()
      console.error('TTS error:', ttsErr)
      await persistMessage({
        agent: normalizedAgent,
        role: 'assistant',
        content: text,
        hasAudio: false,
      })
      return NextResponse.json({ text, audioUrl: null })
    }

    // Convert audio to base64
    const audioBuffer = await ttsRes.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    await persistMessage({
      agent: normalizedAgent,
      role: 'assistant',
      content: text,
      hasAudio: true,
    })

    return NextResponse.json({
      text,
      audioBase64: base64Audio,
      audioType: 'audio/mpeg',
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
