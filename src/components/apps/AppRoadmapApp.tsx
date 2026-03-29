'use client'

import { useState, useEffect, useCallback } from 'react'

/* ─── Types ─── */
interface Phase {
  name: string
  done: boolean
}

interface RoadmapApp {
  id: string
  name: string
  description: string
  icon: string
  icon_id: string | null
  icon_color: string | null
  status: 'idea' | 'planned' | 'building' | 'live' | 'review'
  category: 'business' | 'personal' | 'laboratory'
  phases: Phase[]
  ideas: string[]
  fixes: string[]
  created_at: string
  updated_at: string
}

/* ─── App Icon Map (matches home screen icons) ─── */
const APP_ICONS: Record<string, JSX.Element> = {
  email: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  calendar: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  costs: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  analytics: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  tasks: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  contacts: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  docs: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  alerts: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  web: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  messages: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  newspaper: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9h4"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
  weather: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  health: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  music: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  photos: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  maps: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  notes: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  shopping: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  home: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  reading: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  downtime: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  lovely: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  agents: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>,
  memory: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  settings: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  skillshop: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 20 C7 15 12 11 17 9"/><path d="M17 9 C19 6 22 5 23 3 C23 1 21 1 19 3 C18 5 17 9 17 9"/><path d="M17 9 C19 11 21 14 20 16 C19 18 17 17 16 15 C15 13 17 9 17 9"/></svg>,
  playground: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
}

type ViewMode = 'board' | 'list'

const STATUSES: { id: RoadmapApp['status']; label: string; color: string; emoji: string }[] = [
  { id: 'idea', label: 'Idea', color: '#f59e0b', emoji: '💡' },
  { id: 'planned', label: 'Planned', color: '#6366f1', emoji: '📋' },
  { id: 'building', label: 'Building', color: '#f97316', emoji: '🔨' },
  { id: 'live', label: 'Live', color: '#22c55e', emoji: '✅' },
  { id: 'review', label: 'Review', color: '#ec4899', emoji: '🔍' },
]

const CATEGORIES: { id: RoadmapApp['category']; label: string }[] = [
  { id: 'business', label: 'Business' },
  { id: 'personal', label: 'Personal' },
  { id: 'laboratory', label: 'Laboratory' },
]

/* ─── Shared styles ─── */
const inputS: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#f0eee8', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}
const btnSmall: React.CSSProperties = {
  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
  borderRadius: 8, padding: '5px 10px', color: '#a5b4fc', fontSize: 12, fontWeight: 600, cursor: 'pointer',
}
const cardS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px',
  border: '1px solid rgba(255,255,255,0.06)',
}
const chip = (active: boolean, color?: string): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
  background: active ? (color || '#6366f1') + '30' : 'rgba(255,255,255,0.06)',
  color: active ? (color || '#a5b4fc') : '#888', border: 'none', cursor: 'pointer',
})

/* ─── Icons ─── */
const I = {
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  board: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  list: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
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

/* ─── App Icon Tile ─── */
function AppIcon({ app, size = 40 }: { app: RoadmapApp; size?: number }) {
  const iconSvg = app.icon_id ? APP_ICONS[app.icon_id] : null
  const color = app.icon_color || '#6366f1'

  if (iconSvg) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.27,
        background: `${color}12`, border: `1px solid ${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color, flexShrink: 0,
      }}>
        {iconSvg}
      </div>
    )
  }

  // Fallback to emoji
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.27,
      background: 'rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.55, flexShrink: 0,
    }}>
      {app.icon || '📱'}
    </div>
  )
}

/* ─── Progress bar ─── */
function ProgressBar({ phases }: { phases: Phase[] }) {
  if (!phases || phases.length === 0) return null
  const done = phases.filter(p => p.done).length
  const pct = Math.round((done / phases.length) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: pct === 100 ? '#22c55e' : '#6366f1', transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: 10, color: '#666', fontWeight: 600, flexShrink: 0 }}>{done}/{phases.length}</span>
    </div>
  )
}

/* ═══════ MAIN COMPONENT ═══════ */
export default function AppRoadmapApp({ onBack }: { onBack: () => void }) {
  const [apps, setApps] = useState<RoadmapApp[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [detailApp, setDetailApp] = useState<RoadmapApp | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  // Add form
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newIcon, setNewIcon] = useState('📱')
  const [newIconId, setNewIconId] = useState<string | null>(null)
  const [newIconColor, setNewIconColor] = useState('#6366f1')
  const [newStatus, setNewStatus] = useState<RoadmapApp['status']>('idea')
  const [newCategory, setNewCategory] = useState<RoadmapApp['category']>('business')

  // Detail editing
  const [newIdea, setNewIdea] = useState('')
  const [newFix, setNewFix] = useState('')
  const [newPhase, setNewPhase] = useState('')

  const [toast, setToast] = useState<string | null>(null)
  const showToast = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2800) }, [])

  const loadApps = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/app-roadmap').then(r => r.json()).catch(() => ({ apps: [] }))
    setApps(r.apps || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadApps() }, [loadApps])

  const handleAddApp = async () => {
    if (!newName.trim()) return
    await fetch('/api/app-roadmap', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, description: newDesc, icon: newIcon, icon_id: newIconId, icon_color: newIconColor, status: newStatus, category: newCategory }),
    })
    setNewName(''); setNewDesc(''); setNewIcon('📱'); setNewIconId(null); setNewIconColor('#6366f1'); setNewStatus('idea'); setNewCategory('business'); setShowAdd(false)
    await loadApps()
    showToast('App added')
  }

  const handleUpdateApp = async (id: string, updates: Partial<RoadmapApp>) => {
    const r = await fetch('/api/app-roadmap', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    }).then(r => r.json())
    if (r.ok && r.app) {
      setApps(prev => prev.map(a => a.id === id ? r.app : a))
      if (detailApp?.id === id) setDetailApp(r.app)
    }
  }

  const handleDeleteApp = async (id: string) => {
    await fetch('/api/app-roadmap', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setApps(prev => prev.filter(a => a.id !== id))
    setDetailApp(null)
    showToast('App removed')
  }

  const handleAddIdea = async () => {
    if (!newIdea.trim() || !detailApp) return
    const ideas = [...(detailApp.ideas || []), newIdea.trim()]
    await handleUpdateApp(detailApp.id, { ideas })
    setNewIdea('')
    showToast('Idea added')
  }

  const handleAddFix = async () => {
    if (!newFix.trim() || !detailApp) return
    const fixes = [...(detailApp.fixes || []), newFix.trim()]
    await handleUpdateApp(detailApp.id, { fixes })
    setNewFix('')
    showToast('Fix added')
  }

  const handleAddPhase = async () => {
    if (!newPhase.trim() || !detailApp) return
    const phases = [...(detailApp.phases || []), { name: newPhase.trim(), done: false }]
    await handleUpdateApp(detailApp.id, { phases })
    setNewPhase('')
    showToast('Phase added')
  }

  const handleTogglePhase = async (idx: number) => {
    if (!detailApp) return
    const phases = [...(detailApp.phases || [])]
    phases[idx] = { ...phases[idx], done: !phases[idx].done }
    await handleUpdateApp(detailApp.id, { phases })
  }

  const handleRemoveIdea = async (idx: number) => {
    if (!detailApp) return
    const ideas = (detailApp.ideas || []).filter((_, i) => i !== idx)
    await handleUpdateApp(detailApp.id, { ideas })
  }

  const handleRemoveFix = async (idx: number) => {
    if (!detailApp) return
    const fixes = (detailApp.fixes || []).filter((_, i) => i !== idx)
    await handleUpdateApp(detailApp.id, { fixes })
  }

  const handleRemovePhase = async (idx: number) => {
    if (!detailApp) return
    const phases = (detailApp.phases || []).filter((_, i) => i !== idx)
    await handleUpdateApp(detailApp.id, { phases })
  }

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return m + 'm ago'
    const h = Math.floor(m / 60)
    if (h < 24) return h + 'h ago'
    const days = Math.floor(h / 24)
    if (days < 7) return days + 'd ago'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const filtered = apps.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false
    return true
  })

  /* ═══ DETAIL VIEW ═══ */
  if (detailApp) {
    const status = STATUSES.find(s => s.id === detailApp.status)
    const phases = detailApp.phases || []
    const ideas = detailApp.ideas || []
    const fixes = detailApp.fixes || []

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <style>{`@keyframes arFadeIn { from { opacity:0;transform:translateY(6px)} to {opacity:1;transform:translateY(0)} }`}</style>

        {/* Header */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(10,8,18,0.95)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 16px', maxWidth: 500, margin: '0 auto', width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
            <button onClick={() => setDetailApp(null)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '4px 0' }}>{I.back}</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppIcon app={detailApp} size={28} />
              <span style={{ fontSize: 17, fontWeight: 700, color: '#f0eee8' }}>{detailApp.name}</span>
            </div>
            <button onClick={() => handleDeleteApp(detailApp.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>{I.trash}</button>
          </div>
        </div>

        <div style={{ padding: '0 16px', paddingTop: 66, flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 40, animation: 'arFadeIn 0.25s ease' }}>

          {/* Status & description */}
          <div style={{ ...cardS, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <AppIcon app={detailApp} size={52} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f0eee8' }}>{detailApp.name}</div>
                <div style={{ fontSize: 11, color: '#666' }}>
                  {CATEGORIES.find(c => c.id === detailApp.category)?.label} • Updated {timeAgo(detailApp.updated_at)}
                </div>
              </div>
            </div>
            <textarea
              value={detailApp.description}
              onChange={e => {
                const updated = { ...detailApp, description: e.target.value }
                setDetailApp(updated)
              }}
              onBlur={() => handleUpdateApp(detailApp.id, { description: detailApp.description })}
              placeholder="Add a description..."
              rows={2}
              style={{ ...inputS, resize: 'vertical' as const, marginBottom: 10 }}
            />

            {/* Status selector */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button key={s.id} onClick={() => handleUpdateApp(detailApp.id, { status: s.id })}
                  style={{ ...chip(detailApp.status === s.id, s.color), display: 'flex', alignItems: 'center', gap: 4 }}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
            {/* Category selector */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => handleUpdateApp(detailApp.id, { category: c.id })}
                  style={{ ...chip(detailApp.category === c.id), fontSize: 11 }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phases */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0eee8', margin: 0 }}>Build Phases ({phases.length})</h3>
            </div>
            <ProgressBar phases={phases} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              {phases.map((p, i) => (
                <div key={i} style={{ ...cardS, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, opacity: p.done ? 0.6 : 1 }}>
                  <input type="checkbox" checked={p.done} onChange={() => handleTogglePhase(i)}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#6366f1' }} />
                  <span style={{ flex: 1, fontSize: 13, color: p.done ? '#666' : '#f0eee8', textDecoration: p.done ? 'line-through' : 'none' }}>{p.name}</span>
                  <button onClick={() => handleRemovePhase(i)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 2 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input value={newPhase} onChange={e => setNewPhase(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddPhase()}
                placeholder="Add phase..." style={{ ...inputS, flex: 1 }} />
              <button onClick={handleAddPhase} style={btnSmall}>{I.plus}</button>
            </div>
          </div>

          {/* Ideas */}
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0eee8', margin: '0 0 8px' }}>💡 Ideas & Features ({ideas.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ideas.map((idea, i) => (
                <div key={i} style={{ ...cardS, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 13, color: '#ccc' }}>{idea}</span>
                  <button onClick={() => handleRemoveIdea(i)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 2 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input value={newIdea} onChange={e => setNewIdea(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddIdea()}
                placeholder="Add idea..." style={{ ...inputS, flex: 1 }} />
              <button onClick={handleAddIdea} style={btnSmall}>{I.plus}</button>
            </div>
          </div>

          {/* Fixes */}
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0eee8', margin: '0 0 8px' }}>🔧 Fixes & Requests ({fixes.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {fixes.map((fix, i) => (
                <div key={i} style={{ ...cardS, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 13, color: '#ccc' }}>{fix}</span>
                  <button onClick={() => handleRemoveFix(i)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 2 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input value={newFix} onChange={e => setNewFix(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFix()}
                placeholder="Add fix or request..." style={{ ...inputS, flex: 1 }} />
              <button onClick={handleAddFix} style={btnSmall}>{I.plus}</button>
            </div>
          </div>

        </div>
        {toast && <Toast msg={toast} />}
      </div>
    )
  }

  /* ═══ MAIN LIST/BOARD VIEW ═══ */
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`@keyframes arFadeIn { from { opacity:0;transform:translateY(6px)} to {opacity:1;transform:translateY(0)} }`}</style>

      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,8,18,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 16px', maxWidth: 500, margin: '0 auto', width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '4px 0' }}>{I.back}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🧪</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#f0eee8' }}>App Roadmap</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setViewMode('board')} style={{ background: viewMode === 'board' ? 'rgba(99,102,241,0.2)' : 'none', border: 'none', cursor: 'pointer', color: viewMode === 'board' ? '#a5b4fc' : '#555', padding: 4, borderRadius: 6 }}>{I.board}</button>
            <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'rgba(99,102,241,0.2)' : 'none', border: 'none', cursor: 'pointer', color: viewMode === 'list' ? '#a5b4fc' : '#555', padding: 4, borderRadius: 6 }}>{I.list}</button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px', paddingTop: 66, flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 40 }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 10, paddingBottom: 4 }}>
          <button onClick={() => setStatusFilter('all')} style={{ ...chip(statusFilter === 'all'), flexShrink: 0 }}>All</button>
          {STATUSES.map(s => (
            <button key={s.id} onClick={() => setStatusFilter(s.id)} style={{ ...chip(statusFilter === s.id, s.color), flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14, paddingBottom: 4 }}>
          <button onClick={() => setCategoryFilter('all')} style={{ ...chip(categoryFilter === 'all'), flexShrink: 0, fontSize: 11 }}>All</button>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategoryFilter(c.id)} style={{ ...chip(categoryFilter === c.id), flexShrink: 0, fontSize: 11 }}>{c.label}</button>
          ))}
        </div>

        {/* Add button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: '#666' }}>{filtered.length} apps</span>
          <button onClick={() => setShowAdd(p => !p)} style={btnSmall}>{I.plus} Add App</button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ ...cardS, marginBottom: 16, animation: 'arFadeIn 0.2s ease' }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="App name" style={{ ...inputS, marginBottom: 8, fontWeight: 600 }} />
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description" rows={2} style={{ ...inputS, marginBottom: 8, resize: 'vertical' as const }} />
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Icon</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {Object.entries(APP_ICONS).map(([iconId, svg]) => (
                  <button key={iconId} onClick={() => { setNewIconId(iconId); setNewIcon('') }} style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: newIconId === iconId ? `${newIconColor}30` : 'rgba(255,255,255,0.06)',
                    border: newIconId === iconId ? `2px solid ${newIconColor}` : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: newIconId === iconId ? newIconColor : '#888',
                    cursor: 'pointer', padding: 0,
                  }}>{svg}</button>
                ))}
                <button onClick={() => { setNewIconId(null) }} style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: !newIconId ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                  border: !newIconId ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 16, padding: 0,
                }}>📱</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!newIconId && <input value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="Emoji" style={{ ...inputS, width: 60, textAlign: 'center', fontSize: 20, padding: '6px' }} />}
                <input type="color" value={newIconColor} onChange={e => setNewIconColor(e.target.value)} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
                <select value={newCategory} onChange={e => setNewCategory(e.target.value as RoadmapApp['category'])} style={{ ...inputS, flex: 1, cursor: 'pointer' }}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {STATUSES.map(s => (
                <button key={s.id} onClick={() => setNewStatus(s.id)} style={{ ...chip(newStatus === s.id, s.color), fontSize: 11 }}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
            <button onClick={handleAddApp} style={{ ...btnSmall, width: '100%', textAlign: 'center', padding: '10px' }}>Add App</button>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>Loading...</div>}

        {/* BOARD VIEW */}
        {!loading && viewMode === 'board' && (
          <div style={{ animation: 'arFadeIn 0.25s ease' }}>
            {STATUSES.filter(s => statusFilter === 'all' || statusFilter === s.id).map(s => {
              const statusApps = filtered.filter(a => a.status === s.id)
              if (statusApps.length === 0 && statusFilter !== 'all') return null
              return (
                <div key={s.id} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 14 }}>{s.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: '#555' }}>({statusApps.length})</span>
                    <div style={{ flex: 1, height: 1, background: `${s.color}20` }} />
                  </div>
                  {statusApps.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#444', padding: '8px 0' }}>No apps</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {statusApps.map(app => (
                        <div key={app.id} onClick={() => setDetailApp(app)} style={{ ...cardS, cursor: 'pointer', borderLeft: `3px solid ${s.color}`, transition: 'background 0.15s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <AppIcon app={app} size={42} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{app.name}</div>
                              {app.description && (
                                <div style={{ fontSize: 11, color: '#888', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.description}</div>
                              )}
                              <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 10, color: '#555' }}>
                                {(app.ideas || []).length > 0 && <span>💡 {app.ideas.length}</span>}
                                {(app.fixes || []).length > 0 && <span>🔧 {app.fixes.length}</span>}
                                {(app.phases || []).length > 0 && <span>📋 {app.phases.filter(p => p.done).length}/{app.phases.length}</span>}
                              </div>
                              <ProgressBar phases={app.phases || []} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* LIST VIEW */}
        {!loading && viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'arFadeIn 0.25s ease' }}>
            {filtered.map(app => {
              const status = STATUSES.find(s => s.id === app.status)
              return (
                <div key={app.id} onClick={() => setDetailApp(app)} style={{ ...cardS, cursor: 'pointer', transition: 'background 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AppIcon app={app} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>{app.name}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: `${status?.color || '#6366f1'}20`, color: status?.color || '#a5b4fc',
                          textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>{status?.emoji} {status?.label}</span>
                      </div>
                      {app.description && (
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.description}</div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 10, color: '#555' }}>
                        <span>{CATEGORIES.find(c => c.id === app.category)?.label}</span>
                        <span>•</span>
                        <span>{timeAgo(app.updated_at)}</span>
                        {(app.ideas || []).length > 0 && <span>• 💡 {app.ideas.length}</span>}
                        {(app.fixes || []).length > 0 && <span>• 🔧 {app.fixes.length}</span>}
                      </div>
                      <ProgressBar phases={app.phases || []} />
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                <p style={{ fontSize: 14, margin: '0 0 12px' }}>No apps match your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  )
}
