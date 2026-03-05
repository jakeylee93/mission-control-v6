'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface InventoryItem {
  id: string
  name: string
  category: string
  location: string
  description: string
  estimatedValue: string
  priceSearchQuery?: string
  condition?: string
  imagePath?: string
  productImage?: string  // professional product shot (header)
  photos?: string[]      // user's photos (gallery)
  uses?: string
  size?: string
  purchaseLocation?: string
  categoryConfidence?: number
  alternateCategories?: string[]
  // Enhanced fields
  rating?: number
  notes?: string
  tags?: string[]
  purchaseDate?: string
  wouldRepurchase?: boolean | null
  replaceBy?: string
  usageFrequency?: string // daily, weekly, monthly, rarely
  purchaseLink?: string
  favourite?: boolean
  warrantyExpiry?: string
  runningLow?: boolean
}

interface QueueItem {
  id: string
  imagePath: string
  addedAt: string
  status: string
}

interface ScanResult {
  id: string
  name: string
  category: string
  categoryConfidence?: number
  alternateCategories?: string[]
  estimatedValue: string
  priceSearchQuery?: string
  description: string
  condition?: string
  suggestedLocation?: string
  imagePath: string
  queueId: string
  selected?: boolean
}

const CATEGORIES = [
  '💻 Electronics',
  '🧗 Climbing Gear',
  '🔧 Tools',
  '🍳 Kitchen',
  '💼 Business Equipment',
  '🖥️ Office Equipment',
  '🧴 Toiletries & Grooming',
  '👕 Clothing',
  '🍔 Food & Drink',
  '🏋️ Sports & Fitness',
  '🏠 Home',
  '📦 Other',
]

const CATEGORY_COLORS: Record<string, string> = {
  '💻 Electronics': '#60A5FA',
  '🧗 Climbing Gear': '#22C55E',
  '🔧 Tools': '#F59E0B',
  '🍳 Kitchen': '#F97316',
  '💼 Business Equipment': '#A855F7',
  '🖥️ Office Equipment': '#06B6D4',
  '🧴 Toiletries & Grooming': '#EC4899',
  '👕 Clothing': '#8B5CF6',
  '🍔 Food & Drink': '#EF4444',
  '🏋️ Sports & Fitness': '#10B981',
  '🏠 Home': '#F59E0B',
  '📦 Other': '#6B7280',
}

const LOCATIONS = ['Home', 'Van', 'Office', 'Storage Unit', 'Gear Bag', 'Kitchen', 'Workshop', 'Bathroom', 'Bedroom', 'Car']

function matchCategory(aiCategory: string): string {
  const lower = aiCategory.toLowerCase()
  for (const cat of CATEGORIES) {
    const catName = cat.replace(/^[^\s]+\s/, '').toLowerCase()
    if (lower.includes(catName) || catName.includes(lower)) return cat
  }
  if (lower.includes('toiletri') || lower.includes('grooming') || lower.includes('skincare') || lower.includes('moistur')) return '🧴 Toiletries & Grooming'
  if (lower.includes('cloth') || lower.includes('apparel') || lower.includes('wear')) return '👕 Clothing'
  if (lower.includes('food') || lower.includes('drink') || lower.includes('snack')) return '🍔 Food & Drink'
  if (lower.includes('sport') || lower.includes('fitness') || lower.includes('gym')) return '🏋️ Sports & Fitness'
  if (lower.includes('home') || lower.includes('decor') || lower.includes('furniture')) return '🏠 Home'
  if (lower.includes('electronic') || lower.includes('phone') || lower.includes('laptop') || lower.includes('charger')) return '💻 Electronics'
  if (lower.includes('tool') || lower.includes('drill') || lower.includes('screw')) return '🔧 Tools'
  if (lower.includes('office') || lower.includes('pen') || lower.includes('notebook')) return '🖥️ Office Equipment'
  if (lower.includes('climb') || lower.includes('chalk') || lower.includes('harness')) return '🧗 Climbing Gear'
  if (lower.includes('business') || lower.includes('bar') || lower.includes('cocktail')) return '💼 Business Equipment'
  return '📦 Other'
}

function daysOwned(purchaseDate?: string): string | null {
  if (!purchaseDate) return null
  const diff = Date.now() - new Date(purchaseDate).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${(days / 365).toFixed(1)}yr`
}

function costPerUse(value?: string, frequency?: string): string | null {
  if (!value || !frequency) return null
  const match = value.match(/[\d.]+/)
  if (!match) return null
  const price = parseFloat(match[0])
  const usesPerYear: Record<string, number> = { daily: 365, weekly: 52, monthly: 12, rarely: 4 }
  const uses = usesPerYear[frequency]
  if (!uses) return null
  return `£${(price / uses).toFixed(2)}/use`
}

// Star rating component
function StarRating({ value, onChange, size = 'md' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'text-xs' : 'text-lg'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
        <button
          key={n}
          onClick={() => onChange?.(n)}
          className={`${sz} transition-all ${onChange ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
          style={{ color: n <= value ? '#FFD700' : '#333' }}
          disabled={!onChange}
        >
          {n <= value ? '★' : '☆'}
        </button>
      ))}
      {value > 0 && <span className="text-xs font-semibold ml-1" style={{ color: '#FFD700' }}>{value}/10</span>}
    </div>
  )
}

export default function BelongingsTab() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterFavs, setFilterFavs] = useState(false)
  const [filterRestock, setFilterRestock] = useState(false)
  const [detailTab, setDetailTab] = useState<'info' | 'notes' | 'value'>('info')
  const scanInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ category: CATEGORIES[0], location: LOCATIONS[0], condition: 'Good' })
  const [priceLoading, setPriceLoading] = useState<string | null>(null)
  const [imageSearching, setImageSearching] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/belongings/load').then(r => r.json()).catch(() => ({ items: [] })),
      fetch('/api/belongings/scan').then(r => r.json()).catch(() => ({ queue: [] })),
    ]).then(([itemsData, queueData]) => {
      setItems(itemsData.items || [])
      setQueue((queueData.queue || []).filter((q: QueueItem) => q.status === 'pending'))
      setLoading(false)
    })
  }, [])

  async function saveItems(updatedItems: InventoryItem[]) {
    setItems(updatedItems)
    await fetch('/api/belongings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: updatedItems }),
    })
  }

  async function handleScanUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData()
      fd.append('file', files[i])
      await fetch('/api/belongings/scan', { method: 'POST', body: fd })
    }
    const qRes = await fetch('/api/belongings/scan')
    const qData = await qRes.json()
    setQueue((qData.queue || []).filter((q: QueueItem) => q.status === 'pending'))
    setUploading(false)
    if (scanInputRef.current) scanInputRef.current.value = ''
  }

  async function handleSync() {
    if (syncing || queue.length === 0) return
    setSyncing(true)
    try {
      const fd = new FormData()
      fd.append('action', 'sync')
      const res = await fetch('/api/belongings/scan', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ok && data.results) {
        setScanResults(data.results.map((r: ScanResult) => ({
          ...r,
          category: matchCategory(r.category),
          selected: true,
        })))
        setQueue([])
      }
    } catch {}
    setSyncing(false)
  }

  async function approveResults() {
    const selected = scanResults.filter(r => r.selected)
    const newItems: InventoryItem[] = selected.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      location: r.suggestedLocation || 'Home',
      description: r.description,
      estimatedValue: r.estimatedValue,
      priceSearchQuery: r.priceSearchQuery,
      condition: r.condition,
      imagePath: r.imagePath,
      size: (r as any).size || undefined,
      categoryConfidence: r.categoryConfidence,
      alternateCategories: r.alternateCategories,
      uses: '',
      purchaseLocation: '',
      rating: 0,
      notes: '',
      tags: [],
      favourite: false,
      wouldRepurchase: null,
      usageFrequency: undefined,
      runningLow: false,
    }))
    await saveItems([...items, ...newItems])
    setScanResults([])
    const qRes = await fetch('/api/belongings/scan')
    const qData = await qRes.json()
    setQueue((qData.queue || []).filter((q: QueueItem) => q.status === 'pending'))
  }

  async function findCheapest(item: InventoryItem) {
    const query = item.priceSearchQuery || item.name
    setPriceLoading(item.id)
    try {
      const res = await fetch('/api/belongings/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (data.searchUrl) window.open(data.searchUrl, '_blank')
    } catch {}
    setPriceLoading(null)
  }

  async function findProductImage(item: InventoryItem) {
    setImageSearching(true)
    try {
      const res = await fetch('/api/belongings/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: item.priceSearchQuery || item.name, itemId: item.id }),
      })
      const data = await res.json()
      if (data.imagePath) {
        // Product image becomes the header, user's original stays as gallery
        updateSelected({ productImage: data.imagePath })
      } else if (data.searchUrl) {
        window.open(data.searchUrl, '_blank')
      }
    } catch {}
    setImageSearching(false)
  }

  async function handleAddManual() {
    if (!newItem.name?.trim()) return
    const item: InventoryItem = {
      id: `manual-${Date.now()}`,
      name: newItem.name || '',
      category: newItem.category || '📦 Other',
      location: newItem.location || 'Home',
      description: newItem.description || '',
      estimatedValue: newItem.estimatedValue || '',
      condition: newItem.condition || 'Good',
      imagePath: newItem.imagePath,
      uses: '',
      purchaseLocation: newItem.purchaseLocation || '',
      rating: 0,
      notes: '',
      tags: [],
      favourite: false,
      wouldRepurchase: null,
      runningLow: false,
    }
    await saveItems([...items, item])
    setNewItem({ category: CATEGORIES[0], location: LOCATIONS[0], condition: 'Good' })
    setShowAddModal(false)
  }

  function updateSelected(patch: Partial<InventoryItem>) {
    if (!selectedItem) return
    setSelectedItem({ ...selectedItem, ...patch })
  }

  async function saveSelected() {
    if (!selectedItem) return
    const updated = items.map(i => i.id === selectedItem.id ? selectedItem : i)
    await saveItems(updated)
    setSelectedItem(null)
  }

  async function deleteSelected() {
    if (!selectedItem || !window.confirm('Delete this item?')) return
    await saveItems(items.filter(i => i.id !== selectedItem.id))
    setSelectedItem(null)
  }

  async function toggleFavourite(e: React.MouseEvent, itemId: string) {
    e.stopPropagation()
    const updated = items.map(i => i.id === itemId ? { ...i, favourite: !i.favourite } : i)
    await saveItems(updated)
  }

  async function removeFromQueue(id: string) {
    await fetch('/api/belongings/scan', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setQueue(q => q.filter(i => i.id !== id))
  }

  function addTag() {
    if (!tagInput.trim() || !selectedItem) return
    const tags = [...(selectedItem.tags || []), tagInput.trim()]
    updateSelected({ tags })
    setTagInput('')
  }

  function removeTag(tag: string) {
    if (!selectedItem) return
    updateSelected({ tags: (selectedItem.tags || []).filter(t => t !== tag) })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(item => {
      if (activeCategory && item.category !== activeCategory) return false
      if (filterFavs && !item.favourite) return false
      if (filterRestock && !item.runningLow) return false
      if (!q) return true
      return item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (item.notes || '').toLowerCase().includes(q)
    })
  }, [search, items, activeCategory, filterFavs, filterRestock])

  const totalValue = useMemo(() => {
    let sum = 0
    for (const item of items) {
      const match = item.estimatedValue?.match(/[\d.]+/)
      if (match) sum += parseFloat(match[0])
    }
    return sum
  }, [items])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of items) counts[item.category] = (counts[item.category] || 0) + 1
    return counts
  }, [items])

  const restockCount = items.filter(i => i.runningLow).length
  const favCount = items.filter(i => i.favourite).length
  const avgRating = items.filter(i => (i.rating || 0) > 0)

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,215,0,0.5)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Belongings</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>Your physical world, catalogued and searchable</p>
        </div>

        {/* Summary Strip */}
        <div className="card rounded-xl p-3 mb-4 flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <span>📦</span>
            <span style={{ color: 'var(--c-text)' }}><strong>{items.length}</strong> items</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>💰</span>
            <span style={{ color: '#FFD700' }}><strong>£{totalValue.toFixed(0)}</strong> value</span>
          </div>
          <button onClick={() => setFilterFavs(!filterFavs)} className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg" style={{ background: filterFavs ? '#FFD70020' : 'transparent' }}>
            <span>⭐</span>
            <span style={{ color: filterFavs ? '#FFD700' : 'var(--c-muted)' }}><strong>{favCount}</strong> favs</span>
          </button>
          {restockCount > 0 && (
            <button onClick={() => setFilterRestock(!filterRestock)} className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg" style={{ background: filterRestock ? '#EF444420' : 'transparent' }}>
              <span>🔔</span>
              <span style={{ color: filterRestock ? '#EF4444' : '#F59E0B' }}><strong>{restockCount}</strong> restock</span>
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <span>📷</span>
            <span style={{ color: 'var(--c-muted)' }}><strong>{items.filter(i => !i.imagePath).length}</strong> need photos</span>
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span>⏳</span>
              <span style={{ color: '#F59E0B' }}><strong>{queue.length}</strong> queued</span>
            </div>
          )}
        </div>

        {/* Scan Queue / Review */}
        {(queue.length > 0 || scanResults.length > 0) && (
          <div className="card rounded-xl p-4 mb-4" style={{ border: '1px solid rgba(255,215,0,0.2)' }}>
            {scanResults.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold" style={{ color: '#FFD700' }}>✅ Review ({scanResults.filter(r => r.selected).length}/{scanResults.length} selected)</div>
                  <div className="flex gap-2">
                    <button onClick={() => setScanResults([])} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>Cancel</button>
                    <button onClick={approveResults} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#FFD700', color: '#000' }}>Add Selected</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {scanResults.map((result, idx) => {
                    const accent = CATEGORY_COLORS[result.category] || '#666'
                    return (
                      <motion.div key={result.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="rounded-xl p-3 flex items-start gap-3" style={{ background: 'var(--c-panel)', border: `1px solid ${accent}30` }}>
                        <input type="checkbox" checked={result.selected || false} onChange={() => setScanResults(prev => prev.map(r => r.id === result.id ? { ...r, selected: !r.selected } : r))} className="mt-1 w-4 h-4 accent-yellow-400" />
                        {result.imagePath && <img src={result.imagePath} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{result.name}</div>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <select value={result.category} onChange={(e) => setScanResults(prev => prev.map(r => r.id === result.id ? { ...r, category: e.target.value } : r))} className="text-[11px] px-2 py-0.5 rounded-lg" style={{ background: `${accent}20`, color: accent, border: 'none' }}>
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {result.categoryConfidence != null && result.categoryConfidence < 80 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-lg" style={{ background: '#F59E0B20', color: '#F59E0B' }}>⚠ {result.categoryConfidence}%</span>
                            )}
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>{result.description}</div>
                          {(result as any).size && <div className="text-[10px] mt-0.5 font-semibold" style={{ color: '#60A5FA' }}>{(result as any).size}</div>}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold" style={{ color: '#22C55E' }}>{result.estimatedValue}</div>
                          {result.condition && <div className="text-[10px]" style={{ color: 'var(--c-muted)' }}>{result.condition}</div>}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold" style={{ color: '#F59E0B' }}>⏳ Scan Queue ({queue.length} photos)</div>
                  <button onClick={handleSync} disabled={syncing} className="px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: '#FFD700', color: '#000' }}>
                    {syncing ? '🔄 Scanning...' : '🔍 Sync & Identify'}
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {queue.map(q => (
                    <div key={q.id} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
                      <img src={q.imagePath} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeFromQueue(q.id)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full text-[10px] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>✕</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Search + Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search belongings, tags, notes..." className="flex-1 min-w-[200px] rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
          <input ref={scanInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleScanUpload} />
          <button onClick={() => scanInputRef.current?.click()} disabled={uploading} className="px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: '#FFD700', color: '#000' }}>
            {uploading ? '⏳' : '📸'} Scan
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--c-panel)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}>➕ Add</button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          {/* Categories sidebar */}
          <aside className="card rounded-xl p-3">
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>Categories</div>
            <button onClick={() => { setActiveCategory(null); setFilterFavs(false); setFilterRestock(false) }} className="w-full text-left px-3 py-2 rounded-lg text-sm mb-1" style={{ background: !activeCategory && !filterFavs && !filterRestock ? '#FFD70020' : 'transparent', color: !activeCategory && !filterFavs && !filterRestock ? '#FFD700' : 'var(--c-muted)' }}>
              All ({items.length})
            </button>
            {CATEGORIES.map(cat => {
              const count = categoryCounts[cat] || 0
              if (count === 0) return null
              const active = activeCategory === cat
              const accent = CATEGORY_COLORS[cat] || '#666'
              return (
                <button key={cat} onClick={() => setActiveCategory(active ? null : cat)} className="w-full text-left px-3 py-1.5 rounded-lg text-sm mb-0.5 flex items-center justify-between" style={{ background: active ? `${accent}15` : 'transparent', color: active ? accent : 'var(--c-muted)' }}>
                  <span className="truncate">{cat}</span>
                  <span className="text-xs font-semibold shrink-0">{count}</span>
                </button>
              )
            })}
          </aside>

          {/* Items grid */}
          <section>
            {filtered.length === 0 ? (
              <div className="card rounded-xl p-8 text-center">
                <div className="text-5xl mb-3">📷</div>
                <div className="text-lg font-semibold mb-2" style={{ color: 'var(--c-text)' }}>
                  {items.length === 0 ? 'Scan your first items' : 'No items match'}
                </div>
                <div className="text-sm mb-4" style={{ color: 'var(--c-muted)' }}>Photos → Queue → Sync → AI identifies everything</div>
                <button onClick={() => scanInputRef.current?.click()} className="px-4 py-2 rounded-lg font-semibold" style={{ background: '#FFD700', color: '#000' }}>📸 Scan Items</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map(item => {
                  const accent = CATEGORY_COLORS[item.category] || '#666'
                  const cpu = costPerUse(item.estimatedValue, item.usageFrequency)
                  return (
                    <motion.button key={item.id} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} className="card rounded-xl p-3 text-left relative" style={{ borderColor: item.favourite ? '#FFD70060' : `${accent}20` }} onClick={() => { setSelectedItem(item); setDetailTab('info') }}>
                      {/* Favourite star */}
                      <button onClick={(e) => toggleFavourite(e, item.id)} className="absolute top-2 right-2 z-10 text-lg" style={{ color: item.favourite ? '#FFD700' : '#333' }}>
                        {item.favourite ? '★' : '☆'}
                      </button>
                      {/* Running low badge */}
                      {item.runningLow && <div className="absolute top-2 left-2 z-10 text-[10px] px-1.5 py-0.5 rounded-lg font-semibold" style={{ background: '#EF444430', color: '#EF4444' }}>LOW</div>}

                      <div className="rounded-lg mb-2 aspect-square w-full flex items-center justify-center overflow-hidden" style={{ background: '#1E1E1E' }}>
                        {(item.productImage || item.imagePath) ? <img src={item.productImage || item.imagePath} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-3xl">📷</span>}
                      </div>
                      <div className="text-sm font-semibold mb-1 truncate pr-6" style={{ color: 'var(--c-text)' }}>{item.name}</div>

                      {/* Rating (compact) */}
                      {(item.rating || 0) > 0 && (
                        <div className="flex items-center gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <span key={n} className="text-[8px]" style={{ color: n <= (item.rating || 0) ? '#FFD700' : '#333' }}>★</span>
                          ))}
                          <span className="text-[10px] ml-0.5 font-semibold" style={{ color: '#FFD700' }}>{item.rating}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-lg" style={{ background: `${accent}20`, color: accent }}>{item.category.replace(/^[^\s]+\s/, '')}</span>
                        {item.size && <span className="text-[10px] font-semibold" style={{ color: '#60A5FA' }}>{item.size}</span>}
                        {item.condition && <span className="text-[10px]" style={{ color: 'var(--c-muted)' }}>{item.condition}</span>}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.estimatedValue && <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>{item.estimatedValue}</span>}
                          {cpu && <span className="text-[10px]" style={{ color: 'var(--c-muted)' }}>{cpu}</span>}
                          {item.wouldRepurchase === true && <span className="text-[10px]">👍</span>}
                          {item.wouldRepurchase === false && <span className="text-[10px]">👎</span>}
                        </div>
                        <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>{item.location}</span>
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.tags.slice(0, 3).map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-lg" style={{ background: '#ffffff10', color: 'var(--c-muted)' }}>#{t}</span>
                          ))}
                          {item.tags.length > 3 && <span className="text-[9px]" style={{ color: 'var(--c-muted)' }}>+{item.tags.length - 3}</span>}
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Add Manual Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 px-4 py-8" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={() => setShowAddModal(false)}>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} onClick={e => e.stopPropagation()} className="max-w-lg mx-auto card rounded-2xl p-5 max-h-[80vh] overflow-y-auto">
                <div className="text-lg font-semibold mb-4" style={{ color: 'var(--c-text)' }}>Add Item</div>
                <div className="space-y-3">
                  <input value={newItem.name || ''} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name *" className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={newItem.location} onChange={e => setNewItem({ ...newItem, location: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={newItem.estimatedValue || ''} onChange={e => setNewItem({ ...newItem, estimatedValue: e.target.value })} placeholder="Value (£)" className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                    <select value={newItem.condition || 'Good'} onChange={e => setNewItem({ ...newItem, condition: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                      {['New', 'Good', 'Fair', 'Poor'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <textarea value={newItem.description || ''} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description" rows={2} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowAddModal(false)} className="px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>Cancel</button>
                  <button onClick={handleAddManual} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: '#FFD700', color: '#000' }}>Add Item</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Item Detail Modal — Enhanced with tabs */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 px-4 py-4 md:py-8 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={() => setSelectedItem(null)}>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} onClick={e => e.stopPropagation()} className="max-w-2xl mx-auto card rounded-2xl p-5">
                {/* Photo section — product image header + gallery */}
                <div className="mb-4">
                  {/* Main product image */}
                  <div className="rounded-xl aspect-square max-h-[300px] w-full flex items-center justify-center overflow-hidden relative" style={{ background: '#1E1E1E', border: '1px solid var(--c-border)' }}>
                    {(selectedItem.productImage || selectedItem.imagePath) ? (
                      <>
                        <img src={selectedItem.productImage || selectedItem.imagePath} alt={selectedItem.name} className="w-full h-full object-cover" />
                        <button onClick={() => findProductImage(selectedItem)} disabled={imageSearching} className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(0,0,0,0.85)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}>
                          {imageSearching ? '🔍 Searching...' : '🔄 Better Image'}
                        </button>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="text-4xl mb-3">📷</div>
                        <div className="flex gap-2 justify-center">
                          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const fd = new FormData()
                            fd.append('file', file)
                            const res = await fetch('/api/belongings/scan', { method: 'POST', body: fd })
                            const data = await res.json()
                            if (data.ok) {
                              const qRes = await fetch('/api/belongings/scan')
                              const qData = await qRes.json()
                              const latest = qData.queue?.[qData.queue.length - 1]
                              if (latest) {
                                const photos = [...(selectedItem.photos || [])]
                                if (!selectedItem.imagePath) {
                                  updateSelected({ imagePath: latest.imagePath, photos })
                                } else {
                                  photos.push(latest.imagePath)
                                  updateSelected({ photos })
                                }
                              }
                            }
                          }} />
                          <button onClick={() => photoInputRef.current?.click()} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}>📸 Upload Photo</button>
                          <button onClick={() => findProductImage(selectedItem)} disabled={imageSearching} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>
                            {imageSearching ? '🔍 Searching...' : '🔍 Find Product Image'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Photo gallery — user's own photos */}
                  {((selectedItem.photos && selectedItem.photos.length > 0) || selectedItem.imagePath) && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                      {/* Show original scan photo */}
                      {selectedItem.imagePath && selectedItem.productImage && (
                        <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
                          <img src={selectedItem.imagePath} alt="Your photo" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {/* Additional photos */}
                      {(selectedItem.photos || []).map((photo, i) => (
                        <div key={i} className="shrink-0 w-16 h-16 rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {/* Add photo button */}
                      <button onClick={() => photoInputRef.current?.click()} className="shrink-0 w-16 h-16 rounded-lg flex items-center justify-center text-lg" style={{ border: '1px dashed var(--c-border)', color: 'var(--c-muted)' }}>+</button>
                    </div>
                  )}
                </div>

                {/* Item name + favourite */}
                <div className="flex items-center gap-2 mb-2">
                  <input value={selectedItem.name} onChange={e => updateSelected({ name: e.target.value })} className="flex-1 rounded-lg px-3 py-2 text-base font-semibold" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                  <button onClick={() => updateSelected({ favourite: !selectedItem.favourite })} className="text-2xl" style={{ color: selectedItem.favourite ? '#FFD700' : '#333' }}>
                    {selectedItem.favourite ? '★' : '☆'}
                  </button>
                </div>

                {/* Rating */}
                <div className="mb-3">
                  <StarRating value={selectedItem.rating || 0} onChange={v => updateSelected({ rating: v })} />
                </div>

                {/* Tab navigation */}
                <div className="flex gap-1 mb-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
                  {(['info', 'notes', 'value'] as const).map(tab => (
                    <button key={tab} onClick={() => setDetailTab(tab)} className="px-3 py-2 text-sm font-semibold capitalize" style={{ color: detailTab === tab ? '#FFD700' : 'var(--c-muted)', borderBottom: detailTab === tab ? '2px solid #FFD700' : '2px solid transparent' }}>
                      {tab === 'info' ? '📋 Details' : tab === 'notes' ? '📝 Notes' : '💰 Value'}
                    </button>
                  ))}
                </div>

                {/* Tab: Details */}
                {detailTab === 'info' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <select value={selectedItem.category} onChange={e => updateSelected({ category: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select value={selectedItem.location} onChange={e => updateSelected({ location: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                        {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select value={selectedItem.condition || 'Good'} onChange={e => updateSelected({ condition: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                        {['New', 'Good', 'Fair', 'Poor'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select value={selectedItem.usageFrequency || ''} onChange={e => updateSelected({ usageFrequency: e.target.value || undefined })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                        <option value="">Usage frequency</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="rarely">Rarely</option>
                      </select>
                    </div>
                    <input value={selectedItem.size || ''} onChange={e => updateSelected({ size: e.target.value })} placeholder="Size / Volume / Weight (e.g. 75ml, 250g)" className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                    <textarea value={selectedItem.description} onChange={e => updateSelected({ description: e.target.value })} placeholder="Description" rows={2} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />

                    {/* Tags */}
                    <div>
                      <div className="text-xs mb-1.5" style={{ color: 'var(--c-muted)' }}>Tags</div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(selectedItem.tags || []).map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-lg flex items-center gap-1" style={{ background: '#ffffff10', color: 'var(--c-text)' }}>
                            #{tag}
                            <button onClick={() => removeTag(tag)} className="text-[10px]" style={{ color: 'var(--c-muted)' }}>✕</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} placeholder="Add tag..." className="flex-1 rounded-lg px-3 py-1.5 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                        <button onClick={addTag} className="px-2 py-1.5 rounded-lg text-xs" style={{ color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}>+</button>
                      </div>
                    </div>

                    {/* Rebuy verdict */}
                    <div>
                      <div className="text-xs mb-1.5" style={{ color: 'var(--c-muted)' }}>Would you buy again?</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateSelected({ wouldRepurchase: selectedItem.wouldRepurchase === true ? null : true })}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                          style={{
                            background: selectedItem.wouldRepurchase === true ? '#22C55E20' : 'var(--c-panel)',
                            color: selectedItem.wouldRepurchase === true ? '#22C55E' : 'var(--c-muted)',
                            border: `1px solid ${selectedItem.wouldRepurchase === true ? '#22C55E40' : 'var(--c-border)'}`,
                          }}
                        >
                          👍 Would buy again
                        </button>
                        <button
                          onClick={() => updateSelected({ wouldRepurchase: selectedItem.wouldRepurchase === false ? null : false })}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                          style={{
                            background: selectedItem.wouldRepurchase === false ? '#EF444420' : 'var(--c-panel)',
                            color: selectedItem.wouldRepurchase === false ? '#EF4444' : 'var(--c-muted)',
                            border: `1px solid ${selectedItem.wouldRepurchase === false ? '#EF444440' : 'var(--c-border)'}`,
                          }}
                        >
                          👎 Wouldn't buy again
                        </button>
                      </div>
                    </div>

                    {/* Running low toggle */}
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={selectedItem.runningLow || false} onChange={e => updateSelected({ runningLow: e.target.checked })} className="accent-red-500 w-4 h-4" />
                      <span style={{ color: selectedItem.runningLow ? '#EF4444' : 'var(--c-muted)' }}>🔔 Running low</span>
                    </label>
                  </div>
                )}

                {/* Tab: Notes */}
                {detailTab === 'notes' && (
                  <div className="space-y-3">
                    <textarea value={selectedItem.notes || ''} onChange={e => updateSelected({ notes: e.target.value })} placeholder="Your notes about this item... thoughts, tips, experiences..." rows={6} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                    <textarea value={selectedItem.uses || ''} onChange={e => updateSelected({ uses: e.target.value })} placeholder="What do you use it for?" rows={3} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                  </div>
                )}

                {/* Tab: Value */}
                {detailTab === 'value' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input value={selectedItem.estimatedValue} onChange={e => updateSelected({ estimatedValue: e.target.value })} placeholder="Current value (£)" className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                      <input type="date" value={selectedItem.purchaseDate || ''} onChange={e => updateSelected({ purchaseDate: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={selectedItem.purchaseLocation || ''} onChange={e => updateSelected({ purchaseLocation: e.target.value })} placeholder="Where purchased" className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                      <input value={selectedItem.purchaseLink || ''} onChange={e => updateSelected({ purchaseLink: e.target.value })} placeholder="Purchase URL (rebuy link)" className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" value={selectedItem.warrantyExpiry || ''} onChange={e => updateSelected({ warrantyExpiry: e.target.value })} className="rounded-lg px-3 py-2 text-sm" title="Warranty expiry" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                      <input type="date" value={selectedItem.replaceBy || ''} onChange={e => updateSelected({ replaceBy: e.target.value })} className="rounded-lg px-3 py-2 text-sm" title="Replace by date" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                    </div>

                    {/* Computed stats */}
                    <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)' }}>
                      <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>Stats</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {selectedItem.purchaseDate && (
                          <div>
                            <span style={{ color: 'var(--c-muted)' }}>Owned: </span>
                            <span style={{ color: 'var(--c-text)' }}>{daysOwned(selectedItem.purchaseDate)}</span>
                          </div>
                        )}
                        {costPerUse(selectedItem.estimatedValue, selectedItem.usageFrequency) && (
                          <div>
                            <span style={{ color: 'var(--c-muted)' }}>Cost/use: </span>
                            <span style={{ color: '#22C55E' }}>{costPerUse(selectedItem.estimatedValue, selectedItem.usageFrequency)}</span>
                          </div>
                        )}
                        {selectedItem.warrantyExpiry && (
                          <div>
                            <span style={{ color: 'var(--c-muted)' }}>Warranty: </span>
                            <span style={{ color: new Date(selectedItem.warrantyExpiry) > new Date() ? '#22C55E' : '#EF4444' }}>
                              {new Date(selectedItem.warrantyExpiry) > new Date() ? 'Active' : 'Expired'}
                            </span>
                          </div>
                        )}
                        {selectedItem.replaceBy && (
                          <div>
                            <span style={{ color: 'var(--c-muted)' }}>Replace: </span>
                            <span style={{ color: new Date(selectedItem.replaceBy) < new Date() ? '#EF4444' : 'var(--c-text)' }}>
                              {new Date(selectedItem.replaceBy).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price actions */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => findCheapest(selectedItem)} disabled={priceLoading === selectedItem.id} className="px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: '#22C55E20', color: '#22C55E', border: '1px solid #22C55E40' }}>
                        {priceLoading === selectedItem.id ? '🔍...' : '🔍 Find Cheapest'}
                      </button>
                      {selectedItem.purchaseLink && (
                        <a href={selectedItem.purchaseLink} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: '#60A5FA20', color: '#60A5FA', border: '1px solid #60A5FA40' }}>
                          🔗 Rebuy Link
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--c-border)' }}>
                  <button onClick={deleteSelected} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: '#7F1D1D', color: '#FECACA' }}>Delete</button>
                  <button onClick={() => setSelectedItem(null)} className="px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>Cancel</button>
                  <button onClick={saveSelected} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: '#FFD700', color: '#000' }}>Save</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
