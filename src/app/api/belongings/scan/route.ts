import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

type Category =
  | 'Electronics'
  | 'Climbing Gear'
  | 'Tools'
  | 'Kitchen'
  | 'Business Equipment'
  | 'Office Equipment'
  | 'Other'

interface DetectedItem {
  name: string
  category: Category
  estimatedValue: string
  description: string
  suggestedLocation: string
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'belongings')
const VALID_CATEGORIES: Category[] = [
  'Electronics',
  'Climbing Gear',
  'Tools',
  'Kitchen',
  'Business Equipment',
  'Office Equipment',
  'Other',
]

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function extractContentText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  const textParts = content
    .map((part) => {
      if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
        return part.text
      }
      return ''
    })
    .filter(Boolean)

  return textParts.join('\n').trim()
}

function parseJsonArray(raw: string): unknown[] {
  const trimmed = raw.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    const match = trimmed.match(/\[[\s\S]*\]/)
    if (!match) return []
    try {
      const parsed = JSON.parse(match[0])
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
}

function normalizeItem(input: unknown): DetectedItem | null {
  if (!input || typeof input !== 'object') return null

  const raw = input as Record<string, unknown>
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null

  const category = typeof raw.category === 'string' && VALID_CATEGORIES.includes(raw.category as Category)
    ? (raw.category as Category)
    : 'Other'

  return {
    name,
    category,
    estimatedValue: typeof raw.estimatedValue === 'string' ? raw.estimatedValue.trim() : '',
    description: typeof raw.description === 'string' ? raw.description.trim() : '',
    suggestedLocation: typeof raw.suggestedLocation === 'string' ? raw.suggestedLocation.trim() : 'Home',
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
    }

    const formData = await req.formData()
    const image = (formData.get('image') ?? formData.get('file')) as File | null

    if (!image || image.size === 0) {
      return NextResponse.json({ ok: false, error: 'Image file is required' }, { status: 400 })
    }

    ensureDir(UPLOAD_DIR)

    const filename = `item-${Date.now()}.jpg`
    const filePath = path.join(UPLOAD_DIR, filename)
    const buffer = Buffer.from(await image.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    const mimeType = image.type || 'image/jpeg'
    const base64 = buffer.toString('base64')
    const dataUri = `data:${mimeType};base64,${base64}`

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are an inventory assistant. Analyse this photo and identify ALL distinct physical items visible. For each item return a JSON array of objects with: name (string), category (one of: Electronics, Climbing Gear, Tools, Kitchen, Business Equipment, Office Equipment, Other), estimatedValue (string like "£50"), description (brief), suggestedLocation (string). Be specific with item names. Return ONLY valid JSON array, no markdown.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify all distinct items in this image.' },
              { type: 'image_url', image_url: { url: dataUri } },
            ],
          },
        ],
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('OpenAI scan failed:', errText)
      return NextResponse.json({ ok: false, error: 'Failed to analyse image' }, { status: 502 })
    }

    const aiJson = (await aiResponse.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>
    }

    const rawContent = extractContentText(aiJson.choices?.[0]?.message?.content)
    const parsed = parseJsonArray(rawContent)
    const items = parsed.map(normalizeItem).filter((item): item is DetectedItem => item !== null)

    return NextResponse.json({
      ok: true,
      items,
      imagePath: `/belongings/${filename}`,
    })
  } catch (error) {
    console.error('Belongings scan error:', error)
    return NextResponse.json({ ok: false, error: 'Unable to scan items right now' }, { status: 500 })
  }
}
