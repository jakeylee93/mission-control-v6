'use client'

import { useState, useEffect, useCallback } from 'react'

/* ─── Types ─── */
interface Article {
  id: string; title: string; url: string; source: string | null; summary: string | null
  ai_summary?: string | null; category: string | null; image_url: string | null
  relevance_score: number; is_trending: boolean; published_at: string | null
  collected_at: string; business: string | null
}

interface Brand {
  id: string; name: string; color: string; logo_url?: string | null
  tone?: string; is_client?: boolean; primary_color?: string
}

interface NewsSource {
  id: string; name: string; url: string; label?: string; source_type?: string; brand_id?: string | null
}

interface Favorite {
  id: string; article_id: string; business: string; is_archived?: boolean
  saved_at: string; news_articles: Article | null
}

type Tab = 'feed' | 'favourites' | 'archived' | 'brands'

/* ─── SVG Icons ─── */
const I = {
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  refresh: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  heart: (f: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill={f ? '#ef4444' : 'none'} stroke={f ? '#ef4444' : 'currentColor'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  mail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  sparkle: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  archive: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  chevDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>,
  building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><path d="M9 18h6"/></svg>,
  expand: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  collapse: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
}

/* ─── Utils ─── */
function timeAgo(d: string | null): string {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return m + 'm ago'
  const h = Math.floor(m / 60)
  if (h < 24) return h + 'h ago'
  const days = Math.floor(h / 24)
  if (days < 7) return days + 'd ago'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getFavicon(url: string): string {
  try { return 'https://www.google.com/s2/favicons?domain=' + new URL(url).hostname + '&sz=24' }
  catch { return '' }
}

/* ─── Shared styles ─── */
const inputS: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#f0eee8', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}
const chip = (active: boolean, color?: string): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
  background: active ? (color || '#6366f1') + '30' : 'rgba(255,255,255,0.06)',
  color: active ? (color || '#a5b4fc') : '#888', border: 'none', cursor: 'pointer',
})
const cardS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px',
  border: '1px solid rgba(255,255,255,0.06)',
}
const btnSmall: React.CSSProperties = {
  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
  borderRadius: 8, padding: '5px 10px', color: '#a5b4fc', fontSize: 12, fontWeight: 600, cursor: 'pointer',
}

/* ─── Toast ─── */
function Toast({ msg }: { msg: string }) {
  return <div style={{
    position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(30,27,75,0.97)', color: '#e0e7ff', padding: '10px 20px',
    borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 9999,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)', border: '1px solid rgba(99,102,241,0.3)',
  }}>{msg}</div>
}

/* ─── Article Card ─── */
function ArticleCard({ article, isFaved, onToggleFav, onSummarize, expanded, onToggleExpand }: {
  article: Article; isFaved: boolean; onToggleFav: () => void
  onSummarize: () => void; expanded: boolean; onToggleExpand: () => void
}) {
  const summary = article.ai_summary || article.summary
  const hasSummary = !!summary

  return (
    <div style={{ ...cardS, transition: 'background 0.15s', overflow: 'hidden' }}>
      {/* Main row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Thumbnail */}
        <div style={{
          width: 72, height: 72, borderRadius: 10, flexShrink: 0,
          backgroundImage: article.image_url ? `url(${article.image_url})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center',
          background: article.image_url
            ? `url(${article.image_url}) center/cover`
            : 'rgba(99,102,241,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!article.image_url && (
            <span style={{ fontSize: 11, color: '#666', textAlign: 'center', padding: 4 }}>
              {article.source?.slice(0, 10) || 'News'}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: '#f0eee8', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            marginBottom: 6,
          }}>
            {article.title}
          </div>
          <div style={{ fontSize: 11, color: '#666', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {article.source && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getFavicon(article.url)} width={16} height={16} alt="" style={{ borderRadius: 2, flexShrink: 0 }} />
                {article.source.length > 20 ? article.source.slice(0, 20) + '…' : article.source}
              </span>
            )}
            <span>{timeAgo(article.published_at || article.collected_at)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <button onClick={(e) => { e.stopPropagation(); onToggleFav() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            {I.heart(isFaved)}
          </button>
        </div>
      </div>

      {/* Expandable summary section */}
      <div style={{ marginTop: 10 }}>
        <button onClick={onToggleExpand} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', gap: 4, color: '#a5b4fc', fontSize: 12, fontWeight: 600,
        }}>
          {expanded ? I.collapse : I.expand}
          {expanded ? 'Hide details' : (hasSummary ? 'Show summary' : 'Get AI summary')}
        </button>

        {expanded && (
          <div style={{ marginTop: 10, animation: 'nhFadeIn 0.2s ease' }}>
            {hasSummary ? (
              <p style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6, margin: '0 0 12px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: '3px solid rgba(99,102,241,0.4)' }}>
                {summary}
              </p>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onSummarize() }} style={{
                ...btnSmall, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10,
              }}>
                {I.sparkle} Generate AI Summary
              </button>
            )}

            {/* Action buttons row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => window.open(article.url, '_blank')} style={{
                ...btnSmall, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {I.link} Read Source
              </button>
              {!hasSummary && article.ai_summary === undefined && (
                <button onClick={onSummarize} style={{
                  ...btnSmall, display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {I.sparkle} Summarize
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Favourite Card (with archive button) ─── */
function FavCard({ fav, onArchive, onUnfav }: {
  fav: Favorite; onArchive: () => void; onUnfav: () => void
}) {
  const article = fav.news_articles
  if (!article) return null

  return (
    <div style={{ ...cardS, transition: 'background 0.15s' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {article.image_url && (
          <div style={{
            width: 56, height: 56, borderRadius: 8, flexShrink: 0,
            backgroundImage: `url(${article.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#f0eee8', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            cursor: 'pointer',
          }} onClick={() => window.open(article.url, '_blank')}>
            {article.title}
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
            {article.source && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getFavicon(article.url)} width={14} height={14} alt="" style={{ borderRadius: 2 }} />
              {article.source.length > 20 ? article.source.slice(0, 20) + '…' : article.source}
            </span>}
            <span>{timeAgo(fav.saved_at)}</span>
          </div>
          {(article.ai_summary || article.summary) && (
            <p style={{ fontSize: 12, color: '#999', lineHeight: 1.5, margin: '6px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
              {article.ai_summary || article.summary}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <button onClick={onArchive} title="Archive" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#888' }}>{I.archive}</button>
          <button onClick={onUnfav} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#666' }}>{I.trash}</button>
        </div>
      </div>
    </div>
  )
}


/* ═══════ MAIN COMPONENT ═══════ */
export default function NewsHubApp({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('feed')
  const [brands, setBrands] = useState<Brand[]>([])
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null)
  const [showBrandPicker, setShowBrandPicker] = useState(false)

  // Feed
  const [articles, setArticles] = useState<Article[]>([])
  const [favIds, setFavIds] = useState<Set<string>>(new Set())
  const [favMap, setFavMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)
  const [summarizing, setSummarizing] = useState<string | null>(null)

  // Favourites
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [archivedFavs, setArchivedFavs] = useState<Favorite[]>([])

  // Sources
  const [sources, setSources] = useState<NewsSource[]>([])

  // Brands
  const [showAddBrand, setShowAddBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [newBrandColor, setNewBrandColor] = useState('#6366f1')
  const [newBrandIsClient, setNewBrandIsClient] = useState(false)

  // Source form
  const [showAddSource, setShowAddSource] = useState(false)
  const [newSrcName, setNewSrcName] = useState('')
  const [newSrcUrl, setNewSrcUrl] = useState('')
  const [newSrcLabel, setNewSrcLabel] = useState('')
  const [newSrcType, setNewSrcType] = useState('website')

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  const showToast = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2800) }, [])

  /* ─── Data loading ─── */
  const loadBrands = useCallback(async () => {
    const r = await fetch('/api/news-hub/settings').then(r => r.json()).catch(() => ({ businesses: [] }))
    setBrands(r.businesses || [])
    if (!activeBrand && r.businesses?.length) setActiveBrand(r.businesses[0])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadArticles = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '80' })
    if (activeBrand) params.set('business', activeBrand.id)
    const r = await fetch(`/api/news-hub?${params}`).then(r => r.json()).catch(() => ({ articles: [] }))
    setArticles(r.articles || [])
    setLoading(false)
  }, [activeBrand])

  const loadFavs = useCallback(async () => {
    const params = activeBrand ? `?business=${activeBrand.id}` : ''
    const r = await fetch(`/api/news-hub/favorites${params}`).then(r => r.json()).catch(() => ({ favorites: [] }))
    const favs: Favorite[] = r.favorites || []
    setFavorites(favs)
    setFavIds(new Set(favs.map(f => f.article_id)))
    const map: Record<string, string> = {}
    favs.forEach(f => { map[f.article_id] = f.id })
    setFavMap(map)
  }, [activeBrand])

  const loadArchivedFavs = useCallback(async () => {
    const params = new URLSearchParams({ archived: 'true' })
    if (activeBrand) params.set('business', activeBrand.id)
    const r = await fetch(`/api/news-hub/favorites?${params}`).then(r => r.json()).catch(() => ({ favorites: [] }))
    setArchivedFavs(r.favorites || [])
  }, [activeBrand])

  const loadSources = useCallback(async () => {
    const params = activeBrand ? `?brand_id=${activeBrand.id}` : ''
    const r = await fetch(`/api/news-hub/sources${params}`).then(r => r.json()).catch(() => ({ sources: [] }))
    setSources(r.sources || [])
  }, [activeBrand])

  useEffect(() => { loadBrands() }, [loadBrands])
  useEffect(() => {
    if (activeBrand) { loadArticles(); loadSources(); loadFavs() }
  }, [activeBrand]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tab === 'favourites') loadFavs()
    if (tab === 'archived') loadArchivedFavs()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Handlers ─── */
  const handleCollect = async () => {
    if (collecting) return
    setCollecting(true)
    const r = await fetch('/api/news-hub/collect', { method: 'POST' }).then(r => r.json()).catch(() => ({ ok: false }))
    showToast(r.ok ? `Collected ${r.count || 0} articles` : (r.error || r.message || 'Failed'))
    await loadArticles()
    setCollecting(false)
  }

  const handleToggleFav = async (article: Article) => {
    if (favIds.has(article.id)) {
      const fId = favMap[article.id]; if (!fId) return
      await fetch('/api/news-hub/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: fId }) })
      setFavIds(p => { const s = new Set(p); s.delete(article.id); return s })
      setFavMap(p => { const m = { ...p }; delete m[article.id]; return m })
      setFavorites(p => p.filter(f => f.id !== fId))
      showToast('Removed from favourites')
    } else {
      const r = await fetch('/api/news-hub/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ article_id: article.id, business: activeBrand?.id || 'default' }) }).then(r => r.json())
      if (r.ok && r.favorite) {
        setFavIds(p => { const s = new Set(Array.from(p)); s.add(article.id); return s })
        setFavMap(p => ({ ...p, [article.id]: r.favorite.id }))
        showToast('Added to favourites ⭐')
      }
    }
  }

  const handleArchiveFav = async (favId: string) => {
    await fetch('/api/news-hub/favorites', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: favId, is_archived: true }) })
    setFavorites(p => p.filter(f => f.id !== favId))
    showToast('Archived')
  }

  const handleUnarchiveFav = async (favId: string) => {
    await fetch('/api/news-hub/favorites', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: favId, is_archived: false }) })
    setArchivedFavs(p => p.filter(f => f.id !== favId))
    showToast('Restored')
  }

  const handleSummarize = async (articleId: string) => {
    setSummarizing(articleId)
    const r = await fetch('/api/news-hub/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ article_id: articleId }) }).then(r => r.json()).catch(() => ({ ok: false }))
    if (r.ok) {
      setArticles(prev => prev.map(a => a.id === articleId ? { ...a, ai_summary: r.summary } : a))
      showToast('Summary generated')
    } else {
      showToast(r.error || 'Summary failed')
    }
    setSummarizing(null)
  }

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return
    await fetch('/api/news-hub/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newBrandName, color: newBrandColor, is_client: newBrandIsClient }) })
    setNewBrandName(''); setNewBrandColor('#6366f1'); setNewBrandIsClient(false); setShowAddBrand(false)
    await loadBrands()
    showToast('Brand added')
  }

  const handleAddSource = async () => {
    if (!newSrcName.trim() || !newSrcUrl.trim()) return
    await fetch('/api/news-hub/sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSrcName, url: newSrcUrl, label: newSrcLabel || newSrcName, source_type: newSrcType, brand_id: activeBrand?.id }) })
    setNewSrcName(''); setNewSrcUrl(''); setNewSrcLabel(''); setShowAddSource(false)
    await loadSources()
    showToast('Source added')
  }

  const myBrands = brands.filter(b => !b.is_client)
  const clientBrands = brands.filter(b => b.is_client)

  const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
    { id: 'feed', label: 'Feed', icon: I.mail },
    { id: 'favourites', label: 'Favourites', icon: I.heart(true) },
    { id: 'archived', label: 'Archive', icon: I.archive },
    { id: 'brands', label: 'Brands', icon: I.building },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes nhSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes nhFadeIn { from { opacity:0;transform:translateY(6px)} to {opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,8,18,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 16px', maxWidth: 500, margin: '0 auto', width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '4px 0' }}>{I.back}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#6366f1' }}>{I.mail}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#f0eee8' }}>News & Mail</span>
          </div>
          {/* Brand selector */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowBrandPicker(p => !p)} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '5px 10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ccc',
            }}>
              {activeBrand && <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeBrand.color }} />}
              <span>{activeBrand?.name.split(' ')[0] || 'All'}</span>
              {I.chevDown}
            </button>
            {showBrandPicker && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 500,
                background: 'rgba(20,17,35,0.98)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, overflow: 'hidden', minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                {myBrands.length > 0 && <div style={{ padding: '8px 16px', fontSize: 10, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>My Businesses</div>}
                {myBrands.map(b => (
                  <button key={b.id} onClick={() => { setActiveBrand(b); setShowBrandPicker(false) }} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px',
                    background: activeBrand?.id === b.id ? 'rgba(99,102,241,0.15)' : 'none',
                    border: 'none', cursor: 'pointer', color: '#f0eee8', fontSize: 13,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color }} /> {b.name}
                  </button>
                ))}
                {clientBrands.length > 0 && <div style={{ padding: '8px 16px', fontSize: 10, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Clients</div>}
                {clientBrands.map(b => (
                  <button key={b.id} onClick={() => { setActiveBrand(b); setShowBrandPicker(false) }} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px',
                    background: activeBrand?.id === b.id ? 'rgba(99,102,241,0.15)' : 'none',
                    border: 'none', cursor: 'pointer', color: '#f0eee8', fontSize: 13,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color }} /> {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', flex: 1,
              padding: '10px 8px', fontSize: 11, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? '#a5b4fc' : '#666', whiteSpace: 'nowrap',
              borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{ padding: '0 16px', paddingTop: 108, flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 40 }}>

        {/* ═══ NEWS FEED ═══ */}
        {tab === 'feed' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: '#666' }}>
                {articles.length} articles {activeBrand ? `• ${activeBrand.name}` : ''} • last 7 days
              </span>
              <button onClick={handleCollect} disabled={collecting} style={{
                ...btnSmall, display: 'flex', alignItems: 'center', gap: 6, opacity: collecting ? 0.7 : 1,
              }}>
                <span style={collecting ? { animation: 'nhSpin 1s linear infinite', display: 'inline-flex' } : {}}>{I.refresh}</span>
                {collecting ? 'Collecting…' : 'Refresh'}
              </button>
            </div>

            {/* Source chips */}
            {sources.length > 0 && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14, paddingBottom: 4 }}>
                {sources.map(s => (
                  <span key={s.id} style={{ ...chip(false), display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {getFavicon(s.url) && <img src={getFavicon(s.url)} width={14} height={14} alt="" style={{ borderRadius: 2 }} />}
                    {s.label || s.name}
                  </span>
                ))}
              </div>
            )}

            {sources.length === 0 && !loading && (
              <div style={{ ...cardS, textAlign: 'center', padding: '30px 20px', marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: '#888', margin: '0 0 8px' }}>No sources for {activeBrand?.name || 'this brand'}.</p>
                <button onClick={() => setTab('brands')} style={btnSmall}>Add Sources →</button>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>Loading...</div>
            ) : articles.length === 0 && sources.length > 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                <p style={{ fontSize: 14, margin: '0 0 12px' }}>No articles yet. Hit Refresh to collect from your sources.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {articles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isFaved={favIds.has(article.id)}
                    onToggleFav={() => handleToggleFav(article)}
                    onSummarize={() => handleSummarize(article.id)}
                    expanded={expandedArticle === article.id}
                    onToggleExpand={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ FAVOURITES ═══ */}
        {tab === 'favourites' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: 0 }}>
                Favourites {activeBrand ? `• ${activeBrand.name}` : ''}
              </h3>
              <span style={{ fontSize: 12, color: '#666' }}>{favorites.length} saved</span>
            </div>

            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                <p style={{ fontSize: 14, margin: 0 }}>No favourites yet. Tap the ❤️ on articles in the feed.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {favorites.map(fav => (
                  <FavCard
                    key={fav.id}
                    fav={fav}
                    onArchive={() => handleArchiveFav(fav.id)}
                    onUnfav={async () => {
                      await fetch('/api/news-hub/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: fav.id }) })
                      setFavorites(p => p.filter(f => f.id !== fav.id))
                      setFavIds(p => { const s = new Set(p); s.delete(fav.article_id); return s })
                      showToast('Removed')
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ ARCHIVED ═══ */}
        {tab === 'archived' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: 0 }}>Archive</h3>
              <span style={{ fontSize: 12, color: '#666' }}>{archivedFavs.length} archived</span>
            </div>

            {archivedFavs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                <p style={{ fontSize: 14, margin: 0 }}>No archived favourites. Archive items from the Favourites tab.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {archivedFavs.map(fav => {
                  const article = fav.news_articles
                  if (!article) return null
                  return (
                    <div key={fav.id} style={{ ...cardS, opacity: 0.7 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0eee8', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            onClick={() => window.open(article.url, '_blank')}>
                            {article.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>{timeAgo(fav.saved_at)}</div>
                        </div>
                        <button onClick={() => handleUnarchiveFav(fav.id)} style={{ ...btnSmall, fontSize: 11 }}>Restore</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ BRANDS ═══ */}
        {tab === 'brands' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: 0 }}>Brands & Sources</h3>
              <button onClick={() => setShowAddBrand(p => !p)} style={btnSmall}>{I.plus} Add Brand</button>
            </div>

            {showAddBrand && (
              <div style={{ ...cardS, marginBottom: 16 }}>
                <input value={newBrandName} onChange={e => setNewBrandName(e.target.value)}
                  placeholder="Brand name (e.g. Balti House)" style={{ ...inputS, marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input type="color" value={newBrandColor} onChange={e => setNewBrandColor(e.target.value)}
                    style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
                  <label style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={newBrandIsClient} onChange={e => setNewBrandIsClient(e.target.checked)} />
                    Client business
                  </label>
                </div>
                <button onClick={handleAddBrand} style={{ ...btnSmall, width: '100%', textAlign: 'center', padding: '10px' }}>Add Brand</button>
              </div>
            )}

            {/* Brand list */}
            {myBrands.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>My Businesses</div>
                {myBrands.map(b => (
                  <div key={b.id} onClick={() => setActiveBrand(b)} style={{
                    ...cardS, marginBottom: 8, cursor: 'pointer',
                    borderLeft: activeBrand?.id === b.id ? `3px solid ${b.color}` : '3px solid transparent',
                    background: activeBrand?.id === b.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: b.color }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{b.name}</span>
                      </div>
                      {activeBrand?.id === b.id && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontWeight: 700 }}>ACTIVE</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {clientBrands.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Clients</div>
                {clientBrands.map(b => (
                  <div key={b.id} onClick={() => setActiveBrand(b)} style={{
                    ...cardS, marginBottom: 8, cursor: 'pointer',
                    borderLeft: activeBrand?.id === b.id ? `3px solid ${b.color}` : '3px solid transparent',
                    background: activeBrand?.id === b.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: b.color }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{b.name}</span>
                      </div>
                      {activeBrand?.id === b.id && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontWeight: 700 }}>ACTIVE</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sources for active brand */}
            {activeBrand && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0eee8', margin: 0 }}>
                    Sources for {activeBrand.name} <span style={{ fontSize: 12, color: '#555', fontWeight: 400 }}>({sources.length})</span>
                  </h3>
                  <button onClick={() => setShowAddSource(p => !p)} style={btnSmall}>{I.plus}</button>
                </div>

                {showAddSource && (
                  <div style={{ ...cardS, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input value={newSrcLabel} onChange={e => setNewSrcLabel(e.target.value)}
                      placeholder="Label (e.g. OpenClaw News)" style={inputS} />
                    <input value={newSrcName} onChange={e => setNewSrcName(e.target.value)}
                      placeholder="Source name" style={inputS} />
                    <input value={newSrcUrl} onChange={e => setNewSrcUrl(e.target.value)}
                      placeholder="URL (https://...)" style={inputS} />
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {['website', 'twitter', 'youtube', 'podcast', 'linkedin', 'reddit', 'blog'].map(t => (
                        <button key={t} onClick={() => setNewSrcType(t)} style={{ ...chip(newSrcType === t), textTransform: 'capitalize' }}>{t}</button>
                      ))}
                    </div>
                    <button onClick={handleAddSource} style={{ ...btnSmall, width: '100%', textAlign: 'center', padding: '10px' }}>Add Source</button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sources.map(s => (
                    <div key={s.id} style={{ ...cardS, display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {getFavicon(s.url) && <img src={getFavicon(s.url)} width={18} height={18} alt="" style={{ borderRadius: 3, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0eee8' }}>{s.label || s.name}</div>
                        <div style={{ fontSize: 11, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.url}</div>
                      </div>
                      {s.source_type && s.source_type !== 'website' && (
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', textTransform: 'capitalize' }}>{s.source_type}</span>
                      )}
                      <button onClick={async () => {
                        await fetch('/api/news-hub/sources', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id }) })
                        await loadSources()
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 16, padding: '2px 6px' }}>×</button>
                    </div>
                  ))}
                  {sources.length === 0 && <div style={{ fontSize: 13, color: '#444', padding: '8px 0' }}>No sources yet. Add URLs, X accounts, or YouTube channels.</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  )
}
