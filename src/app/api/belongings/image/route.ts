import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

const BELONGINGS_DIR = path.join(process.cwd(), 'public', 'belongings')

export async function POST(req: NextRequest) {
  try {
    const { query, itemId } = await req.json()
    if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 })

    mkdirSync(BELONGINGS_DIR, { recursive: true })

    // Strategy 1: Brave Image Search
    const braveKey = process.env.BRAVE_SEARCH_API_KEY
    if (braveKey) {
      try {
        const searchUrl = `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query + ' product')}&count=8&country=gb&safesearch=strict`
        const res = await fetch(searchUrl, {
          headers: { 'X-Subscription-Token': braveKey, Accept: 'application/json' },
        })
        const data = await res.json()
        const results = (data.results || []).slice(0, 8)

        for (const r of results) {
          const imgUrl = r.properties?.url || r.thumbnail?.src
          if (!imgUrl) continue
          const saved = await downloadImage(imgUrl, itemId)
          if (saved) return NextResponse.json({ ok: true, imagePath: saved })
        }
      } catch {}
    }

    // Strategy 2: Use OpenAI to search and find an image URL
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      try {
        // Ask GPT to give us a direct image URL for this product
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: `I need a direct image URL for this product: "${query}". Give me 3 direct URLs to product images (jpg/png) from major retailers (Amazon, Boots, Superdrug, Tesco, etc). Return ONLY a JSON array of URL strings, nothing else.`
            }],
            max_tokens: 500,
            temperature: 0.3,
          }),
        })
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content || ''
        const urls = JSON.parse(content.match(/\[[\s\S]*\]/)?.[0] || '[]')

        for (const url of urls) {
          const saved = await downloadImage(url, itemId)
          if (saved) return NextResponse.json({ ok: true, imagePath: saved })
        }
      } catch {}
    }

    // Strategy 3: Scrape Google Images
    try {
      const googleUrl = `https://www.google.co.uk/search?tbm=isch&q=${encodeURIComponent(query + ' product photo')}`
      const res = await fetch(googleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
        },
      })
      const html = await res.text()
      // Extract image URLs from Google's HTML
      const imgMatches = html.match(/\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)",\d+,\d+\]/g) || []
      for (const match of imgMatches.slice(0, 5)) {
        const urlMatch = match.match(/"(https?:\/\/[^"]+)"/)
        if (urlMatch) {
          const saved = await downloadImage(urlMatch[1], itemId)
          if (saved) return NextResponse.json({ ok: true, imagePath: saved })
        }
      }
    } catch {}

    // All strategies failed
    return NextResponse.json({
      ok: false,
      error: 'Could not find product image',
      searchUrl: `https://www.google.co.uk/search?tbm=isch&q=${encodeURIComponent(query + ' product')}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function downloadImage(url: string, itemId: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('image')) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 1000) return null // Skip tiny images

    const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg'
    const filename = `product-${itemId || Date.now()}-${Date.now()}.${ext}`
    writeFileSync(path.join(BELONGINGS_DIR, filename), buffer)
    return `/api/belongings/img?f=${filename}`
  } catch {
    return null
  }
}
