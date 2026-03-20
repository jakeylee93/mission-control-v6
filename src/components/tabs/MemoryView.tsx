'use client'

import { useEffect, useMemo, useState } from 'react'

interface MemoryFile {
  name: string
  path: string
  content: string
  lastModified: string
}

function extractTags(file: MemoryFile) {
  const set = new Set<string>()
  file.name
    .split(/[/.\-_]/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((tag) => set.add(tag.toLowerCase()))

  const hashTags = file.content.match(/#[\w-]+/g) || []
  hashTags.slice(0, 4).forEach((tag) => set.add(tag.replace('#', '').toLowerCase()))
  return Array.from(set).slice(0, 5)
}

export function MemoryView() {
  const [files, setFiles] = useState<MemoryFile[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      const res = await fetch('/api/memory', { cache: 'no-store' })
      const data = await res.json()
      if (mounted) {
        setFiles(data.files || [])
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return files
    return files.filter((f) => f.name.toLowerCase().includes(q) || f.content.toLowerCase().includes(q))
  }, [files, query])

  async function addMemory() {
    const text = newText.trim()
    if (!text) return
    const res = await fetch('/api/memory/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (res.ok) {
      setNewText('')
      setAdding(false)
      const refreshed = await fetch('/api/memory', { cache: 'no-store' })
      const data = await refreshed.json()
      setFiles(data.files || [])
    }
  }

  return (
    <div className="mx-4 flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.035] p-3 backdrop-blur-2xl">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search memory..."
        className="h-9 rounded-full border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35"
      />

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-white/60">Recent entries</p>
        <button
          onClick={() => setAdding((v) => !v)}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs"
        >
          Add memory
        </button>
      </div>

      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Capture a new memory..."
            className="h-9 flex-1 rounded-full border border-white/15 bg-white/5 px-3 text-sm text-white outline-none"
          />
          <button onClick={addMemory} className="rounded-full border border-white/20 bg-white/10 px-3 text-xs">
            Save
          </button>
        </div>
      )}

      <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {loading && (
          <>
            <div className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            <div className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          </>
        )}

        {!loading && filtered.length === 0 && <p className="text-sm text-white/60">No memory entries found.</p>}

        {filtered.slice(0, 30).map((file) => {
          const tags = extractTags(file)
          return (
            <article key={file.path} className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-medium">{file.name}</h3>
                <span className="text-[10px] text-white/50">
                  {new Date(file.lastModified).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-white/70">{file.content.replace(/\n+/g, ' ')}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] text-white/75">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
