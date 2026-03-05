'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MemoryFile {
  name: string
  path: string
  content: string
  lastModified: string
}

interface InboxEntry {
  timestamp: string
  text: string
}

type CategoryId = 'personal' | 'business' | 'tech' | 'mission-control' | 'daily-logs' | 'other'

interface FolderCategory {
  id: CategoryId
  name: string
  accent: string
  icon: string
  defaultExpanded: boolean
}

const FOLDER_CATEGORIES: FolderCategory[] = [
  { id: 'personal', name: 'Personal', accent: '#FFD700', icon: '📁', defaultExpanded: false },
  { id: 'business', name: 'Business', accent: '#A855F7', icon: '📂', defaultExpanded: false },
  { id: 'tech', name: 'Tech', accent: '#16A34A', icon: '🗂️', defaultExpanded: false },
  { id: 'mission-control', name: 'Mission Control', accent: '#06B6D4', icon: '🛰️', defaultExpanded: false },
  { id: 'daily-logs', name: 'Daily Logs', accent: '#F59E0B', icon: '🗓️', defaultExpanded: false },
  { id: 'other', name: 'Other', accent: '#666666', icon: '📦', defaultExpanded: false },
]

const PERSONAL_FILES = new Set(['preferences.md', 'people.md', 'addresses.md', 'honesty.md'])
const BUSINESS_FILES = new Set(['business.md', 'projects.md', 'decisions.md'])
const TECH_FILES = new Set(['tech-setup.md', 'apifixes.md', 'automations.md', 'supabase-config.json'])
const MISSION_CONTROL_FILES = new Set(['future-additions.md', 'memory.md'])
const DATE_FILE_PATTERN = /^\d{4}-\d{2}-\d{2}\.md$/i

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatInboxTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function parseInbox(content: string): InboxEntry[] {
  if (!content.trim()) return []

  const parts = content.split(/^##\s+\[(.+?)\]\s*$/gm)
  const entries: InboxEntry[] = []

  for (let i = 1; i < parts.length; i += 2) {
    const timestamp = (parts[i] || '').trim()
    const text = (parts[i + 1] || '').trim()
    if (!timestamp || !text) continue
    entries.push({ timestamp, text })
  }

  return entries
}

function pickCategory(fileName: string): CategoryId {
  const normalized = fileName.toLowerCase()
  if (PERSONAL_FILES.has(normalized)) return 'personal'
  if (BUSINESS_FILES.has(normalized)) return 'business'
  if (TECH_FILES.has(normalized)) return 'tech'
  if (MISSION_CONTROL_FILES.has(normalized)) return 'mission-control'
  if (DATE_FILE_PATTERN.test(normalized)) return 'daily-logs'
  return 'other'
}

function hexToRgba(hex: string, alpha: number) {
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length !== 6) return `rgba(168,85,247,${alpha})`
  const bigint = Number.parseInt(cleanHex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r},${g},${b},${alpha})`
}

export default function BrainTab() {
  const voiceInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaChunksRef = useRef<BlobPart[]>([])
  const [files, setFiles] = useState<MemoryFile[]>([])
  const [selectedPath, setSelectedPath] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingTimestamp, setEditingTimestamp] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncDone, setSyncDone] = useState(false)
  const [showSyncConfirm, setShowSyncConfirm] = useState(false)
  const [addDone, setAddDone] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [recording, setRecording] = useState(false)
  const [describingVideo, setDescribingVideo] = useState(false)
  const [transcribeError, setTranscribeError] = useState('')
  const [hideInboxAfterSync, setHideInboxAfterSync] = useState(false)
  const [showUndoSync, setShowUndoSync] = useState(false)
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [hiddenInboxTimestamps, setHiddenInboxTimestamps] = useState<Set<string>>(new Set())
  const [deletingTimestamps, setDeletingTimestamps] = useState<Set<string>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Record<CategoryId, boolean>>({
    personal: false,
    business: false,
    tech: false,
    'mission-control': false,
    'daily-logs': false,
    other: false,
  })

  async function loadFiles() {
    setLoading(true)
    try {
      const res = await fetch(`/api/memory?t=${Date.now()}`, { cache: 'no-store' })
      const data = await res.json()
      const list = (data.files || []) as MemoryFile[]
      setFiles(list)
      if (!selectedPath && list.length > 0) {
        setSelectedPath(list[0].path)
      } else if (selectedPath && !list.some((file) => file.path === selectedPath)) {
        setSelectedPath(list[0]?.path || '')
      }
    } catch {
      setFiles([])
      setSelectedPath('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  const selectedFile = useMemo(
    () => files.find((file) => file.path === selectedPath) || null,
    [files, selectedPath],
  )

  const inboxEntries = useMemo(() => {
    const inbox = files.find((file) => file.name.toLowerCase() === 'inbox.md')
    if (!inbox) return []
    return parseInbox(inbox.content)
  }, [files])
  const displayedInboxEntries = useMemo(() => {
    if (hideInboxAfterSync) return []
    return inboxEntries.filter((entry) => !hiddenInboxTimestamps.has(entry.timestamp))
  }, [hideInboxAfterSync, hiddenInboxTimestamps, inboxEntries])

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const searchResults = useMemo(() => {
    if (!normalizedSearchQuery) return []

    return files
      .map((file) => {
        const fileNameLower = file.name.toLowerCase()
        const contentLower = file.content.toLowerCase()
        const matchedInName = fileNameLower.includes(normalizedSearchQuery)
        const contentIndex = contentLower.indexOf(normalizedSearchQuery)
        const matchedInContent = contentIndex >= 0
        if (!matchedInName && !matchedInContent) return null

        let snippet = ''
        if (matchedInContent) {
          const start = Math.max(0, contentIndex - 42)
          const end = Math.min(file.content.length, contentIndex + normalizedSearchQuery.length + 56)
          const prefix = start > 0 ? '...' : ''
          const suffix = end < file.content.length ? '...' : ''
          snippet = `${prefix}${file.content.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`
        }

        return { file, matchedInName, snippet }
      })
      .filter((item): item is { file: MemoryFile; matchedInName: boolean; snippet: string } => Boolean(item))
  }, [files, normalizedSearchQuery])
  const categorizedFiles = useMemo(() => {
    const grouped: Record<CategoryId, MemoryFile[]> = {
      personal: [],
      business: [],
      tech: [],
      'mission-control': [],
      'daily-logs': [],
      other: [],
    }

    files.forEach((file) => {
      const categoryId = pickCategory(file.name)
      grouped[categoryId].push(file)
    })

    grouped['daily-logs'].sort((a, b) => b.name.localeCompare(a.name))

    return FOLDER_CATEGORIES.map((category) => ({
      ...category,
      files: grouped[category.id],
    }))
  }, [files])

  async function handleAdd() {
    const text = input.trim()
    if (!text || adding) return

    setAdding(true)
    try {
      const res = await fetch('/api/memory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.ok) {
        setInput('')
        setHideInboxAfterSync(false)
        setAddDone(true)
        setTimeout(() => setAddDone(false), 1800)
        await loadFiles()
      }
    } catch {}
    setAdding(false)
  }

  function appendInputText(text: string) {
    const cleaned = text.trim()
    if (!cleaned) return
    setInput((prev) => (prev.trim() ? `${prev.trim()}\n${cleaned}` : cleaned))
  }

  async function transcribeAudioFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/memory/transcribe', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (!res.ok || !data?.ok || typeof data?.text !== 'string') {
      throw new Error(typeof data?.error === 'string' ? data.error : 'Transcription failed')
    }

    const transcript = data.text.trim()
    if (!transcript) {
      throw new Error('No speech detected in recording')
    }

    appendInputText(transcript)
  }

  async function handleVoiceFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || transcribing || recording || describingVideo) return

    setTranscribeError('')
    setTranscribing(true)
    try {
      await transcribeAudioFile(file)
    } catch (error: any) {
      setTranscribeError(error?.message || 'Could not transcribe audio')
    } finally {
      setTranscribing(false)
    }
  }

  async function handleToggleRecording() {
    if (describingVideo || transcribing) return

    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      return
    }

    setTranscribeError('')

    // Check if mic access is available (requires HTTPS on mobile)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setTranscribeError('Mic requires HTTPS. Use Voice upload instead.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      mediaChunksRef.current = []

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const chunks = mediaChunksRef.current
        mediaChunksRef.current = []
        const mimeType = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunks, { type: mimeType })
        const recordedFile = new File([blob], `recording-${Date.now()}.webm`, { type: mimeType })

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        mediaRecorderRef.current = null

        if (!blob.size) {
          setTranscribeError('No audio captured')
          return
        }

        setTranscribing(true)
        try {
          await transcribeAudioFile(recordedFile)
        } catch (error: any) {
          setTranscribeError(error?.message || 'Could not transcribe audio')
        } finally {
          setTranscribing(false)
        }
      }

      recorder.onerror = () => {
        setTranscribeError('Recorder error while capturing audio')
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        mediaRecorderRef.current = null
        setRecording(false)
      }

      recorder.start()
      setRecording(true)
    } catch (error: any) {
      const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError'
      setTranscribeError(denied ? 'Microphone permission denied' : 'Mic unavailable over HTTP — use Voice upload instead')
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
      mediaRecorderRef.current = null
      setRecording(false)
    }
  }

  async function handleVideoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || transcribing || recording || describingVideo) return

    setTranscribeError('')
    setDescribingVideo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/memory/describe-video', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || !data?.ok || typeof data?.combined !== 'string') {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Video processing failed')
      }
      appendInputText(data.combined)
    } catch (error: any) {
      setTranscribeError(error?.message || 'Could not process video')
    } finally {
      setDescribingVideo(false)
    }
  }

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
      mediaRecorderRef.current = null
      mediaChunksRef.current = []
    }
  }, [])

  async function performSync() {
    if (syncing) return

    setSyncing(true)
    setSyncDone(false)
    try {
      const res = await fetch('/api/memory/sync', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setHideInboxAfterSync(true)
        setSyncDone(true)
        setShowUndoSync(true)
        setTimeout(() => setSyncDone(false), 2500)
        if (undoTimer) clearTimeout(undoTimer)
        const timer = setTimeout(() => {
          setShowUndoSync(false)
        }, 10000)
        setUndoTimer(timer)
        await loadFiles()
      }
    } catch {}
    setSyncing(false)
  }

  async function handleDeleteInboxEntry(timestamp: string) {
    if (!timestamp || deletingTimestamps.has(timestamp)) return
    if (!window.confirm('Are you sure you want to delete this note?')) return

    setHiddenInboxTimestamps((prev) => {
      const next = new Set(prev)
      next.add(timestamp)
      return next
    })
    setDeletingTimestamps((prev) => {
      const next = new Set(prev)
      next.add(timestamp)
      return next
    })

    try {
      const res = await fetch('/api/memory/add', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp }),
      })
      const data = await res.json()
      if (!data?.ok) {
        setHiddenInboxTimestamps((prev) => {
          const next = new Set(prev)
          next.delete(timestamp)
          return next
        })
      } else {
        await loadFiles()
      }
    } catch {
      setHiddenInboxTimestamps((prev) => {
        const next = new Set(prev)
        next.delete(timestamp)
        return next
      })
    } finally {
      setDeletingTimestamps((prev) => {
        const next = new Set(prev)
        next.delete(timestamp)
        return next
      })
    }
  }

  async function handleEditInboxEntry(timestamp: string, newText: string) {
    try {
      await fetch('/api/memory/add', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp }),
      })
      await fetch('/api/memory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText }),
      })
      setEditingTimestamp(null)
      setEditText('')
      await loadFiles()
    } catch {}
  }

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>Cognitive Layer</div>
            <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--c-text)' }}>Brain</h1>
          </div>

          <motion.button
            onClick={() => {
              if (syncing) return
              setShowSyncConfirm(true)
            }}
            whileTap={{ scale: 0.96 }}
            className="px-4 py-2 rounded-lg font-semibold text-sm inline-flex items-center gap-2"
            style={{
              background: '#FFD700',
              border: '1px solid rgba(255,215,0,0.55)',
              color: '#18181B',
              boxShadow: '0 0 20px rgba(255,215,0,0.22)',
            }}
          >
            <motion.span
              className="inline-block"
              animate={syncing ? { rotate: 360 } : { rotate: 0 }}
              transition={syncing ? { repeat: Infinity, duration: 1, ease: 'linear' } : { duration: 0.2 }}
            >
              🔄
            </motion.span>
            <span>
              {syncing ? 'Syncing...' : syncDone ? 'Synced ✓' : 'Sync Now'}
            </span>
          </motion.button>

          <AnimatePresence>
            {showUndoSync && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 rounded-xl px-4 py-2"
                style={{ background: 'rgba(22,163,100,0.15)', border: '1px solid rgba(22,163,100,0.4)' }}
              >
                <span className="text-sm" style={{ color: '#16A364' }}>✅ Synced {inboxEntries.length} note{inboxEntries.length !== 1 ? 's' : ''}</span>
                <button
                  onClick={() => {
                    setHideInboxAfterSync(false)
                    setShowUndoSync(false)
                    if (undoTimer) clearTimeout(undoTimer)
                  }}
                  className="text-xs px-3 py-1 rounded-lg font-semibold"
                  style={{ color: '#FFD700', border: '1px solid rgba(255,215,0,0.4)', background: 'rgba(255,215,0,0.1)' }}
                >
                  ↩ Undo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 mb-4 min-h-[380px]">
          <section className="card overflow-hidden flex flex-col min-h-[300px]">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--c-border)' }}>
              <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#FFD700' }}>Memory Files</div>
              <div className="mt-2 relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search memory..."
                  className="w-full rounded-lg px-3 py-2 pr-8 text-sm outline-none"
                  style={{
                    background: 'var(--c-panel)',
                    border: '1px solid var(--c-border)',
                    color: 'var(--c-text)',
                  }}
                />
                {searchQuery.trim() && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-lg text-xs"
                    style={{
                      color: 'var(--c-muted)',
                      background: 'transparent',
                    }}
                    aria-label="Clear search"
                  >
                    X
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto">
              {loading && (
                <div className="p-4 text-sm" style={{ color: 'var(--c-muted)' }}>Loading memory files...</div>
              )}

              {!loading && files.length === 0 && (
                <div className="p-4 text-sm" style={{ color: 'var(--c-muted)' }}>No markdown files found.</div>
              )}

              {!loading && files.length > 0 && normalizedSearchQuery && (
                <>
                  {searchResults.length === 0 && (
                    <div className="p-4 text-sm" style={{ color: 'var(--c-muted)' }}>
                      No files match "{searchQuery.trim()}".
                    </div>
                  )}

                  {searchResults.map((result) => {
                    const isSelected = result.file.path === selectedPath
                    return (
                      <button
                        key={result.file.path}
                        onClick={() => setSelectedPath(result.file.path)}
                        className="w-full text-left px-4 py-3 border-b transition-colors"
                        style={{
                          borderColor: 'var(--c-border)',
                          background: isSelected ? 'rgba(255,215,0,0.12)' : 'transparent',
                        }}
                      >
                        <div className="text-sm font-semibold" style={{ color: isSelected ? '#FFD700' : 'var(--c-text)' }}>
                          {result.file.name}
                        </div>
                        <div className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--c-muted)' }}>
                          {formatDate(result.file.lastModified)}
                        </div>
                        <div className="mt-1 text-xs" style={{ color: 'var(--c-muted)' }}>
                          {result.matchedInName ? 'Name match' : 'Content match'}
                          {result.snippet ? `: ${result.snippet}` : ''}
                        </div>
                      </button>
                    )
                  })}
                </>
              )}

              {!loading && files.length > 0 && !normalizedSearchQuery && categorizedFiles.map((category) => {
                const isExpanded = expandedFolders[category.id]
                return (
                  <div key={category.id} className="border-b" style={{ borderColor: 'var(--c-border)' }}>
                    <button
                      onClick={() => setExpandedFolders((prev) => ({ ...prev, [category.id]: !prev[category.id] }))}
                      className="w-full px-4 py-3.5 text-left flex items-center justify-between transition-colors hover:bg-white/5"
                      style={{ color: category.accent }}
                    >
                      <div className="flex items-center gap-3 text-sm font-semibold">
                        <span aria-hidden="true">{category.icon}</span>
                        <span>{category.name}</span>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            color: category.accent,
                            border: `1px solid ${hexToRgba(category.accent, 0.55)}`,
                            background: hexToRgba(category.accent, 0.16),
                          }}
                        >
                          {category.files.length}
                        </span>
                      </div>
                      <motion.svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-4 h-4"
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path d="M9 6l6 6-6 6" />
                      </motion.svg>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          {category.files.length === 0 && (
                            <div className="px-6 pb-3 text-xs" style={{ color: 'var(--c-muted)' }}>
                              No files in this category.
                            </div>
                          )}

                          {category.files.map((file) => {
                            const isSelected = file.path === selectedPath
                            return (
                              <button
                                key={file.path}
                                onClick={() => setSelectedPath(file.path)}
                                className="w-full text-left px-6 py-3 border-t transition-colors"
                                style={{
                                  borderColor: 'var(--c-border)',
                                  background: isSelected ? hexToRgba(category.accent, 0.16) : 'transparent',
                                }}
                              >
                                <div className="text-sm font-semibold" style={{ color: isSelected ? category.accent : 'var(--c-text)' }}>
                                  {file.name}
                                </div>
                                <div className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--c-muted)' }}>
                                  {formatDate(file.lastModified)}
                                </div>
                              </button>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="card overflow-hidden min-h-[300px] flex flex-col">
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
              <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#A855F7' }}>File Viewer</div>
              <div className="text-xs font-mono" style={{ color: 'var(--c-muted)' }}>{selectedFile?.name || 'No file selected'}</div>
            </div>
            <div className="overflow-auto p-4 flex-1">
              <pre
                className="whitespace-pre-wrap break-words text-[13px] leading-relaxed"
                style={{
                  color: 'var(--c-text)',
                  fontFamily: "'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
                }}
              >
                {selectedFile?.content || 'Select a memory file to view raw markdown content.'}
              </pre>
            </div>
          </section>
        </div>

        <section className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#FFD700' }}>Inbox Backlog</div>
            <div className="text-xs font-mono" style={{ color: 'var(--c-muted)' }}>
              {displayedInboxEntries.length} pending
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto pr-1">
            {displayedInboxEntries.length === 0 && (
              <div className="text-sm rounded-xl px-4 py-3 border" style={{ color: 'var(--c-muted)', borderColor: 'var(--c-border)' }}>
                <span className="mr-2" aria-hidden="true">🧠</span>
                No pending notes. Add a thought or drop a voice note.
              </div>
            )}

            {displayedInboxEntries.map((entry, idx) => (
              <motion.div
                key={`${entry.timestamp}-${idx}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.02 }}
                className="rounded-xl p-4 mb-2 last:mb-0"
                style={{
                  border: '1px solid rgba(255,215,0,0.16)',
                  background: 'rgba(255,215,0,0.04)',
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="text-[11px] font-mono tracking-wide" style={{ color: '#FFD700' }}>
                    {formatInboxTimestamp(entry.timestamp)}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingTimestamp(entry.timestamp); setEditText(entry.text) }}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{
                        color: '#18181B',
                        border: '1px solid rgba(168,85,247,0.55)',
                        background: '#A855F7',
                      }}
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteInboxEntry(entry.timestamp)}
                      disabled={deletingTimestamps.has(entry.timestamp)}
                      className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: 'var(--c-muted)',
                        borderColor: 'var(--c-border)',
                        background: 'transparent',
                      }}
                      aria-label={`Delete inbox note ${entry.timestamp}`}
                    >
                      ✕ Delete
                    </button>
                  </div>
                </div>
                {editingTimestamp === entry.timestamp ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-y transition-shadow focus:ring-2 focus:ring-[rgba(255,215,0,0.45)]"
                      style={{
                        background: 'var(--c-panel)',
                        border: '1px solid var(--c-border)',
                        color: 'var(--c-text)',
                        boxShadow: 'none',
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditInboxEntry(entry.timestamp, editText)}
                        className="text-xs px-4 py-2 rounded-lg font-semibold"
                        style={{ background: '#A855F7', color: '#18181B' }}
                      >
                        ✎ Save
                      </button>
                      <button
                        onClick={() => { setEditingTimestamp(null); setEditText('') }}
                        className="text-xs px-4 py-2 rounded-lg border"
                        style={{ color: 'var(--c-muted)', borderColor: 'var(--c-border)', background: 'transparent' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--c-text)' }}>{entry.text}</div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#A855F7' }}>Add Memory Note</div>
          <input
            ref={voiceInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleVoiceFileChange}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept=".mp4,.mov,.webm,.avi,.mkv,video/*"
            className="hidden"
            onChange={handleVideoFileChange}
          />
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              placeholder="Drop a thought for inbox.md..."
              className="w-full rounded-xl px-3 py-2 resize-y min-h-[96px] outline-none transition-shadow focus:ring-2 focus:ring-[rgba(255,215,0,0.45)]"
              style={{
                background: 'var(--c-panel)',
                border: '1px solid var(--c-border)',
                color: 'var(--c-text)',
                fontFamily: 'var(--font-body)',
              }}
            />

            <div className="flex flex-wrap items-center gap-2 sm:self-end">
              <button
                onClick={() => {
                  if (transcribing || recording || describingVideo) return
                  voiceInputRef.current?.click()
                }}
                disabled={transcribing || recording || describingVideo}
                className="h-[38px] px-3 rounded-lg font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: '#A855F7',
                  border: '1px solid rgba(168,85,247,0.6)',
                  color: '#18181B',
                }}
              >
                <motion.span
                  className="inline-block"
                  animate={transcribing ? { rotate: 360 } : { rotate: 0 }}
                  transition={transcribing ? { repeat: Infinity, duration: 1, ease: 'linear' } : { duration: 0.2 }}
                >
                  🎙️
                </motion.span>
                {transcribing ? 'Uploading...' : 'Voice'}
              </button>

              <motion.button
                onClick={handleToggleRecording}
                whileTap={{ scale: 0.96 }}
                disabled={transcribing || describingVideo}
                className="h-[38px] px-3 rounded-lg font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: recording ? '#DC2626' : 'transparent',
                  border: recording ? '1px solid rgba(220,38,38,0.75)' : '1px solid var(--c-border)',
                  color: recording ? '#FFFFFF' : 'var(--c-muted)',
                }}
                animate={recording ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                transition={recording ? { repeat: Infinity, duration: 1, ease: 'easeInOut' } : { duration: 0.2 }}
              >
                <span aria-hidden="true">🎤</span>
                {recording ? 'Stop' : 'Record'}
              </motion.button>

              <button
                onClick={() => {
                  if (transcribing || recording || describingVideo) return
                  videoInputRef.current?.click()
                }}
                disabled={transcribing || recording || describingVideo}
                className="h-[38px] px-3 rounded-lg font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-muted)',
                }}
              >
                <motion.span
                  className="inline-block"
                  animate={describingVideo ? { rotate: 360 } : { rotate: 0 }}
                  transition={describingVideo ? { repeat: Infinity, duration: 1, ease: 'linear' } : { duration: 0.2 }}
                >
                  🎬
                </motion.span>
                {describingVideo ? 'Processing...' : 'Video'}
              </button>

              <button
                onClick={handleAdd}
                disabled={adding || !input.trim()}
                className="h-[38px] px-3 rounded-lg font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: '#FFD700',
                  border: '1px solid rgba(255,215,0,0.6)',
                  color: '#18181B',
                }}
              >
                <span aria-hidden="true">➕</span>
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {addDone && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-3 text-sm"
                style={{ color: '#22C55E' }}
              >
                Added to inbox.
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {transcribeError && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-2 text-xs"
                style={{ color: '#F87171' }}
              >
                {transcribeError}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <AnimatePresence>
          {showSyncConfirm && (
            <>
              <motion.div
                className="fixed inset-0 z-40"
                style={{ background: 'rgba(0,0,0,0.65)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSyncConfirm(false)}
              />
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ y: 16, opacity: 0, scale: 0.96 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 10, opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="w-full max-w-lg rounded-2xl p-4 md:p-5 border"
                  style={{
                    background: 'var(--c-bg)',
                    borderColor: 'var(--c-border)',
                    boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
                  }}
                >
                  <div className="text-sm uppercase tracking-wider font-semibold mb-1" style={{ color: '#FFD700' }}>
                    Confirm Sync
                  </div>
                  <div className="text-lg font-semibold" style={{ color: 'var(--c-text)' }}>
                    Sync {displayedInboxEntries.length} notes to memory?
                  </div>

                  <div className="mt-3 max-h-[220px] overflow-y-auto rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {displayedInboxEntries.length === 0 && (
                      <div className="text-sm" style={{ color: 'var(--c-muted)' }}>
                        No pending notes in inbox.
                      </div>
                    )}
                    {displayedInboxEntries.map((entry, idx) => (
                      <div
                        key={`${entry.timestamp}-confirm-${idx}`}
                        className="text-sm pb-2 mb-2 last:pb-0 last:mb-0 border-b last:border-b-0"
                        style={{ borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
                      >
                        <div className="text-[11px] font-mono mb-1" style={{ color: '#FFD700' }}>{formatInboxTimestamp(entry.timestamp)}</div>
                        <div className="line-clamp-2">{entry.text}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setShowSyncConfirm(false)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold border"
                      style={{
                        color: 'var(--c-muted)',
                        borderColor: 'var(--c-border)',
                        background: 'transparent',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setShowSyncConfirm(false)
                        await performSync()
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
                      style={{
                        color: '#18181B',
                        border: '1px solid rgba(255,215,0,0.55)',
                        background: '#FFD700',
                      }}
                      disabled={syncing}
                    >
                      <span aria-hidden="true">🔄</span>
                      Sync Now
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
