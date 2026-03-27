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

interface Section {
  type: string; heading: string; body: string; image_url?: string | null
  cta_text?: string | null; cta_url?: string | null; locked?: boolean
}

interface Campaign {
  id: string; title: string; brand_id: string; folder: string; status: string
  sections: Section[]; subject_line: string; html_content?: string | null
  list_id?: string | null; scheduled_at?: string | null; created_at: string
}

interface Template {
  id: string; name: string; brand_id: string; sections: Section[]
}

interface SubList {
  id: string; name: string; brand_id: string; description?: string
}

type Tab = 'feed' | 'favourites' | 'archived' | 'campaigns' | 'subscribers' | 'brands' | 'settings'

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
  folder: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  send: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  lock: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  unlock: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  up: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>,
  down: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  image: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  gear: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
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
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [contentTypeFilter, setContentTypeFilter] = useState('all')

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
  const [newBrandLogo, setNewBrandLogo] = useState('')
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [editBrandName, setEditBrandName] = useState('')
  const [editBrandColor, setEditBrandColor] = useState('')
  const [editBrandLogo, setEditBrandLogo] = useState('')
  const [editBrandTone, setEditBrandTone] = useState('')
  const [editBrandIsClient, setEditBrandIsClient] = useState(false)

  // Source form
  const [showAddSource, setShowAddSource] = useState(false)
  const [newSrcName, setNewSrcName] = useState('')
  const [newSrcUrl, setNewSrcUrl] = useState('')
  const [newSrcLabel, setNewSrcLabel] = useState('')
  const [newSrcType, setNewSrcType] = useState('website')

  // Industries & Creators
  const [industries, setIndustries] = useState<{ id: string; name: string; brand_id?: string }[]>([])
  const [creators, setCreators] = useState<{ id: string; name: string; platform: string; brand_id?: string }[]>([])
  const [showAddIndustry, setShowAddIndustry] = useState(false)
  const [newIndustryName, setNewIndustryName] = useState('')
  const [showAddCreator, setShowAddCreator] = useState(false)
  const [newCreatorName, setNewCreatorName] = useState('')
  const [newCreatorPlatform, setNewCreatorPlatform] = useState('youtube')

  // Add link
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkNotes, setLinkNotes] = useState('')
  const [linkSubmitting, setLinkSubmitting] = useState(false)
  const [links, setLinks] = useState<{ id: string; url: string; title: string | null; notes: string | null; source_platform: string | null; added_at: string }[]>([])

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignFolder, setCampaignFolder] = useState('all')
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)
  const [buildStep, setBuildStep] = useState<'list' | 'new' | 'edit' | 'preview'>('list')
  const [buildTitle, setBuildTitle] = useState('')
  const [buildSections, setBuildSections] = useState<Section[]>([])
  const [buildSubject, setBuildSubject] = useState('')
  const [buildListId, setBuildListId] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)

  // Templates
  const [templates, setTemplates] = useState<Template[]>([])
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [editTemplateName, setEditTemplateName] = useState('')

  // Subscribers
  const [subLists, setSubLists] = useState<SubList[]>([])
  const [showAddList, setShowAddList] = useState(false)
  const [newListName, setNewListName] = useState('')

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
  const loadIndustries = useCallback(async () => {
    const params = activeBrand ? `?brand_id=${activeBrand.id}` : ''
    const r = await fetch(`/api/news-hub/industries${params}`).then(r => r.json()).catch(() => ({ industries: [] }))
    setIndustries(r.industries || [])
  }, [activeBrand])

  const loadCreators = useCallback(async () => {
    const params = activeBrand ? `?brand_id=${activeBrand.id}` : ''
    const r = await fetch(`/api/news-hub/creators${params}`).then(r => r.json()).catch(() => ({ creators: [] }))
    setCreators(r.creators || [])
  }, [activeBrand])

  const loadLinks = useCallback(async () => {
    const params = activeBrand ? `?business=${activeBrand.id}` : ''
    const r = await fetch(`/api/news-hub/links${params}`).then(r => r.json()).catch(() => ({ links: [] }))
    setLinks(r.links || [])
  }, [activeBrand])

  useEffect(() => {
    if (activeBrand) { loadArticles(); loadSources(); loadFavs(); loadIndustries(); loadCreators(); loadLinks() }
  }, [activeBrand]) // eslint-disable-line react-hooks/exhaustive-deps
  const loadCampaigns = useCallback(async () => {
    const params = activeBrand ? `?brand_id=${activeBrand.id}` : ''
    const r = await fetch(`/api/news-hub/campaigns${params}`).then(r => r.json()).catch(() => ({ campaigns: [] }))
    setCampaigns(r.campaigns || [])
  }, [activeBrand])

  const loadTemplates = useCallback(async () => {
    const params = activeBrand ? `?brand_id=${activeBrand.id}` : ''
    const r = await fetch(`/api/news-hub/templates${params}`).then(r => r.json()).catch(() => ({ templates: [] }))
    setTemplates(r.templates || [])
  }, [activeBrand])

  const loadSubLists = useCallback(async () => {
    const params = activeBrand ? `?brand_id=${activeBrand.id}` : ''
    const r = await fetch(`/api/news-hub/subscribers${params}`).then(r => r.json()).catch(() => ({ lists: [] }))
    setSubLists(r.lists || [])
  }, [activeBrand])

  useEffect(() => {
    if (tab === 'favourites') loadFavs()
    if (tab === 'archived') loadArchivedFavs()
    if (tab === 'campaigns') { loadCampaigns(); loadSubLists(); loadTemplates() }
    // templates loaded as part of campaigns tab
    if (tab === 'subscribers') loadSubLists()
    if (tab === 'settings') { loadSources(); loadIndustries(); loadCreators(); loadLinks() }
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
    await fetch('/api/news-hub/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newBrandName, color: newBrandColor, is_client: newBrandIsClient, logo_url: newBrandLogo || null }) })
    setNewBrandName(''); setNewBrandColor('#6366f1'); setNewBrandIsClient(false); setNewBrandLogo(''); setShowAddBrand(false)
    await loadBrands()
    showToast('Brand added')
  }

  const startEditBrand = (b: Brand) => {
    setEditingBrand(b); setEditBrandName(b.name); setEditBrandColor(b.color)
    setEditBrandLogo(b.logo_url || ''); setEditBrandTone(b.tone || 'professional')
    setEditBrandIsClient(b.is_client || false)
  }

  const handleSaveEditBrand = async () => {
    if (!editingBrand) return
    await fetch('/api/news-hub/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingBrand.id, name: editBrandName, color: editBrandColor, logo_url: editBrandLogo || null, tone: editBrandTone, is_client: editBrandIsClient }) })
    setEditingBrand(null)
    await loadBrands()
    showToast('Brand updated')
  }

  const handleAddSource = async () => {
    if (!newSrcName.trim() || !newSrcUrl.trim()) return
    await fetch('/api/news-hub/sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSrcName, url: newSrcUrl, label: newSrcLabel || newSrcName, source_type: newSrcType, brand_id: activeBrand?.id }) })
    setNewSrcName(''); setNewSrcUrl(''); setNewSrcLabel(''); setShowAddSource(false)
    await loadSources()
    showToast('Source added')
  }

  // Campaign handlers
  const handleAiDraft = async () => {
    if (!buildTitle.trim() || !activeBrand) return
    setAiLoading(true)
    // Feed real articles to the AI — prioritise favourites, fall back to collected articles
    const favArticles = favorites.filter(f => f.news_articles).map(f => ({
      title: f.news_articles!.title, summary: f.news_articles!.ai_summary || f.news_articles!.summary || ''
    }))
    const collectedArticles = articles.slice(0, 15).map(a => ({
      title: a.title, summary: a.ai_summary || a.summary || ''
    }))
    const realArticles = favArticles.length > 0 ? favArticles : collectedArticles
    const r = await fetch('/api/news-hub/ai-draft', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'draft', title: buildTitle, brand_name: activeBrand.name, brand_tone: activeBrand.tone,
        context: realArticles.length > 0 ? `Use these REAL articles as content (do NOT make up fake articles):\n${realArticles.map(a => `- ${a.title}: ${a.summary}`).join('\n')}` : undefined
      }),
    }).then(r => r.json()).catch(() => ({ ok: false }))
    if (r.sections) {
      setBuildSections(r.sections.map((s: Section) => ({ ...s, locked: false })))
      setBuildSubject(r.subject_line || buildTitle)
      setBuildStep('edit')
      showToast('Draft generated from your articles')
    } else { showToast(r.error || 'AI draft failed') }
    setAiLoading(false)
  }

  const handleEnhanceSection = async (idx: number) => {
    if (!activeBrand || buildSections[idx].locked) return
    const r = await fetch('/api/news-hub/ai-draft', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enhance', section_text: buildSections[idx].body, brand_name: activeBrand.name }),
    }).then(r => r.json()).catch(() => ({ ok: false }))
    if (r.ok && r.enhanced_text) {
      setBuildSections(prev => prev.map((s, i) => i === idx ? { ...s, body: r.enhanced_text } : s))
      showToast('Section enhanced')
    }
  }

  const handleBuildPreview = () => {
    if (!activeBrand) return
    const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const bc = activeBrand.primary_color || activeBrand.color || '#6366f1'
    const sectionsHtml = buildSections.map(s => {
      if (s.type === 'divider') return '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">'
      let h = '<div style="margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #f3f4f6;">'
      if (s.image_url) h += `<img src="${s.image_url}" style="width:100%;border-radius:12px;margin-bottom:16px;" />`
      h += `<h2 style="margin:0 0 10px;font-size:18px;font-weight:700;color:#111827;">${s.heading}</h2>`
      h += `<p style="margin:0 0 14px;color:#4b5563;font-size:15px;line-height:1.6;">${s.body}</p>`
      if (s.cta_text) h += `<a href="${s.cta_url || '#'}" style="display:inline-block;background:${bc};color:#fff;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;">${s.cta_text}</a>`
      return h + '</div>'
    }).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><div style="max-width:640px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><div style="background:${bc};padding:40px 32px;text-align:center;"><h1 style="margin:0 0 6px;color:#fff;font-size:28px;font-weight:800;">${activeBrand.name}</h1><p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;">${buildSubject} &bull; ${date}</p></div><div style="padding:40px 32px;">${sectionsHtml}</div><div style="background:#f3f4f6;padding:24px 32px;text-align:center;"><p style="margin:0;color:#9ca3af;font-size:12px;">Powered by Mission Control &bull; ${date}</p></div></div></body></html>`
    setPreviewHtml(html)
    setBuildStep('preview')
  }

  const handleSaveCampaign = async () => {
    if (!activeBrand) return
    handleBuildPreview() // ensure HTML is current
    const payload = { title: buildTitle, brand_id: activeBrand.id, folder: campaignFolder === 'all' ? 'newsletters' : campaignFolder, sections: buildSections, subject_line: buildSubject, html_content: previewHtml, list_id: buildListId || null }
    if (editCampaign) {
      await fetch('/api/news-hub/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editCampaign.id, ...payload }) })
    } else {
      await fetch('/api/news-hub/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    await loadCampaigns()
    setBuildStep('list'); setEditCampaign(null)
    showToast('Campaign saved')
  }

  const handleTestSend = async () => {
    if (!testEmail.trim()) return
    setSending(true)
    const r = await fetch('/api/news-hub/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ test_email: testEmail, html_content: previewHtml, subject_line: buildSubject || buildTitle }) }).then(r => r.json()).catch(() => ({ ok: false }))
    showToast(r.ok ? 'Test email sent!' : (r.error || 'Send failed'))
    setSending(false)
  }

  const handleAddList = async () => {
    if (!newListName.trim() || !activeBrand) return
    await fetch('/api/news-hub/subscribers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_list', name: newListName, brand_id: activeBrand.id }) })
    setNewListName(''); setShowAddList(false)
    await loadSubLists()
    showToast('List created')
  }

  const handleAddIndustry = async () => {
    if (!newIndustryName.trim()) return
    await fetch('/api/news-hub/industries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newIndustryName, brand_id: activeBrand?.id }) })
    setNewIndustryName(''); setShowAddIndustry(false)
    await loadIndustries()
    showToast('Industry added')
  }

  const handleAddCreator = async () => {
    if (!newCreatorName.trim()) return
    await fetch('/api/news-hub/creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCreatorName, platform: newCreatorPlatform, brand_id: activeBrand?.id }) })
    setNewCreatorName(''); setShowAddCreator(false)
    await loadCreators()
    showToast('Creator added')
  }

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return
    setLinkSubmitting(true)
    const r = await fetch('/api/news-hub/links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: linkUrl, title: linkTitle || null, notes: linkNotes || null, source_platform: 'website', category: 'technology', business: activeBrand?.id || 'default' }) }).then(r => r.json()).catch(() => ({ ok: false }))
    if (r.ok) { setLinkUrl(''); setLinkTitle(''); setLinkNotes(''); await loadLinks(); showToast('Link added') }
    else showToast(r.error || 'Failed')
    setLinkSubmitting(false)
  }

  const CAMPAIGN_FOLDERS = ['all', 'newsletters', 'promotions', 'birthdays', 'christmas', 'seasonal']

  const myBrands = brands.filter(b => !b.is_client)
  const clientBrands = brands.filter(b => b.is_client)

  const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
    { id: 'feed', label: 'Feed', icon: I.mail },
    { id: 'favourites', label: 'Favs', icon: I.heart(true) },
    { id: 'archived', label: 'Archive', icon: I.archive },
    { id: 'campaigns', label: 'Campaigns', icon: I.folder },
    { id: 'subscribers', label: 'Lists', icon: I.users },
    { id: 'brands', label: 'Brands', icon: I.building },
    { id: 'settings', label: 'Settings', icon: I.gear },
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
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'campaigns') setBuildStep('list') }} style={{
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

            {/* Category filter pills */}
            {articles.length > 0 && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 10, paddingBottom: 4 }}>
                {['all', 'technology', 'events-hospitality', 'business-marketing'].map(c => (
                  <button key={c} onClick={() => setCategoryFilter(c)} style={{ ...chip(categoryFilter === c, c === 'technology' ? '#6366f1' : c === 'events-hospitality' ? '#f97316' : c === 'business-marketing' ? '#22c55e' : undefined), flexShrink: 0 }}>
                    {c === 'all' ? 'All' : c === 'technology' ? 'Tech' : c === 'events-hospitality' ? 'Events' : 'Marketing'}
                  </button>
                ))}
              </div>
            )}

            {/* Content type pills */}
            {articles.length > 0 && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14, paddingBottom: 4 }}>
                {[{ id: 'all', label: 'All Types' }, { id: 'article', label: 'Articles' }, { id: 'video', label: 'Videos' }, { id: 'podcast', label: 'Podcasts' }, { id: 'social', label: 'Social' }].map(t => (
                  <button key={t.id} onClick={() => setContentTypeFilter(t.id)} style={{ ...chip(contentTypeFilter === t.id, t.id === 'video' ? '#ef4444' : t.id === 'podcast' ? '#8b5cf6' : t.id === 'social' ? '#0ea5e9' : undefined), flexShrink: 0, fontSize: 11 }}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {sources.length === 0 && !loading && (
              <div style={{ ...cardS, textAlign: 'center', padding: '30px 20px', marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: '#888', margin: '0 0 8px' }}>No sources for {activeBrand?.name || 'this brand'}.</p>
                <button onClick={() => setTab('settings')} style={btnSmall}>Add Sources →</button>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>Loading...</div>
            ) : articles.length === 0 && sources.length > 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                <p style={{ fontSize: 14, margin: '0 0 12px' }}>No articles yet. Hit Refresh to collect from your sources.</p>
              </div>
            ) : (
              <>
                {/* Trending section */}
                {articles.filter(a => a.is_trending).length > 0 && categoryFilter === 'all' && contentTypeFilter === 'all' && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trending</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(249,115,22,0.2)' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                      {articles.filter(a => a.is_trending).slice(0, 6).map(article => (
                        <div key={article.id} onClick={() => window.open(article.url, '_blank')} style={{
                          minWidth: 180, maxWidth: 180, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                          background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
                          cursor: 'pointer', padding: 12,
                        }}>
                          {article.image_url && <div style={{ height: 70, borderRadius: 8, marginBottom: 8, backgroundImage: `url(${article.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#f0eee8', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{article.title}</div>
                          <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>{timeAgo(article.published_at)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filtered articles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {articles.filter(a => {
                  const catMatch = categoryFilter === 'all' || a.category === categoryFilter
                  const typeMatch = contentTypeFilter === 'all' || (contentTypeFilter === 'article' && !['video', 'podcast', 'social'].includes(a.category || '')) || a.category === contentTypeFilter
                  return catMatch && typeMatch
                }).map(article => (
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
              </>
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

        {/* ═══ CAMPAIGNS ═══ */}
        {tab === 'campaigns' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            {buildStep === 'list' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: 0 }}>Campaigns</h3>
                  <button onClick={() => { setBuildStep('new'); setBuildTitle(''); setBuildSections([]); setBuildSubject(''); setEditCampaign(null) }} style={btnSmall}>{I.plus} New</button>
                </div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 16, paddingBottom: 4 }}>
                  {CAMPAIGN_FOLDERS.map(f => (
                    <button key={f} onClick={() => setCampaignFolder(f)} style={{ ...chip(campaignFolder === f), textTransform: 'capitalize', flexShrink: 0 }}>{f}</button>
                  ))}
                </div>
                {campaigns.filter(c => campaignFolder === 'all' || c.folder === campaignFolder).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                    <p style={{ fontSize: 14, margin: '0 0 12px' }}>No campaigns yet.</p>
                    <button onClick={() => setBuildStep('new')} style={btnSmall}>Create Campaign</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {campaigns.filter(c => campaignFolder === 'all' || c.folder === campaignFolder).map(c => (
                      <div key={c.id} style={{ ...cardS, cursor: 'pointer' }} onClick={() => {
                        setEditCampaign(c); setBuildTitle(c.title); setBuildSections(c.sections || [])
                        setBuildSubject(c.subject_line); setBuildListId(c.list_id || ''); setBuildStep('edit')
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{c.title}</div>
                            <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>{c.folder} • {timeAgo(c.created_at)}</div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase',
                            background: c.status === 'sent' ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.15)',
                            color: c.status === 'sent' ? '#4ade80' : '#a5b4fc',
                          }}>{c.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Templates section */}
                <div style={{ marginTop: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0eee8', margin: 0 }}>Templates {activeBrand ? `• ${activeBrand.name}` : ''}</h3>
                    <button onClick={async () => {
                      if (!activeBrand) return
                      await fetch('/api/news-hub/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'New Template', brand_id: activeBrand.id }) })
                      await loadTemplates()
                      showToast('Template created')
                    }} style={btnSmall}>{I.plus} New Template</button>
                  </div>

                  {templates.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#555', padding: '12px 0' }}>No templates yet. Create one to reuse across campaigns.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {templates.map(t => (
                        <div key={t.id} style={cardS}>
                          {editingTemplate?.id === t.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <input value={editTemplateName} onChange={e => setEditTemplateName(e.target.value)} placeholder="Template name" style={{ ...inputS, fontWeight: 600 }} />
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={async () => {
                                  await fetch('/api/news-hub/templates', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, name: editTemplateName }) })
                                  setEditingTemplate(null)
                                  await loadTemplates()
                                  showToast('Template renamed')
                                }} style={{ ...btnSmall, background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>Save</button>
                                <button onClick={() => setEditingTemplate(null)} style={{ ...btnSmall }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{t.name}</div>
                                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{(t.sections || []).length} sections</div>
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => {
                                  setBuildTitle(''); setBuildSections(t.sections || []); setBuildSubject(''); setBuildStep('edit'); setEditCampaign(null)
                                }} style={btnSmall}>Use</button>
                                <button onClick={() => { setEditingTemplate(t); setEditTemplateName(t.name) }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}>{I.edit}</button>
                                <button onClick={async () => {
                                  await fetch('/api/news-hub/templates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id }) })
                                  await loadTemplates()
                                  showToast('Deleted')
                                }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>{I.trash}</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {buildStep === 'new' && (
              <>
                <button onClick={() => setBuildStep('list')} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>{I.back} Back</button>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: '0 0 16px' }}>New Campaign</h3>
                <input value={buildTitle} onChange={e => setBuildTitle(e.target.value)} placeholder="Title e.g. 'March Industry News'" style={{ ...inputS, marginBottom: 12, fontSize: 15, fontWeight: 600 }} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button onClick={handleAiDraft} disabled={!buildTitle.trim() || aiLoading} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: buildTitle.trim() ? 'rgba(99,102,241,0.8)' : 'rgba(99,102,241,0.2)', color: buildTitle.trim() ? '#fff' : '#666', fontSize: 14, fontWeight: 700, cursor: buildTitle.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {I.sparkle} {aiLoading ? 'Generating...' : 'AI Draft'}
                  </button>
                  <button onClick={() => {
                    setBuildSections([{ type: 'hero', heading: buildTitle || 'Newsletter', body: 'Write your intro here...', locked: false }, { type: 'text', heading: 'Section 1', body: 'Your content...', locked: false }])
                    setBuildSubject(buildTitle); setBuildStep('edit')
                  }} style={{ ...btnSmall, padding: '12px 16px' }}>{I.edit} Manual</button>
                </div>
                {templates.length > 0 && (
                  <div><p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>Or from template:</p>
                    {templates.map(t => (
                      <button key={t.id} onClick={() => { setBuildSections(t.sections); setBuildSubject(buildTitle); setBuildStep('edit') }} style={{ ...cardS, cursor: 'pointer', textAlign: 'left', width: '100%', marginBottom: 8, display: 'block' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0eee8' }}>{t.name}</div>
                      </button>
                    ))}
                  </div>
                )}
                {/* Pull from favourites */}
                {favorites.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>Your favourited articles ({favorites.length}):</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                      {favorites.filter(f => f.news_articles).map(f => (
                        <div key={f.id} style={{ ...cardS, fontSize: 12, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#ccc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.news_articles!.title}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: '#666', marginTop: 6 }}>AI Draft will use these to build your newsletter content.</p>
                  </div>
                )}
              </>
            )}

            {buildStep === 'edit' && (
              <>
                <button onClick={() => setBuildStep(editCampaign ? 'list' : 'new')} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>{I.back} Back</button>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: '0 0 12px' }}>{editCampaign ? 'Edit' : 'Build'} Campaign</h3>
                <input value={buildSubject} onChange={e => setBuildSubject(e.target.value)} placeholder="Subject line" style={{ ...inputS, marginBottom: 12 }} />
                {subLists.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Send to list:</label>
                    <select value={buildListId} onChange={e => setBuildListId(e.target.value)} style={{ ...inputS, cursor: 'pointer' }}>
                      <option value="">No list selected</option>
                      {subLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Section editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {buildSections.map((sec, i) => (
                    <div key={i} style={{ ...cardS, borderLeft: sec.locked ? '3px solid #4ade80' : `3px solid ${activeBrand?.color || '#6366f1'}`, background: sec.locked ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.04)', opacity: sec.locked ? 0.85 : 1 }}>
                      {sec.locked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '4px 8px', background: 'rgba(34,197,94,0.15)', borderRadius: 6, fontSize: 11, color: '#4ade80', fontWeight: 600 }}>
                          {I.lock} Locked — AI won&apos;t touch this section
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <select value={sec.type} onChange={e => setBuildSections(prev => prev.map((s, j) => j === i ? { ...s, type: e.target.value } : s))} disabled={sec.locked} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '3px 8px', color: '#a5b4fc', fontSize: 11, outline: 'none', opacity: sec.locked ? 0.5 : 1 }}>
                          {['hero', 'text', 'image', 'offer', 'cta', 'divider'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div style={{ flex: 1 }} />
                        <button onClick={() => setBuildSections(prev => prev.map((s, j) => j === i ? { ...s, locked: !s.locked } : s))} title={sec.locked ? 'Click to unlock' : 'Click to lock'} style={{ background: sec.locked ? 'rgba(34,197,94,0.2)' : 'none', border: sec.locked ? '1px solid rgba(34,197,94,0.3)' : 'none', borderRadius: 6, cursor: 'pointer', color: sec.locked ? '#4ade80' : '#666', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                          {sec.locked ? I.lock : I.unlock} {sec.locked ? '✓' : ''}
                        </button>
                        <button onClick={() => { const a = [...buildSections]; if (i > 0) { [a[i-1], a[i]] = [a[i], a[i-1]]; setBuildSections(a) } }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 2 }}>{I.up}</button>
                        <button onClick={() => { const a = [...buildSections]; if (i < a.length-1) { [a[i], a[i+1]] = [a[i+1], a[i]]; setBuildSections(a) } }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 2 }}>{I.down}</button>
                        {!sec.locked && <button onClick={() => handleEnhanceSection(i)} style={{ ...btnSmall, padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>{I.sparkle} Enhance</button>}
                        <button onClick={() => setBuildSections(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}>{I.trash}</button>
                      </div>
                      {sec.type !== 'divider' && (
                        <>
                          <input value={sec.heading} onChange={e => setBuildSections(prev => prev.map((s, j) => j === i ? { ...s, heading: e.target.value } : s))} placeholder="Heading" style={{ ...inputS, marginBottom: 8, fontWeight: 700 }} />
                          <textarea value={sec.body} onChange={e => setBuildSections(prev => prev.map((s, j) => j === i ? { ...s, body: e.target.value } : s))} rows={3} placeholder="Content..." style={{ ...inputS, resize: 'vertical' as const, marginBottom: 8 }} />
                        </>
                      )}
                      {(sec.type === 'hero' || sec.type === 'image') && (
                        <input value={sec.image_url || ''} onChange={e => setBuildSections(prev => prev.map((s, j) => j === i ? { ...s, image_url: e.target.value || null } : s))} placeholder="Image URL" style={{ ...inputS, fontSize: 12 }} />
                      )}
                      {(sec.type === 'offer' || sec.type === 'cta') && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input value={sec.cta_text || ''} onChange={e => setBuildSections(prev => prev.map((s, j) => j === i ? { ...s, cta_text: e.target.value } : s))} placeholder="Button text" style={{ ...inputS, flex: 1, fontSize: 12 }} />
                          <input value={sec.cta_url || ''} onChange={e => setBuildSections(prev => prev.map((s, j) => j === i ? { ...s, cta_url: e.target.value } : s))} placeholder="Button URL" style={{ ...inputS, flex: 2, fontSize: 12 }} />
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setBuildSections(prev => [...prev, { type: 'text', heading: 'New Section', body: '', locked: false }])} style={{ ...btnSmall, width: '100%', textAlign: 'center', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{I.plus} Add Section</button>

                  {/* Pull favourited article as section */}
                  {favorites.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f0eee8', marginBottom: 8 }}>Add from your favourites:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 250, overflowY: 'auto' }}>
                        {favorites.filter(f => f.news_articles).map(f => {
                          const a = f.news_articles!
                          const alreadyAdded = buildSections.some(s => s.heading === a.title)
                          return (
                            <div key={f.id} onClick={() => {
                              if (alreadyAdded) return
                              setBuildSections(prev => [...prev, {
                                type: 'text', heading: a.title, body: a.ai_summary || a.summary || '',
                                image_url: a.image_url, cta_text: 'Read More', cta_url: a.url, locked: false
                              }])
                              showToast('Added as section')
                            }} style={{
                              ...cardS, cursor: alreadyAdded ? 'default' : 'pointer', padding: '10px 12px',
                              display: 'flex', gap: 10, alignItems: 'center',
                              opacity: alreadyAdded ? 0.4 : 1, transition: 'opacity 0.15s',
                            }}>
                              {a.image_url && <div style={{ width: 40, height: 40, borderRadius: 6, flexShrink: 0, backgroundImage: `url(${a.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0eee8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                                {a.source && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{a.source}</div>}
                              </div>
                              <span style={{ fontSize: 11, color: alreadyAdded ? '#4ade80' : '#a5b4fc', fontWeight: 600, flexShrink: 0 }}>
                                {alreadyAdded ? '✓ Added' : '+ Add'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleBuildPreview} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(99,102,241,0.8)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Preview</button>
                  <button onClick={handleSaveCampaign} style={{ ...btnSmall, padding: '12px 16px' }}>Save Draft</button>
                </div>
              </>
            )}

            {buildStep === 'preview' && (
              <>
                <button onClick={() => setBuildStep('edit')} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>{I.back} Back to editor</button>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: '0 0 16px' }}>Preview</h3>
                <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                  <iframe srcDoc={previewHtml} style={{ width: '100%', minHeight: 400, border: 'none', display: 'block' }} title="Preview" />
                </div>
                <div style={{ ...cardS, marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>Send test:</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your@email.com" style={{ ...inputS, flex: 1 }} />
                    <button onClick={handleTestSend} disabled={!testEmail.trim() || sending} style={{ ...btnSmall, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 4 }}>{I.send} {sending ? '...' : 'Test'}</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { navigator.clipboard.writeText(previewHtml); showToast('HTML copied') }} style={{ ...btnSmall, flex: 1, textAlign: 'center', padding: '10px' }}>Copy HTML</button>
                  <button onClick={handleSaveCampaign} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(99,102,241,0.8)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save Campaign</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ SUBSCRIBERS ═══ */}
        {tab === 'subscribers' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: 0 }}>Subscriber Lists {activeBrand ? `• ${activeBrand.name}` : ''}</h3>
              <button onClick={() => setShowAddList(p => !p)} style={btnSmall}>{I.plus} New List</button>
            </div>
            {showAddList && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input value={newListName} onChange={e => setNewListName(e.target.value)} placeholder="List name (e.g. Corporate, Weddings)" style={{ ...inputS, flex: 1 }} />
                <button onClick={handleAddList} style={btnSmall}>Add</button>
              </div>
            )}
            {subLists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}><p style={{ fontSize: 14, margin: 0 }}>No subscriber lists yet.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {subLists.map(l => (
                  <div key={l.id} style={cardS}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{l.name}</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>{l.description || 'No description'}</div>
                      </div>
                      <button onClick={async () => {
                        await fetch('/api/news-hub/subscribers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: l.id, type: 'list' }) })
                        await loadSubLists(); showToast('Deleted')
                      }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}>{I.trash}</button>
                    </div>
                  </div>
                ))}
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
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Logo</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={newBrandLogo} onChange={e => setNewBrandLogo(e.target.value)} placeholder="Logo URL (or upload)" style={{ ...inputS, flex: 1 }} />
                    <label style={{ ...btnSmall, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', margin: 0 }}>
                      {I.image} Upload
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files?.[0]; if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => setNewBrandLogo(reader.result as string)
                        reader.readAsDataURL(file)
                      }} />
                    </label>
                  </div>
                  {newBrandLogo && <img src={newBrandLogo} alt="Logo preview" style={{ height: 40, marginTop: 8, borderRadius: 6 }} />}
                </div>
                <button onClick={handleAddBrand} style={{ ...btnSmall, width: '100%', textAlign: 'center', padding: '10px' }}>Add Brand</button>
              </div>
            )}

            {/* Brand list */}
            {/* Edit brand modal */}
            {editingBrand && (
              <div style={{ ...cardS, marginBottom: 20, borderLeft: `3px solid ${editBrandColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0eee8', margin: 0 }}>Edit: {editingBrand.name}</h3>
                  <button onClick={() => setEditingBrand(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
                <input value={editBrandName} onChange={e => setEditBrandName(e.target.value)} placeholder="Brand name" style={{ ...inputS, marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input type="color" value={editBrandColor} onChange={e => setEditBrandColor(e.target.value)} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
                  <input value={editBrandTone} onChange={e => setEditBrandTone(e.target.value)} placeholder="Tone (e.g. professional, friendly)" style={{ ...inputS, flex: 1 }} />
                </div>
                <label style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 8 }}>
                  <input type="checkbox" checked={editBrandIsClient} onChange={e => setEditBrandIsClient(e.target.checked)} />
                  Client business
                </label>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Logo</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={editBrandLogo} onChange={e => setEditBrandLogo(e.target.value)} placeholder="Logo URL (or upload)" style={{ ...inputS, flex: 1 }} />
                    <label style={{ ...btnSmall, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', margin: 0 }}>
                      {I.image} Upload
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files?.[0]; if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => setEditBrandLogo(reader.result as string)
                        reader.readAsDataURL(file)
                      }} />
                    </label>
                  </div>
                  {editBrandLogo && <img src={editBrandLogo} alt="Logo" style={{ height: 40, marginTop: 8, borderRadius: 6 }} />}
                </div>
                <button onClick={handleSaveEditBrand} style={{ ...btnSmall, width: '100%', textAlign: 'center', padding: '10px', background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>Save Changes</button>
              </div>
            )}

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
                        {b.logo_url ? <img src={b.logo_url} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain' }} /> : <span style={{ width: 12, height: 12, borderRadius: '50%', background: b.color }} />}
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{b.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {activeBrand?.id === b.id && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontWeight: 700 }}>ACTIVE</span>}
                        <button onClick={(e) => { e.stopPropagation(); startEditBrand(b) }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}>{I.edit}</button>
                      </div>
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
                        {b.logo_url ? <img src={b.logo_url} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain' }} /> : <span style={{ width: 12, height: 12, borderRadius: '50%', background: b.color }} />}
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{b.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {activeBrand?.id === b.id && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontWeight: 700 }}>ACTIVE</span>}
                        <button onClick={(e) => { e.stopPropagation(); startEditBrand(b) }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}>{I.edit}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ═══ SETTINGS ═══ */}
        {tab === 'settings' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: '0 0 4px' }}>
              Settings {activeBrand ? `• ${activeBrand.name}` : ''}
            </h3>
            <p style={{ fontSize: 12, color: '#666', margin: '0 0 16px' }}>Sources, industries, and creators for the active brand. Switch brands in the top-right dropdown.</p>

            {!activeBrand ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                <p style={{ fontSize: 14, margin: 0 }}>Select a brand first.</p>
              </div>
            ) : (
              <>
                {/* News Sources */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0eee8', margin: 0 }}>
                      News Sources <span style={{ fontSize: 12, color: '#555', fontWeight: 400 }}>({sources.length})</span>
                    </h3>
                    <button onClick={() => setShowAddSource(p => !p)} style={btnSmall}>{I.plus} Add</button>
                  </div>

                  {showAddSource && (
                    <div style={{ ...cardS, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input value={newSrcLabel} onChange={e => setNewSrcLabel(e.target.value)} placeholder="Label (e.g. OpenClaw News)" style={inputS} />
                      <input value={newSrcName} onChange={e => setNewSrcName(e.target.value)} placeholder="Source name" style={inputS} />
                      <input value={newSrcUrl} onChange={e => setNewSrcUrl(e.target.value)} placeholder="URL (https://...)" style={inputS} />
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

                {/* Industries */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0eee8', margin: 0 }}>Industries <span style={{ fontSize: 12, color: '#555', fontWeight: 400 }}>({industries.length})</span></h3>
                    <button onClick={() => setShowAddIndustry(p => !p)} style={btnSmall}>{I.plus} Add</button>
                  </div>
                  {showAddIndustry && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <input value={newIndustryName} onChange={e => setNewIndustryName(e.target.value)} placeholder="Industry name" style={{ ...inputS, flex: 1 }} />
                      <button onClick={handleAddIndustry} style={btnSmall}>Add</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {industries.map(ind => (
                      <div key={ind.id} style={{ ...cardS, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#f0eee8' }}>{ind.name}</span>
                        <button onClick={async () => {
                          await fetch('/api/news-hub/industries', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ind.id }) })
                          await loadIndustries()
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 16, padding: '2px 6px' }}>×</button>
                      </div>
                    ))}
                    {industries.length === 0 && <div style={{ fontSize: 13, color: '#444', padding: '8px 0' }}>No industries. Add to collect industry-specific news.</div>}
                  </div>
                </div>

                {/* Content Creators */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0eee8', margin: 0 }}>Content Creators <span style={{ fontSize: 12, color: '#555', fontWeight: 400 }}>({creators.length})</span></h3>
                    <button onClick={() => setShowAddCreator(p => !p)} style={btnSmall}>{I.plus} Add</button>
                  </div>
                  {showAddCreator && (
                    <div style={{ ...cardS, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input value={newCreatorName} onChange={e => setNewCreatorName(e.target.value)} placeholder="e.g. Lex Fridman" style={inputS} />
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['youtube', 'podcast', 'twitter', 'linkedin', 'reddit', 'blog'].map(p => (
                          <button key={p} onClick={() => setNewCreatorPlatform(p)} style={{ ...chip(newCreatorPlatform === p), textTransform: 'capitalize' }}>{p}</button>
                        ))}
                      </div>
                      <button onClick={handleAddCreator} style={{ ...btnSmall, width: '100%', textAlign: 'center', padding: '10px' }}>Add Creator</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {creators.map(c => (
                      <div key={c.id} style={{ ...cardS, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#f0eee8' }}>{c.name}</span>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', textTransform: 'capitalize' }}>{c.platform}</span>
                        </div>
                        <button onClick={async () => {
                          await fetch('/api/news-hub/creators', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) })
                          await loadCreators()
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 16, padding: '2px 6px' }}>×</button>
                      </div>
                    ))}
                    {creators.length === 0 && <div style={{ fontSize: 13, color: '#444', padding: '8px 0' }}>No creators. Add YouTube channels, podcasts, X accounts.</div>}
                  </div>
                </div>

                {/* Add Link */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0eee8', margin: '0 0 12px' }}>Add a Link</h3>
                  <div style={{ ...cardS, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." style={inputS} />
                    <input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Title (optional)" style={inputS} />
                    <textarea value={linkNotes} onChange={e => setLinkNotes(e.target.value)} placeholder="Notes (optional)" rows={2} style={{ ...inputS, resize: 'vertical' as const }} />
                    <button onClick={handleAddLink} disabled={!linkUrl.trim() || linkSubmitting} style={{ ...btnSmall, width: '100%', textAlign: 'center', padding: '10px', opacity: linkUrl.trim() ? 1 : 0.5 }}>
                      {linkSubmitting ? 'Adding...' : 'Add Link'}
                    </button>
                  </div>
                  {links.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>Saved Links ({links.length})</p>
                      {links.slice(0, 10).map(l => (
                        <div key={l.id} onClick={() => window.open(l.url, '_blank')} style={{ ...cardS, marginBottom: 6, cursor: 'pointer', padding: '10px 12px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0eee8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title || l.url}</div>
                          <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{timeAgo(l.added_at)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Collection info */}
                <div style={{ ...cardS, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', marginBottom: 6 }}>Collection Schedule</div>
                  <div style={{ fontSize: 13, color: '#888' }}>Hit Refresh in the Feed tab to collect latest articles from your sources.</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Requires BRAVE_API_KEY env variable on Vercel.</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  )
}
