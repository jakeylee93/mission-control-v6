import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import path from 'path'

const BELONGINGS_DIR = path.join(process.cwd(), 'public', 'belongings')
const QUEUE_FILE = '/Users/margaritabot/.openclaw/workspace/memory/belongings-queue.json'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const action = formData.get('action') as string | null

    // If action is "sync", process the queue
    if (action === 'sync') {
      return await processQueue()
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Save image
    mkdirSync(BELONGINGS_DIR, { recursive: true })
    const filename = `item-${Date.now()}.jpg`
    const filepath = path.join(BELONGINGS_DIR, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    writeFileSync(filepath, buffer)

    // Add to queue
    const queue = loadQueue()
    queue.push({
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      imagePath: `/belongings/${filename}`,
      addedAt: new Date().toISOString(),
      status: 'pending',
    })
    saveQueue(queue)

    return NextResponse.json({ ok: true, queueLength: queue.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scan failed' }, { status: 500 })
  }
}

// GET: return current queue
export async function GET() {
  return NextResponse.json({ queue: loadQueue() })
}

// DELETE: remove item from queue
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    const queue = loadQueue().filter((q: any) => q.id !== id)
    saveQueue(queue)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function loadQueue(): any[] {
  try {
    if (existsSync(QUEUE_FILE)) {
      return JSON.parse(readFileSync(QUEUE_FILE, 'utf8'))
    }
  } catch {}
  return []
}

function saveQueue(queue: any[]) {
  mkdirSync(path.dirname(QUEUE_FILE), { recursive: true })
  writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))
}

async function processQueue() {
  const queue = loadQueue()
  const pending = queue.filter((q: any) => q.status === 'pending')

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, results: [], message: 'Nothing to process' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 })
  }

  const allResults: any[] = []

  for (const item of pending) {
    try {
      const imgPath = path.join(process.cwd(), 'public', item.imagePath)
      if (!existsSync(imgPath)) continue

      const imgBuffer = readFileSync(imgPath)
      const base64 = imgBuffer.toString('base64')
      const mimeType = 'image/jpeg'

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an inventory assistant. Analyse this photo and identify ALL distinct physical items visible.

For each item return a JSON array of objects with:
- name: specific product name if recognisable, otherwise descriptive name
- category: one of [Electronics, Climbing Gear, Tools, Kitchen, Business Equipment, Office Equipment, Toiletries & Grooming, Clothing, Food & Drink, Sports & Fitness, Home, Other]
- categoryConfidence: number 0-100 (how sure you are about the category)
- alternateCategories: array of up to 2 other possible categories
- estimatedValue: string like "£50" (your best estimate of current retail value)
- priceSearchQuery: a good Google Shopping search query to find this exact item (e.g. "Nivea Men Moisturiser 75ml")
- description: brief description
- condition: one of [New, Good, Fair, Poor]
- suggestedLocation: likely storage location

Return ONLY a valid JSON array, no markdown, no explanation.`
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Identify all items in this photo:' },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
              ]
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      })

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || '[]'

      // Parse JSON from response
      let items: any[] = []
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          items = JSON.parse(jsonMatch[0])
        }
      } catch {}

      // Attach image to each detected item
      for (const detected of items) {
        allResults.push({
          id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ...detected,
          imagePath: item.imagePath,
          queueId: item.id,
          scannedAt: new Date().toISOString(),
        })
      }

      // Mark queue item as processed
      item.status = 'processed'
    } catch (err: any) {
      item.status = 'error'
      item.error = err.message
    }
  }

  saveQueue(queue)
  return NextResponse.json({ ok: true, results: allResults })
}
