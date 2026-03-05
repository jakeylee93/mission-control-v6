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
  uses?: string
  purchaseLocation?: string
  categoryConfidence?: number
  alternateCategories?: string[]
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

export default function BelongingsTab() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map(c => [c, false]))
  )
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const scanInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ category: CATEGORIES[0], location: LOCATIONS[0], condition: 'Good' })
  const [priceLoading, setPriceLoading] = useState<string | null>(null)

  // Load saved items + queue on mount
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

  // Save items
  async function saveItems(updatedItems: InventoryItem[]) {
    setItems(updatedItems)
    await fetch('/api/belongings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: updatedItems }),
    })
  }

  // Upload photo to queue
  async function handleScanUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/belongings/scan', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ok) {
        // Refresh queue
        const qRes = await fetch('/api/belongings/scan')
        const qData = await qRes.json()
        setQueue((qData.queue || []).filter((q: QueueItem) => q.status === 'pending'))
      }
    } catch {}
    setUploading(false)
    if (scanInputRef.current) scanInputRef.current.value = ''
  }

  // Process queue (sync)
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

  // Approve selected scan results
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
      categoryConfidence: r.categoryConfidence,
      alternateCategories: r.alternateCategories,
      uses: '',
      purchaseLocation: '',
    }))
    const updated = [...items, ...newItems]
    await saveItems(updated)
    setScanResults([])
    // Clear processed queue
    const qRes = await fetch('/api/belongings/scan')
    const qData = await qRes.json()
    setQueue((qData.queue || []).filter((q: QueueItem) => q.status === 'pending'))
  }

  // Find cheapest
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
      if (data.searchUrl) {
        window.open(data.searchUrl, '_blank')
      }
    } catch {}
    setPriceLoading(null)
  }

  // Add manual item
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
    }
    await saveItems([...items, item])
    setNewItem({ category: CATEGORIES[0], location: LOCATIONS[0], condition: 'Good' })
    setShowAddModal(false)
  }

  // Update + save item
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

  // Remove from queue
  async function removeFromQueue(id: string) {
    await fetch('/api/belongings/scan', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setQueue(q => q.filter(i => i.id !== id))
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(item => {
      if (activeCategory && item.category !== activeCategory) return false
      if (!q) return true
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.location.toLowerCase().includes(q)
    })
  }, [search, items, activeCategory])

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
        <div className="card rounded-xl p-3 mb-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <span style={{ color: 'var(--c-text)' }}><strong>{items.length}</strong> items</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <span style={{ color: '#FFD700' }}><strong>£{totalValue.toFixed(0)}</strong> estimated value</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📷</span>
            <span style={{ color: 'var(--c-muted)' }}><strong>{items.filter(i => !i.imagePath).length}</strong> need photos</span>
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-lg">⏳</span>
              <span style={{ color: '#F59E0B' }}><strong>{queue.length}</strong> in scan queue</span>
            </div>
          )}
        </div>

        {/* Scan Queue */}
        {(queue.length > 0 || scanResults.length > 0) && (
          <div className="card rounded-xl p-4 mb-4" style={{ border: '1px solid rgba(255,215,0,0.2)' }}>
            {scanResults.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold" style={{ color: '#FFD700' }}>✅ Review Scanned Items ({scanResults.filter(r => r.selected).length}/{scanResults.length} selected)</div>
                  <div className="flex gap-2">
                    <button onClick={() => setScanResults([])} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>Cancel</button>
                    <button onClick={approveResults} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#FFD700', color: '#000' }}>Add Selected</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {scanResults.map((result, idx) => {
                    const accent = CATEGORY_COLORS[result.category] || '#666'
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="rounded-xl p-3 flex items-start gap-3"
                        style={{ background: 'var(--c-panel)', border: `1px solid ${accent}30` }}
                      >
                        <input
                          type="checkbox"
                          checked={result.selected || false}
                          onChange={() => setScanResults(prev => prev.map(r => r.id === result.id ? { ...r, selected: !r.selected } : r))}
                          className="mt-1 w-4 h-4 accent-yellow-400"
                        />
                        {result.imagePath && (
                          <img src={result.imagePath} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{result.name}</div>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <select
                              value={result.category}
                              onChange={(e) => setScanResults(prev => prev.map(r => r.id === result.id ? { ...r, category: e.target.value } : r))}
                              className="text-[11px] px-2 py-0.5 rounded-full"
                              style={{ background: `${accent}20`, color: accent, border: 'none' }}
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {result.categoryConfidence != null && result.categoryConfidence < 80 && result.alternateCategories && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#F59E0B20', color: '#F59E0B' }}>
                                ⚠ {result.categoryConfidence}% sure
                              </span>
                            )}
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>{result.description}</div>
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
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                    style={{ background: '#FFD700', color: '#000' }}
                  >
                    {syncing ? '🔄 Scanning...' : '🔍 Sync & Identify'}
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {queue.map(q => (
                    <div key={q.id} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
                      <img src={q.imagePath} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeFromQueue(q.id)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full text-[10px] flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Search + Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search belongings..."
            className="flex-1 min-w-[200px] rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
          />
          <input ref={scanInputRef} type="file" accept="image/*" className="hidden" onChange={handleScanUpload} />
          <button
            onClick={() => scanInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: '#FFD700', color: '#000' }}
          >
            {uploading ? '⏳ Adding...' : '📸 Scan Items'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--c-panel)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
          >➕ Add Manual</button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Categories sidebar */}
          <aside className="card rounded-xl p-3">
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>Categories</div>
            <button
              onClick={() => setActiveCategory(null)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm mb-1"
              style={{ background: !activeCategory ? '#FFD70020' : 'transparent', color: !activeCategory ? '#FFD700' : 'var(--c-muted)' }}
            >
              All items ({items.length})
            </button>
            {CATEGORIES.map(cat => {
              const count = categoryCounts[cat] || 0
              const active = activeCategory === cat
              const accent = CATEGORY_COLORS[cat] || '#666'
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(active ? null : cat)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm mb-0.5 flex items-center justify-between"
                  style={{ background: active ? `${accent}15` : 'transparent', color: active ? accent : 'var(--c-muted)' }}
                >
                  <span>{cat}</span>
                  {count > 0 && <span className="text-xs font-semibold">{count}</span>}
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
                  {items.length === 0 ? 'Snap your first items' : 'No items match your search'}
                </div>
                <div className="text-sm mb-4" style={{ color: 'var(--c-muted)' }}>
                  Take a photo → add to queue → hit Sync → AI identifies everything
                </div>
                <button onClick={() => scanInputRef.current?.click()} className="px-4 py-2 rounded-lg font-semibold" style={{ background: '#FFD700', color: '#000' }}>
                  📸 Scan Items
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map(item => {
                  const accent = CATEGORY_COLORS[item.category] || '#666'
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="card rounded-xl p-3 text-left"
                      style={{ borderColor: `${accent}30` }}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="rounded-lg mb-2 h-28 flex items-center justify-center overflow-hidden" style={{ background: '#1E1E1E' }}>
                        {item.imagePath ? (
                          <img src={item.imagePath} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">📷</span>
                        )}
                      </div>
                      <div className="text-sm font-semibold mb-1 truncate" style={{ color: 'var(--c-text)' }}>{item.name}</div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${accent}20`, color: accent }}>{item.category}</span>
                        {item.condition && <span className="text-[10px]" style={{ color: 'var(--c-muted)' }}>{item.condition}</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        {item.estimatedValue && <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>{item.estimatedValue}</span>}
                        <span className="text-[10px]" style={{ color: 'var(--c-dim)' }}>{item.location}</span>
                      </div>
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
                <div className="text-lg font-semibold mb-4" style={{ color: 'var(--c-text)' }}>Add Item Manually</div>
                <div className="space-y-3">
                  <input value={newItem.name || ''} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name *" className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                  <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={newItem.location} onChange={e => setNewItem({ ...newItem, location: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <input value={newItem.estimatedValue || ''} onChange={e => setNewItem({ ...newItem, estimatedValue: e.target.value })} placeholder="Estimated value (£)" className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
                  <select value={newItem.condition || 'Good'} onChange={e => setNewItem({ ...newItem, condition: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                    {['New', 'Good', 'Fair', 'Poor'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
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

        {/* Item Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 px-4 py-8" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={() => setSelectedItem(null)}>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} onClick={e => e.stopPropagation()} className="max-w-2xl mx-auto card rounded-2xl p-5 max-h-[85vh] overflow-y-auto">
                <div className="text-lg font-semibold mb-3" style={{ color: 'var(--c-text)' }}>Item Details</div>

                {/* Photo */}
                <div className="rounded-xl h-48 mb-4 flex items-center justify-center overflow-hidden" style={{ background: '#1E1E1E', border: '1px solid var(--c-border)' }}>
                  {selectedItem.imagePath ? (
                    <img src={selectedItem.imagePath} alt={selectedItem.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const fd = new FormData()
                        fd.append('file', file)
                        const res = await fetch('/api/belongings/scan', { method: 'POST', body: fd })
                        const data = await res.json()
                        if (data.ok) {
                          // Get the image path from the queue
                          const qRes = await fetch('/api/belongings/scan')
                          const qData = await qRes.json()
                          const latest = qData.queue?.[qData.queue.length - 1]
                          if (latest) updateSelected({ imagePath: latest.imagePath })
                        }
                      }} />
                      <button onClick={() => photoInputRef.current?.click()} className="text-xs px-3 py-1 rounded-lg" style={{ color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}>Upload Photo</button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={selectedItem.name} onChange={e => updateSelected({ name: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} placeholder="Item name" />
                  <select value={selectedItem.category} onChange={e => updateSelected({ category: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={selectedItem.estimatedValue} onChange={e => updateSelected({ estimatedValue: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} placeholder="Estimated value (£)" />
                  <select value={selectedItem.location} onChange={e => updateSelected({ location: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <select value={selectedItem.condition || 'Good'} onChange={e => updateSelected({ condition: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                    {['New', 'Good', 'Fair', 'Poor'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={selectedItem.purchaseLocation || ''} onChange={e => updateSelected({ purchaseLocation: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} placeholder="Where purchased" />
                  <textarea value={selectedItem.description} onChange={e => updateSelected({ description: e.target.value })} className="rounded-lg px-3 py-2 text-sm md:col-span-2" rows={2} style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} placeholder="Description" />
                </div>

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => findCheapest(selectedItem)}
                    disabled={priceLoading === selectedItem.id}
                    className="px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ background: '#22C55E20', color: '#22C55E', border: '1px solid #22C55E40' }}
                  >
                    {priceLoading === selectedItem.id ? '🔍 Searching...' : '🔍 Find Cheapest Online'}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={deleteSelected} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: '#7F1D1D', color: '#FECACA' }}>Delete</button>
                    <button onClick={saveSelected} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: '#FFD700', color: '#000' }}>Save</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
