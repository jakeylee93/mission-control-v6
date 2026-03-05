'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface InventoryItem {
  id: string
  name: string
  category: string
  location: string
  description: string
  estimatedValue: string
  purchaseLocation: string
  uses: string
}

const CATEGORIES = [
  '💻 Electronics',
  '🧗 Climbing Gear',
  '🔧 Tools',
  '🍳 Kitchen',
  '💼 Business Equipment',
  '🖥️ Office Equipment',
  '⭐ Favourites',
]

const CATEGORY_COLORS: Record<string, string> = {
  '💻 Electronics': '#60A5FA',
  '🧗 Climbing Gear': '#22C55E',
  '🔧 Tools': '#F59E0B',
  '🍳 Kitchen': '#F97316',
  '💼 Business Equipment': '#A855F7',
  '🖥️ Office Equipment': '#06B6D4',
  '⭐ Favourites': '#FFD700',
}

const DEFAULT_ITEMS: InventoryItem[] = [
  {
    id: '1',
    name: 'Black Diamond Climbing Shoes',
    category: '🧗 Climbing Gear',
    location: 'Gear Bag',
    description: '',
    estimatedValue: '',
    purchaseLocation: '',
    uses: '',
  },
  {
    id: '2',
    name: 'MacBook Pro 16"',
    category: '💻 Electronics',
    location: 'Office',
    description: '',
    estimatedValue: '',
    purchaseLocation: '',
    uses: '',
  },
  {
    id: '3',
    name: 'DeWalt Drill',
    category: '🔧 Tools',
    location: 'Van',
    description: '',
    estimatedValue: '',
    purchaseLocation: '',
    uses: '',
  },
  {
    id: '4',
    name: 'Cocktail Shaker Set',
    category: '💼 Business Equipment',
    location: 'Storage Unit',
    description: '',
    estimatedValue: '',
    purchaseLocation: '',
    uses: '',
  },
]

export default function BelongingsTab() {
  const [search, setSearch] = useState('')
  const [items, setItems] = useState(DEFAULT_ITEMS)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    CATEGORIES.reduce((acc, category) => ({ ...acc, [category]: true }), {}),
  )
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      const matchesCategory = !activeCategory || item.category === activeCategory
      if (!matchesCategory) return false
      if (!q) return true
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.location.toLowerCase().includes(q)
    })
  }, [search, items, activeCategory])

  function toggleCategory(category: string) {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  function updateSelected(patch: Partial<InventoryItem>) {
    if (!selectedItem) return
    setSelectedItem({ ...selectedItem, ...patch })
  }

  function saveSelected() {
    if (!selectedItem) return
    setItems((prev) => prev.map((item) => (item.id === selectedItem.id ? selectedItem : item)))
    setSelectedItem(null)
  }

  function deleteSelected() {
    if (!selectedItem) return
    setItems((prev) => prev.filter((item) => item.id !== selectedItem.id))
    setSelectedItem(null)
  }

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--c-text)" }}>Belongings</h1>
          <p className="text-sm mt-1" style={{ color: "var(--c-muted)" }}>Your physical world, catalogued and searchable</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search belongings..."
            className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
          />
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: '#FFD700', color: '#000' }}>📸 Scan Items</button>
            <button className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--c-panel)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}>➕ Add Manual</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 md:gap-5">
          <aside className="card rounded-2xl p-3 md:p-4">
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>Categories</div>
            <div className="space-y-2">
              {CATEGORIES.map((category) => {
                const count = items.filter((item) => item.category === category).length
                const open = expanded[category]
                const active = activeCategory === category
                return (
                  <div key={category} className="rounded-xl" style={{ border: '1px solid var(--c-border)', background: 'var(--c-panel)' }}>
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full px-3 py-2.5 flex items-center justify-between text-left"
                    >
                      <span className="font-semibold text-sm" style={{ color: active ? '#FFD700' : 'var(--c-text)' }}>{category}</span>
                      <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{count}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 flex items-center gap-2">
                            <button
                              className="text-xs px-2 py-1 rounded-md"
                              style={{
                                background: active ? '#FFD700' : 'var(--c-surface)',
                                color: active ? '#000' : 'var(--c-muted)',
                                border: '1px solid var(--c-border)',
                              }}
                              onClick={() => setActiveCategory(active ? null : category)}
                            >
                              {active ? 'Showing' : 'Filter'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </aside>

          <section className="space-y-4">
            {filtered.length === 0 ? (
              <div className="card rounded-2xl p-8 text-center">
                <div className="text-5xl mb-3">📷</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--c-text)' }}>Snap a photo to start cataloguing your stuff</div>
                <button className="mt-4 px-4 py-2 rounded-lg font-semibold" style={{ background: '#FFD700', color: '#000' }}>Scan Items</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((item) => {
                  const accent = CATEGORY_COLORS[item.category] || '#666'
                  return (
                    <button
                      key={item.id}
                      className="card rounded-xl p-3 text-left transition-all"
                      style={{ borderColor: `${accent}40` }}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="rounded-lg mb-2 h-24 flex items-center justify-center" style={{ background: '#2A2A2A' }}>
                        <span className="text-2xl">📷</span>
                      </div>
                      <div className="text-sm font-semibold mb-1" style={{ color: 'var(--c-text)' }}>{item.name}</div>
                      <div className="text-[11px] mb-1 inline-block px-2 py-0.5 rounded-full" style={{ background: `${accent}20`, color: accent }}>{item.category}</div>
                      <div className="text-[11px]" style={{ color: 'var(--c-muted)' }}>{item.location}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 px-4 py-8"
              style={{ background: 'rgba(0,0,0,0.65)' }}
              onClick={() => setSelectedItem(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-2xl mx-auto card rounded-2xl p-4 md:p-5"
              >
                <div className="text-lg font-semibold mb-3" style={{ color: 'var(--c-text)' }}>Item Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2 rounded-xl h-40 flex items-center justify-center" style={{ background: '#2A2A2A', border: '1px solid var(--c-border)' }}>📷</div>
                  <input value={selectedItem.name} onChange={(e) => updateSelected({ name: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} placeholder="Item name" />
                  <select value={selectedItem.category} onChange={(e) => updateSelected({ category: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                    {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                  <input value={selectedItem.estimatedValue} onChange={(e) => updateSelected({ estimatedValue: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} placeholder="Estimated value (£)" />
                  <input value={selectedItem.purchaseLocation} onChange={(e) => updateSelected({ purchaseLocation: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} placeholder="Purchase location" />
                  <select value={selectedItem.location} onChange={(e) => updateSelected({ location: e.target.value })} className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                    {['Gear Bag', 'Office', 'Van', 'Storage Unit', 'Home'].map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                  <textarea value={selectedItem.description} onChange={(e) => updateSelected({ description: e.target.value })} className="rounded-lg px-3 py-2 text-sm md:col-span-2" rows={3} style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} placeholder="Description" />
                  <textarea value={selectedItem.uses} onChange={(e) => updateSelected({ uses: e.target.value })} className="rounded-lg px-3 py-2 text-sm md:col-span-2" rows={2} style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} placeholder="Uses" />
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button onClick={deleteSelected} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: '#7F1D1D', color: '#FECACA' }}>Delete</button>
                  <button onClick={saveSelected} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: '#FFD700', color: '#000' }}>Save</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
