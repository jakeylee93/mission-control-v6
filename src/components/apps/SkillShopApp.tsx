'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Skill {
  id: string
  slug: string
  display_name: string
  summary: string | null
  category: string
  is_installed: boolean
  is_favorite: boolean
  marg_rating: number | null
  marg_notes: string | null
  trust_level: string
  source: string
  updated_at: string
  cached_at: string
}

interface InstalledSkill {
  slug: string
  name: string
  description: string | null
  source: string
  eligible: boolean
}

interface SearchResult {
  score: number
  slug: string
  displayName: string
  summary: string
  version: string
  updatedAt: string
}

type View = 'discover' | 'saved' | 'installed' | 'search'
type CategoryFilter = 'for-you' | 'business' | 'automation' | 'communication' | 'dev-tools' | 'productivity' | 'all'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  recommended: '🎯',
  business: '📊',
  productivity: '📅',
  'dev-tools': '🔧',
  automation: '🤖',
  communication: '💬',
  other: '📦',
}

const SOURCE_LABELS: Record<string, string> = {
  clawhub: 'ClawHub',
  custom: 'Custom',
  bundled: 'Bundled',
}

const FEATURED = [
  {
    slug: 'automation-workflows',
    name: 'Automation Workflows',
    tagline: 'Automate anything with ease',
    emoji: '⚡',
    bg: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #6366f1 100%)',
  },
  {
    slug: 'email-daily-summary',
    name: 'Email Daily Summary',
    tagline: 'Your inbox, intelligently curated',
    emoji: '📧',
    bg: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)',
  },
  {
    slug: 'business-writing',
    name: 'Business Writing',
    tagline: 'Professional copy in seconds',
    emoji: '✍️',
    bg: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #f97316 100%)',
  },
  {
    slug: 'ai-web-automation',
    name: 'AI Web Automation',
    tagline: 'Browse and act on any website',
    emoji: '🌐',
    bg: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #3b82f6 100%)',
  },
]

const CATEGORY_PILLS: { id: CategoryFilter; label: string }[] = [
  { id: 'for-you', label: '🎯 For You' },
  { id: 'business', label: '📊 Business' },
  { id: 'automation', label: '🤖 Automation' },
  { id: 'communication', label: '💬 Comms' },
  { id: 'dev-tools', label: '🔧 Dev Tools' },
  { id: 'productivity', label: '📅 Productivity' },
  { id: 'all', label: '📦 All' },
]

const VIEWS: { id: View; label: string }[] = [
  { id: 'discover', label: '🏠 Discover' },
  { id: 'saved', label: '⭐ Saved' },
  { id: 'installed', label: '📦 Installed' },
  { id: 'search', label: '🔍 Search' },
]

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const RefreshIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ── Skeleton Grid Card ─────────────────────────────────────────────────────────

function SkeletonGridCard() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: '20px 12px 14px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.07)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
      <div style={{ height: 12, width: '70%', borderRadius: 6, background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
      <div style={{ height: 10, width: '50%', borderRadius: 6, background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
    </div>
  )
}

// ── Grid Skill Card ───────────────────────────────────────────────────────────

function GridSkillCard({
  skill,
  onTap,
  onToggleFavorite,
}: {
  skill: Skill
  onTap: () => void
  onToggleFavorite: (e: React.MouseEvent) => void
}) {
  const emoji = CATEGORY_EMOJI[skill.category] || '📦'
  const sourceLabel = SOURCE_LABELS[skill.source] || skill.source || 'ClawHub'

  return (
    <div
      onClick={onTap}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '18px 10px 12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 8, cursor: 'pointer', position: 'relative',
        transition: 'background 0.15s, transform 0.1s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Installed dot */}
      {skill.is_installed && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
          boxShadow: '0 0 6px rgba(34,197,94,0.6)',
        }} />
      )}

      {/* Heart */}
      <button
        onClick={onToggleFavorite}
        style={{
          position: 'absolute', top: 8, right: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <HeartIcon filled={skill.is_favorite} />
      </button>

      {/* Emoji */}
      <span style={{ fontSize: 32, lineHeight: 1 }}>{emoji}</span>

      {/* Name */}
      <span style={{
        fontSize: 13, fontWeight: 700, color: '#F0EEE8', textAlign: 'center',
        lineHeight: '18px', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        wordBreak: 'break-word',
      }}>
        {skill.display_name}
      </span>

      {/* Source pill */}
      <span style={{
        fontSize: 10, color: '#666',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: '2px 8px',
        marginTop: 'auto',
      }}>{sourceLabel}</span>
    </div>
  )
}

// ── Search Result Card ────────────────────────────────────────────────────────

function SearchResultCard({
  result,
  isInstalled,
  isFavorite,
  onTap,
  onToggleFavorite,
}: {
  result: SearchResult
  isInstalled: boolean
  isFavorite: boolean
  onTap: () => void
  onToggleFavorite: (e: React.MouseEvent) => void
}) {
  const text = (result.slug + ' ' + result.summary).toLowerCase()
  let category = 'other'
  if (/event|hospitality|bar|venue|ticket|booking/.test(text)) category = 'recommended'
  else if (/business|crm|sales|marketing|revenue|invoice|client/.test(text)) category = 'business'
  else if (/automat|workflow|trigger|pipeline|zap/.test(text)) category = 'automation'
  else if (/email|slack|discord|chat|message|telegram|whatsapp/.test(text)) category = 'communication'
  else if (/code|dev|git|deploy|build|test|debug|api|github/.test(text)) category = 'dev-tools'
  else if (/schedule|calendar|task|health|habit|remind|product/.test(text)) category = 'productivity'
  const emoji = CATEGORY_EMOJI[category] || '📦'

  return (
    <div
      onClick={onTap}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '18px 10px 12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 8, cursor: 'pointer', position: 'relative',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {isInstalled && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
          boxShadow: '0 0 6px rgba(34,197,94,0.6)',
        }} />
      )}
      <button
        onClick={onToggleFavorite}
        style={{
          position: 'absolute', top: 8, right: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <HeartIcon filled={isFavorite} />
      </button>
      <span style={{ fontSize: 32, lineHeight: 1 }}>{emoji}</span>
      <span style={{
        fontSize: 13, fontWeight: 700, color: '#F0EEE8', textAlign: 'center',
        lineHeight: '18px', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {result.displayName || result.slug}
      </span>
      <span style={{
        fontSize: 10, color: '#666',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: '2px 8px', marginTop: 'auto',
      }}>ClawHub</span>
    </div>
  )
}

// ── Detail Modal Sheet ────────────────────────────────────────────────────────

function DetailModal({
  skill,
  onClose,
  onToggleFavorite,
  onAskMarg,
}: {
  skill: Skill | null
  onClose: () => void
  onToggleFavorite: () => void
  onAskMarg: () => void
}) {
  if (!skill) return null
  const emoji = CATEGORY_EMOJI[skill.category] || '📦'
  const sourceLabel = SOURCE_LABELS[skill.source] || skill.source || 'ClawHub'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px 24px 0 0',
          padding: '0 20px 40px',
          maxHeight: '85vh', overflowY: 'auto',
          animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
            color: '#888', width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CloseIcon />
          </button>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{emoji}</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0EEE8', margin: '0 0 6px' }}>
            {skill.display_name}
          </h2>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 12, color: '#888', background: 'rgba(255,255,255,0.07)',
              borderRadius: 20, padding: '4px 12px',
            }}>{sourceLabel}</span>
            {skill.is_installed && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: '#22c55e',
                background: 'rgba(34,197,94,0.12)', borderRadius: 20, padding: '4px 12px',
              }}>● Active</span>
            )}
          </div>
        </div>

        {/* Summary */}
        {skill.summary && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 14, color: '#ccc', lineHeight: '22px', margin: 0 }}>
              {skill.summary}
            </p>
          </div>
        )}

        {/* Marg's notes */}
        {skill.marg_notes && (
          <div style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 6, letterSpacing: 0.5 }}>
              MARG&apos;S NOTES
            </div>
            <p style={{ fontSize: 14, color: '#a5b4fc', lineHeight: '20px', margin: 0 }}>
              {skill.marg_notes}
            </p>
          </div>
        )}

        {/* Meta row */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 20,
          fontSize: 12, color: '#666',
        }}>
          <span>Category: <span style={{ color: '#aaa' }}>{skill.category}</span></span>
          <span>·</span>
          <span>Trust: <span style={{ color: skill.trust_level === 'verified' ? '#22c55e' : '#f59e0b' }}>{skill.trust_level}</span></span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
          <button
            onClick={onToggleFavorite}
            style={{
              background: skill.is_favorite ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)',
              border: skill.is_favorite ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, color: skill.is_favorite ? '#f87171' : '#ccc',
              padding: '14px', fontSize: 15, cursor: 'pointer', fontWeight: 600,
              width: '100%',
            }}
          >
            {skill.is_favorite ? '💔 Remove from Saved' : '⭐ Save to Favourites'}
          </button>
          <button
            onClick={onAskMarg}
            style={{
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: 14, color: '#a5b4fc',
              padding: '14px', fontSize: 15, cursor: 'pointer', fontWeight: 600,
              width: '100%',
            }}
          >
            🤖 Ask Marg to Install
          </button>
          <a
            href={`https://clawhub.ai/skills/${skill.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', textAlign: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, color: '#666',
              padding: '12px', fontSize: 13, textDecoration: 'none',
              width: '100%', boxSizing: 'border-box',
            }}
          >
            🌐 View on ClawHub
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Search Detail Modal ───────────────────────────────────────────────────────

function SearchDetailModal({
  result,
  isInstalled,
  isFavorite,
  onClose,
  onToggleFavorite,
  onAskMarg,
}: {
  result: SearchResult | null
  isInstalled: boolean
  isFavorite: boolean
  onClose: () => void
  onToggleFavorite: () => void
  onAskMarg: () => void
}) {
  if (!result) return null
  const text = (result.slug + ' ' + result.summary).toLowerCase()
  let category = 'other'
  if (/event|hospitality|bar|venue|ticket|booking/.test(text)) category = 'recommended'
  else if (/business|crm|sales|marketing|revenue|invoice|client/.test(text)) category = 'business'
  else if (/automat|workflow|trigger|pipeline|zap/.test(text)) category = 'automation'
  else if (/email|slack|discord|chat|message|telegram|whatsapp/.test(text)) category = 'communication'
  else if (/code|dev|git|deploy|build|test|debug|api|github/.test(text)) category = 'dev-tools'
  else if (/schedule|calendar|task|health|habit|remind|product/.test(text)) category = 'productivity'
  const emoji = CATEGORY_EMOJI[category] || '📦'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px 24px 0 0',
          padding: '0 20px 40px',
          maxHeight: '85vh', overflowY: 'auto',
          animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
            color: '#888', width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CloseIcon />
          </button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{emoji}</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0EEE8', margin: '0 0 6px' }}>
            {result.displayName || result.slug}
          </h2>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <span style={{
              fontSize: 12, color: '#888', background: 'rgba(255,255,255,0.07)',
              borderRadius: 20, padding: '4px 12px',
            }}>ClawHub</span>
            {isInstalled && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: '#22c55e',
                background: 'rgba(34,197,94,0.12)', borderRadius: 20, padding: '4px 12px',
              }}>● Active</span>
            )}
            {result.version && (
              <span style={{
                fontSize: 12, color: '#666', background: 'rgba(255,255,255,0.05)',
                borderRadius: 20, padding: '4px 12px',
              }}>v{result.version}</span>
            )}
          </div>
        </div>
        {result.summary && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 14, color: '#ccc', lineHeight: '22px', margin: 0 }}>{result.summary}</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
          <button
            onClick={onToggleFavorite}
            style={{
              background: isFavorite ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)',
              border: isFavorite ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, color: isFavorite ? '#f87171' : '#ccc',
              padding: '14px', fontSize: 15, cursor: 'pointer', fontWeight: 600, width: '100%',
            }}
          >
            {isFavorite ? '💔 Remove from Saved' : '⭐ Save to Favourites'}
          </button>
          <button
            onClick={onAskMarg}
            style={{
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: 14, color: '#a5b4fc',
              padding: '14px', fontSize: 15, cursor: 'pointer', fontWeight: 600, width: '100%',
            }}
          >
            🤖 Ask Marg to Install
          </button>
          <a
            href={`https://clawhub.ai/skills/${result.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', textAlign: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, color: '#666',
              padding: '12px', fontSize: 13, textDecoration: 'none',
              width: '100%', boxSizing: 'border-box',
            }}
          >
            🌐 View on ClawHub
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  if (!message) return null
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(20,20,35,0.92)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#F0EEE8', padding: '10px 20px',
      borderRadius: 40, fontSize: 13, fontWeight: 500, zIndex: 999,
      whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'fadeIn 0.2s ease',
    }}>{message}</div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SkillShopApp({ onBack }: { onBack: () => void }) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [view, setView] = useState<View>('discover')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('for-you')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null)
  const [toast, setToast] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [installedSkills, setInstalledSkills] = useState<InstalledSkill[]>([])
  const [installedLoading, setInstalledLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didSetup = useRef(false)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch('/api/skill-shop', { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      return (data.skills || []) as Skill[]
    } catch {
      return [] as Skill[]
    }
  }, [])

  const runRefresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      const res = await fetch('/api/skill-shop', { method: 'POST' })
      const data = await res.json()
      const fresh = await fetchSkills()
      setSkills(fresh)
      showToast(data.count > 0 ? `✨ Loaded ${data.count} skills from ClawHub` : 'Refreshed!')
    } catch {
      showToast('Could not connect to ClawHub')
    } finally {
      setRefreshing(false)
    }
  }, [refreshing, fetchSkills, showToast])

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const cached = await fetchSkills()
      setSkills(cached)
      setLoading(false)
      if (cached.length === 0 && !didSetup.current) {
        didSetup.current = true
        await runRefresh()
      }
    }
    load()
  }, [fetchSkills, runRefresh])

  // Load installed skills when view switches
  useEffect(() => {
    if (view !== 'installed') return
    if (installedSkills.length > 0) return
    const load = async () => {
      setInstalledLoading(true)
      try {
        const res = await fetch('/api/skill-shop/installed')
        if (!res.ok) throw new Error('failed')
        const data = await res.json()
        setInstalledSkills(data.skills || [])
      } catch {
        setInstalledSkills([])
      } finally {
        setInstalledLoading(false)
      }
    }
    load()
  }, [view, installedSkills.length])

  // Debounced search
  useEffect(() => {
    if (view !== 'search') return
    if (!searchQuery.trim()) { setSearchResults([]); return }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/skill-shop/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [searchQuery, view])

  const toggleFavorite = useCallback(async (skill: Skill) => {
    const newVal = !skill.is_favorite
    setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, is_favorite: newVal } : s))
    if (selectedSkill?.id === skill.id) setSelectedSkill(s => s ? { ...s, is_favorite: newVal } : s)
    showToast(newVal ? '⭐ Added to Saved' : 'Removed from Saved')
    try {
      await fetch('/api/skill-shop/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: skill.slug, favorite: newVal }),
      })
    } catch {
      setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, is_favorite: !newVal } : s))
    }
  }, [selectedSkill, showToast])

  const askMarg = useCallback((name: string) => {
    showToast(`Tell Marg in chat to install ${name}!`)
  }, [showToast])

  // ── Derived data ───────────────────────────────────────────────────────────

  const getFilteredSkills = () => {
    switch (categoryFilter) {
      case 'for-you': return skills.filter(s =>
        s.category === 'recommended' ||
        /event|hospitality|schedule|crm|email|social|automat|calendar/i.test(s.summary || s.display_name)
      )
      case 'business': return skills.filter(s => s.category === 'business')
      case 'automation': return skills.filter(s => s.category === 'automation')
      case 'communication': return skills.filter(s => s.category === 'communication')
      case 'dev-tools': return skills.filter(s => s.category === 'dev-tools')
      case 'productivity': return skills.filter(s => s.category === 'productivity')
      default: return skills
    }
  }

  const filteredSkills = getFilteredSkills()
  const savedSkills = skills.filter(s => s.is_favorite)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingTop: 0, paddingBottom: 80 }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0 16px', gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12,
            color: '#aaa', padding: '9px 14px', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <BackIcon />
          <span>Back</span>
        </button>

        <h1 style={{
          fontSize: 20, fontWeight: 700, color: '#F0EEE8',
          margin: 0, flex: 1, textAlign: 'center',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          🦀 Skill Shop
        </h1>

        <button
          onClick={runRefresh}
          disabled={refreshing}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, color: refreshing ? '#555' : '#aaa',
            padding: '9px 13px', fontSize: 13, cursor: refreshing ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ display: 'inline-flex', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>
            <RefreshIcon />
          </span>
        </button>
      </div>

      {/* ── DISCOVER VIEW ── */}
      {view === 'discover' && (
        <>
          {/* Featured Carousel */}
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto',
            scrollSnapType: 'x mandatory', paddingBottom: 4,
            marginBottom: 20, WebkitOverflowScrolling: 'touch',
          }}>
            {FEATURED.map(f => (
              <div
                key={f.slug}
                style={{
                  flexShrink: 0, width: 'calc(100% - 48px)', height: 180,
                  borderRadius: 20, scrollSnapAlign: 'start',
                  background: f.bg,
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: '20px 22px', boxSizing: 'border-box',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Decorative large emoji */}
                <div style={{
                  position: 'absolute', top: -10, right: -10,
                  fontSize: 90, opacity: 0.25, userSelect: 'none',
                  lineHeight: 1,
                }}>{f.emoji}</div>
                <div style={{ fontSize: 32, marginBottom: 8, position: 'relative' }}>{f.emoji}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 3, position: 'relative' }}>
                  {f.name}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', position: 'relative' }}>
                  {f.tagline}
                </div>
              </div>
            ))}
          </div>

          {/* Category pills */}
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            paddingBottom: 4, marginBottom: 16,
            WebkitOverflowScrolling: 'touch',
          }}>
            {CATEGORY_PILLS.map(pill => (
              <button
                key={pill.id}
                onClick={() => setCategoryFilter(pill.id)}
                style={{
                  flexShrink: 0, padding: '8px 16px',
                  borderRadius: 20,
                  border: categoryFilter === pill.id ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  fontSize: 13, fontWeight: categoryFilter === pill.id ? 600 : 400,
                  cursor: 'pointer',
                  background: categoryFilter === pill.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                  color: categoryFilter === pill.id ? '#a5b4fc' : '#888',
                  whiteSpace: 'nowrap',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Skills grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonGridCard key={i} />)}
            </div>
          ) : filteredSkills.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              background: 'rgba(255,255,255,0.02)', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🦀</div>
              <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
                No skills in this category yet. Tap refresh to load from ClawHub!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {filteredSkills.map(skill => (
                <GridSkillCard
                  key={skill.id}
                  skill={skill}
                  onTap={() => setSelectedSkill(skill)}
                  onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(skill) }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SAVED VIEW ── */}
      {view === 'saved' && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#F0EEE8' }}>⭐ Saved</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{savedSkills.length} skill{savedSkills.length !== 1 ? 's' : ''} saved</div>
          </div>
          {savedSkills.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '56px 24px',
              background: 'rgba(255,255,255,0.02)', borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤍</div>
              <p style={{ color: '#888', fontSize: 14, margin: 0, lineHeight: '22px' }}>
                No saved skills yet.<br />Tap ♥ on any skill to save it here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {savedSkills.map(skill => (
                <GridSkillCard
                  key={skill.id}
                  skill={skill}
                  onTap={() => setSelectedSkill(skill)}
                  onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(skill) }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── INSTALLED VIEW ── */}
      {view === 'installed' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#F0EEE8' }}>📦 Installed</div>
            {!installedLoading && (
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                {installedSkills.length} skill{installedSkills.length !== 1 ? 's' : ''} active
              </div>
            )}
          </div>
          {installedLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: 72, borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  animation: 'shimmer 1.5s ease-in-out infinite',
                }} />
              ))}
            </div>
          ) : installedSkills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#666' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
              <p style={{ margin: 0, fontSize: 14 }}>No installed skills found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {installedSkills.map(s => (
                <div key={s.slug} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, padding: '14px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#F0EEE8', marginBottom: 2 }}>{s.name}</div>
                    {s.description && (
                      <div style={{ fontSize: 12, color: '#888', lineHeight: '17px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{s.description}</div>
                    )}
                    <div style={{ marginTop: 6 }}>
                      <span style={{
                        fontSize: 10, color: '#666',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 5, padding: '2px 8px',
                      }}>{SOURCE_LABELS[s.source] || s.source}</span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    color: '#22c55e',
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    borderRadius: 20, padding: '3px 10px',
                  }}>● Active</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SEARCH VIEW ── */}
      {view === 'search' && (
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search ClawHub for skills…"
            autoFocus
            style={{
              width: '100%', padding: '14px 18px', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)', color: '#F0EEE8',
              fontSize: 16, outline: 'none', boxSizing: 'border-box',
              marginBottom: 16,
            }}
          />

          {searchLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[1, 2, 3, 4].map(i => <SkeletonGridCard key={i} />)}
            </div>
          )}

          {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
              <p style={{ margin: 0, fontSize: 14 }}>No skills found. Try different keywords!</p>
            </div>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 12 }}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} from ClawHub
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {searchResults.map((r) => {
                  const cachedSkill = skills.find(s => s.slug === r.slug)
                  return (
                    <SearchResultCard
                      key={r.slug}
                      result={r}
                      isInstalled={cachedSkill?.is_installed || false}
                      isFavorite={cachedSkill?.is_favorite || false}
                      onTap={() => setSelectedSearchResult(r)}
                      onToggleFavorite={(e) => {
                        e.stopPropagation()
                        if (cachedSkill) {
                          toggleFavorite(cachedSkill)
                        } else {
                          showToast('Refresh first to save this skill')
                        }
                      }}
                    />
                  )
                })}
              </div>
            </>
          )}

          {!searchQuery.trim() && !searchLoading && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#555', fontSize: 14 }}>
              Type to search ClawHub for skills…
            </div>
          )}
        </div>
      )}

      {/* ── Bottom Nav Switcher ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(10,10,20,0.92)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', justifyContent: 'space-around',
        padding: '10px 0 max(10px, env(safe-area-inset-bottom))',
        zIndex: 100,
      }}>
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 8px',
              color: view === v.id ? '#6366f1' : '#555',
              fontSize: 11, fontWeight: view === v.id ? 600 : 400,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: 20 }}>{v.label.split(' ')[0]}</span>
            <span>{v.label.split(' ').slice(1).join(' ')}</span>
          </button>
        ))}
      </div>

      {/* ── Detail Modals ── */}
      {selectedSkill && (
        <DetailModal
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
          onToggleFavorite={() => toggleFavorite(selectedSkill)}
          onAskMarg={() => { askMarg(selectedSkill.display_name); setSelectedSkill(null) }}
        />
      )}

      {selectedSearchResult && (
        <SearchDetailModal
          result={selectedSearchResult}
          isInstalled={skills.some(s => s.slug === selectedSearchResult.slug && s.is_installed)}
          isFavorite={skills.some(s => s.slug === selectedSearchResult.slug && s.is_favorite)}
          onClose={() => setSelectedSearchResult(null)}
          onToggleFavorite={() => {
            const cached = skills.find(s => s.slug === selectedSearchResult.slug)
            if (cached) { toggleFavorite(cached) }
            else { showToast('Refresh first to save this skill') }
          }}
          onAskMarg={() => { askMarg(selectedSearchResult.displayName || selectedSearchResult.slug); setSelectedSearchResult(null) }}
        />
      )}

      {/* ── Toast ── */}
      <Toast message={toast} />

      {/* ── Global styles ── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 0.7; }
          100% { opacity: 0.4; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
