'use client'

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Folder {
  id: string
  name: string
  items: string[]
}

const FOLDERS: Folder[] = [
  { id: 'personal', name: '📁 Personal', items: ['ID', 'Driving', 'Health', 'House'] },
  { id: 'companies', name: '📁 Companies', items: ['Bar People', 'AnyOS', 'AnyVendor'] },
  { id: 'finance', name: '📁 Finance', items: ['VAT', 'HMRC', 'Loans', 'Invoices'] },
  { id: 'legal', name: '📁 Legal', items: ['Contracts', 'Insurance'] },
  { id: 'property', name: '📁 Property / Vehicles', items: [] },
  { id: 'events', name: '📁 Events / Builds', items: ['CEW', 'BDC', 'Stand docs'] },
]

export default function DocsTab() {
  const [query, setQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState(FOLDERS[0].id)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const folders = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FOLDERS
    return FOLDERS.filter((f) => f.name.toLowerCase().includes(q) || f.items.some((item) => item.toLowerCase().includes(q)))
  }, [query])

  const selected = folders.find((f) => f.id === selectedFolder) || FOLDERS[0]

  function showUploadSoon() {
    fileRef.current?.click()
  }

  function onPickedFile() {
    setToast('Upload coming soon')
    setTimeout(() => setToast(null), 2200)
  }

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs..."
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
          <input ref={fileRef} type="file" className="hidden" onChange={onPickedFile} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 md:gap-5">
          <aside className="card rounded-2xl p-3 md:p-4">
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>Folders</div>
            <div className="space-y-2">
              {folders.map((folder) => {
                const active = folder.id === selectedFolder
                return (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
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
          </aside>

          <section className="space-y-4">
            <div className="card rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>
                Selected Folder
              </div>
              <div className="text-base font-semibold" style={{ color: 'var(--c-text)' }}>{selected.name}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>
                {selected.items.length ? selected.items.join(' · ') : 'Folder is ready for documents.'}
              </div>
            </div>

            <div className="card rounded-2xl p-4">
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--c-text)' }}>📌 Pinned</h3>
              <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px dashed var(--c-border-2)' }}>
                No pinned docs yet
              </div>
            </div>

            <div className="card rounded-2xl p-4">
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--c-text)' }}>🕐 Recent</h3>
              <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px dashed var(--c-border-2)' }}>
                No recent docs
              </div>
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
