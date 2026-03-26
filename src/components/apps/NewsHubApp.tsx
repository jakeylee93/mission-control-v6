'use client'

import { useState, useEffect, useCallback } from 'react'

/* ─── Types ─── */
interface Article {
  id: string
  title: string
  url: string
  source: string | null
  summary: string | null
  category: string | null
  image_url: string | null
  relevance_score: number
  is_trending: boolean
  published_at: string | null
  collected_at: string
  business: string | null
}

interface Favorite {
  id: string
  article_id: string
  business: string
  saved_at: string
  news_articles: Article | null
}

interface NewsLink {
  id: string
  url: string
  title: string | null
  notes: string | null
  source_platform: string | null
  category: string | null
  business: string
  added_at: string
}

interface Newsletter {
  id: string
  title: string
  business: string
  articles: Article[]
  html_content: string | null
  status: string
  created_at: string
  sent_at: string | null
}

interface Business {
  id: string
  name: string
  color: string
}

type Tab = 'feed' | 'favourites' | 'addlink' | 'newsletter' | 'settings'

/* ─── SVG Icons ─── */
const NhIcons = {
  newspaper: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9h4"/>
      <line x1="10" y1="6" x2="18" y2="6"/>
      <line x1="10" y1="10" x2="18" y2="10"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  ),
  back: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  refresh: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  heart: (filled: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  link: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  copy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  collect: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 17 12 21 16 17"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
    </svg>
  ),
  newsletter: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  chevronDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
}

/* ─── Category config ─── */
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'technology', label: 'Technology' },
  { id: 'events-hospitality', label: 'Events & Hospitality' },
  { id: 'business-marketing', label: 'Business & Marketing' },
]

const CAT_COLORS: Record<string, string> = {
  'technology': '#6366f1',
  'events-hospitality': '#f97316',
  'business-marketing': '#22c55e',
}

function catLabel(cat: string | null): string {
  if (cat === 'events-hospitality') return 'Events'
  if (cat === 'business-marketing') return 'Marketing'
  if (cat === 'technology') return 'Tech'
  return cat || 'Other'
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

/* ─── Shimmer skeleton ─── */
function NhSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 14,
          padding: '14px 14px',
          display: 'flex',
          gap: 12,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{ width: 60, height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.06)', width: '80%' }} />
            <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.04)', width: '50%' }} />
            <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '100%', marginTop: 4 }} />
          </div>
          <style>{`@keyframes nhShimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
            animation: 'nhShimmer 1.8s infinite',
          }} />
        </div>
      ))}
    </div>
  )
}

/* ─── Article Card ─── */
function ArticleCard({
  article,
  isFaved,
  onToggleFav,
}: {
  article: Article
  isFaved: boolean
  onToggleFav: (article: Article) => void
}) {
  const catColor = CAT_COLORS[article.category || ''] || '#6366f1'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 14,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      border: '1px solid rgba(255,255,255,0.06)',
      cursor: 'pointer',
      transition: 'background 0.15s',
      overflow: 'hidden',
    }}
      onClick={() => window.open(article.url, '_blank')}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {article.image_url && (
          <div style={{
            width: 60, height: 60, borderRadius: 10, flexShrink: 0,
            backgroundImage: `url(${article.image_url})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            background: `url(${article.image_url}) center/cover, rgba(99,102,241,0.15)`,
          }} />
        )}
        {!article.image_url && (
          <div style={{
            width: 60, height: 60, borderRadius: 10, flexShrink: 0,
            background: `rgba(${catColor === '#6366f1' ? '99,102,241' : catColor === '#f97316' ? '249,115,22' : '34,197,94'},0.15)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {NhIcons.newspaper}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: '#f0eee8', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            marginBottom: 4,
          }}>
            {article.title}
          </div>
          <div style={{ fontSize: 11, color: '#666', display: 'flex', gap: 8, alignItems: 'center' }}>
            {article.source && <span>{article.source.length > 30 ? article.source.slice(0, 30) + '…' : article.source}</span>}
            {article.published_at && <span>{timeAgo(article.published_at)}</span>}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(article) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            flexShrink: 0, marginTop: -2,
          }}
        >
          {NhIcons.heart(isFaved)}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: catColor,
          background: `${catColor}20`, padding: '2px 8px', borderRadius: 20,
          textTransform: 'uppercase' as const, letterSpacing: '0.5px',
        }}>
          {catLabel(article.category)}
        </span>
        <div style={{ flex: 1, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: catColor,
            width: `${article.relevance_score}%`,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>
    </div>
  )
}

/* ─── Toast ─── */
function NhToast({ msg }: { msg: string }) {
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(30,27,75,0.97)', color: '#e0e7ff',
      padding: '10px 20px', borderRadius: 24, fontSize: 13, fontWeight: 600,
      zIndex: 9999, whiteSpace: 'nowrap' as const, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      border: '1px solid rgba(99,102,241,0.3)',
    }}>
      {msg}
    </div>
  )
}

/* ─── Main Component ─── */
export default function NewsHubApp({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('feed')
  const [articles, setArticles] = useState<Article[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [links, setLinks] = useState<NewsLink[]>([])
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [toast, setToast] = useState<string | null>(null)
  const [favIds, setFavIds] = useState<Set<string>>(new Set())
  const [favMap, setFavMap] = useState<Record<string, string>>({}) // article_id -> favorite.id
  const [showBizPicker, setShowBizPicker] = useState(false)
  const [firstLoad, setFirstLoad] = useState(true)

  // Newsletter builder state
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<string>>(new Set())
  const [nlTitle, setNlTitle] = useState('')
  const [nlHtml, setNlHtml] = useState<string | null>(null)
  const [nlLoading, setNlLoading] = useState(false)
  const [nlStep, setNlStep] = useState<'select' | 'preview'>('select')
  const [copied, setCopied] = useState(false)

  // Add link form state
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkNotes, setLinkNotes] = useState('')
  const [linkPlatform, setLinkPlatform] = useState('website')
  const [linkCategory, setLinkCategory] = useState('technology')
  const [linkBusiness, setLinkBusiness] = useState('')
  const [linkSubmitting, setLinkSubmitting] = useState(false)

  // Settings collecting state
  const [collectingFor, setCollectingFor] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }, [])

  // Load businesses
  useEffect(() => {
    fetch('/api/news-hub/settings')
      .then(r => r.json())
      .then(d => {
        if (d.businesses) {
          setBusinesses(d.businesses)
          setActiveBusiness(d.businesses[0])
          setLinkBusiness(d.businesses[0]?.id || '')
        }
      })
      .catch(() => {})
  }, [])

  const loadArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '80' })
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      const res = await fetch(`/api/news-hub?${params}`)
      const d = await res.json()
      setArticles(d.articles || [])
    } catch {
      setArticles([])
    } finally {
      setLoading(false)
    }
  }, [categoryFilter])

  const loadFavorites = useCallback(async () => {
    try {
      const res = await fetch('/api/news-hub/favorites')
      const d = await res.json()
      const favs: Favorite[] = d.favorites || []
      setFavorites(favs)
      const ids = new Set(favs.map(f => f.article_id))
      setFavIds(ids)
      const map: Record<string, string> = {}
      favs.forEach(f => { map[f.article_id] = f.id })
      setFavMap(map)
    } catch {
      setFavorites([])
    }
  }, [])

  const loadLinks = useCallback(async () => {
    try {
      const res = await fetch('/api/news-hub/links')
      const d = await res.json()
      setLinks(d.links || [])
    } catch {
      setLinks([])
    }
  }, [])

  const loadNewsletters = useCallback(async () => {
    try {
      const params = activeBusiness ? `?business=${activeBusiness.id}` : ''
      const res = await fetch(`/api/news-hub/newsletter${params}`)
      const d = await res.json()
      setNewsletters(d.newsletters || [])
    } catch {
      setNewsletters([])
    }
  }, [activeBusiness])

  // Initial load
  useEffect(() => {
    loadArticles()
    loadFavorites()
    loadLinks()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === 'newsletter') loadNewsletters()
  }, [tab, loadNewsletters])

  // Auto-collect on first load if no articles
  useEffect(() => {
    if (!firstLoad) return
    if (!loading && articles.length === 0) {
      setFirstLoad(false)
      handleCollect()
    } else if (!loading && articles.length > 0) {
      setFirstLoad(false)
    }
  }, [loading, articles.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when category changes
  useEffect(() => {
    if (!firstLoad) loadArticles()
  }, [categoryFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCollect = useCallback(async () => {
    if (collecting) return
    setCollecting(true)
    try {
      const res = await fetch('/api/news-hub/collect', { method: 'POST' })
      const d = await res.json()
      if (d.ok) {
        showToast(d.count > 0 ? `Collected ${d.count} articles` : 'No new articles found')
        await loadArticles()
      } else {
        showToast(d.error || 'Collection failed')
      }
    } catch {
      showToast('Collection failed')
    } finally {
      setCollecting(false)
    }
  }, [collecting, loadArticles, showToast])

  const handleToggleFav = useCallback(async (article: Article) => {
    if (favIds.has(article.id)) {
      // Remove
      const favId = favMap[article.id]
      if (!favId) return
      try {
        await fetch('/api/news-hub/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: favId }),
        })
        setFavIds(prev => { const s = new Set(prev); s.delete(article.id); return s })
        setFavMap(prev => { const m = { ...prev }; delete m[article.id]; return m })
        setFavorites(prev => prev.filter(f => f.id !== favId))
        showToast('Removed from favourites')
      } catch {
        showToast('Failed to remove')
      }
    } else {
      // Add
      const biz = activeBusiness?.id || 'barpeople'
      try {
        const res = await fetch('/api/news-hub/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article_id: article.id, business: biz }),
        })
        const d = await res.json()
        if (d.ok && d.favorite) {
          setFavIds(prev => { const next = new Set(Array.from(prev)); next.add(article.id); return next })
          setFavMap(prev => ({ ...prev, [article.id]: d.favorite.id }))
          setFavorites(prev => [...prev, { ...d.favorite, news_articles: article }])
          showToast('Saved to favourites')
        } else {
          showToast(d.error || 'Could not save')
        }
      } catch {
        showToast('Failed to save')
      }
    }
  }, [favIds, favMap, activeBusiness, showToast])

  const handleAddLink = useCallback(async () => {
    if (!linkUrl.trim() || !linkBusiness) return
    setLinkSubmitting(true)
    try {
      const res = await fetch('/api/news-hub/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: linkUrl.trim(),
          title: linkTitle.trim() || null,
          notes: linkNotes.trim() || null,
          source_platform: linkPlatform,
          category: linkCategory,
          business: linkBusiness,
        }),
      })
      const d = await res.json()
      if (d.ok) {
        showToast('Link added')
        setLinkUrl('')
        setLinkTitle('')
        setLinkNotes('')
        await loadLinks()
      } else {
        showToast(d.error || 'Failed to add link')
      }
    } catch {
      showToast('Failed to add link')
    } finally {
      setLinkSubmitting(false)
    }
  }, [linkUrl, linkTitle, linkNotes, linkPlatform, linkCategory, linkBusiness, loadLinks, showToast])

  const handleGenerateNewsletter = useCallback(async () => {
    if (!nlTitle.trim() || selectedArticleIds.size === 0 || !activeBusiness) return
    setNlLoading(true)
    try {
      const res = await fetch('/api/news-hub/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: nlTitle,
          business: activeBusiness.id,
          article_ids: Array.from(selectedArticleIds),
        }),
      })
      const d = await res.json()
      if (d.ok || d.html) {
        setNlHtml(d.html)
        setNlStep('preview')
        showToast('Newsletter generated')
        await loadNewsletters()
      } else {
        showToast(d.error || 'Failed to generate')
      }
    } catch {
      showToast('Failed to generate')
    } finally {
      setNlLoading(false)
    }
  }, [nlTitle, selectedArticleIds, activeBusiness, loadNewsletters, showToast])

  const handleCopyHtml = useCallback(() => {
    if (!nlHtml) return
    navigator.clipboard.writeText(nlHtml).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      showToast('HTML copied')
    })
  }, [nlHtml, showToast])

  const handleCollectForBusiness = useCallback(async (bizId: string) => {
    setCollectingFor(bizId)
    try {
      const res = await fetch('/api/news-hub/collect', { method: 'POST' })
      const d = await res.json()
      showToast(d.ok ? `Collected ${d.count || 0} articles` : (d.error || 'Failed'))
      await loadArticles()
    } catch {
      showToast('Collection failed')
    } finally {
      setCollectingFor(null)
    }
  }, [loadArticles, showToast])

  /* ─── Filtered data ─── */
  const trendingArticles = articles.filter(a => a.is_trending)
  const feedArticles = articles

  const groupedFavs = favorites.reduce((acc, fav) => {
    if (!fav.news_articles) return acc
    const biz = fav.business || 'other'
    if (!acc[biz]) acc[biz] = []
    acc[biz].push(fav)
    return acc
  }, {} as Record<string, Favorite[]>)

  /* ─── Styles ─── */
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f0eee8', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  }

  const chipStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
    background: active ? (color || 'rgba(99,102,241,0.3)') : 'rgba(255,255,255,0.06)',
    color: active ? (color ? '#fff' : '#a5b4fc') : '#888',
    border: active ? `1px solid ${color || '#6366f1'}` : '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
  })

  const TABS_CONFIG: { id: Tab; label: string }[] = [
    { id: 'feed', label: 'News Feed' },
    { id: 'favourites', label: 'Favourites' },
    { id: 'addlink', label: 'Add Link' },
    { id: 'newsletter', label: 'Newsletter' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40, paddingTop: 52 }}>
      <style>{`
        @keyframes nhSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes nhShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes nhFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .nh-card-hover:hover { background: rgba(255,255,255,0.07) !important; }
        .nh-btn-hover:hover { opacity: 0.85; }
      `}</style>

      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,8,18,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 16px',
        maxWidth: 500, margin: '0 auto',
        width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: '#aaa', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, padding: '4px 0',
          }}>
            {NhIcons.back}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#6366f1' }}>{NhIcons.newspaper}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#f0eee8' }}>News Hub</span>
          </div>
          {/* Business selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowBizPicker(p => !p)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '5px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ccc',
              }}
            >
              {activeBusiness && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeBusiness.color, display: 'inline-block' }} />
              )}
              <span>{activeBusiness?.name.split(' ')[0] || 'All'}</span>
              {NhIcons.chevronDown}
            </button>
            {showBizPicker && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 500,
                background: 'rgba(20,17,35,0.98)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, overflow: 'hidden', minWidth: 160,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                {businesses.map(b => (
                  <button key={b.id} onClick={() => { setActiveBusiness(b); setShowBizPicker(false) }} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px',
                    background: activeBusiness?.id === b.id ? 'rgba(99,102,241,0.15)' : 'none',
                    border: 'none', cursor: 'pointer', color: '#f0eee8', fontSize: 14,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, display: 'inline-block' }} />
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 0, overflowX: 'auto' as const, scrollbarWidth: 'none' as const,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          msOverflowStyle: 'none',
        }}>
          {TABS_CONFIG.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 14px', fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? '#a5b4fc' : '#666', whiteSpace: 'nowrap' as const,
              borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: '0 16px', paddingTop: 104 }}>

        {/* ── NEWS FEED TAB ── */}
        {tab === 'feed' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            {/* Controls row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: '#666' }}>{articles.length} articles</span>
              <button onClick={handleCollect} disabled={collecting} style={{
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 20, padding: '6px 14px', color: '#a5b4fc', fontSize: 13, fontWeight: 600,
                cursor: collecting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                opacity: collecting ? 0.7 : 1,
              }}>
                <span style={collecting ? { animation: 'nhSpin 1s linear infinite', display: 'inline-flex' } : {}}>
                  {NhIcons.refresh}
                </span>
                {collecting ? 'Collecting…' : 'Refresh'}
              </button>
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto' as const, scrollbarWidth: 'none' as const, marginBottom: 16, paddingBottom: 4 }}>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategoryFilter(c.id)} style={{
                  ...chipStyle(categoryFilter === c.id, c.id !== 'all' ? CAT_COLORS[c.id] : undefined),
                  flexShrink: 0, border: 'none',
                }}>
                  {c.label}
                </button>
              ))}
            </div>

            {loading ? (
              <NhSkeleton />
            ) : articles.length === 0 ? (
              <div style={{ textAlign: 'center' as const, padding: '60px 20px', color: '#555' }}>
                <div style={{ marginBottom: 12, color: '#444' }}>{NhIcons.newspaper}</div>
                <p style={{ fontSize: 15, margin: 0 }}>No articles yet. Tap Refresh to collect the latest news.</p>
              </div>
            ) : (
              <>
                {/* Trending section */}
                {trendingArticles.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Trending</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(249,115,22,0.2)' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto' as const, scrollbarWidth: 'none' as const, paddingBottom: 4 }}>
                      {trendingArticles.slice(0, 8).map(article => (
                        <div key={article.id} onClick={() => window.open(article.url, '_blank')} style={{
                          minWidth: 200, maxWidth: 200, borderRadius: 14, overflow: 'hidden',
                          background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
                          cursor: 'pointer', flexShrink: 0, padding: '12px',
                          animation: 'nhFadeIn 0.3s ease',
                        }}>
                          {article.image_url && (
                            <div style={{
                              height: 80, borderRadius: 8, marginBottom: 8,
                              backgroundImage: `url(${article.image_url})`,
                              backgroundSize: 'cover', backgroundPosition: 'center',
                            }} />
                          )}
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#f0eee8', lineHeight: 1.4, marginBottom: 6,
                            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                          }}>
                            {article.title}
                          </div>
                          <div style={{ fontSize: 10, color: '#888' }}>{timeAgo(article.published_at)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All articles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {feedArticles.map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isFaved={favIds.has(article.id)}
                      onToggleFav={handleToggleFav}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── FAVOURITES TAB ── */}
        {tab === 'favourites' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center' as const, padding: '60px 20px', color: '#555' }}>
                <div style={{ marginBottom: 12, color: '#444' }}>{NhIcons.heart(false)}</div>
                <p style={{ fontSize: 15, margin: 0 }}>No saved articles. Tap the heart on articles you want to keep.</p>
              </div>
            ) : (
              <>
                {Object.entries(groupedFavs).map(([bizId, bizFavs]) => {
                  const biz = businesses.find(b => b.id === bizId)
                  return (
                    <div key={bizId} style={{ marginBottom: 24 }}>
                      {biz && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: biz.color, display: 'inline-block' }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#aaa', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{biz.name}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {bizFavs.map(fav => fav.news_articles && (
                          <ArticleCard
                            key={fav.id}
                            article={fav.news_articles}
                            isFaved={true}
                            onToggleFav={handleToggleFav}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* ── ADD LINK TAB ── */}
        {tab === 'addlink' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: '0 0 16px' }}>Add a Link</h3>

              {/* URL */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>URL *</label>
                <input
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>

              {/* Title */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Title</label>
                <input
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  placeholder="Article title"
                  style={inputStyle}
                />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Notes</label>
                <textarea
                  value={linkNotes}
                  onChange={e => setLinkNotes(e.target.value)}
                  placeholder="Why is this interesting..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' as const }}
                />
              </div>

              {/* Platform */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 8 }}>Platform</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  {['linkedin', 'instagram', 'website', 'other'].map(p => (
                    <button key={p} onClick={() => setLinkPlatform(p)} style={{
                      ...chipStyle(linkPlatform === p),
                      border: 'none', textTransform: 'capitalize' as const,
                    }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 8 }}>Category</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  {[
                    { id: 'technology', label: 'Technology' },
                    { id: 'events-hospitality', label: 'Events & Hospitality' },
                    { id: 'business-marketing', label: 'Business & Marketing' },
                  ].map(c => (
                    <button key={c.id} onClick={() => setLinkCategory(c.id)} style={{
                      ...chipStyle(linkCategory === c.id, CAT_COLORS[c.id]),
                      border: 'none',
                    }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Business */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 8 }}>Business</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  {businesses.map(b => (
                    <button key={b.id} onClick={() => setLinkBusiness(b.id)} style={{
                      ...chipStyle(linkBusiness === b.id, b.color),
                      border: 'none',
                    }}>
                      {b.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleAddLink} disabled={!linkUrl.trim() || linkSubmitting} style={{
                width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                background: linkUrl.trim() ? 'rgba(99,102,241,0.8)' : 'rgba(99,102,241,0.2)',
                color: linkUrl.trim() ? '#fff' : '#666', fontSize: 15, fontWeight: 700,
                cursor: linkUrl.trim() ? 'pointer' : 'not-allowed',
              }}>
                {linkSubmitting ? 'Adding…' : 'Add Link'}
              </button>
            </div>

            {/* Previous links */}
            {links.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px' }}>
                  Saved Links ({links.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {links.map(link => (
                    <div key={link.id} onClick={() => window.open(link.url, '_blank')} style={{
                      background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px',
                      cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0eee8', marginBottom: 4,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                            {link.title || link.url}
                          </div>
                          <div style={{ fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                            {link.url}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                          {link.source_platform && (
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                              background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
                              textTransform: 'capitalize' as const,
                            }}>
                              {link.source_platform}
                            </span>
                          )}
                          <span style={{ color: '#666' }}>{NhIcons.link}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: '#555', marginTop: 6 }}>{timeAgo(link.added_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── NEWSLETTER TAB ── */}
        {tab === 'newsletter' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            {nlStep === 'select' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: 0 }}>Build Newsletter</h3>
                  {selectedArticleIds.size > 0 && (
                    <span style={{
                      background: 'rgba(99,102,241,0.3)', color: '#a5b4fc',
                      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    }}>
                      {selectedArticleIds.size} selected
                    </span>
                  )}
                </div>

                {/* Title input */}
                <div style={{ marginBottom: 14 }}>
                  <input
                    value={nlTitle}
                    onChange={e => setNlTitle(e.target.value)}
                    placeholder="Newsletter title e.g. 'Weekly Roundup — March 2026'"
                    style={inputStyle}
                  />
                </div>

                {/* Article selection */}
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px' }}>Select articles to include:</p>
                {articles.length === 0 && links.length === 0 ? (
                  <div style={{ textAlign: 'center' as const, padding: '40px 20px', color: '#555' }}>
                    <p style={{ fontSize: 14, margin: 0 }}>No articles yet. Go to News Feed and collect some.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {[...articles, ...links.map(l => ({
                      id: l.id, title: l.title || l.url, url: l.url, source: l.source_platform,
                      summary: l.notes, category: l.category, image_url: null,
                      relevance_score: 50, is_trending: false, published_at: l.added_at,
                      collected_at: l.added_at, business: l.business,
                    }) as Article)].map(article => (
                      <div key={article.id} onClick={() => {
                        setSelectedArticleIds(prev => {
                          const s = new Set(prev)
                          if (s.has(article.id)) s.delete(article.id)
                          else s.add(article.id)
                          return s
                        })
                      }} style={{
                        background: selectedArticleIds.has(article.id)
                          ? 'rgba(99,102,241,0.15)'
                          : 'rgba(255,255,255,0.04)',
                        borderRadius: 12, padding: '10px 14px', cursor: 'pointer',
                        border: `1px solid ${selectedArticleIds.has(article.id) ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        display: 'flex', alignItems: 'center', gap: 12,
                        transition: 'all 0.15s',
                      }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          background: selectedArticleIds.has(article.id) ? '#6366f1' : 'rgba(255,255,255,0.08)',
                          border: `1.5px solid ${selectedArticleIds.has(article.id) ? '#6366f1' : 'rgba(255,255,255,0.2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff',
                        }}>
                          {selectedArticleIds.has(article.id) && NhIcons.check}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0eee8',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                            {article.title}
                          </div>
                          {article.category && (
                            <span style={{ fontSize: 10, color: CAT_COLORS[article.category] || '#6366f1' }}>
                              {catLabel(article.category)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleGenerateNewsletter}
                  disabled={!nlTitle.trim() || selectedArticleIds.size === 0 || nlLoading}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                    background: nlTitle.trim() && selectedArticleIds.size > 0 ? 'rgba(99,102,241,0.8)' : 'rgba(99,102,241,0.2)',
                    color: nlTitle.trim() && selectedArticleIds.size > 0 ? '#fff' : '#666',
                    fontSize: 15, fontWeight: 700,
                    cursor: nlTitle.trim() && selectedArticleIds.size > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <span>{NhIcons.newsletter}</span>
                  {nlLoading ? 'Generating…' : 'Generate Newsletter'}
                </button>

                {/* Previous newsletters */}
                {newsletters.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px' }}>
                      Previous ({newsletters.length})
                    </h3>
                    {newsletters.map(nl => (
                      <div key={nl.id} style={{
                        background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px',
                        marginBottom: 8, border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{nl.title}</div>
                            <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>{timeAgo(nl.created_at)}</div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                            background: nl.status === 'sent' ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.15)',
                            color: nl.status === 'sent' ? '#4ade80' : '#a5b4fc',
                            textTransform: 'uppercase' as const,
                          }}>
                            {nl.status}
                          </span>
                        </div>
                        {nl.html_content && (
                          <button onClick={() => { setNlHtml(nl.html_content); setNlStep('preview') }} style={{
                            marginTop: 8, background: 'none', border: 'none', color: '#a5b4fc',
                            fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 600,
                          }}>
                            View HTML
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Preview step */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <button onClick={() => setNlStep('select')} style={{
                    background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10,
                    color: '#aaa', padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {NhIcons.back} Back
                  </button>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: 0 }}>Newsletter Preview</h3>
                </div>

                <button onClick={handleCopyHtml} style={{
                  width: '100%', padding: '11px', borderRadius: 12, border: 'none', marginBottom: 16,
                  background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)',
                  color: copied ? '#4ade80' : '#a5b4fc',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {copied ? NhIcons.check : NhIcons.copy}
                  {copied ? 'Copied!' : 'Copy HTML'}
                </button>

                {nlHtml && (
                  <div style={{
                    background: '#fff', borderRadius: 12, overflow: 'hidden',
                    maxHeight: 500, overflowY: 'auto' as const,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <iframe
                      srcDoc={nlHtml}
                      style={{ width: '100%', minHeight: 400, border: 'none', display: 'block' }}
                      title="Newsletter Preview"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: '0 0 16px' }}>Businesses</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {businesses.map(b => (
                <div key={b.id} style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: b.color, display: 'inline-block' }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                        {articles.filter(a => a.business === b.id).length} articles
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCollectForBusiness(b.id)}
                    disabled={collectingFor === b.id}
                    style={{
                      background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                      borderRadius: 10, padding: '7px 12px', color: '#a5b4fc', fontSize: 12, fontWeight: 600,
                      cursor: collectingFor === b.id ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      opacity: collectingFor === b.id ? 0.7 : 1,
                    }}
                  >
                    <span style={collectingFor === b.id ? { animation: 'nhSpin 1s linear infinite', display: 'inline-flex' } : {}}>
                      {NhIcons.collect}
                    </span>
                    {collectingFor === b.id ? 'Collecting…' : 'Collect'}
                  </button>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(99,102,241,0.08)', borderRadius: 14, padding: '14px 16px',
              border: '1px solid rgba(99,102,241,0.15)', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', marginBottom: 6 }}>Collection Schedule</div>
              <div style={{ fontSize: 13, color: '#888' }}>Auto-collects daily at 11:00 PM</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Requires BRAVE_API_KEY env variable</div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '14px 16px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#aaa', marginBottom: 10 }}>Categories</div>
              {[
                { id: 'technology', label: 'Technology', color: '#6366f1' },
                { id: 'events-hospitality', label: 'Events & Hospitality', color: '#f97316' },
                { id: 'business-marketing', label: 'Business & Marketing', color: '#22c55e' },
              ].map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#ccc' }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <NhToast msg={toast} />}
    </div>
  )
}
