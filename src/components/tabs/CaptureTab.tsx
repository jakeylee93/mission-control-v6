'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DEFAULT_CATEGORIES = ['Personal', 'Business']

interface CaptureEntry {
  id: string
  text: string
  category: string
  isPrivate: boolean
  timestamp: string
  processed: boolean
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function CaptureTab() {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('Personal')
  const [isPrivate, setIsPrivate] = useState(false)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [addingCat, setAddingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [queue, setQueue] = useState<CaptureEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadQueue()
  }, [])

  async function loadQueue() {
    try {
      const res = await fetch('/api/capture')
      const data = await res.json()
      setQueue(data.queue || [])
    } catch {}
  }

  async function handleSubmit() {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, category, isPrivate }),
      })
      const data = await res.json()
      if (data.ok) {
        setText('')
        setSubmitted(true)
        setTimeout(() => setSubmitted(false), 2500)
        await loadQueue()
        textareaRef.current?.focus()
      }
    } catch {}
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/capture?id=${id}`, { method: 'DELETE' })
      await loadQueue()
    } catch {}
  }

  async function handleClearAll() {
    if (!confirm(`Clear all ${queue.length} queued items?`)) return
    try {
      await fetch('/api/capture?all=true', { method: 'DELETE' })
      setQueue([])
    } catch {}
  }

  function handleAddCategory() {
    const name = newCatName.trim()
    if (!name || categories.includes(name)) return
    setCategories((prev) => [...prev, name])
    setCategory(name)
    setNewCatName('')
    setAddingCat(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[860px] mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold font-heading" style={{ color: 'var(--c-text)' }}>Capture</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--c-muted)' }}>
            Drop thoughts, tasks, ideas. Processed nightly at 1 AM.
          </p>
        </div>

        {/* Input Card */}
        <div className="card p-5 mb-6">
          {/* Textarea */}
          <div className="mb-4">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What are you thinking?"
              rows={4}
              className="w-full resize-none bg-transparent outline-none text-base leading-relaxed"
              style={{
                color: 'var(--c-text)',
                caretColor: '#FFD700',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3 flex-wrap">

            {/* Category */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>
                Category
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: category === cat ? '#FFD700' : 'var(--c-surface)',
                      color: category === cat ? '#000' : 'var(--c-muted)',
                      border: `1px solid ${category === cat ? '#FFD700' : 'var(--c-border)'}`,
                    }}
                  >
                    {cat}
                  </button>
                ))}
                {/* Add category */}
                {addingCat ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCategory()
                        if (e.key === 'Escape') setAddingCat(false)
                      }}
                      placeholder="Category name"
                      autoFocus
                      className="bg-transparent outline-none text-xs px-2 py-1 rounded-lg w-28"
                      style={{
                        border: '1px solid var(--c-border-2)',
                        color: 'var(--c-text)',
                        caretColor: '#FFD700',
                      }}
                    />
                    <button
                      onClick={handleAddCategory}
                      className="text-xs px-2 py-1 rounded-lg font-semibold"
                      style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingCat(false)}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ color: 'var(--c-muted)' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingCat(true)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-lg leading-none transition-all"
                    style={{
                      background: 'var(--c-surface)',
                      border: '1px solid var(--c-border)',
                      color: 'var(--c-muted)',
                    }}
                    title="Add category"
                  >
                    +
                  </button>
                )}
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Privacy toggle */}
            <button
              onClick={() => setIsPrivate((p) => !p)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: isPrivate ? 'rgba(168,85,247,0.1)' : 'var(--c-surface)',
                color: isPrivate ? '#A855F7' : 'var(--c-muted)',
                border: `1px solid ${isPrivate ? 'rgba(168,85,247,0.3)' : 'var(--c-border)'}`,
              }}
            >
              {isPrivate ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="M12 2C9.24 2 7 4.24 7 7v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V11c0-1.1-.9-2-2-2h-2V7c0-2.76-2.24-5-5-5zm0 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-6H9V7c0-1.66 1.34-3 3-3s3 1.34 3 3v2z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                  <path d="M17 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"/>
                  <path d="M11 11V7a1 1 0 0 1 1-1c.55 0 1 .45 1 1v.5"/>
                  <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                </svg>
              )}
              {isPrivate ? 'Private' : 'Shared'}
            </button>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#FFD700', color: '#000' }}
            >
              {submitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : submitted ? (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  </svg>
                  Captured
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Capture
                </>
              )}
            </button>
          </div>

          <div className="mt-3 text-[10px]" style={{ color: 'var(--c-dim)' }}>
            ⌘ + Enter to submit
          </div>
        </div>

        {/* Queue status banner */}
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3 mb-5"
          style={{
            background: queue.length > 0 ? 'rgba(255,215,0,0.05)' : 'var(--c-surface)',
            border: `1px solid ${queue.length > 0 ? 'rgba(255,215,0,0.2)' : 'var(--c-border)'}`,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: queue.length > 0 ? 'rgba(255,215,0,0.1)' : 'var(--c-panel)', color: '#FFD700' }}
            >
              {queue.length}
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                {queue.length === 0
                  ? 'Queue empty'
                  : `${queue.length} item${queue.length !== 1 ? 's' : ''} queued for tonight`}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--c-dim)' }}>
                {queue.length > 0 ? 'Processed nightly at 1:00 AM' : 'Drop something above to get started'}
              </div>
            </div>
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="text-[10px] px-2 py-1 rounded-md font-semibold"
                style={{ background: 'rgba(168,85,247,0.1)', color: '#A855F7' }}>
                ⏰ 1 AM
              </div>
              <button
                onClick={handleClearAll}
                className="text-[10px] px-2 py-1 rounded-md transition-all"
                style={{ color: 'var(--c-muted)', background: 'var(--c-panel)' }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Queue items */}
        {queue.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>
              Queued Items
            </div>
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {queue.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className="card p-4 flex items-start gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text)' }}>
                        {entry.text}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                          style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}
                        >
                          {entry.category}
                        </span>
                        {entry.isPrivate && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                            style={{ background: 'rgba(168,85,247,0.1)', color: '#A855F7' }}
                          >
                            Private
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>
                          {timeAgo(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                      style={{ color: 'var(--c-muted)', background: 'var(--c-panel)' }}
                      title="Remove"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="mt-8 card p-5">
          <div className="text-[10px] uppercase tracking-widest mb-4" style={{ color: 'var(--c-muted)' }}>
            How Nightly Processing Works
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '📅', label: 'Calendar requests', desc: 'Creates Google Calendar events automatically' },
              { icon: '✅', label: 'Tasks & to-dos', desc: 'Added to Plans in the right category' },
              { icon: '💭', label: 'Philosophy & thoughts', desc: 'Saved to memory/philosophy/ as dated notes' },
              { icon: '❓', label: 'Questions', desc: 'Flagged for morning discussion with Margarita' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)' }}>
                <span className="text-lg leading-none">{icon}</span>
                <div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--c-text)' }}>{label}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--c-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
