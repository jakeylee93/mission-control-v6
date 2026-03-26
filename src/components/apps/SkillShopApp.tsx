'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Skill {
  id: string
  slug: string
  display_name: string
  summary: string | null
  category: string
  is_favorite: boolean
  marg_rating: number | null
  marg_notes: string | null
  source: string
  updated_at: string
  cached_at: string
}

interface QueueItem {
  id: string
  slug: string
  display_name: string | null
  summary: string | null
  user_note: string | null
  status: string
  created_at: string
  acknowledged_at: string | null
}

interface SearchResult {
  score: number
  slug: string
  displayName: string
  summary: string
  version: string
  updatedAt: string
}

type Section = 'discover' | 'saved' | 'queue' | 'search'

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const Icons = {
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  briefcase: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  ),
  refresh: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  wrench: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  grid: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  heart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  heartFilled: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  hammer: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0a2.12 2.12 0 0 1 0-3L12 9" /><path d="M17.64 15L22 10.64" /><path d="M20.35 6.35L17.64 9.06A1.5 1.5 0 0 1 15.5 7l2.72-2.72c.63-.63.19-1.72-.72-1.72H13a2 2 0 0 0-2 2v.17" />
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  back: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  star: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  externalLink: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  crab: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14c-3 0-5-2-5-5s2-4 5-4 5 1 5 4-2 5-5 5z" />
      <path d="M7 9L3 6M17 9l4 6M7 12l-3 4M17 12l3 4" />
      <path d="M9 14l-1 4M15 14l1 4" />
      <path d="M10 5l-2-3M14 5l2-3" />
    </svg>
  ),
  chevronDown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  chevronUp: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
}

const CategoryIcons: Record<string, React.ReactNode> = {
  recommended: Icons.target,
  business: Icons.briefcase,
  automation: Icons.refresh,
  communication: Icons.chat,
  'dev-tools': Icons.wrench,
  productivity: Icons.clock,
  other: Icons.grid,
}

const CategoryLabels: Record<string, string> = {
  recommended: 'Recommended',
  business: 'Business',
  automation: 'Automation',
  communication: 'Communication',
  'dev-tools': 'Dev Tools',
  productivity: 'Productivity',
  other: 'Other',
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: 'rgba(20,15,35,0.92)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: '10px 20px',
      color: '#F0EEE8',
      fontSize: 13,
      backdropFilter: 'blur(12px)',
      animation: 'ssSlideUp 0.25s ease',
      whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: 16,
      animation: 'ssShimmer 1.5s ease infinite',
    }}>
      <div style={{ height: 10, width: 80, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 10 }} />
      <div style={{ height: 15, width: '80%', background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 10, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 6 }} />
      <div style={{ height: 10, width: '90%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
    </div>
  )
}

function RowSkeleton() {
  return (
    <div style={{
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      animation: 'ssShimmer 1.5s ease infinite',
    }}>
      <div style={{ width: 20, height: 20, background: 'rgba(255,255,255,0.08)', borderRadius: 4, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 13, width: '60%', background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 10, width: '90%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
      </div>
    </div>
  )
}

// ─── Build This Input ─────────────────────────────────────────────────────────

function BuildThisInput({
  onSubmit,
  onCancel,
}: {
  skill: { slug: string; display_name: string; summary?: string | null }
  onSubmit: (note: string) => Promise<void>
  onCancel: () => void
}) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    await onSubmit(note)
    setLoading(false)
  }

  return (
    <div style={{
      marginTop: 12,
      padding: '12px 0 4px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>
        Add a note for Marg (optional)
      </p>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="e.g. I want this but for my bar business"
        rows={2}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          padding: '8px 10px',
          color: '#F0EEE8',
          fontSize: 13,
          resize: 'none',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            flex: 1,
            padding: '9px 0',
            background: '#f59e0b',
            border: 'none',
            borderRadius: 8,
            color: '#000',
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span style={{ width: 16, height: 16, display: 'flex' }}>{Icons.hammer}</span>
          Add to Build Queue
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '9px 14px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            color: '#888',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Skill Card (horizontal scroll) ──────────────────────────────────────────

function SkillCard({
  skill,
  queued,
  onFavorite,
  onTap,
}: {
  skill: Skill
  queued: boolean
  onFavorite: (slug: string, val: boolean) => void
  onTap: (skill: Skill) => void
}) {
  return (
    <div
      onClick={() => onTap(skill)}
      style={{
        width: 280,
        flexShrink: 0,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: 16,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ color: '#6366f1', width: 16, height: 16, display: 'flex' }}>
          {CategoryIcons[skill.category] || Icons.grid}
        </span>
        <span style={{ fontSize: 10, color: '#555', letterSpacing: '0.02em' }}>
          ClawHub Reference
        </span>
        {queued && (
          <span style={{ marginLeft: 'auto', color: '#f59e0b', width: 14, height: 14, display: 'flex' }}>
            {Icons.hammer}
          </span>
        )}
      </div>

      <p style={{
        fontSize: 15,
        fontWeight: 700,
        color: '#F0EEE8',
        margin: '0 0 8px',
        lineHeight: 1.3,
      }}>
        {skill.display_name}
      </p>

      <p style={{
        fontSize: 12,
        color: '#888',
        margin: '0 0 14px',
        lineHeight: 1.5,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {skill.summary || 'No description available.'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10,
          color: '#818cf8',
          background: 'rgba(99,102,241,0.1)',
          padding: '3px 8px',
          borderRadius: 6,
        }}>
          Reference Only
        </span>
        <button
          onClick={e => { e.stopPropagation(); onFavorite(skill.slug, !skill.is_favorite) }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: skill.is_favorite ? '#ef4444' : '#555',
            padding: 4,
            display: 'flex',
          }}
          aria-label={skill.is_favorite ? 'Remove from saved' : 'Save'}
        >
          {skill.is_favorite ? Icons.heartFilled : Icons.heart}
        </button>
      </div>
    </div>
  )
}

// ─── Skill Row (vertical list) ────────────────────────────────────────────────

type SkillRowSkill = Skill | SearchResult

function SkillRow({
  skill,
  queued,
  onFavorite,
  onBuildSubmit,
  onTap,
}: {
  skill: SkillRowSkill
  queued: boolean
  onFavorite: (slug: string, val: boolean) => void
  onBuildSubmit: (slug: string, displayName: string, summary: string | null, note: string) => Promise<void>
  onTap: (skill: SkillRowSkill) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showBuild, setShowBuild] = useState(false)

  const slug = skill.slug
  const name = 'display_name' in skill ? skill.display_name : (skill as SearchResult).displayName
  const summary = skill.summary ?? null
  const isFav = 'is_favorite' in skill ? (skill as Skill).is_favorite : false
  const category = 'category' in skill ? (skill as Skill).category : 'other'

  const heartSm = isFav
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
        onClick={() => { if (!showBuild) setExpanded(e => !e) }}
      >
        <span style={{ color: '#555', width: 20, height: 20, display: 'flex', flexShrink: 0 }}>
          {CategoryIcons[category] || Icons.grid}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#F0EEE8', margin: 0, lineHeight: 1.3 }}>
            {name}
            {queued && (
              <span style={{ marginLeft: 6, color: '#f59e0b', display: 'inline-flex', verticalAlign: 'middle' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0a2.12 2.12 0 0 1 0-3L12 9" />
                  <path d="M17.64 15L22 10.64M20.35 6.35L17.64 9.06A1.5 1.5 0 0 1 15.5 7l2.72-2.72c.63-.63.19-1.72-.72-1.72H13a2 2 0 0 0-2 2v.17" />
                </svg>
              </span>
            )}
          </p>
          <p style={{ fontSize: 11, color: '#777', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {summary || 'No description'}
          </p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onFavorite(slug, !isFav) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: isFav ? '#ef4444' : '#555', padding: 4, display: 'flex', flexShrink: 0 }}
          aria-label={isFav ? 'Remove from saved' : 'Save'}
        >
          {heartSm}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p style={{ fontSize: 12, color: '#999', lineHeight: 1.6, margin: '12px 0 10px' }}>
            {summary || 'No description available.'}
          </p>
          <p style={{ fontSize: 11, color: '#555', margin: '0 0 12px', fontStyle: 'italic' }}>
            Reference Only — Browse for inspiration, Marg builds custom versions
          </p>

          {!showBuild ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onFavorite(slug, !isFav)}
                style={{
                  flex: 1, padding: '8px 0',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: isFav ? '#ef4444' : '#F0EEE8', fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? '#ef4444' : 'none'} stroke={isFav ? '#ef4444' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {isFav ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={() => setShowBuild(true)}
                style={{
                  flex: 1, padding: '8px 0',
                  background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 8, color: '#f59e0b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <span style={{ width: 16, height: 16, display: 'flex' }}>{Icons.hammer}</span>
                Build This
              </button>
            </div>
          ) : (
            <BuildThisInput
              skill={{ slug, display_name: name, summary }}
              onSubmit={async (note) => {
                await onBuildSubmit(slug, name, summary, note)
                setShowBuild(false)
                setExpanded(false)
              }}
              onCancel={() => setShowBuild(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function DetailSheet({
  skill,
  queued,
  onClose,
  onFavorite,
  onBuildSubmit,
}: {
  skill: SkillRowSkill
  queued: boolean
  onClose: () => void
  onFavorite: (slug: string, val: boolean) => void
  onBuildSubmit: (slug: string, displayName: string, summary: string | null, note: string) => Promise<void>
}) {
  const [showBuild, setShowBuild] = useState(false)

  const slug = skill.slug
  const name = 'display_name' in skill ? skill.display_name : (skill as SearchResult).displayName
  const summary = skill.summary ?? null
  const isFav = 'is_favorite' in skill ? (skill as Skill).is_favorite : false
  const category = 'category' in skill ? (skill as Skill).category : 'other'
  const margRating = 'marg_rating' in skill ? (skill as Skill).marg_rating : null
  const margNotes = 'marg_notes' in skill ? (skill as Skill).marg_notes : null
  const updatedAt = 'updated_at' in skill ? (skill as Skill).updated_at : (skill as SearchResult).updatedAt

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 1000, animation: 'ssFadeIn 0.2s ease',
        }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '80vh',
        background: '#0f0a1e', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px 20px 0 0', zIndex: 1001, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', animation: 'ssSlideUp 0.3s ease',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
        }}>
          <span style={{ color: '#6366f1', width: 20, height: 20, display: 'flex' }}>
            {CategoryIcons[category] || Icons.grid}
          </span>
          <p style={{ flex: 1, fontSize: 16, fontWeight: 700, color: '#F0EEE8', margin: 0 }}>{name}</p>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#888', display: 'flex' }}
          >
            {Icons.close}
          </button>
        </div>

        <div style={{ overflow: 'auto', flex: 1, padding: '16px 20px 32px' }}>
          <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.7, margin: '0 0 20px' }}>
            {summary || 'No description available.'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            <span style={{ fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: 20 }}>
              {CategoryLabels[category] || category}
            </span>
            <span style={{ fontSize: 11, color: '#555', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20 }}>
              ClawHub Reference
            </span>
            {updatedAt && (
              <span style={{ fontSize: 11, color: '#555', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20 }}>
                {new Date(updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {margRating !== null && margRating !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, color: '#f59e0b' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} style={{ opacity: i < margRating ? 1 : 0.2 }}>{Icons.star}</span>
              ))}
              <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>Marg&apos;s rating</span>
            </div>
          )}

          {margNotes && (
            <div style={{
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 20,
            }}>
              <p style={{ fontSize: 11, color: '#818cf8', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Marg says
              </p>
              <p style={{ fontSize: 13, color: '#ccc', margin: 0, lineHeight: 1.6 }}>{margNotes}</p>
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
            <p style={{ fontSize: 11, color: '#555', margin: '0 0 16px', textAlign: 'center', fontStyle: 'italic' }}>
              This is a reference listing. Marg builds secure custom versions of skills you like.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => onFavorite(slug, !isFav)}
                style={{
                  width: '100%', padding: '13px 0',
                  background: isFav ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isFav ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12, color: isFav ? '#ef4444' : '#F0EEE8',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span style={{ width: 18, height: 18, display: 'flex' }}>{isFav ? Icons.heartFilled : Icons.heart}</span>
                {isFav ? 'Saved' : 'Save for Later'}
              </button>

              {!showBuild ? (
                <button
                  onClick={() => { if (!queued) setShowBuild(true) }}
                  style={{
                    width: '100%', padding: '13px 0',
                    background: queued ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.15)',
                    border: `1px solid ${queued ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.3)'}`,
                    borderRadius: 12, color: queued ? '#a16207' : '#f59e0b',
                    fontSize: 14, fontWeight: 600, cursor: queued ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <span style={{ width: 18, height: 18, display: 'flex' }}>{Icons.hammer}</span>
                  {queued ? 'In Build Queue' : 'Build This'}
                </button>
              ) : (
                <BuildThisInput
                  skill={{ slug, display_name: name, summary }}
                  onSubmit={async (note) => {
                    await onBuildSubmit(slug, name, summary, note)
                    setShowBuild(false)
                    onClose()
                  }}
                  onCancel={() => setShowBuild(false)}
                />
              )}

              <a
                href="https://clawhub.ai"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontSize: 12, color: '#555', textDecoration: 'none', padding: '8px 0',
                }}
              >
                View on ClawHub {Icons.externalLink}
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SkillShopApp({ onBack }: { onBack?: () => void }) {
  const [section, setSection] = useState<Section>('discover')
  const [skills, setSkills] = useState<Skill[]>([])
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<SkillRowSkill | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(['business', 'automation', 'communication', 'dev-tools', 'productivity', 'other'])
  )
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queuedSlugs = new Set(queueItems.map(q => q.slug))

  useEffect(() => {
    loadSkills()
    loadQueue()
  }, [])

  async function loadSkills() {
    setLoading(true)
    try {
      const res = await fetch('/api/skill-shop')
      const data = await res.json()
      if (data.ok) {
        const loaded = data.skills || []
        setSkills(loaded)
        if (loaded.length === 0) {
          await refreshCache(false)
        }
      }
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  async function loadQueue() {
    try {
      const res = await fetch('/api/skill-shop/queue')
      const data = await res.json()
      if (data.ok) setQueueItems(data.items || [])
    } catch {
      // noop
    }
  }

  async function refreshCache(showToastMsg = true) {
    setRefreshing(true)
    try {
      const res = await fetch('/api/skill-shop', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        const res2 = await fetch('/api/skill-shop')
        const data2 = await res2.json()
        if (data2.ok) setSkills(data2.skills || [])
        if (showToastMsg) showToast(`Refreshed — ${data.count} skills loaded`)
      }
    } catch {
      // noop
    } finally {
      setRefreshing(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
  }

  async function toggleFavorite(slug: string, val: boolean) {
    // Find skill details from either cached skills or search results
    const fromSkills = skills.find(s => s.slug === slug)
    const fromSearch = searchResults.find(s => s.slug === slug)
    const displayName = fromSkills?.display_name || fromSearch?.displayName || slug
    const summary = fromSkills?.summary || fromSearch?.summary || null
    const category = fromSkills?.category || 'other'

    setSkills(prev => {
      const exists = prev.some(s => s.slug === slug)
      if (exists) return prev.map(s => s.slug === slug ? { ...s, is_favorite: val } : s)
      // Add the search result to local skills state so it appears in Saved tab
      return [...prev, { slug, display_name: displayName, summary, category, is_favorite: val, source: 'clawhub', marg_rating: null, marg_notes: null, updated_at: new Date().toISOString(), cached_at: new Date().toISOString() } as Skill]
    })
    if (selectedSkill && selectedSkill.slug === slug && 'is_favorite' in selectedSkill) {
      setSelectedSkill({ ...(selectedSkill as Skill), is_favorite: val })
    }
    try {
      await fetch('/api/skill-shop/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, favorite: val, display_name: displayName, summary, category }),
      })
      showToast(val ? 'Saved to favorites' : 'Removed from favorites')
    } catch {
      setSkills(prev => prev.map(s => s.slug === slug ? { ...s, is_favorite: !val } : s))
    }
  }

  async function addToQueue(slug: string, displayName: string, summary: string | null, note: string) {
    try {
      const res = await fetch('/api/skill-shop/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, display_name: displayName, summary, user_note: note || null }),
      })
      const data = await res.json()
      if (data.ok) {
        setQueueItems(prev => [data.item, ...prev])
        showToast('Added to build queue — Marg will pick this up next chat')
      }
    } catch {
      showToast('Failed to add to queue')
    }
  }

  function handleSearchChange(val: string) {
    setSearchQuery(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!val.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/skill-shop/search?q=${encodeURIComponent(val)}`)
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch {
        // noop
      } finally {
        setSearchLoading(false)
      }
    }, 400)
  }

  function toggleCategory(cat: string) {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const recommended = [...skills].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 20)
  const recent = [...skills].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 10)
  const savedSkills = skills.filter(s => s.is_favorite)
  const pendingCount = queueItems.filter(q => q.status === 'pending').length

  const otherCategories = ['business', 'automation', 'communication', 'dev-tools', 'productivity', 'other'] as const

  return (
    <>
      <style>{`
        @keyframes ssShimmer { 0% { opacity: 0.5 } 50% { opacity: 0.85 } 100% { opacity: 0.5 } }
        @keyframes ssSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes ssSlideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes ssFadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: '#0a0612', color: '#F0EEE8',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* ── Header ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100, background: '#0a0612',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 16px 0', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            {onBack && (
              <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', padding: 4, marginRight: 4 }} aria-label="Back">
                {Icons.back}
              </button>
            )}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#6366f1' }}>{Icons.crab}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#F0EEE8' }}>Skill Shop</span>
              </div>
              <span style={{ fontSize: 12, color: '#666', marginTop: 1 }}>Browse ideas. Build your own.</span>
            </div>
            <button
              onClick={() => refreshCache()}
              disabled={refreshing}
              style={{
                background: 'none', border: 'none', cursor: refreshing ? 'not-allowed' : 'pointer',
                color: refreshing ? '#6366f1' : '#888', display: 'flex', padding: 4,
                animation: refreshing ? 'ssSpin 1s linear infinite' : 'none',
              }}
              aria-label="Refresh"
            >
              {Icons.refresh}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex' }}>
            {(['discover', 'saved', 'queue', 'search'] as Section[]).map(s => {
              const labels: Record<Section, string> = { discover: 'Discover', saved: 'Saved', queue: 'Build Queue', search: 'Search' }
              const isActive = section === s
              return (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  style={{
                    flex: 1, background: 'none', border: 'none',
                    borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                    padding: '10px 4px', fontSize: 13, fontWeight: isActive ? 700 : 400,
                    color: isActive ? '#F0EEE8' : '#666', cursor: 'pointer',
                  }}
                >
                  {labels[s]}
                  {s === 'queue' && pendingCount > 0 && (
                    <span style={{
                      marginLeft: 4, fontSize: 10, background: '#f59e0b', color: '#000',
                      borderRadius: 10, padding: '1px 5px', fontWeight: 700,
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflow: 'auto' }}>

          {/* DISCOVER */}
          {section === 'discover' && (
            <div>
              {/* Recommended */}
              <div style={{ padding: '20px 16px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: '#6366f1', width: 16, height: 16, display: 'flex' }}>{Icons.target}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#F0EEE8' }}>Trending</span>
                  <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>
                    {recommended.length}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#666', margin: '0 0 14px' }}>
                  Popular skills being used across the community
                </p>

                {loading ? (
                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                    {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
                  </div>
                ) : recommended.length === 0 ? (
                  <div style={{ padding: '20px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, textAlign: 'center', color: '#555', fontSize: 13 }}>
                    Refreshing recommendations...
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollSnapType: 'x mandatory' }}>
                    {recommended.map(skill => (
                      <div key={skill.slug} style={{ scrollSnapAlign: 'start' }}>
                        <SkillCard skill={skill} queued={queuedSlugs.has(skill.slug)} onFavorite={toggleFavorite} onTap={sk => setSelectedSkill(sk)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recently Added */}
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 8px' }}>
                  <span style={{ color: '#555', width: 16, height: 16, display: 'flex' }}>{Icons.clock}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#F0EEE8' }}>Recently Added</span>
                </div>
                {loading
                  ? [1, 2, 3, 4].map(i => <RowSkeleton key={i} />)
                  : recent.map(skill => (
                    <SkillRow key={skill.slug} skill={skill} queued={queuedSlugs.has(skill.slug)} onFavorite={toggleFavorite} onBuildSubmit={addToQueue} onTap={sk => setSelectedSkill(sk)} />
                  ))
                }
              </div>

              {/* Category sections */}
              {otherCategories.map(cat => {
                const catSkills = skills.filter(s => s.category === cat)
                if (catSkills.length === 0) return null
                const collapsed = collapsedCategories.has(cat)
                return (
                  <div key={cat} style={{ marginTop: 4 }}>
                    <button
                      onClick={() => toggleCategory(cat)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 16px', background: 'none', border: 'none',
                        borderTop: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', color: '#888', textAlign: 'left',
                      }}
                    >
                      <span style={{ width: 18, height: 18, display: 'flex' }}>{CategoryIcons[cat] || Icons.grid}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#F0EEE8', flex: 1 }}>{CategoryLabels[cat]}</span>
                      <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', color: '#888', padding: '1px 6px', borderRadius: 8 }}>
                        {catSkills.length}
                      </span>
                      <span style={{ color: '#555' }}>{collapsed ? Icons.chevronDown : Icons.chevronUp}</span>
                    </button>
                    {!collapsed && catSkills.map(skill => (
                      <SkillRow key={skill.slug} skill={skill} queued={queuedSlugs.has(skill.slug)} onFavorite={toggleFavorite} onBuildSubmit={addToQueue} onTap={sk => setSelectedSkill(sk)} />
                    ))}
                  </div>
                )
              })}

              <div style={{ height: 32 }} />
            </div>
          )}

          {/* SAVED */}
          {section === 'saved' && (
            <div>
              {savedSkills.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 32px', gap: 12, color: '#555' }}>
                  <span style={{ width: 48, height: 48, display: 'flex', opacity: 0.35 }}>{Icons.heart}</span>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#777', margin: 0 }}>No saved skills yet</p>
                  <p style={{ fontSize: 13, color: '#555', margin: 0, textAlign: 'center' }}>
                    Browse Discover and tap the heart on skills you like
                  </p>
                </div>
              ) : savedSkills.map(skill => (
                <SkillRow key={skill.slug} skill={skill} queued={queuedSlugs.has(skill.slug)} onFavorite={toggleFavorite} onBuildSubmit={addToQueue} onTap={sk => setSelectedSkill(sk)} />
              ))}
            </div>
          )}

          {/* BUILD QUEUE */}
          {section === 'queue' && (
            <div>
              {queueItems.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 32px', gap: 12 }}>
                  <span style={{ width: 48, height: 48, display: 'flex', opacity: 0.28, color: '#888' }}>{Icons.hammer}</span>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#777', margin: 0 }}>Nothing in the queue</p>
                  <p style={{ fontSize: 13, color: '#555', margin: 0, textAlign: 'center' }}>
                    Tap &ldquo;Build This&rdquo; on any skill to add it here
                  </p>
                </div>
              ) : (
                <div style={{ padding: '12px 0' }}>
                  {queueItems.map(item => {
                    const sc: Record<string, { bg: string; color: string }> = {
                      pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
                      acknowledged: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
                      built: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
                    }
                    const style = sc[item.status] || sc.pending
                    return (
                      <div key={item.id} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <span style={{ color: '#f59e0b', width: 18, height: 18, display: 'flex', flexShrink: 0, marginTop: 2 }}>{Icons.hammer}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: '#F0EEE8', margin: 0 }}>{item.display_name || item.slug}</p>
                              <span style={{
                                fontSize: 10, fontWeight: 700, color: style.color, background: style.bg,
                                padding: '2px 8px', borderRadius: 10, textTransform: 'capitalize', flexShrink: 0,
                              }}>
                                {item.status}
                              </span>
                            </div>
                            {item.user_note && (
                              <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px', fontStyle: 'italic' }}>
                                &ldquo;{item.user_note}&rdquo;
                              </p>
                            )}
                            {item.summary && !item.user_note && (
                              <p style={{ fontSize: 12, color: '#666', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.summary}
                              </p>
                            )}
                            <p style={{ fontSize: 11, color: '#444', margin: 0 }}>
                              {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ height: 32 }} />
                </div>
              )}
            </div>
          )}

          {/* SEARCH */}
          {section === 'search' && (
            <div style={{ padding: '16px' }}>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555', display: 'flex', pointerEvents: 'none' }}>
                  {Icons.search}
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search ClawHub for inspiration..."
                  autoFocus
                  style={{
                    width: '100%', padding: '12px 12px 12px 42px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#F0EEE8', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>

              {searchQuery && (
                <p style={{ fontSize: 12, color: '#555', margin: '0 0 14px', textAlign: 'center', fontStyle: 'italic' }}>
                  Results are reference only. Found something good? Tap Build This.
                </p>
              )}

              {searchLoading ? (
                <div style={{ marginTop: 8 }}>{[1, 2, 3, 4].map(i => <RowSkeleton key={i} />)}</div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#555', fontSize: 14 }}>
                  No skills found. Try different keywords.
                </div>
              ) : (
                <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                  {searchResults.map(result => (
                    <SkillRow key={result.slug} skill={result} queued={queuedSlugs.has(result.slug)} onFavorite={toggleFavorite} onBuildSubmit={addToQueue} onTap={sk => setSelectedSkill(sk)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Sheet */}
        {selectedSkill && (
          <DetailSheet
            skill={selectedSkill}
            queued={queuedSlugs.has(selectedSkill.slug)}
            onClose={() => setSelectedSkill(null)}
            onFavorite={toggleFavorite}
            onBuildSubmit={addToQueue}
          />
        )}

        {/* Toast */}
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </div>
    </>
  )
}
