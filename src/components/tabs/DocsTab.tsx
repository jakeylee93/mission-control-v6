'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Folder {
  id: string
  name: string
  items: string[]
}

interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  webViewLink: string
  size: number | null
  parents: string[]
}

const FOLDERS: Folder[] = [
  { id: 'personal', name: '📁 Personal', items: ['ID', 'Driving', 'Health', 'House'] },
  { id: 'companies', name: '📁 Companies', items: ['Bar People', 'AnyOS', 'AnyVendor'] },
  { id: 'finance', name: '📁 Finance', items: ['VAT', 'HMRC', 'Loans', 'Invoices'] },
  { id: 'legal', name: '📁 Legal', items: ['Contracts', 'Insurance'] },
  { id: 'property', name: '📁 Property / Vehicles', items: [] },
  { id: 'events', name: '📁 Events / Builds', items: ['CEW', 'BDC', 'Stand docs'] },
]

function mimeIcon(mimeType: string) {
  const value = mimeType.toLowerCase()
  if (value.includes('folder')) return '📁'
  if (value.includes('pdf')) return '📕'
  if (value.includes('spreadsheet') || value.includes('sheet') || value.includes('excel')) return '📊'
  if (value.includes('presentation') || value.includes('powerpoint')) return '📽️'
  if (value.startsWith('image/')) return '🖼️'
  if (value.includes('document') || value.includes('text') || value.includes('wordprocessingml')) return '📄'
  return '📎'
}

function formatSize(size: number | null) {
  if (size == null || Number.isNaN(size) || size <= 0) return '—'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

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

export default function DocsTab() {
  const [query, setQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>(FOLDERS[0].id)
  const [selectedDriveFolder, setSelectedDriveFolder] = useState<string | null>(null)
  const [files, setFiles] = useState<DriveFile[]>([])
  const [driveFolders, setDriveFolders] = useState<DriveFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const requestSeq = useRef(0)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = query.trim()
      void loadFiles(next)
    }, 300)

    return () => window.clearTimeout(handle)
  }, [query])

  useEffect(() => {
    void loadFolders()
  }, [])

  async function loadFiles(searchQuery: string) {
    const seq = ++requestSeq.current
    setLoadingFiles(true)

    try {
      const url = searchQuery
        ? `/api/docs/search?q=${encodeURIComponent(searchQuery)}`
        : '/api/docs'
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json() as { files?: DriveFile[] }
      if (seq !== requestSeq.current) return
      setFiles(data.files || [])
    } catch {
      if (seq !== requestSeq.current) return
      setFiles([])
    } finally {
      if (seq === requestSeq.current) {
        setLoadingFiles(false)
      }
    }
  }

  async function loadFolders() {
    setLoadingFolders(true)
    try {
      const res = await fetch('/api/docs/folders', { cache: 'no-store' })
      const data = await res.json() as { files?: DriveFile[] }
      setDriveFolders(data.files || [])
    } catch {
      setDriveFolders([])
    } finally {
      setLoadingFolders(false)
    }
  }

  const visibleFiles = useMemo(() => {
    if (query.trim()) return files
    if (!selectedDriveFolder) return files
    return files.filter((file) => file.parents.includes(selectedDriveFolder))
  }, [files, query, selectedDriveFolder])

  function showUploadSoon() {
    setToast('Upload via Google Drive')
    setTimeout(() => setToast(null), 2200)
  }

  function openDriveFile(file: DriveFile) {
    if (!file.webViewLink) return
    window.open(file.webViewLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--c-text)" }}>Docs</h1>
          <p className="text-sm mt-1" style={{ color: "var(--c-muted)" }}>Your vault — important documents, always at hand</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Google Drive..."
            className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={showUploadSoon}
              className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#FFD700', color: '#000' }}
            >
              Upload
            </button>
            <button
              className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--c-panel)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
            >
              New Folder
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 md:gap-5">
          <aside className="card rounded-2xl p-3 md:p-4">
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>Folders</div>
            <div className="space-y-2 mb-4">
              {FOLDERS.map((folder) => {
                const active = folder.id === selectedFolder && selectedDriveFolder == null
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolder(folder.id)
                      setSelectedDriveFolder(null)
                    }}
                    className="w-full text-left rounded-xl px-3 py-2.5 transition-all"
                    style={{
                      background: active ? 'rgba(255,215,0,0.1)' : 'var(--c-panel)',
                      border: `1px solid ${active ? 'rgba(255,215,0,0.4)' : 'var(--c-border)'}`,
                    }}
                  >
                    <div className="text-sm font-semibold" style={{ color: active ? '#FFD700' : 'var(--c-text)' }}>{folder.name}</div>
                    {folder.items.length > 0 && (
                      <div className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>{folder.items.join(' · ')}</div>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>Google Drive</div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {loadingFolders && (
                <div className="rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>
                  Loading folders...
                </div>
              )}

              {!loadingFolders && driveFolders.length === 0 && (
                <div className="rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>
                  No Drive folders found
                </div>
              )}

              {!loadingFolders && driveFolders.map((folder) => {
                const active = selectedDriveFolder === folder.id
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolder('')
                      setSelectedDriveFolder(folder.id)
                    }}
                    className="w-full text-left rounded-xl px-3 py-2 transition-all"
                    style={{
                      background: active ? 'rgba(96,165,250,0.12)' : 'var(--c-panel)',
                      border: `1px solid ${active ? 'rgba(96,165,250,0.4)' : 'var(--c-border)'}`,
                    }}
                  >
                    <div className="text-sm font-semibold" style={{ color: active ? '#60A5FA' : 'var(--c-text)' }}>
                      📁 {folder.name}
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="space-y-3">
            <div className="card rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>
                {query.trim() ? `Search: ${query.trim()}` : selectedDriveFolder ? 'Google Drive Folder' : 'Recent from Google Drive'}
              </div>

              {loadingFiles ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,215,0,0.45)', borderTopColor: 'transparent' }} />
                </div>
              ) : visibleFiles.length === 0 ? (
                <div className="rounded-xl p-6 text-center text-sm" style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px dashed var(--c-border-2)' }}>
                  No files found
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => openDriveFile(file)}
                      className="w-full rounded-xl px-3 py-2.5 transition-colors text-left"
                      style={{
                        background: '#1B1B1B',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#252525'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#1B1B1B'
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl" aria-hidden="true">{mimeIcon(file.mimeType)}</span>
                          <span className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>{file.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{formatDate(file.modifiedTime)}</div>
                          <div className="text-xs" style={{ color: 'var(--c-dim)' }}>{formatSize(file.size)}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="fixed bottom-5 right-5 rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--c-panel)', color: '#FFD700', border: '1px solid #FFD70055' }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
