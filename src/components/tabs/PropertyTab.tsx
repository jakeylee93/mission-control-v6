'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'

type PropertySubTab = 'property' | 'assets'
type PropertyCategory = 'Residential' | 'Vehicles' | 'Storage' | 'Commercial'
type PropertyType = 'house' | 'flat' | 'room' | 'vehicle' | 'storage' | 'commercial'
type PropertyStatus = 'owned' | 'rented' | 'leased'
type AssetCategory = 'Bar Equipment' | 'Furniture' | 'Glassware' | 'Tech' | 'Uniforms & Branding' | 'Consumables' | 'Other'
type AssetCondition = 'new' | 'good' | 'fair' | 'poor'
type CompanyKey = 'bar-people' | 'anyvendor' | 'anyos'

interface PropertyItem {
  id: string
  name: string
  category: PropertyCategory
  type: PropertyType
  status: PropertyStatus
  address: string
  monthlyCost?: number
  notes: string
  keyDates: string
}

interface AssetItem {
  id: string
  name: string
  quantity: number
  company: CompanyKey
  category: AssetCategory
  condition: AssetCondition
  location: string
  valuePerUnit?: number
  notes: string
}

const PROPERTY_SUB_TABS: Array<{ id: PropertySubTab; label: string; icon: string }> = [
  { id: 'property', label: 'Property', icon: '🏠' },
  { id: 'assets', label: 'Company Assets', icon: '📦' },
]

const PROPERTY_CATEGORIES: Array<{ key: PropertyCategory; icon: string; accent: string; desc: string }> = [
  { key: 'Residential', icon: '🏠', accent: '#16A34A', desc: 'houses, flats, rooms' },
  { key: 'Vehicles', icon: '🚐', accent: '#F59E0B', desc: 'van, car, etc' },
  { key: 'Storage', icon: '📦', accent: '#06B6D4', desc: 'storage units, lock-ups' },
  { key: 'Commercial', icon: '🏢', accent: '#A855F7', desc: 'offices, workspaces' },
]

const ASSET_CATEGORIES: Array<{ key: AssetCategory; icon: string; accent: string; desc: string }> = [
  { key: 'Bar Equipment', icon: '🍸', accent: '#F59E0B', desc: 'fridges, taps, ice machines, blenders' },
  { key: 'Furniture', icon: '🪑', accent: '#B45309', desc: 'tables, chairs, bars, shelving' },
  { key: 'Glassware', icon: '🥃', accent: '#14B8A6', desc: 'glasses, cocktail sets, shakers' },
  { key: 'Tech', icon: '📱', accent: '#06B6D4', desc: 'laptops, tablets, POS systems, cables' },
  { key: 'Uniforms & Branding', icon: '👕', accent: '#EC4899', desc: 'shirts, banners, signage' },
  { key: 'Consumables', icon: '📋', accent: '#22C55E', desc: 'stock that gets used up' },
  { key: 'Other', icon: '📦', accent: '#94A3B8', desc: 'miscellaneous assets' },
]

const COMPANIES: Array<{ id: CompanyKey; label: string; icon: string; color: string }> = [
  { id: 'bar-people', label: 'The Bar People', icon: '🍺', color: '#F59E0B' },
  { id: 'anyvendor', label: 'AnyVendor', icon: '🛒', color: '#A855F7' },
  { id: 'anyos', label: 'AnyOS', icon: '💻', color: '#06B6D4' },
]

const PROPERTY_TYPES: Array<{ value: PropertyType; label: string; category: PropertyCategory }> = [
  { value: 'house', label: 'House', category: 'Residential' },
  { value: 'flat', label: 'Flat', category: 'Residential' },
  { value: 'room', label: 'Room', category: 'Residential' },
  { value: 'vehicle', label: 'Vehicle', category: 'Vehicles' },
  { value: 'storage', label: 'Storage', category: 'Storage' },
  { value: 'commercial', label: 'Commercial', category: 'Commercial' },
]

const PROPERTY_STATUS_COLORS: Record<PropertyStatus, string> = {
  owned: '#22C55E',
  rented: '#F59E0B',
  leased: '#A855F7',
}

const CONDITION_COLORS: Record<AssetCondition, string> = {
  new: '#22C55E',
  good: '#06B6D4',
  fair: '#F59E0B',
  poor: '#EF4444',
}

const DEFAULT_PROPERTIES: PropertyItem[] = [
  {
    id: 'prop-1',
    name: "Jake's Van",
    category: 'Vehicles',
    type: 'vehicle',
    status: 'owned',
    address: 'Manchester',
    notes: 'Bar People delivery van',
    keyDates: 'MOT: 2026-08-10, Insurance renewal: 2026-06-01',
  },
  {
    id: 'prop-2',
    name: 'Storage Unit #4',
    category: 'Storage',
    type: 'storage',
    status: 'rented',
    address: 'Trafford Park, Manchester',
    monthlyCost: 150,
    notes: '',
    keyDates: 'Lease end: 2026-11-30',
  },
]

const DEFAULT_ASSETS: AssetItem[] = [
  {
    id: 'asset-1',
    name: 'Portable Fridge',
    quantity: 3,
    company: 'bar-people',
    category: 'Bar Equipment',
    condition: 'good',
    location: 'Van',
    valuePerUnit: 450,
    notes: '',
  },
  {
    id: 'asset-2',
    name: 'Cocktail Shaker Set',
    quantity: 5,
    company: 'bar-people',
    category: 'Glassware',
    condition: 'good',
    location: 'Storage Unit',
    valuePerUnit: 25,
    notes: '',
  },
  {
    id: 'asset-3',
    name: 'Black Tablecloths',
    quantity: 20,
    company: 'bar-people',
    category: 'Furniture',
    condition: 'fair',
    location: 'Storage Unit',
    valuePerUnit: 15,
    notes: '',
  },
  {
    id: 'asset-4',
    name: 'Staff Polo Shirts',
    quantity: 10,
    company: 'bar-people',
    category: 'Uniforms & Branding',
    condition: 'good',
    location: 'Storage Unit',
    valuePerUnit: 20,
    notes: '',
  },
  {
    id: 'asset-5',
    name: 'iPad POS',
    quantity: 2,
    company: 'bar-people',
    category: 'Tech',
    condition: 'good',
    location: 'Office',
    valuePerUnit: 350,
    notes: '',
  },
]

interface PropertyFormData {
  name: string
  type: PropertyType
  status: PropertyStatus
  address: string
  monthlyCost: string
  notes: string
  keyDates: string
}

interface AssetFormData {
  name: string
  quantity: string
  company: CompanyKey
  category: AssetCategory
  condition: AssetCondition
  location: string
  valuePerUnit: string
  notes: string
}

function formatMoney(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 px-4 py-8"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        onClick={(event) => event.stopPropagation()}
        className="max-w-2xl mx-auto card rounded-2xl p-4 md:p-5"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--c-text)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-lg text-sm"
            style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}
          >
            Close
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

export default function PropertyTab() {
  const [activeSubTab, setActiveSubTab] = useState<PropertySubTab>('property')
  const [propertyItems, setPropertyItems] = useState<PropertyItem[]>(DEFAULT_PROPERTIES)
  const [assetItems, setAssetItems] = useState<AssetItem[]>(DEFAULT_ASSETS)
  const [openPropertyCategories, setOpenPropertyCategories] = useState<Record<PropertyCategory, boolean>>({
    Residential: false,
    Vehicles: false,
    Storage: false,
    Commercial: false,
  })
  const [openAssetCategories, setOpenAssetCategories] = useState<Record<AssetCategory, boolean>>({
    'Bar Equipment': false,
    Furniture: false,
    Glassware: false,
    Tech: false,
    'Uniforms & Branding': false,
    Consumables: false,
    Other: false,
  })
  const [companyFilter, setCompanyFilter] = useState<'all' | CompanyKey>('all')
  const [assetSearch, setAssetSearch] = useState('')
  const [showPropertyModal, setShowPropertyModal] = useState(false)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [propertyForm, setPropertyForm] = useState<PropertyFormData>({
    name: '',
    type: 'house',
    status: 'owned',
    address: '',
    monthlyCost: '',
    notes: '',
    keyDates: '',
  })
  const [assetForm, setAssetForm] = useState<AssetFormData>({
    name: '',
    quantity: '1',
    company: 'bar-people',
    category: 'Other',
    condition: 'good',
    location: '',
    valuePerUnit: '',
    notes: '',
  })

  const assetsFiltered = useMemo(() => {
    const q = assetSearch.trim().toLowerCase()
    return assetItems.filter((item) => {
      const matchesCompany = companyFilter === 'all' || item.company === companyFilter
      if (!matchesCompany) return false
      if (!q) return true

      const companyName = COMPANIES.find((company) => company.id === item.company)?.label ?? ''
      const text = `${item.name} ${item.category} ${companyName} ${item.location}`.toLowerCase()
      return text.includes(q)
    })
  }, [assetItems, assetSearch, companyFilter])

  const summary = useMemo(() => {
    const totalItems = assetsFiltered.reduce((sum, item) => sum + item.quantity, 0)
    const totalValue = assetsFiltered.reduce((sum, item) => sum + item.quantity * (item.valuePerUnit ?? 0), 0)
    const byCompany = COMPANIES.map((company) => {
      const quantity = assetsFiltered
        .filter((item) => item.company === company.id)
        .reduce((sum, item) => sum + item.quantity, 0)
      return { company, quantity }
    }).filter((entry) => entry.quantity > 0)

    return { totalItems, totalValue, byCompany }
  }, [assetsFiltered])

  function togglePropertyCategory(category: PropertyCategory) {
    setOpenPropertyCategories((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  function toggleAssetCategory(category: AssetCategory) {
    setOpenAssetCategories((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  function saveProperty() {
    if (!propertyForm.name.trim()) return

    const typeDef = PROPERTY_TYPES.find((type) => type.value === propertyForm.type)
    const monthlyCost = propertyForm.monthlyCost.trim() ? Number(propertyForm.monthlyCost) : undefined

    const nextItem: PropertyItem = {
      id: `prop-${Date.now()}`,
      name: propertyForm.name.trim(),
      type: propertyForm.type,
      category: typeDef?.category ?? 'Commercial',
      status: propertyForm.status,
      address: propertyForm.address.trim(),
      monthlyCost: Number.isFinite(monthlyCost) ? monthlyCost : undefined,
      notes: propertyForm.notes.trim(),
      keyDates: propertyForm.keyDates.trim(),
    }

    setPropertyItems((prev) => [nextItem, ...prev])
    setPropertyForm({
      name: '',
      type: 'house',
      status: 'owned',
      address: '',
      monthlyCost: '',
      notes: '',
      keyDates: '',
    })
    setShowPropertyModal(false)
  }

  function saveAsset() {
    if (!assetForm.name.trim()) return

    const quantity = Number(assetForm.quantity)
    const valuePerUnit = assetForm.valuePerUnit.trim() ? Number(assetForm.valuePerUnit) : undefined

    const nextItem: AssetItem = {
      id: `asset-${Date.now()}`,
      name: assetForm.name.trim(),
      quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
      company: assetForm.company,
      category: assetForm.category,
      condition: assetForm.condition,
      location: assetForm.location.trim(),
      valuePerUnit: Number.isFinite(valuePerUnit) ? valuePerUnit : undefined,
      notes: assetForm.notes.trim(),
    }

    setAssetItems((prev) => [nextItem, ...prev])
    setAssetForm({
      name: '',
      quantity: '1',
      company: 'bar-people',
      category: 'Other',
      condition: 'good',
      location: '',
      valuePerUnit: '',
      notes: '',
    })
    setShowAssetModal(false)
  }

  function updateAssetQuantity(id: string, nextValue: string) {
    const parsed = Number(nextValue)
    const quantity = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
    setAssetItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Property & Assets</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>Your properties, vehicles, company stock and equipment inventory</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {PROPERTY_SUB_TABS.map((tab) => {
            const active = activeSubTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className="rounded-lg px-3 py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
                style={{
                  background: active ? 'rgba(255,215,0,0.12)' : 'var(--c-surface)',
                  border: `1px solid ${active ? 'rgba(255,215,0,0.35)' : 'var(--c-border)'}`,
                  color: active ? '#FFD700' : 'var(--c-muted)',
                }}
              >
                <span>{tab.icon}</span>
                <span className="font-semibold">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {activeSubTab === 'property' ? (
          <div>
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={() => setShowPropertyModal(true)}
                className="px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ background: '#FFD700', color: '#000' }}
              >
                + Add Property
              </button>
            </div>

            <div className="space-y-3">
              {PROPERTY_CATEGORIES.map((category) => {
                const items = propertyItems.filter((item) => item.category === category.key)
                const open = openPropertyCategories[category.key]
                return (
                  <section
                    key={category.key}
                    className="rounded-2xl overflow-hidden"
                    style={{ border: `1px solid ${category.accent}40`, background: 'var(--c-surface)' }}
                  >
                    <button
                      onClick={() => togglePropertyCategory(category.key)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left"
                      style={{ background: 'var(--c-panel)' }}
                    >
                      <div>
                        <div className="text-sm font-semibold" style={{ color: category.accent }}>{category.icon} {category.key}</div>
                        <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{category.desc}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{items.length}</span>
                        <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{open ? 'Hide' : 'Show'}</span>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 md:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {items.length === 0 ? (
                              <div className="text-sm" style={{ color: 'var(--c-muted)' }}>No items in this category.</div>
                            ) : (
                              items.map((item, index) => (
                                <motion.article
                                  key={item.id}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  className="rounded-xl p-3 transition-all"
                                  style={{ border: '1px solid var(--c-border)', background: 'var(--c-panel)' }}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>{item.name}</h3>
                                      <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{item.address || 'No address provided'}</div>
                                    </div>
                                    <span className="text-[10px] px-2 py-1 rounded-full uppercase" style={{ background: `${category.accent}20`, color: category.accent }}>{item.type}</span>
                                  </div>

                                  <div className="mt-2 flex items-center flex-wrap gap-2">
                                    <span className="text-[10px] px-2 py-1 rounded-full uppercase" style={{ background: `${PROPERTY_STATUS_COLORS[item.status]}20`, color: PROPERTY_STATUS_COLORS[item.status] }}>{item.status}</span>
                                    {typeof item.monthlyCost === 'number' && (
                                      <span className="text-xs" style={{ color: 'var(--c-text)' }}>{formatMoney(item.monthlyCost)}/month</span>
                                    )}
                                  </div>

                                  <div className="mt-2 text-xs" style={{ color: 'var(--c-muted)' }}>
                                    <span style={{ color: 'var(--c-text-2)' }}>Notes:</span> {item.notes || '—'}
                                  </div>
                                  <div className="mt-1 text-xs" style={{ color: 'var(--c-muted)' }}>
                                    <span style={{ color: 'var(--c-text-2)' }}>Key dates:</span> {item.keyDates || '—'}
                                  </div>
                                </motion.article>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                )
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 mb-4">
              <div className="card rounded-2xl p-4">
                <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>Stock List Summary</div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs" style={{ color: 'var(--c-muted)' }}>Total items</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--c-text)' }}>{summary.totalItems}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: 'var(--c-muted)' }}>Total estimated value</div>
                    <div className="text-xl font-bold" style={{ color: '#FFD700' }}>{formatMoney(summary.totalValue)}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: 'var(--c-muted)' }}>By company</div>
                    <div className="text-xs mt-1 space-y-1">
                      {summary.byCompany.length === 0 ? (
                        <div style={{ color: 'var(--c-muted)' }}>No matching items</div>
                      ) : (
                        summary.byCompany.map((entry) => (
                          <div key={entry.company.id} style={{ color: entry.company.color }}>{entry.company.label}: {entry.quantity}</div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end lg:justify-start">
                <button
                  onClick={() => setShowAssetModal(true)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: '#FFD700', color: '#000' }}
                >
                  + Add Asset
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <input
                value={assetSearch}
                onChange={(event) => setAssetSearch(event.target.value)}
                placeholder="Search assets by name, category, company, or location..."
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCompanyFilter('all')}
                  className="px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{
                    background: companyFilter === 'all' ? 'rgba(255,215,0,0.14)' : 'var(--c-panel)',
                    border: `1px solid ${companyFilter === 'all' ? 'rgba(255,215,0,0.35)' : 'var(--c-border)'}`,
                    color: companyFilter === 'all' ? '#FFD700' : 'var(--c-muted)',
                  }}
                >
                  All
                </button>
                {COMPANIES.map((company) => {
                  const active = companyFilter === company.id
                  return (
                    <button
                      key={company.id}
                      onClick={() => setCompanyFilter(company.id)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold"
                      style={{
                        background: active ? `${company.color}20` : 'var(--c-panel)',
                        border: `1px solid ${active ? `${company.color}66` : 'var(--c-border)'}`,
                        color: active ? company.color : 'var(--c-muted)',
                      }}
                    >
                      {company.icon} {company.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              {ASSET_CATEGORIES.map((category) => {
                const items = assetsFiltered.filter((asset) => asset.category === category.key)
                const open = openAssetCategories[category.key]
                return (
                  <section
                    key={category.key}
                    className="rounded-2xl overflow-hidden"
                    style={{ border: `1px solid ${category.accent}40`, background: 'var(--c-surface)' }}
                  >
                    <button
                      onClick={() => toggleAssetCategory(category.key)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left"
                      style={{ background: 'var(--c-panel)' }}
                    >
                      <div>
                        <div className="text-sm font-semibold" style={{ color: category.accent }}>{category.icon} {category.key}</div>
                        <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{category.desc}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{items.length}</span>
                        <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{open ? 'Hide' : 'Show'}</span>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 md:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {items.length === 0 ? (
                              <div className="text-sm" style={{ color: 'var(--c-muted)' }}>No matching assets in this category.</div>
                            ) : (
                              items.map((item, index) => {
                                const company = COMPANIES.find((entry) => entry.id === item.company)
                                const accent = company?.color || '#94A3B8'
                                const totalValue = item.quantity * (item.valuePerUnit ?? 0)
                                return (
                                  <motion.article
                                    key={item.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="rounded-xl p-3 transition-all hover:translate-y-[-1px]"
                                    style={{ border: '1px solid var(--c-border)', background: 'var(--c-panel)' }}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>{item.name}</h3>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                          <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: `${accent}22`, color: accent }}>{company?.label || 'Unknown'}</span>
                                          <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: `${CONDITION_COLORS[item.condition]}20`, color: CONDITION_COLORS[item.condition] }}>{item.condition}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <label className="text-[11px]" style={{ color: 'var(--c-muted)' }}>Qty</label>
                                        <input
                                          type="number"
                                          min={0}
                                          value={item.quantity}
                                          onChange={(event) => updateAssetQuantity(item.id, event.target.value)}
                                          className="w-16 rounded-md px-2 py-1 text-xs"
                                          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                                        />
                                      </div>
                                    </div>

                                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                      <div style={{ color: 'var(--c-muted)' }}><span style={{ color: 'var(--c-text-2)' }}>Category:</span> {item.category}</div>
                                      <div style={{ color: 'var(--c-muted)' }}><span style={{ color: 'var(--c-text-2)' }}>Location:</span> {item.location || '—'}</div>
                                      <div style={{ color: 'var(--c-muted)' }}><span style={{ color: 'var(--c-text-2)' }}>Value each:</span> {formatMoney(item.valuePerUnit)}</div>
                                      <div style={{ color: 'var(--c-muted)' }}><span style={{ color: 'var(--c-text-2)' }}>Est. total:</span> {formatMoney(totalValue)}</div>
                                    </div>
                                    <div className="mt-2 text-xs" style={{ color: 'var(--c-muted)' }}>
                                      <span style={{ color: 'var(--c-text-2)' }}>Notes:</span> {item.notes || '—'}
                                    </div>
                                  </motion.article>
                                )
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                )
              })}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showPropertyModal && (
            <ModalShell title="Add Property" onClose={() => setShowPropertyModal(false)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={propertyForm.name}
                  onChange={(event) => setPropertyForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm md:col-span-2"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Name"
                />
                <select
                  value={propertyForm.type}
                  onChange={(event) => setPropertyForm((prev) => ({ ...prev, type: event.target.value as PropertyType }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                >
                  {PROPERTY_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <select
                  value={propertyForm.status}
                  onChange={(event) => setPropertyForm((prev) => ({ ...prev, status: event.target.value as PropertyStatus }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                >
                  <option value="owned">Owned</option>
                  <option value="rented">Rented</option>
                  <option value="leased">Leased</option>
                </select>
                <input
                  value={propertyForm.address}
                  onChange={(event) => setPropertyForm((prev) => ({ ...prev, address: event.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm md:col-span-2"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Address"
                />
                <input
                  value={propertyForm.monthlyCost}
                  onChange={(event) => setPropertyForm((prev) => ({ ...prev, monthlyCost: event.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Monthly cost (£)"
                />
                <input
                  value={propertyForm.keyDates}
                  onChange={(event) => setPropertyForm((prev) => ({ ...prev, keyDates: event.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Key dates"
                />
                <textarea
                  value={propertyForm.notes}
                  onChange={(event) => setPropertyForm((prev) => ({ ...prev, notes: event.target.value }))}
                  rows={3}
                  className="rounded-lg px-3 py-2 text-sm md:col-span-2"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Notes"
                />
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={() => setShowPropertyModal(false)} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}>Cancel</button>
                <button onClick={saveProperty} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: '#FFD700', color: '#000' }}>Save</button>
              </div>
            </ModalShell>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAssetModal && (
            <ModalShell title="Add Asset" onClose={() => setShowAssetModal(false)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={assetForm.name}
                  onChange={(event) => setAssetForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm md:col-span-2"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Item name"
                />
                <input
                  value={assetForm.quantity}
                  onChange={(event) => setAssetForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Quantity"
                  type="number"
                  min={1}
                />
                <select
                  value={assetForm.company}
                  onChange={(event) => setAssetForm((prev) => ({ ...prev, company: event.target.value as CompanyKey }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                >
                  {COMPANIES.map((company) => (
                    <option key={company.id} value={company.id}>{company.label}</option>
                  ))}
                </select>
                <select
                  value={assetForm.category}
                  onChange={(event) => setAssetForm((prev) => ({ ...prev, category: event.target.value as AssetCategory }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                >
                  {ASSET_CATEGORIES.map((category) => (
                    <option key={category.key} value={category.key}>{category.key}</option>
                  ))}
                </select>
                <select
                  value={assetForm.condition}
                  onChange={(event) => setAssetForm((prev) => ({ ...prev, condition: event.target.value as AssetCondition }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
                <input
                  value={assetForm.location}
                  onChange={(event) => setAssetForm((prev) => ({ ...prev, location: event.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Location"
                />
                <input
                  value={assetForm.valuePerUnit}
                  onChange={(event) => setAssetForm((prev) => ({ ...prev, valuePerUnit: event.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Value per unit (£)"
                  type="number"
                  min={0}
                />
                <textarea
                  value={assetForm.notes}
                  onChange={(event) => setAssetForm((prev) => ({ ...prev, notes: event.target.value }))}
                  rows={3}
                  className="rounded-lg px-3 py-2 text-sm md:col-span-2"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  placeholder="Notes"
                />
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={() => setShowAssetModal(false)} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}>Cancel</button>
                <button onClick={saveAsset} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: '#FFD700', color: '#000' }}>Save</button>
              </div>
            </ModalShell>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
