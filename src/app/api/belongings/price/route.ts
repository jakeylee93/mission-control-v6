import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query) {
      return NextResponse.json({ error: 'No search query' }, { status: 400 })
    }

    // Use Brave Search API for price comparison
    const braveKey = process.env.BRAVE_SEARCH_API_KEY
    if (!braveKey) {
      // Fallback: return a Google Shopping link
      const googleUrl = `https://www.google.co.uk/search?tbm=shop&q=${encodeURIComponent(query)}`
      return NextResponse.json({
        ok: true,
        results: [{ store: 'Google Shopping', price: null, url: googleUrl }],
        searchUrl: googleUrl,
      })
    }

    const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query + ' buy price UK')}&count=5&country=gb`
    const res = await fetch(searchUrl, {
      headers: { 'X-Subscription-Token': braveKey, Accept: 'application/json' },
    })
    const data = await res.json()

    const results = (data.web?.results || []).slice(0, 5).map((r: any) => ({
      store: r.title || 'Unknown',
      url: r.url,
      snippet: r.description || '',
    }))

    const googleUrl = `https://www.google.co.uk/search?tbm=shop&q=${encodeURIComponent(query)}`

    return NextResponse.json({ ok: true, results, searchUrl: googleUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
