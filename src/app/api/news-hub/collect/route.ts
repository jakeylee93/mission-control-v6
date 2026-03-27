import { NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

interface BraveNewsResult {
  title?: string
  url?: string
  description?: string
  thumbnail?: { src?: string }
  age?: string
  meta_url?: { hostname?: string }
}

// No hardcoded queries — we ONLY collect from user's custom sources, industries, and creators

function autoCategory(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase()
  if (/events?|hospitality|venue|catering|bar|mobile bar|wedding|exhibition|trade show|festival/.test(text)) {
    return 'events-hospitality'
  }
  if (/ai|artificial intelligence|automation|software|tech|digital|machine learning|saas|app/.test(text)) {
    return 'technology'
  }
  if (/marketing|brand|social media|content|seo|advertising|campaign|business|startup|revenue/.test(text)) {
    return 'business-marketing'
  }
  return 'technology'
}

function calcRelevance(title: string, description: string): number {
  const text = (title + ' ' + description).toLowerCase()
  let score = 30 // base

  // Jake's businesses: The Bar People, Booked Events, Future Climbing, anyOS
  const highKeywords = ['bar', 'mobile bar', 'events', 'hospitality', 'catering', 'climbing', 'automation', 'ai', 'anyos']
  const medKeywords = ['uk', 'business', 'industry', 'technology', 'marketing', 'digital', 'exhibition', 'festival', 'trade show']

  for (const kw of highKeywords) {
    if (text.includes(kw)) score += 15
  }
  for (const kw of medKeywords) {
    if (text.includes(kw)) score += 5
  }

  return Math.min(100, score)
}

function parseAge(age?: string): string {
  if (!age) return new Date().toISOString()
  // Brave returns ages like "3 hours ago", "2 days ago", "1 week ago"
  const now = Date.now()
  const lower = (age || '').toLowerCase()
  const numMatch = lower.match(/(\d+)/)
  const num = numMatch ? parseInt(numMatch[1], 10) : 1

  if (lower.includes('minute')) return new Date(now - num * 60 * 1000).toISOString()
  if (lower.includes('hour')) return new Date(now - num * 60 * 60 * 1000).toISOString()
  if (lower.includes('day')) return new Date(now - num * 24 * 60 * 60 * 1000).toISOString()
  if (lower.includes('week')) return new Date(now - num * 7 * 24 * 60 * 60 * 1000).toISOString()
  if (lower.includes('month')) return new Date(now - num * 30 * 24 * 60 * 60 * 1000).toISOString()
  return new Date().toISOString()
}

export async function POST() {
  const braveKey = process.env.BRAVE_API_KEY || process.env.BRAVE_SEARCH_API_KEY

  if (!braveKey) {
    return NextResponse.json({
      ok: false,
      error: 'BRAVE_API_KEY is not set. Add it to your environment variables to enable news collection.',
    })
  }

  const supabase = createServerSupabaseAdmin()
  const allResults: Array<{ title: string; url: string; description: string; thumbnail: string | null; age: string; query: string; brand_id?: string | null }> = []

  // Helper to search Brave
  async function braveSearch(query: string, brandId?: string | null) {
    try {
      const res = await fetch(
        `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=10`,
        {
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': braveKey! },
          cache: 'no-store',
        }
      )
      if (!res.ok) return
      const data = await res.json()
      const results: BraveNewsResult[] = Array.isArray(data.results) ? data.results : []
      for (const r of results) {
        if (r.url && r.title) {
          allResults.push({
            title: r.title, url: r.url, description: r.description || '',
            thumbnail: r.thumbnail?.src || null, age: r.age || '', query, brand_id: brandId || null,
          })
        }
      }
    } catch { /* skip */ }
  }

  // ONLY collect from user's custom sources, industries, and creators
  // Step A: Custom sources (per-brand)
  try {
    const { data: sources } = await supabase.from('news_sources').select('name, url, brand_id')
    if (sources && sources.length > 0) {
      for (const source of sources) {
        try {
          const domain = new URL(source.url).hostname.replace(/^www\./, '')
          await braveSearch(`site:${domain} news`, source.brand_id)
        } catch { /* skip */ }
      }
    }
  } catch { /* table missing */ }

  // Step B: Custom industries (per-brand)
  try {
    const { data: industries } = await supabase.from('news_industries').select('name, brand_id')
    if (industries && industries.length > 0) {
      for (const ind of industries) {
        await braveSearch(`${ind.name} news`, ind.brand_id)
      }
    }
  } catch { /* table missing */ }

  // Step C: Content creators (per-brand)
  try {
    const { data: creators } = await supabase.from('news_creators').select('name, platform, brand_id')
    if (creators && creators.length > 0) {
      for (const creator of creators) {
        const platform = creator.platform || 'all'
        let searchQuery: string
        switch (platform) {
          case 'youtube': searchQuery = `${creator.name} youtube latest video`; break
          case 'podcast': searchQuery = `${creator.name} podcast latest episode`; break
          case 'twitter': case 'x': searchQuery = `${creator.name} twitter posts`; break
          case 'linkedin': searchQuery = `${creator.name} linkedin article`; break
          case 'reddit': searchQuery = `reddit ${creator.name}`; break
          case 'blog': searchQuery = `site:${creator.name} latest`; break
          default: searchQuery = `${creator.name} latest content`
        }
        await braveSearch(searchQuery, creator.brand_id)
      }
    }
  } catch { /* table missing */ }

  if (allResults.length === 0) {
    return NextResponse.json({ ok: true, count: 0, message: 'No results — add some sources in Settings first' })
  }

  // Detect trending: count topic occurrences
  const topicCounts: Record<string, number> = {}
  for (const r of allResults) {
    const words = (r.title + ' ' + r.description).toLowerCase().match(/\b\w{5,}\b/g) || []
    for (const word of words) {
      topicCounts[word] = (topicCounts[word] || 0) + 1
    }
  }
  const trendingTopics = new Set(
    Object.entries(topicCounts)
      .filter(([, count]) => count >= 3)
      .map(([word]) => word)
  )

  function isTrending(title: string, desc: string): boolean {
    const words = (title + ' ' + desc).toLowerCase().match(/\b\w{5,}\b/g) || []
    return words.some(w => trendingTopics.has(w))
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  const unique = allResults.filter(r => {
    if (seen.has(r.url)) return false
    seen.add(r.url)
    return true
  })

  const now = new Date().toISOString()
  const rows = unique.map(r => ({
    title: r.title,
    url: r.url,
    source: (() => {
      try { return new URL(r.url).hostname.replace(/^www\./, '') } catch { return r.query }
    })(),
    summary: r.description || null,
    category: r.query.startsWith('industry:')
      ? r.query.slice('industry:'.length)
      : r.query.startsWith('creator:')
      ? (() => {
          const parts = r.query.split(':')
          return parts.length >= 3 ? parts[2] : 'article'
        })()
      : autoCategory(r.title, r.description),
    image_url: r.thumbnail,
    relevance_score: calcRelevance(r.title, r.description),
    is_trending: isTrending(r.title, r.description),
    published_at: parseAge(r.age),
    collected_at: now,
    business: r.brand_id || null,
  }))

  // Upsert WITHOUT ignoreDuplicates — so brand_id gets updated if article already exists
  const { error: upsertError } = await supabase
    .from('news_articles')
    .upsert(rows, { onConflict: 'url' })

  if (upsertError) {
    if (upsertError.code === 'PGRST116' || upsertError.message?.includes('does not exist') || upsertError.code === '42P01') {
      return NextResponse.json({ ok: false, error: 'news_articles table does not exist yet. Please create it in Supabase.' })
    }
    return NextResponse.json({ ok: false, error: upsertError.message })
  }

  return NextResponse.json({ ok: true, count: rows.length })
}
