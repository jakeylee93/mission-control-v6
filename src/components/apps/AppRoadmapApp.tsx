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
  status: 'idea' | 'planned' | 'building' | 'live' | 'review'
  category: 'business' | 'personal' | 'laboratory'
  phases: Phase[]
  ideas: string[]
  fixes: string[]
  created_at: string
  updated_at: string
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
      body: JSON.stringify({ name: newName, description: newDesc, icon: newIcon, status: newStatus, category: newCategory }),
    })
    setNewName(''); setNewDesc(''); setNewIcon('📱'); setNewStatus('idea'); setNewCategory('business'); setShowAdd(false)
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
            <span style={{ fontSize: 17, fontWeight: 700, color: '#f0eee8' }}>{detailApp.icon} {detailApp.name}</span>
            <button onClick={() => handleDeleteApp(detailApp.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>{I.trash}</button>
          </div>
        </div>

        <div style={{ padding: '0 16px', paddingTop: 66, flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 40, animation: 'arFadeIn 0.25s ease' }}>

          {/* Status & description */}
          <div style={{ ...cardS, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 28 }}>{detailApp.icon}</span>
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
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="Icon emoji" style={{ ...inputS, width: 60, textAlign: 'center', fontSize: 20, padding: '6px' }} />
              <select value={newCategory} onChange={e => setNewCategory(e.target.value as RoadmapApp['category'])} style={{ ...inputS, flex: 1, cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
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
                            <span style={{ fontSize: 24 }}>{app.icon}</span>
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
                    <span style={{ fontSize: 24 }}>{app.icon}</span>
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
