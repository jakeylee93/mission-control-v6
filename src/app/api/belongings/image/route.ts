import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

const BELONGINGS_DIR = path.join(process.cwd(), 'public', 'belongings')

export async function POST(req: NextRequest) {
  try {
    const { query, itemId } = await req.json()
    if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 })

    // Use OpenAI to generate a good search query, then use Brave image search
    const braveKey = process.env.BRAVE_SEARCH_API_KEY

    let imageUrl: string | null = null
    let searchResults: any[] = []

    if (braveKey) {
      // Brave Image Search
      const searchUrl = `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query + ' product photo square white background')}&count=8&country=gb&safesearch=strict`
      const res = await fetch(searchUrl, {
        headers: { 'X-Subscription-Token': braveKey, Accept: 'application/json' },
      })
      const data = await res.json()
      searchResults = (data.results || []).slice(0, 8).map((r: any) => ({
        url: r.properties?.url || r.thumbnail?.src || r.url,
        thumb: r.thumbnail?.src || r.properties?.url,
        title: r.title || '',
        source: r.source || '',
        width: r.properties?.width,
        height: r.properties?.height,
      }))

      // Pick the most square image
      if (searchResults.length > 0) {
        const best = searchResults.reduce((a: any, b: any) => {
          const aRatio = a.width && a.height ? Math.abs(1 - a.width / a.height) : 1
          const bRatio = b.width && b.height ? Math.abs(1 - b.width / b.height) : 1
          return aRatio < bRatio ? a : b
        })
        imageUrl = best.url || best.thumb
      }
    }

    // If we found an image, download and save it locally
    if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(10000),
        })

        if (imgRes.ok) {
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
          const filename = `product-${itemId || Date.now()}.${ext}`
          mkdirSync(BELONGINGS_DIR, { recursive: true })
          const buffer = Buffer.from(await imgRes.arrayBuffer())
          writeFileSync(path.join(BELONGINGS_DIR, filename), buffer)

          return NextResponse.json({
            ok: true,
            imagePath: `/belongings/${filename}`,
            originalUrl: imageUrl,
            alternatives: searchResults.slice(0, 6),
          })
        }
      } catch {}
    }

    // Fallback: return search results for manual selection
    return NextResponse.json({
      ok: true,
      imagePath: null,
      alternatives: searchResults.slice(0, 6),
      searchUrl: `https://www.google.co.uk/search?tbm=isch&q=${encodeURIComponent(query + ' product')}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
