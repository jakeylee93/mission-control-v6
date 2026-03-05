import { NextRequest, NextResponse } from 'next/server'

const KNOWN_RETAILERS = [
  'amazon.co.uk', 'amazon.com',
  'boots.com',
  'hollandandbarrett.com',
  'superdrug.com',
  'tesco.com', 'tesco.co.uk',
  'sainsburys.co.uk',
  'ocado.com',
  'argos.co.uk',
  'currys.co.uk',
  'johnlewis.com',
  'screwfix.com',
  'toolstation.com',
  'halfords.com',
  'wilko.com',
  'ebay.co.uk',
]

function extractRetailer(url: string): string | null {
  for (const r of KNOWN_RETAILERS) {
    if (url.includes(r)) {
      const name = r.replace('.co.uk', '').replace('.com', '')
      return name.charAt(0).toUpperCase() + name.slice(1)
    }
  }
  return null
}

function extractPrice(text: string): string | null {
  // Match £X.XX patterns
  const match = text.match(/£\d+(?:\.\d{2})?/)
  return match ? match[0] : null
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 })

    // Strategy 1: Brave Search for real prices
    const braveKey = process.env.BRAVE_SEARCH_API_KEY
    if (braveKey) {
      try {
        const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query + ' buy price UK')}&count=10&country=gb`
        const res = await fetch(searchUrl, {
          headers: { 'X-Subscription-Token': braveKey, Accept: 'application/json' },
        })
        const data = await res.json()
        const results = data.web?.results || []

        // Find results from known retailers with prices
        for (const r of results) {
          const retailer = extractRetailer(r.url || '')
          if (!retailer) continue
          const price = extractPrice(r.description || '') || extractPrice(r.title || '')
          if (price) {
            return NextResponse.json({
              ok: true,
              price,
              url: r.url,
              retailer,
              snippet: r.description,
            })
          }
        }

        // If no price found but retailer link exists, return best retailer link
        for (const r of results) {
          const retailer = extractRetailer(r.url || '')
          if (retailer) {
            return NextResponse.json({
              ok: true,
              price: null,
              url: r.url,
              retailer,
              snippet: r.description,
            })
          }
        }
      } catch {}
    }

    // Strategy 2: Google Shopping scrape
    try {
      const googleUrl = `https://www.google.co.uk/search?tbm=shop&q=${encodeURIComponent(query)}`
      const res = await fetch(googleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
        },
      })
      const html = await res.text()

      // Extract prices from Google Shopping HTML
      const priceMatches = html.match(/£\d+(?:\.\d{2})?/g) || []
      if (priceMatches.length > 0) {
        // Return lowest price and Google Shopping link
        const prices = priceMatches.map(p => parseFloat(p.replace('£', '')))
        const lowest = Math.min(...prices)
        return NextResponse.json({
          ok: true,
          price: `£${lowest.toFixed(2)}`,
          url: googleUrl,
          retailer: 'Google Shopping',
          snippet: `Lowest from ${priceMatches.length} results`,
        })
      }
    } catch {}

    // Strategy 3: Use GPT to estimate current price
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: `What is the current UK retail price of "${query}"? Give me:
1. The typical current price in GBP
2. The best UK retailer to buy it from (Amazon UK, Boots, Holland & Barrett, Superdrug, Tesco, etc)
3. A direct URL to buy it

Return ONLY valid JSON: {"price": "£X.XX", "retailer": "Store Name", "url": "https://..."}`
            }],
            max_tokens: 200,
            temperature: 0.2,
          }),
        })
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content || ''
        const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}')
        if (parsed.price) {
          return NextResponse.json({
            ok: true,
            price: parsed.price,
            url: parsed.url || `https://www.google.co.uk/search?tbm=shop&q=${encodeURIComponent(query)}`,
            retailer: parsed.retailer || 'Online',
            snippet: 'AI estimated price',
          })
        }
      } catch {}
    }

    return NextResponse.json({
      ok: false,
      price: null,
      url: `https://www.google.co.uk/search?tbm=shop&q=${encodeURIComponent(query)}`,
      retailer: null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
