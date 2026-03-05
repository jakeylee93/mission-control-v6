'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

type Category =
  | 'Electronics'
  | 'Climbing Gear'
  | 'Tools'
  | 'Kitchen'
  | 'Business Equipment'
  | 'Office Equipment'
  | 'Other'

interface InventoryItem {
  id: string
  name: string
  category: Category
  location: string
  description: string
  estimatedValue: string
  purchaseLocation: string
  uses: string
  imagePath?: string
}

interface DetectedItem {
  name: string
  category: Category
  estimatedValue: string
  description: string
  suggestedLocation: string
}

interface ScanReviewItem extends DetectedItem {
  id: string
  selected: boolean
}

interface ManualForm {
  name: string
  category: Category
  locationPreset: string
  customLocation: string
  estimatedValue: string
  description: string
  purchaseLocation: string
  uses: string
  imagePath?: string
}

const CATEGORIES: Category[] = [
  'Electronics',
  'Climbing Gear',
  'Tools',
  'Kitchen',
  'Business Equipment',
  'Office Equipment',
  'Other',
]

const CATEGORY_META: Record<Category, { color: string; icon: string }> = {
  Electronics: { color: '#60A5FA', icon: '💻' },
  'Climbing Gear': { color: '#22C55E', icon: '🧗' },
  Tools: { color: '#F59E0B', icon: '🔧' },
  Kitchen: { color: '#F97316', icon: '🍳' },
  'Business Equipment': { color: '#D946EF', icon: '💼' },
  'Office Equipment': { color: '#06B6D4', icon: '🖥️' },
  Other: { color: '#9CA3AF', icon: '📦' },
}

const LOCATION_OPTIONS = ['Home', 'Van', 'Office', 'Storage Unit', 'Gear Bag', 'Kitchen', 'Workshop', 'Custom']

const DEFAULT_ITEMS: InventoryItem[] = [
  {
    id: 'default-1',
    name: 'MacBook Pro 16"',
    category: 'Electronics',
    location: 'Office',
    description: 'Primary work machine',
    estimatedValue: '£2200',
    purchaseLocation: '',
    uses: '',
  },
  {
    id: 'default-2',
    name: 'Black Diamond Climbing Shoes',
    category: 'Climbing Gear',
    location: 'Gear Bag',
    description: 'Indoor climbing pair',
    estimatedValue: '£110',
    purchaseLocation: '',
    uses: '',
  },
]

const EMPTY_MANUAL_FORM: ManualForm = {
  name: '',
  category: 'Other',
  locationPreset: 'Home',
  customLocation: '',
  estimatedValue: '',
  description: '',
  purchaseLocation: '',
  uses: '',
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.readAsDataURL(file)
  })
}

function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d.,]/g, '').replace(/,/g, '')
  const num = Number.parseFloat(cleaned)
  return Number.isFinite(num) ? num : 0
}

function normalizeCategory(value: string): Category {
  return CATEGORIES.includes(value as Category) ? (value as Category) : 'Other'
}

function sanitizeLoadedItem(raw: unknown, idx: number): InventoryItem | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<InventoryItem>
  if (!item.name || typeof item.name !== 'string') return null

  return {
    id: typeof item.id === 'string' && item.id ? item.id : `item-${Date.now()}-${idx}`,
    name: item.name,
    category: normalizeCategory(typeof item.category === 'string' ? item.category : 'Other'),
    location: typeof item.location === 'string' && item.location ? item.location : 'Home',
    description: typeof item.description === 'string' ? item.description : '',
    estimatedValue: typeof item.estimatedValue === 'string' ? item.estimatedValue : '',
    purchaseLocation: typeof item.purchaseLocation === 'string' ? item.purchaseLocation : '',
    uses: typeof item.uses === 'string' ? item.uses : '',
    imagePath: typeof item.imagePath === 'string' ? item.imagePath : undefined,
  }
}

export default function BelongingsTab() {
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<InventoryItem[]>(DEFAULT_ITEMS)
  const [expanded, setExpanded] = useState<Record<Category, boolean>>(
    CATEGORIES.reduce((acc, category) => ({ ...acc, [category]: false }), {} as Record<Category, boolean>),
  )
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [scanReviewItems, setScanReviewItems] = useState<ScanReviewItem[]>([])
  const [scanImagePath, setScanImagePath] = useState<string | undefined>(undefined)
  const [scanError, setScanError] = useState('')

  const [isManualOpen, setIsManualOpen] = useState(false)
  const [manualForm, setManualForm] = useState<ManualForm>(EMPTY_MANUAL_FORM)
  const [manualError, setManualError] = useState('')

  const scanInputRef = useRef<HTMLInputElement | null>(null)
  const manualPhotoInputRef = useRef<HTMLInputElement | null>(null)
  const detailPhotoInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadItems() {
      try {
        const res = await fetch('/api/belongings/load', { method: 'GET' })
        if (!res.ok) return

        const json = (await res.json()) as { items?: unknown[] }
        const loaded = Array.isArray(json.items)
          ? json.items.map((item, idx) => sanitizeLoadedItem(item, idx)).filter((item): item is InventoryItem => item !== null)
          : []

        if (!cancelled) {
          setItems(loaded.length > 0 ? loaded : DEFAULT_ITEMS)
        }
      } catch {
        if (!cancelled) setItems(DEFAULT_ITEMS)
      }
    }

    loadItems()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      )
    })
  }, [search, items, activeCategory])

  const summary = useMemo(() => {
    const totalValue = items.reduce((acc, item) => acc + parseCurrency(item.estimatedValue), 0)
    const noPhotoCount = items.filter((item) => !item.imagePath).length
    return { totalItems: items.length, totalValue, noPhotoCount }
  }, [items])

  async function persistItems(nextItems: InventoryItem[]) {
    await fetch('/api/belongings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: nextItems }),
    })
  }

  function setItemsAndSave(nextItems: InventoryItem[]) {
    setItems(nextItems)
    void persistItems(nextItems)
  }

  function updateSelected(patch: Partial<InventoryItem>) {
    if (!selectedItem) return
    setSelectedItem({ ...selectedItem, ...patch })
  }

  function saveSelected() {
    if (!selectedItem) return
    const next = items.map((item) => (item.id === selectedItem.id ? selectedItem : item))
    setItemsAndSave(next)
    setSelectedItem(null)
  }

  function deleteSelected() {
    if (!selectedItem) return
    const next = items.filter((item) => item.id !== selectedItem.id)
    setItemsAndSave(next)
    setSelectedItem(null)
  }

  async function onScanFileChosen(file: File) {
    setScanError('')
    setIsScanning(true)

    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/api/belongings/scan', { method: 'POST', body: formData })
      const json = (await res.json()) as { ok?: boolean; error?: string; items?: DetectedItem[]; imagePath?: string }

      if (!res.ok || !json.ok) {
        setScanError(json.error || 'Scan failed')
        return
      }

      const detectedItems = Array.isArray(json.items) ? json.items : []
      const reviewItems = detectedItems.map((item, idx) => ({
        id: `scan-${Date.now()}-${idx}`,
        name: item.name || 'Unnamed item',
        category: normalizeCategory(item.category || 'Other'),
        estimatedValue: item.estimatedValue || '',
        description: item.description || '',
        suggestedLocation: item.suggestedLocation || 'Home',
        selected: true,
      }))

      setScanImagePath(json.imagePath)
      setScanReviewItems(reviewItems)
      setIsReviewOpen(true)
    } catch {
      setScanError('Unable to scan this image right now')
    } finally {
      setIsScanning(false)
    }
  }

  function onClickScan() {
    scanInputRef.current?.click()
  }

  async function onScanInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    await onScanFileChosen(file)
  }

  function addSelectedScanItems() {
    const chosen = scanReviewItems.filter((item) => item.selected)
    if (chosen.length === 0) return

    const appended: InventoryItem[] = chosen.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      name: item.name,
      category: item.category,
      location: item.suggestedLocation || 'Home',
      description: item.description,
      estimatedValue: item.estimatedValue,
      purchaseLocation: '',
      uses: '',
      imagePath: scanImagePath,
    }))

    const next = [...items, ...appended]
    setItemsAndSave(next)
    setIsReviewOpen(false)
    setScanReviewItems([])
    setScanImagePath(undefined)
  }

  function resetManualForm() {
    setManualForm(EMPTY_MANUAL_FORM)
    setManualError('')
  }

  async function saveManualItem() {
    if (!manualForm.name.trim()) {
      setManualError('Item name is required')
      return
    }

    const location = manualForm.locationPreset === 'Custom' ? manualForm.customLocation.trim() || 'Home' : manualForm.locationPreset

    const nextItem: InventoryItem = {
      id: `item-${Date.now()}`,
      name: manualForm.name.trim(),
      category: manualForm.category,
      location,
      estimatedValue: manualForm.estimatedValue,
      description: manualForm.description,
      purchaseLocation: manualForm.purchaseLocation,
      uses: manualForm.uses,
      imagePath: manualForm.imagePath,
    }

    const next = [...items, nextItem]
    setItemsAndSave(next)
    setIsManualOpen(false)
    resetManualForm()
  }

  async function onManualPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const dataUrl = await toDataUrl(file)
    setManualForm((prev) => ({ ...prev, imagePath: dataUrl }))
  }

  async function onDetailPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !selectedItem) return

    const dataUrl = await toDataUrl(file)
    setSelectedItem({ ...selectedItem, imagePath: dataUrl })
  }

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <input ref={scanInputRef} type="file" accept="image/*" className="hidden" onChange={onScanInputChange} />
      <input ref={manualPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={onManualPhotoChange} />
      <input ref={detailPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={onDetailPhotoChange} />

      <div className="p-4 md:p-6 max-w-[1500px] mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Belongings</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>
            Your physical world, catalogued and searchable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div className="card rounded-xl p-3" style={{ border: '1px solid var(--c-border)' }}>
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>Total Items</div>
            <div className="text-xl font-bold" style={{ color: 'var(--c-text)' }}>{summary.totalItems}</div>
          </div>
          <div className="card rounded-xl p-3" style={{ border: '1px solid var(--c-border)' }}>
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>Estimated Value</div>
            <div className="text-xl font-bold" style={{ color: 'var(--c-text)' }}>£{summary.totalValue.toLocaleString('en-GB')}</div>
          </div>
          <div className="card rounded-xl p-3" style={{ border: '1px solid var(--c-border)' }}>
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>Needs Photos</div>
            <div className="text-xl font-bold" style={{ color: 'var(--c-text)' }}>{summary.noPhotoCount}</div>
          </div>
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
            <button
              onClick={onClickScan}
              className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#FFD700', color: '#000' }}
            >
              📸 Scan Items
            </button>
            <button
              onClick={() => {
                resetManualForm()
                setIsManualOpen(true)
              }}
              className="px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--c-panel)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
            >
              ➕ Add Manual
            </button>
          </div>
        </div>

        {!!scanError && (
          <div className="mb-4 text-sm rounded-lg px-3 py-2" style={{ background: '#7F1D1D33', color: '#FCA5A5', border: '1px solid #991B1B' }}>
            {scanError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 md:gap-5">
          <aside className="card rounded-2xl p-3 md:p-4">
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>Categories</div>
            <div className="space-y-2">
              {CATEGORIES.map((category) => {
                const count = items.filter((item) => item.category === category).length
                const isActive = activeCategory === category
                const isOpen = expanded[category]
                const meta = CATEGORY_META[category]
                return (
                  <div key={category} className="rounded-xl" style={{ border: '1px solid var(--c-border)', background: 'var(--c-panel)' }}>
                    <div className="flex items-center">
                      <button
                        onClick={() => setActiveCategory(isActive ? null : category)}
                        className="flex-1 px-3 py-2.5 text-left flex items-center justify-between"
                      >
                        <span className="font-semibold text-sm" style={{ color: isActive ? meta.color : 'var(--c-text)' }}>
                          {meta.icon} {category}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{count}</span>
                      </button>
                      <button
                        onClick={() => setExpanded((prev) => ({ ...prev, [category]: !prev[category] }))}
                        className="px-3 py-2 text-xs"
                        style={{ color: 'var(--c-muted)' }}
                      >
                        {isOpen ? '−' : '+'}
                      </button>
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden px-3 pb-3"
                        >
                          <div className="text-xs" style={{ color: 'var(--c-muted)' }}>
                            {isActive ? 'Filtering this category' : 'Click the category name to filter the grid'}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </aside>

          <section>
            {filteredItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card rounded-2xl p-10 text-center"
              >
                <div className="text-7xl mb-4">📷</div>
                <div className="text-xl font-semibold" style={{ color: 'var(--c-text)' }}>Scan your first items</div>
                <div className="text-sm mt-2" style={{ color: 'var(--c-muted)' }}>Use photo scan to instantly detect and add belongings</div>
                <button
                  onClick={onClickScan}
                  className="mt-5 px-4 py-2 rounded-lg font-semibold"
                  style={{ background: '#FFD700', color: '#000' }}
                >
                  Scan Items
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {filteredItems.map((item) => {
                  const meta = CATEGORY_META[item.category]
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ y: -2, scale: 1.01 }}
                      transition={{ duration: 0.18 }}
                      className="card rounded-xl p-3 text-left transition-all"
                      style={{ borderColor: `${meta.color}44`, boxShadow: `0 0 0 0 ${meta.color}` }}
                      onClick={() => setSelectedItem(item)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 18px -6px ${meta.color}`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 0 0 ${meta.color}`
                      }}
                    >
                      <div className="rounded-lg mb-2 h-28 overflow-hidden" style={{ background: '#1F1F1F' }}>
                        {item.imagePath ? (
                          <img src={item.imagePath} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-3xl">📷</div>
                        )}
                      </div>
                      <div className="text-sm font-semibold mb-1 line-clamp-2" style={{ color: 'var(--c-text)' }}>{item.name}</div>
                      <div className="text-[11px] mb-1 inline-block px-2 py-0.5 rounded-full" style={{ background: `${meta.color}22`, color: meta.color }}>
                        {meta.icon} {item.category}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--c-muted)' }}>{item.location}</div>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center"
            style={{ background: 'rgba(0, 0, 0, 0.85)' }}
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-full"
              style={{ background: 'radial-gradient(circle, #FFD700 0%, #F59E0B 65%, transparent 70%)' }}
            />
            <div className="mt-5 text-xl font-semibold" style={{ color: '#F7F7F7' }}>Scanning items...</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] p-4 md:p-8"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setIsReviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="max-w-3xl mx-auto card rounded-2xl p-4 md:p-5 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-lg font-semibold mb-3" style={{ color: 'var(--c-text)' }}>Review Detected Items</div>
              <div className="space-y-2">
                {scanReviewItems.map((item) => {
                  const meta = CATEGORY_META[item.category]
                  return (
                    <label
                      key={item.id}
                      className="flex gap-3 rounded-xl p-3"
                      style={{ border: '1px solid var(--c-border)', background: 'var(--c-panel)' }}
                    >
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setScanReviewItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, selected: checked } : it)))
                        }}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{item.name}</div>
                        <div className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full" style={{ background: `${meta.color}20`, color: meta.color }}>
                          {item.category}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>{item.estimatedValue || 'No value estimate'}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>{item.description || 'No description'}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsReviewOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--c-panel)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={addSelectedScanItems}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: '#FFD700', color: '#000' }}
                >
                  Add Selected
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isManualOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] p-4 md:p-8"
            style={{ background: 'rgba(0,0,0,0.72)' }}
            onClick={() => setIsManualOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="max-w-2xl mx-auto card rounded-2xl p-4 md:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-lg font-semibold mb-3" style={{ color: 'var(--c-text)' }}>Add Item Manually</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={manualForm.name}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm md:col-span-2"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Item name"
                />
                <select
                  value={manualForm.category}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, category: normalizeCategory(e.target.value) }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={manualForm.locationPreset}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, locationPreset: e.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                >
                  {LOCATION_OPTIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                {manualForm.locationPreset === 'Custom' && (
                  <input
                    value={manualForm.customLocation}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, customLocation: e.target.value }))}
                    className="rounded-lg px-3 py-2 text-sm md:col-span-2"
                    style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                    placeholder="Custom location"
                  />
                )}
                <input
                  value={manualForm.estimatedValue}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, estimatedValue: e.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Estimated value (£)"
                />
                <input
                  value={manualForm.purchaseLocation}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, purchaseLocation: e.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Purchase location"
                />
                <textarea
                  value={manualForm.description}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm md:col-span-2"
                  rows={3}
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Description"
                />
                <textarea
                  value={manualForm.uses}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, uses: e.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm md:col-span-2"
                  rows={2}
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Uses"
                />
                <div className="md:col-span-2 rounded-xl p-3" style={{ border: '1px solid var(--c-border)', background: 'var(--c-panel)' }}>
                  {manualForm.imagePath ? (
                    <img src={manualForm.imagePath} alt="Manual item" className="w-full h-36 object-cover rounded-lg mb-2" />
                  ) : (
                    <div className="h-24 flex items-center justify-center rounded-lg mb-2" style={{ background: '#1F1F1F' }}>📷</div>
                  )}
                  <button
                    onClick={() => manualPhotoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-md text-sm"
                    style={{ background: '#1F2937', color: '#E5E7EB' }}
                  >
                    Upload Photo
                  </button>
                </div>
              </div>

              {!!manualError && <div className="text-sm mt-3" style={{ color: '#FCA5A5' }}>{manualError}</div>}

              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsManualOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--c-panel)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => void saveManualItem()}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: '#FFD700', color: '#000' }}
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] px-4 py-8"
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
                <div className="md:col-span-2 rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-border)', background: '#1F1F1F' }}>
                  {selectedItem.imagePath ? (
                    <img src={selectedItem.imagePath} alt={selectedItem.name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="h-40 flex items-center justify-center text-4xl">📷</div>
                  )}
                  <div className="p-2">
                    <button
                      onClick={() => detailPhotoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-md text-sm"
                      style={{ background: '#1F2937', color: '#E5E7EB' }}
                    >
                      Upload Photo
                    </button>
                  </div>
                </div>
                <input
                  value={selectedItem.name}
                  onChange={(e) => updateSelected({ name: e.target.value })}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Item name"
                />
                <select
                  value={selectedItem.category}
                  onChange={(e) => updateSelected({ category: normalizeCategory(e.target.value) })}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <input
                  value={selectedItem.estimatedValue}
                  onChange={(e) => updateSelected({ estimatedValue: e.target.value })}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Estimated value (£)"
                />
                <input
                  value={selectedItem.purchaseLocation}
                  onChange={(e) => updateSelected({ purchaseLocation: e.target.value })}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Purchase location"
                />
                <input
                  value={selectedItem.location}
                  onChange={(e) => updateSelected({ location: e.target.value })}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Location"
                />
                <textarea
                  value={selectedItem.description}
                  onChange={(e) => updateSelected({ description: e.target.value })}
                  className="rounded-lg px-3 py-2 text-sm md:col-span-2"
                  rows={3}
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Description"
                />
                <textarea
                  value={selectedItem.uses}
                  onChange={(e) => updateSelected({ uses: e.target.value })}
                  className="rounded-lg px-3 py-2 text-sm md:col-span-2"
                  rows={2}
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Uses"
                />
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={deleteSelected} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: '#7F1D1D', color: '#FECACA' }}>
                  Delete
                </button>
                <button onClick={saveSelected} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: '#FFD700', color: '#000' }}>
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
