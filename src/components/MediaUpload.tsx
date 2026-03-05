'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DEFAULT_CATEGORIES = ['Business', 'Personal']

interface UploadedFile {
  filename: string
  originalName: string
  date: string
  category: string
  note: string
  fileType: string
  size: number
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(type: string) {
  return type.startsWith('image/')
}

function isVideo(type: string) {
  return type.startsWith('video/')
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

export default function MediaUpload() {
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [category, setCategory] = useState('Business')
  const [note, setNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadHistory = useCallback(async () => {
    if (historyLoaded) return
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/uploads')
      const data = await res.json()
      setUploadedFiles(data.uploads || [])
      setHistoryLoaded(true)
    } catch {}
    setLoadingHistory(false)
  }, [historyLoaded])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setError('')

    if (isImage(file.type)) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else if (isVideo(file.type)) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  const handleBrowse = () => fileInputRef.current?.click()

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleClear = () => {
    setSelectedFile(null)
    setPreview(null)
    setNote('')
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setProgress(0)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('category', category)
      formData.append('note', note)

      // Fake progress animation
      const progressInterval = setInterval(() => {
        setProgress((p) => {
          if (p >= 85) { clearInterval(progressInterval); return p }
          return p + 15
        })
      }, 120)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Upload failed')
      }

      setSuccessMsg(`Saved: ${data.filename}`)
      setTimeout(() => setSuccessMsg(''), 3000)
      handleClear()
      setHistoryLoaded(false)
      await loadHistory()
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    }

    setUploading(false)
    setTimeout(() => setProgress(0), 500)
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>
          Media Upload
        </div>
        <button
          onClick={loadHistory}
          className="text-[10px] px-2 py-1 rounded-md transition-all"
          style={{ color: 'var(--c-muted)', background: 'var(--c-panel)' }}
        >
          {loadingHistory ? 'Loading...' : 'View recent'}
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!selectedFile ? handleBrowse : undefined}
        className="relative rounded-xl transition-all cursor-pointer overflow-hidden"
        style={{
          border: `2px dashed ${dragging ? '#FFD700' : selectedFile ? 'var(--c-border-2)' : 'var(--c-border)'}`,
          background: dragging
            ? 'rgba(255,215,0,0.04)'
            : selectedFile
            ? 'var(--c-surface)'
            : 'var(--c-panel)',
          minHeight: selectedFile ? 'auto' : '120px',
        }}
      >
        {/* Hidden input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileInput}
        />

        {!selectedFile ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center p-6 gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.15)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" className="w-5 h-5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                Drop photo or video here
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--c-muted)' }}>
                or click to browse
              </div>
            </div>
            <div className="text-[10px]" style={{ color: 'var(--c-dim)' }}>
              JPG · PNG · GIF · MP4 · MOV · WebM
            </div>
          </div>
        ) : (
          /* File selected */
          <div className="p-4">
            <div className="flex items-start gap-4">
              {/* Thumbnail */}
              <div
                className="w-20 h-20 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)' }}
              >
                {preview && isImage(selectedFile.type) ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                ) : preview && isVideo(selectedFile.type) ? (
                  <video src={preview} className="w-full h-full object-cover" muted />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6" style={{ color: 'var(--c-muted)' }}>
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                      <polyline points="13 2 13 9 20 9"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Info + Controls */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--c-text)' }}>
                  {selectedFile.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px]" style={{ color: 'var(--c-muted)' }}>
                    {formatSize(selectedFile.size)}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>·</span>
                  <span className="text-[10px]" style={{ color: 'var(--c-muted)' }}>
                    {selectedFile.type || 'unknown'}
                  </span>
                </div>

                {/* Note field */}
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (optional)"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 w-full bg-transparent outline-none text-xs px-2 py-1.5 rounded-lg"
                  style={{
                    border: '1px solid var(--c-border)',
                    color: 'var(--c-text)',
                    caretColor: '#FFD700',
                  }}
                />

                {/* Category + actions */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={(e) => { e.stopPropagation(); setCategory(cat) }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all"
                      style={{
                        background: category === cat ? '#FFD700' : 'var(--c-surface)',
                        color: category === cat ? '#000' : 'var(--c-muted)',
                        border: `1px solid ${category === cat ? '#FFD700' : 'var(--c-border)'}`,
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClear() }}
                    className="text-[10px] px-2 py-1 rounded-md transition-all"
                    style={{ color: 'var(--c-muted)', background: 'var(--c-panel)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpload() }}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-md font-semibold transition-all disabled:opacity-50"
                    style={{ background: '#FFD700', color: '#000' }}
                  >
                    {uploading ? (
                      <div className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    )}
                    {uploading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            {uploading && (
              <div className="mt-3 rounded-full overflow-hidden" style={{ height: '3px', background: 'var(--c-border)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: '#FFD700' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-[11px] px-3 py-2 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-[11px] px-3 py-2 rounded-lg"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent uploads list */}
      <AnimatePresence>
        {historyLoaded && uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4"
          >
            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>
              Recent Uploads ({uploadedFiles.length})
            </div>
            <div className="flex flex-col gap-2">
              {uploadedFiles.slice(0, 10).map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)' }}
                >
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--c-surface)' }}
                  >
                    {isImage(f.fileType) ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" className="w-4 h-4">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    ) : isVideo(f.fileType) ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.5" className="w-4 h-4">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" style={{ color: 'var(--c-muted)' }}>
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                        <polyline points="13 2 13 9 20 9"/>
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: 'var(--c-text)' }}>
                      {f.originalName}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px]" style={{ color: 'var(--c-muted)' }}>
                        {f.category}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>·</span>
                      <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>
                        {formatSize(f.size)}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>·</span>
                      <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>
                        {timeAgo(f.date)}
                      </span>
                    </div>
                    {f.note && (
                      <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--c-muted)' }}>
                        {f.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {historyLoaded && uploadedFiles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-[11px] text-center py-3"
            style={{ color: 'var(--c-dim)' }}
          >
            No uploads yet
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
