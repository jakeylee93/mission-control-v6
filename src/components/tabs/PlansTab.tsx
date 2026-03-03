'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, type Plan } from '@/lib/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'mission-control', label: 'Mission Control', icon: '🎛️', color: '#FFD700' },
  { id: 'companies',       label: 'Companies',        icon: '🏢', color: '#A855F7' },
  { id: 'personal',        label: 'Personal',         icon: '👤', color: '#16A34A' },
  { id: 'finance',         label: 'Finance',          icon: '💰', color: '#22C55E' },
  { id: 'relationships',   label: 'Relationships',    icon: '🤝', color: '#F59E0B' },
  { id: 'lifestyle',       label: 'Lifestyle',        icon: '🌿', color: '#FF6B6B' },
  { id: 'future',          label: 'Future',           icon: '🚀', color: '#60A5FA' },
] as const

type CategoryId = typeof CATEGORIES[number]['id']

const VENTURES = [
  { name: 'The Bar People',  icon: '🍺', color: '#F59E0B' },
  { name: 'AnyVendor',       icon: '🛒', color: '#A855F7' },
  { name: 'Future Climbing', icon: '🧗', color: '#22C55E' },
  { name: 'Margarita AI',    icon: '🤖', color: '#FFD700' },
  { name: 'Bar People Honey',icon: '🍯', color: '#F97316' },
  { name: 'Safety Device',   icon: '🛡️', color: '#60A5FA' },
  { name: 'Butterfly App',   icon: '🦋', color: '#FF6B6B' },
]

const STATUSES = ['not-started', 'in-progress', 'done', 'blocked'] as const
const PRIORITIES = ['high', 'medium', 'low'] as const

// ─── Subcategory logic ────────────────────────────────────────────────────────

interface Subcategory {
  id: string
  label: string
  plans: Plan[]
  color: string
  icon: string
}

function getSubcategories(categoryId: CategoryId, plans: Plan[]): Subcategory[] {
  if (categoryId === 'companies') {
    const order = VENTURES.map((v) => v.name)
    const groups: Record<string, Plan[]> = {}
    for (const plan of plans) {
      const key = plan.company || 'Other'
      if (!groups[key]) groups[key] = []
      groups[key].push(plan)
    }
    return Object.entries(groups)
      .sort(([a], [b]) => {
        const ia = order.indexOf(a)
        const ib = order.indexOf(b)
        if (ia === -1 && ib === -1) return a.localeCompare(b)
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      })
      .map(([name, plans]) => {
        const venture = VENTURES.find((v) => v.name === name)
        return {
          id: name,
          label: name,
          plans,
          color: venture?.color || '#666',
          icon: venture?.icon || '🏢',
        }
      })
  }

  // Status-based subcategories for all other categories
  const sections: Subcategory[] = [
    { id: 'in-progress', label: 'In Progress', plans: plans.filter((p) => p.status === 'in-progress'), color: '#A855F7', icon: '⚡' },
    { id: 'not-started', label: 'Up Next',     plans: plans.filter((p) => p.status === 'not-started'), color: '#FFD700', icon: '📋' },
    { id: 'blocked',     label: 'Blocked',     plans: plans.filter((p) => p.status === 'blocked'),     color: '#EF4444', icon: '🚫' },
    { id: 'done',        label: 'Done',        plans: plans.filter((p) => p.status === 'done'),        color: '#22C55E', icon: '✅' },
  ]
  return sections.filter((s) => s.plans.length > 0)
}

// ─── Priority Badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority?: string }) {
  const cfg: Record<string, { color: string; dot: string; label: string }> = {
    high:   { color: '#EF4444', dot: '#EF4444', label: 'HIGH' },
    medium: { color: '#F59E0B', dot: '#F59E0B', label: 'MED' },
    low:    { color: 'var(--c-muted)', dot: 'var(--c-dim)', label: 'LOW' },
  }
  const c = cfg[priority || 'low']
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ color: c.color, background: c.color + '15', border: `1px solid ${c.color}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      {c.label}
    </span>
  )
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const cfg: Record<string, { color: string; pulse: boolean }> = {
    'not-started': { color: 'var(--c-dim)',  pulse: false },
    'in-progress': { color: '#A855F7',       pulse: true  },
    'done':        { color: '#22C55E',       pulse: false },
    'blocked':     { color: '#EF4444',       pulse: false },
  }
  const c = cfg[status] || cfg['not-started']
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${c.pulse ? 'dot-thinking' : ''}`}
      style={{ background: c.color, boxShadow: c.pulse ? `0 0 6px ${c.color}` : 'none' }}
      title={status}
    />
  )
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: Plan
  category: CategoryId
  onUpdate: (id: string, data: Partial<Plan>) => void
  onDelete: (id: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
  isFirst: boolean
  isLast: boolean
}

function PlanCard({ plan, category, onUpdate, onDelete, onMove, isFirst, isLast }: PlanCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(plan.title)
  const [notes, setNotes] = useState(plan.notes || '')

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    const idx = STATUSES.indexOf(plan.status as typeof STATUSES[number])
    const next = STATUSES[(idx + 1) % STATUSES.length]
    onUpdate(plan.id, { status: next })
  }

  const save = () => {
    onUpdate(plan.id, { title, notes })
    setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Card header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => !editing && setExpanded(!expanded)}
      >
        {/* Status dot (click to cycle) */}
        <button
          onClick={cycleStatus}
          className="shrink-0"
          title={`Status: ${plan.status} — click to cycle`}
        >
          <StatusDot status={plan.status} />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-medium leading-snug truncate"
            style={{
              color: 'var(--c-text)',
              textDecoration: plan.status === 'done' ? 'line-through' : 'none',
              opacity: plan.status === 'done' ? 0.5 : 1,
            }}
          >
            {plan.title}
          </div>
          {plan.company && category !== 'companies' && (
            <div className="text-[10px]" style={{ color: 'var(--c-muted)' }}>{plan.company}</div>
          )}
        </div>

        {/* Priority badge */}
        <PriorityBadge priority={plan.priority} />

        {/* Expand chevron */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--c-dim)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Expanded section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-1 flex flex-col gap-3"
              style={{ borderTop: '1px solid var(--c-border)' }}
            >
              {/* Description */}
              {plan.description && !editing && (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-2)' }}>
                  {plan.description}
                </p>
              )}

              {/* Notes edit / display */}
              {editing ? (
                <div className="flex flex-col gap-2">
                  <input
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{
                      background: 'var(--c-panel)',
                      border: '1px solid var(--c-border-2)',
                      color: 'var(--c-text)',
                    }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
                    autoFocus
                  />
                  <textarea
                    className="w-full rounded-lg px-3 py-2 text-xs resize-none focus:outline-none"
                    style={{
                      background: 'var(--c-panel)',
                      border: '1px solid var(--c-border-2)',
                      color: 'var(--c-text)',
                    }}
                    rows={3}
                    value={notes}
                    placeholder="Notes..."
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              ) : (
                plan.notes && (
                  <p className="text-xs italic" style={{ color: 'var(--c-muted)' }}>
                    {plan.notes}
                  </p>
                )
              )}

              {/* Action bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {editing ? (
                  <>
                    <button
                      onClick={save}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-[#FFD700] text-black"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
                    >
                      Edit
                    </button>

                    <select
                      className="text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                      style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}
                      value={plan.priority || 'medium'}
                      onChange={(e) => onUpdate(plan.id, { priority: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>

                    {/* Up/Down reorder */}
                    <div className="flex gap-1 ml-auto">
                      {!isFirst && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onMove(plan.id, 'up') }}
                          className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                          style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
                          title="Move up"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                            <path d="M18 15l-6-6-6 6" />
                          </svg>
                        </button>
                      )}
                      {!isLast && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onMove(plan.id, 'down') }}
                          className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                          style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
                          title="Move down"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(plan.id) }}
                        className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                        style={{ background: 'var(--c-panel)', color: 'var(--c-dim)', border: '1px solid var(--c-border)' }}
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Subcategory Section ──────────────────────────────────────────────────────

interface SubcategorySectionProps {
  sub: Subcategory
  category: CategoryId
  defaultOpen: boolean
  onUpdate: (id: string, data: Partial<Plan>) => void
  onDelete: (id: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
}

function SubcategorySection({ sub, category, defaultOpen, onUpdate, onDelete, onMove }: SubcategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const doneCount = sub.plans.filter((p) => p.status === 'done').length
  const activeCount = sub.plans.filter((p) => p.status === 'in-progress').length

  return (
    <div className="subcategory-section mb-3">
      {/* Section Header */}
      <div
        className="subcategory-header"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">{sub.icon}</span>
          <span className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>
            {sub.label}
          </span>
          {activeCount > 0 && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: '#A855F730', color: '#A855F7' }}
            >
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: sub.color + '18', color: sub.color }}
          >
            {sub.plans.length}
          </span>
          {sub.plans.length > 0 && (
            <div className="flex gap-0.5">
              {sub.plans.slice(0, 5).map((p) => (
                <StatusDot key={p.id} status={p.status} />
              ))}
            </div>
          )}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4 transition-transform duration-200"
            style={{
              color: 'var(--c-muted)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Plans list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {sub.plans.map((plan, idx) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    category={category}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onMove={onMove}
                    isFirst={idx === 0}
                    isLast={idx === sub.plans.length - 1}
                  />
                ))}
              </AnimatePresence>
              {sub.plans.length === 0 && (
                <div className="text-center py-4 text-xs" style={{ color: 'var(--c-muted)' }}>
                  No plans here
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Quick Add Form ───────────────────────────────────────────────────────────

interface AddPlanFormProps {
  category: CategoryId
  onAdd: (plan: Partial<Plan>) => void
  onClose: () => void
}

function AddPlanForm({ category, onAdd, onClose }: AddPlanFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [company, setCompany] = useState('')

  const submit = () => {
    if (!title.trim()) return
    onAdd({ title: title.trim(), priority, status: 'not-started', company: company || undefined })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      className="rounded-2xl p-4 mb-4"
      style={{
        background: 'var(--c-surface)',
        border: '1px solid #A855F730',
        boxShadow: '0 0 24px rgba(168,85,247,0.1)',
      }}
    >
      <div className="flex flex-col gap-3">
        <input
          autoFocus
          className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={{
            background: 'var(--c-panel)',
            border: '1px solid var(--c-border-2)',
            color: 'var(--c-text)',
          }}
          placeholder="Plan title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose() }}
        />
        <div className="flex gap-2">
          <select
            className="rounded-xl px-2.5 py-2 text-xs flex-1 focus:outline-none"
            style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITIES.map((p) => <option key={p} value={p}>{p} priority</option>)}
          </select>
          {category === 'companies' && (
            <select
              className="rounded-xl px-2.5 py-2 text-xs flex-1 focus:outline-none"
              style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            >
              <option value="">Select venture...</option>
              {VENTURES.map((v) => <option key={v.name} value={v.name}>{v.icon} {v.name}</option>)}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={submit}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#FFD700] text-black hover:bg-[#FFD700]/90 transition-colors"
          >
            Add Plan
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm transition-colors"
            style={{ background: 'var(--c-panel)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main PlansTab ────────────────────────────────────────────────────────────

export default function PlansTab() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('companies')
  const [allPlans, setAllPlans] = useState<Record<string, Plan[]>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const data = await api.categories()
    setAllPlans(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const plans = allPlans[activeCategory] || []
  const subcategories = getSubcategories(activeCategory, plans)
  const cat = CATEGORIES.find((c) => c.id === activeCategory)!
  const activeCount = plans.filter((p) => p.status === 'in-progress').length

  const handleAdd = async (plan: Partial<Plan>) => {
    const added = await api.addPlan(activeCategory, plan as Omit<Plan, 'id'>)
    setAllPlans((prev) => ({ ...prev, [activeCategory]: [...(prev[activeCategory] || []), added] }))
  }

  const handleUpdate = async (id: string, data: Partial<Plan>) => {
    await api.updatePlan(activeCategory, id, data)
    setAllPlans((prev) => ({
      ...prev,
      [activeCategory]: (prev[activeCategory] || []).map((p) => (p.id === id ? { ...p, ...data } : p)),
    }))
  }

  const handleDelete = async (id: string) => {
    await api.deletePlan(activeCategory, id)
    setAllPlans((prev) => ({
      ...prev,
      [activeCategory]: (prev[activeCategory] || []).filter((p) => p.id !== id),
    }))
  }

  const handleMove = (id: string, direction: 'up' | 'down') => {
    setAllPlans((prev) => {
      const list = [...(prev[activeCategory] || [])]
      const idx = list.findIndex((p) => p.id === id)
      if (idx === -1) return prev
      const target = direction === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= list.length) return prev;
      [list[idx], list[target]] = [list[target], list[idx]]
      return { ...prev, [activeCategory]: list }
    })
  }

  return (
    <div className="h-[calc(100vh-116px)] flex flex-col">
      {/* ── Category Pills ── */}
      <div
        className="shrink-0 px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid var(--c-border)' }}
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {CATEGORIES.map((c) => {
            const count = (allPlans[c.id] || []).length
            const isActive = activeCategory === c.id
            return (
              <button
                key={c.id}
                onClick={() => { setActiveCategory(c.id); setShowAdd(false) }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap transition-all duration-150 shrink-0"
                style={{
                  background: isActive ? c.color : 'var(--c-panel)',
                  color: isActive ? (c.color === '#FFD700' ? '#000' : '#fff') : 'var(--c-muted)',
                  border: `1px solid ${isActive ? c.color : 'var(--c-border)'}`,
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '12px',
                }}
              >
                <span className="text-sm leading-none">{c.icon}</span>
                <span>{c.label}</span>
                {count > 0 && (
                  <span
                    className="text-[10px] font-bold ml-0.5 px-1.5 rounded-full"
                    style={{
                      background: isActive ? 'rgba(0,0,0,0.2)' : 'var(--c-border)',
                      color: isActive ? (c.color === '#FFD700' ? '#000' : '#fff') : 'var(--c-muted)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 max-w-[900px] mx-auto">
          {/* Category header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: cat.color, fontFamily: 'var(--font-heading)' }}
              >
                {cat.icon} {cat.label}
              </h1>
              <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                {plans.length} plans
                {activeCount > 0 && (
                  <> · <span style={{ color: '#A855F7' }}>{activeCount} in progress</span></>
                )}
              </div>
            </div>

            {/* Quick Add button — always visible */}
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
              style={{
                background: showAdd ? 'var(--c-panel)' : '#FFD700',
                color: showAdd ? 'var(--c-muted)' : '#000',
                border: showAdd ? '1px solid var(--c-border)' : 'none',
              }}
            >
              <span className="text-base leading-none">{showAdd ? '✕' : '+'}</span>
              <span className="hidden sm:inline">{showAdd ? 'Cancel' : 'Add Plan'}</span>
            </button>
          </div>

          {/* Add form */}
          <AnimatePresence>
            {showAdd && (
              <AddPlanForm
                category={activeCategory}
                onAdd={handleAdd}
                onClose={() => setShowAdd(false)}
              />
            )}
          </AnimatePresence>

          {/* Subcategory sections */}
          {loading ? (
            <div className="text-center py-16 text-sm" style={{ color: 'var(--c-muted)' }}>
              Loading plans...
            </div>
          ) : subcategories.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">{cat.icon}</div>
              <div className="text-lg font-semibold mb-1" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-heading)' }}>
                No plans yet
              </div>
              <div className="text-sm mb-6" style={{ color: 'var(--c-muted)' }}>
                Start building your {cat.label} roadmap
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#FFD700] text-black"
              >
                Add first plan
              </button>
            </div>
          ) : (
            subcategories.map((sub, idx) => (
              <SubcategorySection
                key={sub.id}
                sub={sub}
                category={activeCategory}
                defaultOpen={idx === 0 || sub.id === 'in-progress'}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onMove={handleMove}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
