'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/* ─── Types ─── */
interface Article {
  id: string; title: string; url: string; source: string | null; summary: string | null
  category: string | null; image_url: string | null; relevance_score: number
  is_trending: boolean; published_at: string | null; collected_at: string; business: string | null
}

interface Brand {
  id: string; name: string; color: string; logo_url?: string | null
  tone?: string; is_client?: boolean; primary_color?: string; secondary_color?: string
}

interface NewsSource {
  id: string; name: string; url: string; label?: string; source_type?: string; brand_id?: string | null
}

interface Section {
  type: string; heading: string; body: string; image_url?: string | null
  cta_text?: string | null; cta_url?: string | null
}

interface Campaign {
  id: string; title: string; brand_id: string; folder: string; status: string
  sections: Section[]; subject_line: string; html_content?: string | null
  list_id?: string | null; scheduled_at?: string | null; created_at: string; sent_at?: string | null
}

interface Template {
  id: string; name: string; brand_id: string; sections: Section[]
  header_image?: string | null; primary_color?: string; secondary_color?: string
}

interface SubList {
  id: string; name: string; brand_id: string; description?: string
}

type Tab = 'feed' | 'campaigns' | 'templates' | 'subscribers' | 'brands'

/* ─── SVG Icons ─── */
const I = {
  newspaper: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9h4"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  refresh: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  heart: (f: boolean) => <svg width="16" height="16" viewBox="0 0 24 24" fill={f ? '#ef4444' : 'none'} stroke={f ? '#ef4444' : 'currentColor'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  mail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  sparkle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  send: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  image: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  up: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>,
  down: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>,
  folder: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  chevDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>,
  building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><path d="M9 18h6"/></svg>,
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
  try { return 'https://www.google.com/s2/favicons?domain=' + new URL(url).hostname + '&sz=20' }
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

const btnPrimary = (enabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '12px', borderRadius: 12, border: 'none',
  background: enabled ? 'rgba(99,102,241,0.8)' : 'rgba(99,102,241,0.2)',
  color: enabled ? '#fff' : '#666', fontSize: 14, fontWeight: 700,
  cursor: enabled ? 'pointer' : 'not-allowed',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
})

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

/* ─── Section Editor ─── */
function SectionEditor({ sections, onChange, brandColor, brandName }: {
  sections: Section[]; onChange: (s: Section[]) => void; brandColor: string; brandName: string
}) {
  const [enhancingIdx, setEnhancingIdx] = useState<number | null>(null)

  const move = (i: number, dir: -1 | 1) => {
    const arr = [...sections]; const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    onChange(arr)
  }

  const update = (i: number, field: keyof Section, value: string | null) => {
    const arr = [...sections]
    arr[i] = { ...arr[i], [field]: value }
    onChange(arr)
  }

  const remove = (i: number) => onChange(sections.filter((_, idx) => idx !== i))

  const addSection = () => onChange([...sections, { type: 'text', heading: 'New Section', body: 'Edit this content...', image_url: null, cta_text: null, cta_url: null }])

  const enhanceSection = async (i: number) => {
    setEnhancingIdx(i)
    try {
      const res = await fetch('/api/news-hub/ai-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enhance', section_text: sections[i].body, brand_name: brandName }),
      })
      const d = await res.json()
      if (d.ok) update(i, 'body', d.enhanced_text)
    } catch { /* ignore */ }
    setEnhancingIdx(null)
  }

  const SECTION_TYPES = ['hero', 'text', 'image', 'offer', 'cta', 'divider']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sections.map((sec, i) => (
        <div key={i} style={{
          ...cardS, position: 'relative',
          borderLeft: `3px solid ${sec.type === 'hero' ? brandColor : sec.type === 'offer' ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
        }}>
          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <select value={sec.type} onChange={e => update(i, 'type', e.target.value)} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '3px 8px', color: '#a5b4fc', fontSize: 11, outline: 'none',
            }}>
              {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ flex: 1 }} />
            <button onClick={() => move(i, -1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 2 }}>{I.up}</button>
            <button onClick={() => move(i, 1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 2 }}>{I.down}</button>
            <button onClick={() => enhanceSection(i)} disabled={enhancingIdx === i} style={{ ...btnSmall, padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, opacity: enhancingIdx === i ? 0.5 : 1 }}>
              {I.sparkle} {enhancingIdx === i ? '...' : 'Enhance'}
            </button>
            <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}>{I.trash}</button>
          </div>

          {sec.type !== 'divider' && (
            <>
              <input value={sec.heading} onChange={e => update(i, 'heading', e.target.value)}
                placeholder="Section heading" style={{ ...inputS, marginBottom: 8, fontSize: 15, fontWeight: 700 }} />
              <textarea value={sec.body} onChange={e => update(i, 'body', e.target.value)}
                rows={3} placeholder="Section content..."
                style={{ ...inputS, resize: 'vertical' as const, marginBottom: 8 }} />
            </>
          )}

          {/* Image upload */}
          {(sec.type === 'hero' || sec.type === 'image') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <input value={sec.image_url || ''} onChange={e => update(i, 'image_url', e.target.value || null)}
                placeholder="Image URL" style={{ ...inputS, flex: 1, fontSize: 12 }} />
              <label style={{ ...btnSmall, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', margin: 0 }}>
                {I.image} Upload
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    update(i, 'image_url', reader.result as string)
                  }
                  reader.readAsDataURL(file)
                }} />
              </label>
            </div>
          )}

          {sec.image_url && (
            <div style={{
              height: 80, borderRadius: 8, marginBottom: 8,
              backgroundImage: `url(${sec.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center',
              border: '1px solid rgba(255,255,255,0.1)',
            }} />
          )}

          {/* CTA */}
          {(sec.type === 'offer' || sec.type === 'cta') && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={sec.cta_text || ''} onChange={e => update(i, 'cta_text', e.target.value || null)}
                placeholder="Button text" style={{ ...inputS, flex: 1, fontSize: 12 }} />
              <input value={sec.cta_url || ''} onChange={e => update(i, 'cta_url', e.target.value || null)}
                placeholder="Button URL" style={{ ...inputS, flex: 2, fontSize: 12 }} />
            </div>
          )}
        </div>
      ))}

      <button onClick={addSection} style={{ ...btnSmall, width: '100%', textAlign: 'center', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {I.plus} Add Section
      </button>
    </div>
  )
}

/* ─── HTML Builder ─── */
function buildHtml(brand: Brand, sections: Section[], subjectLine: string): string {
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const brandColor = brand.primary_color || brand.color || '#6366f1'

  const sectionsHtml = sections.map(s => {
    if (s.type === 'divider') return '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">'

    let html = '<div style="margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #f3f4f6;">'

    if (s.image_url) {
      html += `<img src="${s.image_url}" alt="${s.heading}" style="width:100%;height:auto;border-radius:12px;margin-bottom:16px;display:block;" />`
    }

    if (s.type === 'hero') {
      html += `<h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#111827;line-height:1.3;">${s.heading}</h1>`
    } else {
      html += `<h2 style="margin:0 0 10px;font-size:18px;font-weight:700;color:#111827;line-height:1.4;">${s.heading}</h2>`
    }

    html += `<p style="margin:0 0 14px;color:#4b5563;font-size:15px;line-height:1.6;">${s.body}</p>`

    if (s.cta_text) {
      html += `<a href="${s.cta_url || '#'}" style="display:inline-block;background:${brandColor};color:#fff;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;">${s.cta_text}</a>`
    }

    html += '</div>'
    return html
  }).join('')

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${subjectLine}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<div style="background:linear-gradient(135deg,${brandColor} 0%,${brandColor}cc 100%);padding:40px 32px;text-align:center;">
${brand.logo_url ? `<img src="${brand.logo_url}" alt="${brand.name}" style="max-height:48px;margin-bottom:12px;">` : ''}
<h1 style="margin:0 0 6px;color:#fff;font-size:28px;font-weight:800;">${brand.name}</h1>
<p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;">${subjectLine} &bull; ${date}</p>
</div>
<div style="padding:40px 32px;">${sectionsHtml}</div>
<div style="background:#f3f4f6;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 6px;color:#6b7280;font-size:13px;">You're receiving this from ${brand.name}.</p>
<p style="margin:0;color:#9ca3af;font-size:12px;">Powered by Mission Control &bull; ${date}</p>
</div></div></body></html>`
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

  // Sources
  const [sources, setSources] = useState<NewsSource[]>([])

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)
  const [campaignFolder, setCampaignFolder] = useState('all')

  // Templates
  const [templates, setTemplates] = useState<Template[]>([])

  // Subscribers
  const [subLists, setSubLists] = useState<SubList[]>([])

  // Campaign builder
  const [buildTitle, setBuildTitle] = useState('')
  const [buildSections, setBuildSections] = useState<Section[]>([])
  const [buildSubject, setBuildSubject] = useState('')
  const [buildListId, setBuildListId] = useState('')
  const [buildStep, setBuildStep] = useState<'new' | 'edit' | 'preview' | 'list'>('list')
  const [aiLoading, setAiLoading] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  const showToast = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2800) }, [])

  // Brands & settings form
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

  // Sub list form
  const [showAddList, setShowAddList] = useState(false)
  const [newListName, setNewListName] = useState('')

  // Test email
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)

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
    const r = await fetch('/api/news-hub/favorites').then(r => r.json()).catch(() => ({ favorites: [] }))
    const favs = r.favorites || []
    setFavIds(new Set(favs.map((f: { article_id: string }) => f.article_id)))
    const map: Record<string, string> = {}
    favs.forEach((f: { article_id: string; id: string }) => { map[f.article_id] = f.id })
    setFavMap(map)
  }, [])

  const loadSources = useCallback(async () => {
    const params = activeBrand ? `?brand_id=${activeBrand.id}` : ''
    const r = await fetch(`/api/news-hub/sources${params}`).then(r => r.json()).catch(() => ({ sources: [] }))
    setSources(r.sources || [])
  }, [activeBrand])

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

  useEffect(() => { loadBrands() }, [loadBrands])
  useEffect(() => { if (activeBrand) { loadArticles(); loadSources(); loadFavs() } }, [activeBrand]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tab === 'campaigns') { loadCampaigns(); loadSubLists() }
    if (tab === 'templates') loadTemplates()
    if (tab === 'subscribers') loadSubLists()
  }, [tab, activeBrand]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Handlers ─── */
  const handleCollect = async () => {
    if (collecting) return
    setCollecting(true)
    const r = await fetch('/api/news-hub/collect', { method: 'POST' }).then(r => r.json()).catch(() => ({ ok: false }))
    showToast(r.ok ? `Collected ${r.count || 0} articles` : (r.error || 'Failed'))
    await loadArticles()
    setCollecting(false)
  }

  const handleToggleFav = async (article: Article) => {
    if (favIds.has(article.id)) {
      const fId = favMap[article.id]; if (!fId) return
      await fetch('/api/news-hub/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: fId }) })
      setFavIds(p => { const s = new Set(p); s.delete(article.id); return s })
      setFavMap(p => { const m = { ...p }; delete m[article.id]; return m })
      showToast('Removed')
    } else {
      const r = await fetch('/api/news-hub/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ article_id: article.id, business: activeBrand?.id || 'default' }) }).then(r => r.json())
      if (r.ok && r.favorite) {
        setFavIds(p => { const s = new Set(Array.from(p)); s.add(article.id); return s })
        setFavMap(p => ({ ...p, [article.id]: r.favorite.id }))
        showToast('Saved')
      }
    }
  }

  const handleAiDraft = async () => {
    if (!buildTitle.trim() || !activeBrand) return
    setAiLoading(true)
    const r = await fetch('/api/news-hub/ai-draft', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'draft', title: buildTitle, brand_name: activeBrand.name, brand_tone: activeBrand.tone }),
    }).then(r => r.json()).catch(() => ({ ok: false }))
    if (r.ok !== false && r.sections) {
      setBuildSections(r.sections)
      setBuildSubject(r.subject_line || buildTitle)
      setBuildStep('edit')
      showToast('Draft generated')
    } else {
      showToast(r.error || 'AI draft failed')
    }
    setAiLoading(false)
  }

  const handleEnhanceAll = async () => {
    if (!activeBrand || buildSections.length === 0) return
    setAiLoading(true)
    const r = await fetch('/api/news-hub/ai-draft', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enhance_all', sections: buildSections, brand_name: activeBrand.name, brand_tone: activeBrand.tone }),
    }).then(r => r.json()).catch(() => ({ ok: false }))
    if (r.ok !== false && r.sections) {
      setBuildSections(r.sections)
      showToast('Enhanced')
    }
    setAiLoading(false)
  }

  const handlePreview = () => {
    if (!activeBrand) return
    const html = buildHtml(activeBrand, buildSections, buildSubject || buildTitle)
    setPreviewHtml(html)
    setBuildStep('preview')
  }

  const handleSaveCampaign = async () => {
    if (!activeBrand) return
    const html = buildHtml(activeBrand, buildSections, buildSubject || buildTitle)

    if (editCampaign) {
      await fetch('/api/news-hub/campaigns', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editCampaign.id, title: buildTitle, sections: buildSections, subject_line: buildSubject, html_content: html, list_id: buildListId || null }),
      })
      showToast('Campaign updated')
    } else {
      await fetch('/api/news-hub/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: buildTitle, brand_id: activeBrand.id, folder: campaignFolder === 'all' ? 'newsletters' : campaignFolder, sections: buildSections, subject_line: buildSubject, html_content: html, list_id: buildListId || null }),
      })
      showToast('Campaign saved')
    }
    await loadCampaigns()
    setBuildStep('list')
    setEditCampaign(null)
  }

  const handleTestSend = async () => {
    if (!testEmail.trim() || !activeBrand) return
    setSending(true)
    const html = previewHtml || buildHtml(activeBrand, buildSections, buildSubject || buildTitle)
    const r = await fetch('/api/news-hub/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_email: testEmail, html_content: html, subject_line: buildSubject || buildTitle }),
    }).then(r => r.json()).catch(() => ({ ok: false }))
    showToast(r.ok ? 'Test email sent!' : (r.error || 'Send failed'))
    setSending(false)
  }

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return
    await fetch('/api/news-hub/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newBrandName, color: newBrandColor, is_client: newBrandIsClient }),
    })
    setNewBrandName(''); setNewBrandColor('#6366f1'); setNewBrandIsClient(false); setShowAddBrand(false)
    await loadBrands()
    showToast('Brand added')
  }

  const handleAddSource = async () => {
    if (!newSrcName.trim() || !newSrcUrl.trim()) return
    await fetch('/api/news-hub/sources', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSrcName, url: newSrcUrl, label: newSrcLabel || newSrcName, source_type: newSrcType, brand_id: activeBrand?.id }),
    })
    setNewSrcName(''); setNewSrcUrl(''); setNewSrcLabel(''); setShowAddSource(false)
    await loadSources()
    showToast('Source added')
  }

  const handleAddList = async () => {
    if (!newListName.trim() || !activeBrand) return
    await fetch('/api/news-hub/subscribers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_list', name: newListName, brand_id: activeBrand.id }),
    })
    setNewListName(''); setShowAddList(false)
    await loadSubLists()
    showToast('List created')
  }

  const CAMPAIGN_FOLDERS = ['all', 'newsletters', 'promotions', 'birthdays', 'christmas', 'seasonal']

  const myBrands = brands.filter(b => !b.is_client)
  const clientBrands = brands.filter(b => b.is_client)

  const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
    { id: 'feed', label: 'News', icon: I.newspaper },
    { id: 'campaigns', label: 'Campaigns', icon: I.mail },
    { id: 'templates', label: 'Templates', icon: I.folder },
    { id: 'subscribers', label: 'Lists', icon: I.users },
    { id: 'brands', label: 'Brands', icon: I.building },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes nhSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes nhFadeIn { from { opacity:0;transform:translateY(6px)} to {opacity:1;transform:translateY(0)} }
        .nh-card:hover { background: rgba(255,255,255,0.07) !important; }
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
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color }} />
                    {b.name}
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
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color }} />
                    {b.name}
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
                {articles.length} articles {activeBrand ? `• ${activeBrand.name}` : ''}
              </span>
              <button onClick={handleCollect} disabled={collecting} style={{
                ...btnSmall, display: 'flex', alignItems: 'center', gap: 6, opacity: collecting ? 0.7 : 1,
              }}>
                <span style={collecting ? { animation: 'nhSpin 1s linear infinite', display: 'inline-flex' } : {}}>{I.refresh}</span>
                {collecting ? 'Collecting…' : 'Refresh'}
              </button>
            </div>

            {/* Sources for this brand */}
            {sources.length > 0 && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14, paddingBottom: 4 }}>
                {sources.map(s => (
                  <span key={s.id} style={{
                    ...chip(false), display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  }}>
                    {getFavicon(s.url) && <img src={getFavicon(s.url)} width={14} height={14} alt="" style={{ borderRadius: 2 }} />}
                    {s.label || s.name}
                  </span>
                ))}
              </div>
            )}

            {sources.length === 0 && !loading && (
              <div style={{ ...cardS, textAlign: 'center', padding: '30px 20px', marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: '#888', margin: 0 }}>No sources configured for this brand.</p>
                <button onClick={() => setTab('brands')} style={{ ...btnSmall, marginTop: 12 }}>Add Sources →</button>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>Loading...</div>
            ) : articles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                <p style={{ fontSize: 14, margin: 0 }}>No articles yet. Add sources in Brands tab and hit Refresh.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {articles.map(article => (
                  <div key={article.id} className="nh-card" onClick={() => window.open(article.url, '_blank')} style={{
                    ...cardS, cursor: 'pointer', transition: 'background 0.15s', display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}>
                    {article.image_url && (
                      <div style={{ width: 56, height: 56, borderRadius: 10, flexShrink: 0, backgroundImage: `url(${article.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', marginBottom: 4 }}>{article.title}</div>
                      <div style={{ fontSize: 11, color: '#666', display: 'flex', gap: 8, alignItems: 'center' }}>
                        {article.source && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {getFavicon(article.url) && <img src={getFavicon(article.url)} width={14} height={14} alt="" style={{ borderRadius: 2 }} />}
                          {article.source.length > 25 ? article.source.slice(0, 25) + '…' : article.source}
                        </span>}
                        <span>{timeAgo(article.published_at || article.collected_at)}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleToggleFav(article) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                      {I.heart(favIds.has(article.id))}
                    </button>
                  </div>
                ))}
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
                  <button onClick={() => { setBuildStep('new'); setBuildTitle(''); setBuildSections([]); setBuildSubject(''); setEditCampaign(null) }} style={btnSmall}>
                    {I.plus} New
                  </button>
                </div>

                {/* Folder pills */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 16, paddingBottom: 4 }}>
                  {CAMPAIGN_FOLDERS.map(f => (
                    <button key={f} onClick={() => setCampaignFolder(f)} style={{ ...chip(campaignFolder === f), textTransform: 'capitalize', flexShrink: 0 }}>{f}</button>
                  ))}
                </div>

                {campaigns.filter(c => campaignFolder === 'all' || c.folder === campaignFolder).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                    <p style={{ fontSize: 14, margin: '0 0 12px' }}>No campaigns yet. Create your first one!</p>
                    <button onClick={() => setBuildStep('new')} style={btnSmall}>Create Campaign</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {campaigns.filter(c => campaignFolder === 'all' || c.folder === campaignFolder).map(c => (
                      <div key={c.id} className="nh-card" style={{ ...cardS, cursor: 'pointer' }} onClick={() => {
                        setEditCampaign(c); setBuildTitle(c.title); setBuildSections(c.sections || [])
                        setBuildSubject(c.subject_line); setBuildListId(c.list_id || ''); setBuildStep('edit')
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{c.title}</div>
                            <div style={{ fontSize: 11, color: '#666', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ textTransform: 'capitalize' }}>{c.folder}</span>
                              <span>{timeAgo(c.created_at)}</span>
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase',
                            background: c.status === 'sent' ? 'rgba(34,197,94,0.2)' : c.status === 'scheduled' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.15)',
                            color: c.status === 'sent' ? '#4ade80' : c.status === 'scheduled' ? '#f59e0b' : '#a5b4fc',
                          }}>{c.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {buildStep === 'new' && (
              <>
                <button onClick={() => setBuildStep('list')} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {I.back} Back to campaigns
                </button>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: '0 0 16px' }}>New Campaign</h3>

                <input value={buildTitle} onChange={e => setBuildTitle(e.target.value)}
                  placeholder="Give it a title e.g. 'March Industry News'" style={{ ...inputS, marginBottom: 12, fontSize: 15, fontWeight: 600 }} />

                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button onClick={handleAiDraft} disabled={!buildTitle.trim() || aiLoading} style={{ ...btnPrimary(!!buildTitle.trim() && !aiLoading), flex: 1 }}>
                    {I.sparkle} {aiLoading ? 'Generating...' : 'AI Draft'}
                  </button>
                  <button onClick={() => {
                    setBuildSections([
                      { type: 'hero', heading: buildTitle || 'Newsletter', body: 'Write your intro here...', image_url: null, cta_text: null, cta_url: null },
                      { type: 'text', heading: 'Section 1', body: 'Your content...', image_url: null, cta_text: null, cta_url: null },
                    ])
                    setBuildSubject(buildTitle)
                    setBuildStep('edit')
                  }} style={{ ...btnSmall, padding: '12px 16px' }}>
                    {I.edit} Manual
                  </button>
                </div>

                {/* Use template */}
                {templates.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>Or start from a template:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {templates.map(t => (
                        <button key={t.id} onClick={() => {
                          setBuildSections(t.sections || []); setBuildSubject(buildTitle); setBuildStep('edit')
                        }} style={{ ...cardS, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0eee8' }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>{(t.sections || []).length} sections</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {buildStep === 'edit' && (
              <>
                <button onClick={() => setBuildStep(editCampaign ? 'list' : 'new')} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {I.back} Back
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: 0 }}>
                    {editCampaign ? 'Edit Campaign' : 'Build Campaign'}
                  </h3>
                  <button onClick={handleEnhanceAll} disabled={aiLoading} style={{ ...btnSmall, display: 'flex', alignItems: 'center', gap: 4, opacity: aiLoading ? 0.5 : 1 }}>
                    {I.sparkle} Enhance All
                  </button>
                </div>

                <input value={buildSubject} onChange={e => setBuildSubject(e.target.value)}
                  placeholder="Subject line" style={{ ...inputS, marginBottom: 12 }} />

                {/* Subscriber list selector */}
                {subLists.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Send to list:</label>
                    <select value={buildListId} onChange={e => setBuildListId(e.target.value)} style={{
                      ...inputS, cursor: 'pointer',
                    }}>
                      <option value="">No list selected</option>
                      {subLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                )}

                <SectionEditor
                  sections={buildSections}
                  onChange={setBuildSections}
                  brandColor={activeBrand?.color || '#6366f1'}
                  brandName={activeBrand?.name || 'Business'}
                />

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={handlePreview} style={{ ...btnPrimary(buildSections.length > 0), flex: 1 }}>
                    Preview
                  </button>
                  <button onClick={handleSaveCampaign} style={{ ...btnSmall, padding: '12px 16px' }}>
                    Save Draft
                  </button>
                </div>
              </>
            )}

            {buildStep === 'preview' && (
              <>
                <button onClick={() => setBuildStep('edit')} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {I.back} Back to editor
                </button>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: '0 0 16px' }}>Preview</h3>

                <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <iframe srcDoc={previewHtml} style={{ width: '100%', minHeight: 400, border: 'none', display: 'block' }} title="Preview" />
                </div>

                {/* Test send */}
                <div style={{ ...cardS, marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>Send a test email:</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
                      placeholder="your@email.com" style={{ ...inputS, flex: 1 }} />
                    <button onClick={handleTestSend} disabled={!testEmail.trim() || sending} style={{ ...btnSmall, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {I.send} {sending ? '...' : 'Test'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => {
                    navigator.clipboard.writeText(previewHtml)
                    showToast('HTML copied')
                  }} style={{ ...btnSmall, flex: 1, textAlign: 'center', padding: '10px' }}>
                    Copy HTML
                  </button>
                  <button onClick={handleSaveCampaign} style={{ ...btnPrimary(true), flex: 1 }}>
                    Save Campaign
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ TEMPLATES ═══ */}
        {tab === 'templates' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: 0 }}>
                Templates {activeBrand ? `• ${activeBrand.name}` : ''}
              </h3>
              <button onClick={async () => {
                if (!activeBrand) return
                await fetch('/api/news-hub/templates', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: 'New Template', brand_id: activeBrand.id }),
                })
                await loadTemplates()
                showToast('Template created')
              }} style={btnSmall}>{I.plus} New</button>
            </div>

            {templates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                <p style={{ fontSize: 14, margin: 0 }}>No templates yet. Create one to reuse across campaigns.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {templates.map(t => (
                  <div key={t.id} style={{ ...cardS }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>{(t.sections || []).length} sections</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => {
                          setBuildTitle(''); setBuildSections(t.sections || []); setBuildSubject(''); setTab('campaigns'); setBuildStep('edit'); setEditCampaign(null)
                        }} style={btnSmall}>Use</button>
                        <button onClick={async () => {
                          await fetch('/api/news-hub/templates', {
                            method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: t.id }),
                          })
                          await loadTemplates()
                          showToast('Deleted')
                        }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>{I.trash}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ SUBSCRIBERS ═══ */}
        {tab === 'subscribers' && (
          <div style={{ animation: 'nhFadeIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0eee8', margin: 0 }}>
                Subscriber Lists {activeBrand ? `• ${activeBrand.name}` : ''}
              </h3>
              <button onClick={() => setShowAddList(p => !p)} style={btnSmall}>{I.plus} New List</button>
            </div>

            {showAddList && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input value={newListName} onChange={e => setNewListName(e.target.value)}
                  placeholder="List name (e.g. Corporate, Weddings)" style={{ ...inputS, flex: 1 }} />
                <button onClick={handleAddList} style={btnSmall}>Add</button>
              </div>
            )}

            {subLists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                <p style={{ fontSize: 14, margin: 0 }}>No subscriber lists yet. Create one to start managing contacts.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {subLists.map(l => (
                  <div key={l.id} style={{ ...cardS }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{l.name}</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>{l.description || 'No description'}</div>
                      </div>
                      <button onClick={async () => {
                        await fetch('/api/news-hub/subscribers', {
                          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: l.id, type: 'list' }),
                        })
                        await loadSubLists()
                        showToast('List deleted')
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
                    This is a client (not my business)
                  </label>
                </div>
                <button onClick={handleAddBrand} style={{ ...btnSmall, width: '100%', textAlign: 'center', padding: '10px' }}>Add Brand</button>
              </div>
            )}

            {/* My businesses */}
            {myBrands.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>My Businesses</div>
                {myBrands.map(b => (
                  <BrandCard key={b.id} brand={b} isActive={activeBrand?.id === b.id}
                    onSelect={() => setActiveBrand(b)}
                    onDelete={async () => {
                      await fetch('/api/news-hub/settings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id }) })
                      await loadBrands()
                      showToast('Deleted')
                    }}
                  />
                ))}
              </div>
            )}

            {/* Client businesses */}
            {clientBrands.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Clients</div>
                {clientBrands.map(b => (
                  <BrandCard key={b.id} brand={b} isActive={activeBrand?.id === b.id}
                    onSelect={() => setActiveBrand(b)}
                    onDelete={async () => {
                      await fetch('/api/news-hub/settings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id }) })
                      await loadBrands()
                      showToast('Deleted')
                    }}
                  />
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
                    <div key={s.id} style={{
                      ...cardS, display: 'flex', alignItems: 'center', gap: 10,
                    }}>
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
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 16, padding: '2px 6px', lineHeight: 1 }}>×</button>
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

/* ─── Brand Card ─── */
function BrandCard({ brand, isActive, onSelect, onDelete }: {
  brand: Brand; isActive: boolean; onSelect: () => void; onDelete: () => void
}) {
  return (
    <div onClick={onSelect} style={{
      ...cardS, marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s',
      borderLeft: isActive ? `3px solid ${brand.color}` : '3px solid transparent',
      background: isActive ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: brand.color, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{brand.name}</div>
            {brand.tone && <div style={{ fontSize: 11, color: '#666' }}>Tone: {brand.tone}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isActive && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontWeight: 700 }}>ACTIVE</span>}
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}>{I.trash}</button>
        </div>
      </div>
    </div>
  )
}
