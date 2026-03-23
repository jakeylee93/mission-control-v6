import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const MEMORY_DIR = '/Users/margaritabot/.openclaw/workspace/memory'
const INBOX_FILE = path.join(MEMORY_DIR, 'inbox.md')
const USAGE_CONFIG_FILE = path.join(MEMORY_DIR, 'usage', 'config.json')
const MOONSHOT_URL = 'https://api.moonshot.cn/v1/chat/completions'
const MOONSHOT_MODEL = 'kimi-k2.5'

type MemoryCategory =
  | 'people'
  | 'business'
  | 'preferences'
  | 'addresses'
  | 'projects'
  | 'decisions'
  | 'tech-setup'
  | 'general'

type CategorizedNote = {
  category: string
  text: string
}

const CATEGORY_FILE_MAP: Record<MemoryCategory, string> = {
  people: 'people.md',
  business: 'business.md',
  preferences: 'preferences.md',
  addresses: 'addresses.md',
  projects: 'projects.md',
  decisions: 'decisions.md',
  'tech-setup': 'tech-setup.md',
  general: 'general.md',
}

function normalizeCategory(category: string): MemoryCategory {
  const normalized = category.trim().toLowerCase() as MemoryCategory
  return normalized in CATEGORY_FILE_MAP ? normalized : 'general'
}

function getMoonshotApiKey(): string {
  const raw = fs.readFileSync(USAGE_CONFIG_FILE, 'utf8')
  const parsed = JSON.parse(raw) as { moonshot?: { key?: string } }
  const key = String(parsed?.moonshot?.key || '').trim()

  if (!key) {
    throw new Error('Moonshot API key missing at memory/usage/config.json (moonshot.key)')
  }

  return key
}

function extractJsonArray(raw: string): CategorizedNote[] {
  const trimmed = raw.trim()

  const parse = (input: string): CategorizedNote[] => {
    const parsed = JSON.parse(input) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is CategorizedNote => {
      return (
        item !== null &&
        typeof item === 'object' &&
        typeof (item as CategorizedNote).category === 'string' &&
        typeof (item as CategorizedNote).text === 'string'
      )
    })
  }

  try {
    return parse(trimmed)
  } catch {
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (codeBlockMatch?.[1]) {
      try {
        return parse(codeBlockMatch[1])
      } catch {
        // Continue to bracket fallback.
      }
    }

    const firstBracket = trimmed.indexOf('[')
    const lastBracket = trimmed.lastIndexOf(']')
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      return parse(trimmed.slice(firstBracket, lastBracket + 1))
    }

    throw new Error('Kimi response did not contain a valid JSON array')
  }
}

export async function POST() {
  try {
    let content = ''
    if (fs.existsSync(INBOX_FILE)) {
      content = fs.readFileSync(INBOX_FILE, 'utf8')
    }

    if (!content.trim()) {
      return NextResponse.json({ ok: true, message: 'Nothing to sync' })
    }

    const apiKey = getMoonshotApiKey()
    const prompt = [
      'You are a memory organiser.',
      'Read these raw notes and categorise each one.',
      'For each note, output a JSON array of { category, text }.',
      'Valid categories: people, business, preferences, addresses, projects, decisions, tech-setup.',
      'If unsure, use general.',
      '',
      'Raw notes:',
      content,
    ].join('\n')

    const moonshotResponse = await fetch(MOONSHOT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MOONSHOT_MODEL,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!moonshotResponse.ok) {
      const errorBody = await moonshotResponse.text()
      throw new Error(`Moonshot API error (${moonshotResponse.status}): ${errorBody}`)
    }

    const moonshotJson = (await moonshotResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const reply = String(moonshotJson?.choices?.[0]?.message?.content || '').trim()
    if (!reply) {
      throw new Error('Moonshot API returned an empty response')
    }

    const categorized = extractJsonArray(reply)
    if (categorized.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, categories: {} })
    }

    const byCategory: Record<MemoryCategory, string[]> = {
      people: [],
      business: [],
      preferences: [],
      addresses: [],
      projects: [],
      decisions: [],
      'tech-setup': [],
      general: [],
    }

    for (const item of categorized) {
      const text = item.text.trim()
      if (!text) continue
      const category = normalizeCategory(item.category)
      byCategory[category].push(text)
    }

    const summary: Record<string, number> = {}
    for (const [category, notes] of Object.entries(byCategory) as Array<[MemoryCategory, string[]]>) {
      if (notes.length === 0) continue

      const filePath = path.join(MEMORY_DIR, CATEGORY_FILE_MAP[category])
      const lines = notes.map((note) => `- ${note.replace(/\n+/g, ' ').trim()}`).join('\n')
      fs.appendFileSync(filePath, `${lines}\n`, 'utf8')
      summary[category] = notes.length
    }

    fs.writeFileSync(INBOX_FILE, '', 'utf8')

    const processed = Object.values(summary).reduce((acc, count) => acc + count, 0)
    return NextResponse.json({ ok: true, processed, categories: summary })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
