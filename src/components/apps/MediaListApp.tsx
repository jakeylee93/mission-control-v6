'use client'

import { useState, useEffect, useCallback } from 'react'

interface MediaItem {
  id: string
  title: string
  source: string | null
  author: string | null
  url: string | null
  category: string
  recommended_by: string | null
  notes: string | null
  status: string
  created_at: string
  completed_at: string | null
  description: string | null
}

type Category = 'all' | 'podcast' | 'newsletter' | 'article' | 'book' | 'video'
type Status = 'all' | 'todo' | 'in_progress' | 'done'

const CATEGORY_EMOJI: Record<string, string> = {
  podcast: '🎧',
  newsletter: '📰',
  article: '📖',
  book: '📖',
  video: '🎬',
}

const CATEGORY_FILTERS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'podcast', label: '🎧 Podcasts' },
  { id: 'newsletter', label: '📰 Newsletters' },
  { id: 'article', label: '📖 Reading' },
  { id: 'video', label: '🎬 Video' },
]

const STATUS_FILTERS: { id: Status; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

const STATUS_COLORS: Record<string, string> = {
  todo: '#f59e0b',
  in_progress: '#3b82f6',
  done: '#22c55e',
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const CATEGORY_OPTIONS: { id: string; label: string; emoji: string }[] = [
  { id: 'podcast', label: 'Podcast', emoji: '🎧' },
  { id: 'newsletter', label: 'Newsletter', emoji: '📰' },
  { id: 'article', label: 'Article', emoji: '📖' },
  { id: 'book', label: 'Book', emoji: '📖' },
  { id: 'video', label: 'Video', emoji: '🎬' },
]

const EMPTY_MESSAGES: Record<string, string> = {
  all: 'No media items yet. Tap + to add your first!',
  podcast: 'No podcasts saved. Add one to get started!',
  newsletter: 'No newsletters tracked yet.',
  article: 'No articles or books saved.',
  book: 'No articles or books saved.',
  video: 'No videos saved yet.',
}

const backIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>

export default function MediaListApp({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<Category>('all')
  const [statusFilter, setStatusFilter] = useState<Status>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')
  const [toast, setToast] = useState('')

  // Add form state
  const [addForm, setAddForm] = useState({
    title: '', source: '', author: '', url: '', category: 'podcast',
    recommended_by: '', description: '',
  })

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/media-list')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      // Table might not exist, try setup
      try {
        await fetch('/api/media-list/setup', { method: 'POST' })
        const res = await fetch('/api/media-list')
        if (res.ok) {
          const data = await res.json()
          setItems(data.items || [])
        }
      } catch {
        // Silently fail
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const filteredItems = items.filter(item => {
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'article' && item.category !== 'article' && item.category !== 'book') return false
      if (categoryFilter !== 'article' && item.category !== categoryFilter) return false
    }
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    return true
  })

  const handleAdd = async () => {
    if (!addForm.title.trim()) return
    try {
      const res = await fetch('/api/media-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (!res.ok) throw new Error('Failed to add')
      const data = await res.json()
      setItems(prev => [data.item, ...prev])
      setShowAdd(false)
      setAddForm({ title: '', source: '', author: '', url: '', category: 'podcast', recommended_by: '', description: '' })
      showToast('Added to media list')
    } catch {
      showToast('Failed to add item')
    }
  }

  const cycleStatus = async (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = item.status === 'todo' ? 'in_progress' : item.status === 'in_progress' ? 'done' : 'todo'
    try {
      const res = await fetch('/api/media-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: next }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const data = await res.json()
      setItems(prev => prev.map(i => i.id === item.id ? data.item : i))
      showToast(`Marked as ${STATUS_LABELS[next]}`)
    } catch {
      showToast('Failed to update status')
    }
  }

  const saveNotes = async (id: string) => {
    try {
      const res = await fetch('/api/media-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes: notesText }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      setItems(prev => prev.map(i => i.id === id ? data.item : i))
      setEditingNotes(null)
      showToast('Notes saved')
    } catch {
      showToast('Failed to save notes')
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch('/api/media-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setItems(prev => prev.filter(i => i.id !== id))
      setExpandedId(null)
      showToast('Item deleted')
    } catch {
      showToast('Failed to delete')
    }
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 20,
    border: 'none',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    background: active ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.06)',
    color: active ? '#c4b5fd' : '#999',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  })

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#F0EEE8',
    fontSize: 14,
    fontFamily: 'Inter, system-ui, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ paddingTop: 52 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(168,85,247,0.9)', color: '#fff', padding: '10px 24px',
          borderRadius: 12, fontSize: 14, fontWeight: 500, zIndex: 999,
          backdropFilter: 'blur(10px)',
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12,
            color: '#aaa', padding: '10px 16px', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>{backIcon} Back</button>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          background: 'rgba(168,85,247,0.25)', border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: 12, color: '#c4b5fd', padding: '10px 18px', fontSize: 14,
          fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>+ Add</button>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontSize: 28, fontWeight: 700, color: '#F0EEE8', margin: 0,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>Media List</h1>
        <p style={{ color: '#888', fontSize: 14, margin: '4px 0 0' }}>
          {items.length} item{items.length !== 1 ? 's' : ''} &middot; {items.filter(i => i.status === 'done').length} completed
        </p>
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {CATEGORY_FILTERS.map(f => (
          <button key={f.id} onClick={() => setCategoryFilter(f.id)} style={chipStyle(categoryFilter === f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Status Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {STATUS_FILTERS.map(f => (
          <button key={f.id} onClick={() => setStatusFilter(f.id)} style={chipStyle(statusFilter === f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'rgba(255,255,255,0.02)', borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {categoryFilter === 'all' ? '📚' : CATEGORY_EMOJI[categoryFilter] || '📚'}
          </div>
          <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
            {EMPTY_MESSAGES[categoryFilter] || EMPTY_MESSAGES.all}
          </p>
        </div>
      )}

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredItems.map(item => {
          const isExpanded = expandedId === item.id
          return (
            <div key={item.id} onClick={() => setExpandedId(isExpanded ? null : item.id)} style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${isExpanded ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              {/* Main row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 22, lineHeight: '28px', flexShrink: 0 }}>
                  {CATEGORY_EMOJI[item.category] || '📄'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: '#F0EEE8',
                    lineHeight: '20px', marginBottom: 4,
                  }}>{item.title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                    {(item.source || item.author) && (
                      <span style={{ fontSize: 13, color: '#999' }}>
                        {item.source}{item.source && item.author ? ' · ' : ''}{item.author}
                      </span>
                    )}
                    {item.recommended_by && (
                      <span style={{ fontSize: 12, color: '#a78bfa' }}>
                        rec&apos;d by {item.recommended_by}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => cycleStatus(item, e)}
                  style={{
                    background: `${STATUS_COLORS[item.status]}22`,
                    color: STATUS_COLORS[item.status],
                    border: `1px solid ${STATUS_COLORS[item.status]}44`,
                    borderRadius: 8, padding: '4px 10px', fontSize: 11,
                    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >{STATUS_LABELS[item.status]}</button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {item.description && (
                    <p style={{ fontSize: 13, color: '#bbb', lineHeight: '20px', margin: '0 0 12px' }}>
                      {item.description}
                    </p>
                  )}

                  {/* Notes */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 600 }}>Notes</div>
                    {editingNotes === item.id ? (
                      <div>
                        <textarea
                          value={notesText}
                          onChange={e => setNotesText(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          placeholder="Add your notes..."
                          style={{
                            ...inputStyle, minHeight: 80, resize: 'vertical',
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button onClick={(e) => { e.stopPropagation(); saveNotes(item.id) }} style={{
                            background: 'rgba(168,85,247,0.25)', border: 'none', borderRadius: 8,
                            color: '#c4b5fd', padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                          }}>Save</button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingNotes(null) }} style={{
                            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
                            color: '#999', padding: '6px 14px', fontSize: 12, cursor: 'pointer',
                          }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={(e) => { e.stopPropagation(); setEditingNotes(item.id); setNotesText(item.notes || '') }}
                        style={{
                          fontSize: 13, color: item.notes ? '#bbb' : '#666',
                          background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                          padding: '8px 12px', cursor: 'text', minHeight: 36,
                          fontStyle: item.notes ? 'normal' : 'italic',
                        }}
                      >{item.notes || 'Tap to add notes...'}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {item.url && (
                      <button onClick={(e) => { e.stopPropagation(); window.open(item.url!, '_blank') }} style={{
                        background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: 8, color: '#a5b4fc', padding: '6px 14px', fontSize: 12,
                        cursor: 'pointer', fontWeight: 500,
                      }}>Open Link ↗</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id) }} style={{
                      background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 8, color: '#f87171', padding: '6px 14px', fontSize: 12,
                      cursor: 'pointer', fontWeight: 500,
                    }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setShowAdd(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(170deg, #1a1528 0%, #110d20 100%)',
            borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 500,
            padding: '24px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
            maxHeight: '85vh', overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ color: '#F0EEE8', fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                Add Media
              </h2>
              <button onClick={() => setShowAdd(false)} style={{
                background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10,
                color: '#999', padding: '8px 14px', fontSize: 13, cursor: 'pointer',
              }}>Cancel</button>
            </div>

            {/* Category chips */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 8 }}>Category</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATEGORY_OPTIONS.map(c => (
                  <button key={c.id} onClick={() => setAddForm(f => ({ ...f, category: c.id }))} style={{
                    ...chipStyle(addForm.category === c.id),
                    fontSize: 13,
                  }}>{c.emoji} {c.label}</button>
                ))}
              </div>
            </div>

            {/* URL */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>URL</label>
              <input
                value={addForm.url}
                onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Title *</label>
              <input
                value={addForm.title}
                onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Episode or article title"
                style={inputStyle}
              />
            </div>

            {/* Source */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Source</label>
              <input
                value={addForm.source}
                onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}
                placeholder="e.g. The Rest Is Politics, Morning Brew"
                style={inputStyle}
              />
            </div>

            {/* Author */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Author / Host</label>
              <input
                value={addForm.author}
                onChange={e => setAddForm(f => ({ ...f, author: e.target.value }))}
                placeholder="Host or writer name"
                style={inputStyle}
              />
            </div>

            {/* Recommended by */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Recommended by</label>
              <input
                value={addForm.recommended_by}
                onChange={e => setAddForm(f => ({ ...f, recommended_by: e.target.value }))}
                placeholder="Who told you about this?"
                style={inputStyle}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label>
              <textarea
                value={addForm.description}
                onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description..."
                style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              />
            </div>

            {/* Submit */}
            <button onClick={handleAdd} disabled={!addForm.title.trim()} style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: addForm.title.trim() ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.06)',
              color: addForm.title.trim() ? '#e0d4fc' : '#666',
              fontSize: 15, fontWeight: 700, cursor: addForm.title.trim() ? 'pointer' : 'default',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>Add to Media List</button>
          </div>
        </div>
      )}
    </div>
  )
}
