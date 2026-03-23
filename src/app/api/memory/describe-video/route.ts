import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execSync } from 'child_process'

export const runtime = 'nodejs'

const OPENAI_TRANSCRIBE_URL = 'https://api.openai.com/v1/audio/transcriptions'
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions'
const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.avi', '.mkv'])
const FFMPEG_BIN = '/opt/homebrew/bin/ffmpeg'
const FFPROBE_BIN = '/opt/homebrew/bin/ffprobe'

function getExtension(fileName: string): string {
  const normalized = fileName.toLowerCase().trim()
  const dotIndex = normalized.lastIndexOf('.')
  if (dotIndex < 0) return ''
  return normalized.slice(dotIndex)
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

function runCommand(command: string): string {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function getExtractedFrames(tmpDir: string): string[] {
  return fs
    .readdirSync(tmpDir)
    .filter((name) => /^frame_\d+\.jpg$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => path.join(tmpDir, name))
}

async function transcribeAudio(apiKey: string, audioPath: string): Promise<string> {
  if (!fs.existsSync(audioPath)) return ''

  const audioBuffer = fs.readFileSync(audioPath)
  if (!audioBuffer.length) return ''

  const formData = new FormData()
  formData.append('model', 'whisper-1')
  formData.append('file', new File([audioBuffer], 'audio.wav', { type: 'audio/wav' }))

  const res = await fetch(OPENAI_TRANSCRIBE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const upstreamMessage =
      (data as { error?: { message?: string } } | null)?.error?.message ||
      'Audio transcription failed'
    throw new Error(upstreamMessage)
  }

  return String((data as { text?: string } | null)?.text || '').trim()
}

async function describeFrames(apiKey: string, framePaths: string[]): Promise<string> {
  const content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [
    {
      type: 'text',
      text: 'Describe what is happening in this video based on these frames. Be concise but descriptive.',
    },
  ]

  framePaths.forEach((framePath) => {
    const base64 = fs.readFileSync(framePath).toString('base64')
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${base64}`,
      },
    })
  })

  const res = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Describe what is happening in this video based on these frames. Be concise but descriptive.',
        },
        {
          role: 'user',
          content,
        },
      ],
    }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const upstreamMessage =
      (data as { error?: { message?: string } } | null)?.error?.message ||
      'Video description failed'
    throw new Error(upstreamMessage)
  }

  const description = String(
    (data as { choices?: Array<{ message?: { content?: string } }> } | null)?.choices?.[0]?.message?.content || '',
  ).trim()

  if (!description) {
    throw new Error('No video description returned')
  }

  return description
}

export async function POST(req: NextRequest) {
  let tmpDir = ''

  try {
    const apiKey = String(process.env.OPENAI_API_KEY || '').trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Video file is required' }, { status: 400 })
    }

    const extension = getExtension(file.name)
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use .mp4, .mov, .webm, .avi, or .mkv' },
        { status: 400 },
      )
    }

    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 100MB limit' }, { status: 400 })
    }

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-describe-'))

    const inputPath = path.join(tmpDir, `input${extension || '.mp4'}`)
    const framePatternPath = path.join(tmpDir, 'frame_%d.jpg')
    const audioPath = path.join(tmpDir, 'audio.wav')

    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(inputPath, buffer)

    let extractedFrames: string[] = []

    try {
      const probeOutput = runCommand(
        `${FFPROBE_BIN} -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of default=nokey=1:noprint_wrappers=1 ${shellQuote(inputPath)}`,
      )

      const totalFrames = Number.parseInt(probeOutput.trim(), 10)
      if (Number.isFinite(totalFrames) && totalFrames > 0) {
        const interval = Math.max(1, Math.floor(totalFrames / 4))
        runCommand(
          `${FFMPEG_BIN} -y -i ${shellQuote(inputPath)} -vf \"select=not(mod(n\\,${interval}))\" -frames:v 4 -vsync vfr ${shellQuote(framePatternPath)}`,
        )
        extractedFrames = getExtractedFrames(tmpDir)
      }
    } catch {
      extractedFrames = []
    }

    if (extractedFrames.length === 0) {
      runCommand(
        `${FFMPEG_BIN} -y -i ${shellQuote(inputPath)} -vf fps=1/10 -frames:v 4 ${shellQuote(framePatternPath)}`,
      )
      extractedFrames = getExtractedFrames(tmpDir)
    }

    if (extractedFrames.length === 0) {
      return NextResponse.json({ error: 'Could not extract frames from video' }, { status: 400 })
    }

    let transcription = ''
    try {
      runCommand(
        `${FFMPEG_BIN} -y -i ${shellQuote(inputPath)} -vn -acodec pcm_s16le -ar 16000 ${shellQuote(audioPath)}`,
      )
      transcription = await transcribeAudio(apiKey, audioPath)
    } catch {
      transcription = ''
    }

    const description = await describeFrames(apiKey, extractedFrames)
    const combined = `Video shows: ${description}\n\nAudio: ${transcription || 'No audio transcription available.'}`

    return NextResponse.json({
      ok: true,
      description,
      transcription,
      combined,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Video description failed' }, { status: 500 })
  } finally {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  }
}
