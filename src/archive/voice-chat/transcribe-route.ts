import { NextRequest, NextResponse } from 'next/server'

const OPENAI_TRANSCRIBE_URL = 'https://api.openai.com/v1/audio/transcriptions'
const MAX_FILE_SIZE = 25 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.m4a', '.mp3', '.ogg', '.wav', '.webm', '.mp4'])

function getExtension(fileName: string): string {
  const normalized = fileName.toLowerCase().trim()
  const dotIndex = normalized.lastIndexOf('.')
  if (dotIndex < 0) return ''
  return normalized.slice(dotIndex)
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = String(process.env.OPENAI_API_KEY || '').trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    const extension = getExtension(file.name)
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use .m4a, .mp3, .ogg, .wav, .webm, or .mp4' },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 25MB limit' }, { status: 400 })
    }

    const upstreamBody = new FormData()
    upstreamBody.append('model', 'whisper-1')
    upstreamBody.append('file', file)

    const upstreamRes = await fetch(OPENAI_TRANSCRIBE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamBody,
    })

    const upstreamJson = await upstreamRes.json().catch(() => null)
    if (!upstreamRes.ok) {
      const upstreamMessage =
        (upstreamJson as { error?: { message?: string } } | null)?.error?.message ||
        'Transcription failed'

      return NextResponse.json({ error: upstreamMessage }, { status: 502 })
    }

    const text = String((upstreamJson as { text?: string } | null)?.text || '').trim()
    if (!text) {
      return NextResponse.json({ error: 'No transcription text returned' }, { status: 502 })
    }

    return NextResponse.json({ ok: true, text })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Transcription failed' }, { status: 500 })
  }
}
