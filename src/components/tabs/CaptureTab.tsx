'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DEFAULT_CATEGORIES = ['Personal', 'Business']

interface Attachment {
  filename: string
  type: string
  size: number
}

interface CaptureEntry {
  id: string
  text: string
  originalText?: string
  enhancedText?: string
  enhancementType?: string
  category: string
  isPrivate: boolean
  timestamp: string
  processed: boolean
  attachments?: Attachment[]
}

type EnhancementType = 'summarize' | 'enhance' | 'expand'

interface EnhancePreview {
  originalText: string
  enhancedText: string
  enhancementType: EnhancementType
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

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ENHANCEMENT_LABELS: Record<EnhancementType, { label: string; desc: string; color: string }> = {
  summarize: { label: 'Summarize', desc: 'Key points only', color: '#60A5FA' },
  enhance: { label: 'Enhance', desc: 'Clear & actionable', color: '#34D399' },
  expand: { label: 'Expand', desc: 'Full context + subtasks', color: '#A78BFA' },
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
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [enhancing, setEnhancing] = useState<EnhancementType | null>(null)
  const [preview, setPreview] = useState<EnhancePreview | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  function handleFileSelect(selectedFiles: FileList | null) {
    if (!selectedFiles) return
    const newFiles = Array.from(selectedFiles)
    setFiles((prev) => [...prev, ...newFiles])
    newFiles.forEach((f) => {
      if (f.type.startsWith('image/')) {
        const url = URL.createObjectURL(f)
        setPreviews((prev) => [...prev, url])
      } else {
        setPreviews((prev) => [...prev, ''])
      }
    })
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleEnhance(type: EnhancementType) {
    if (!text.trim()) return
    setEnhancing(type)
    setPreview(null)
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type }),
      })
      const data = await res.json()
      if (data.ok) {
        setPreview({
          originalText: data.originalText,
          enhancedText: data.enhancedText,
          enhancementType: data.enhancementType,
        })
      }
    } catch {}
    setEnhancing(null)
  }

  function acceptEnhancement() {
    if (!preview) return
    setText(preview.enhancedText)
    setPreview(null)
    textareaRef.current?.focus()
  }

  function cancelEnhancement() {
    setPreview(null)
  }

  async function handleSubmit() {
    if (!text.trim() && files.length === 0) return
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('text', text)
      formData.append('category', category)
      formData.append('isPrivate', String(isPrivate))
      if (preview) {
        formData.append('originalText', preview.originalText)
        formData.append('enhancedText', preview.enhancedText)
        formData.append('enhancementType', preview.enhancementType)
      }
      files.forEach((f) => formData.append('files', f))

      const res = await fetch('/api/capture', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.ok) {
        setText('')
        setFiles([])
        setPreviews([])
        setPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--c-text)" }}>Capture</h1>
          <p className="text-sm mt-1" style={{ color: "var(--c-muted)" }}>Quick capture — snap, upload and enhance</p>
        </div>

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
          <div className="mb-3">
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

          {/* Action row: Upload | Summarize | Enhance | Expand | → Submit */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Paperclip / upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
              style={{
                background: files.length > 0 ? 'rgba(255,215,0,0.08)' : 'var(--c-surface)',
                border: `1px solid ${files.length > 0 ? 'rgba(255,215,0,0.2)' : 'var(--c-border)'}`,
                color: files.length > 0 ? '#FFD700' : 'var(--c-muted)',
              }}
              title="Attach files"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''}` : 'Upload'}
            </button>

            <div className="w-px h-4 shrink-0" style={{ background: 'var(--c-border)' }} />

            {/* AI Enhancement Buttons */}
            {(Object.entries(ENHANCEMENT_LABELS) as [EnhancementType, typeof ENHANCEMENT_LABELS[EnhancementType]][]).map(([type, cfg]) => (
              <button
                key={type}
                onClick={() => handleEnhance(type)}
                disabled={!text.trim() || enhancing !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 active:scale-95"
                style={{
                  background: enhancing === type ? `${cfg.color}22` : 'var(--c-surface)',
                  color: enhancing === type ? cfg.color : 'var(--c-muted)',
                  border: `1px solid ${enhancing === type ? `${cfg.color}44` : 'var(--c-border)'}`,
                }}
                title={cfg.desc}
              >
                {enhancing === type ? (
                  <div
                    className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: `${cfg.color}44`, borderTopColor: 'transparent' }}
                  />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    {type === 'summarize' && (
                      <>
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                      </>
                    )}
                    {type === 'enhance' && (
                      <>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </>
                    )}
                    {type === 'expand' && (
                      <>
                        <polyline points="15 3 21 3 21 9"/>
                        <polyline points="9 21 3 21 3 15"/>
                        <line x1="21" y1="3" x2="14" y2="10"/>
                        <line x1="3" y1="21" x2="10" y2="14"/>
                      </>
                    )}
                  </svg>
                )}
                {cfg.label}
              </button>
            ))}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Submit — right-aligned in same row */}
            <button
              onClick={handleSubmit}
              disabled={(!text.trim() && files.length === 0) || submitting}
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

          {/* Enhancement Preview Panel */}
          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'var(--c-panel)',
                    border: `1px solid ${ENHANCEMENT_LABELS[preview.enhancementType].color}33`,
                  }}
                >
                  {/* Preview header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: `${ENHANCEMENT_LABELS[preview.enhancementType].color}22`,
                          color: ENHANCEMENT_LABELS[preview.enhancementType].color,
                        }}
                      >
                        {ENHANCEMENT_LABELS[preview.enhancementType].label}
                      </div>
                      <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>Preview</span>
                    </div>
                  </div>

                  {/* Original */}
                  <div className="mb-3">
                    <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--c-dim)' }}>Original</div>
                    <p className="text-xs leading-relaxed line-through" style={{ color: 'var(--c-muted)' }}>
                      {preview.originalText}
                    </p>
                  </div>

                  {/* Enhanced */}
                  <div className="mb-4">
                    <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: ENHANCEMENT_LABELS[preview.enhancementType].color }}>
                      {ENHANCEMENT_LABELS[preview.enhancementType].label}d
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--c-text)' }}>
                      {preview.enhancedText}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={acceptEnhancement}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                      style={{
                        background: ENHANCEMENT_LABELS[preview.enhancementType].color,
                        color: '#000',
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Accept
                    </button>
                    <button
                      onClick={cancelEnhancement}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: 'var(--c-surface)',
                        color: 'var(--c-muted)',
                        border: '1px solid var(--c-border)',
                      }}
                    >
                      Keep original
                    </button>
                    <button
                      onClick={() => {
                        setText(preview.enhancedText)
                        setPreview(null)
                        textareaRef.current?.focus()
                      }}
                      className="text-[10px] ml-auto transition-all"
                      style={{ color: 'var(--c-dim)' }}
                    >
                      Edit before saving
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* File thumbnails */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mb-3 overflow-hidden"
              >
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden shrink-0"
                    style={{
                      width: '72px',
                      height: '72px',
                      background: 'var(--c-panel)',
                      border: '1px solid var(--c-border)',
                    }}
                  >
                    {previews[idx] ? (
                      <img src={previews[idx]} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5" style={{ color: 'var(--c-muted)' }}>
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                          <polyline points="13 2 13 9 20 9"/>
                        </svg>
                        <span className="text-[9px] text-center truncate w-full px-1" style={{ color: 'var(--c-dim)' }}>
                          {file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.75)' }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                    {/* Size label */}
                    <div
                      className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[8px] text-center"
                      style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                    >
                      {formatSize(file.size)}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls row: Category + Privacy */}
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
          </div>

          <div className="mt-3 text-[10px]" style={{ color: 'var(--c-dim)' }}>
            ⌘ + Enter to submit · AI buttons enhance before saving
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
                        {entry.text || <span style={{ color: 'var(--c-dim)' }}>(no text)</span>}
                      </p>
                      {entry.enhancementType && (
                        <p className="text-[10px] mt-1 italic" style={{ color: 'var(--c-dim)' }}>
                          Originally: {entry.originalText}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                          style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}
                        >
                          {entry.category}
                        </span>
                        {entry.enhancementType && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                            style={{
                              background: `${ENHANCEMENT_LABELS[entry.enhancementType as EnhancementType]?.color}22`,
                              color: ENHANCEMENT_LABELS[entry.enhancementType as EnhancementType]?.color,
                            }}
                          >
                            AI {entry.enhancementType}d
                          </span>
                        )}
                        {entry.isPrivate && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                            style={{ background: 'rgba(168,85,247,0.1)', color: '#A855F7' }}
                          >
                            Private
                          </span>
                        )}
                        {entry.attachments && entry.attachments.length > 0 && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1"
                            style={{ background: 'rgba(255,215,0,0.06)', color: 'var(--c-muted)' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                            {entry.attachments.length} file{entry.attachments.length !== 1 ? 's' : ''}
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
        <div className="mt-6 card p-5">
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
