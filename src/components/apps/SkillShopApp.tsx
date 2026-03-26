'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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
  missing: string[]
}

type ShopTab = 'all' | 'favourites' | 'installed' | 'recommended' | 'search'

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

const TABS: { id: ShopTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'favourites', label: '⭐ Favourites' },
  { id: 'installed', label: '📦 Installed' },
  { id: 'recommended', label: '🎯 Recommended' },
  { id: 'search', label: '🔍 Search' },
]

const backIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const refreshIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const heartIcon = (filled: boolean) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: 11, color: i <= rating ? '#f59e0b' : '#444' }}>★</span>
      ))}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '14px 16px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', flexShrink: 0, animation: 'shimmer 1.5s infinite' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 14, width: '60%', borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />
        <div style={{ height: 11, width: '90%', borderRadius: 6, background: 'rgba(255,255,255,0.04)', marginBottom: 4 }} />
        <div style={{ height: 11, width: '70%', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  )
}

function SectionHeader({ emoji, title, count }: { emoji: string; title: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 22 }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#ccc', letterSpacing: 0.3 }}>{title}</span>
      {count !== undefined && (
        <span style={{ fontSize: 11, color: '#555', marginLeft: 2 }}>{count}</span>
      )}
    </div>
  )
}

function SkillCard({
  skill,
  expanded,
  onToggleExpand,
  onToggleFavorite,
  onAskInstall,
}: {
  skill: Skill
  expanded: boolean
  onToggleExpand: () => void
  onToggleFavorite: (e: React.MouseEvent) => void
  onAskInstall: () => void
}) {
  const emoji = CATEGORY_EMOJI[skill.category] || '📦'
  const sourceLabel = SOURCE_LABELS[skill.source] || skill.source || 'ClawHub'

  return (
    <div
      onClick={onToggleExpand}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${expanded ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
        transition: 'border-color 0.2s',
        position: 'relative',
      }}
    >
      {/* Heart button */}
      <button
        onClick={onToggleFavorite}
        style={{
          position: 'absolute', top: 10, right: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {heartIcon(skill.is_favorite)}
      </button>

      {/* Main row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingRight: 28 }}>
        <span style={{ fontSize: 28, lineHeight: '36px', flexShrink: 0 }}>{emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F0EEE8', lineHeight: '20px' }}>
              {skill.display_name}
            </span>
            {skill.is_installed && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#22c55e',
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 6, padding: '1px 7px',
              }}>Installed</span>
            )}
          </div>
          {skill.summary && (
            <p style={{
              fontSize: 12, color: '#888', margin: '0 0 8px',
              lineHeight: '17px',
              display: expanded ? 'block' : '-webkit-box',
              WebkitLineClamp: expanded ? undefined : 2,
              WebkitBoxOrient: expanded ? undefined : 'vertical' as const,
              overflow: expanded ? 'visible' : 'hidden',
            }}>{skill.summary}</p>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: 10, color: '#666',
              background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 7px',
            }}>{sourceLabel}</span>
            {skill.trust_level === 'verified' && (
              <span style={{ fontSize: 10, color: '#22c55e' }}>✅ Verified</span>
            )}
            {skill.trust_level === 'looks-ok' && (
              <span style={{ fontSize: 10, color: '#f59e0b' }}>👍 Looks OK</span>
            )}
            <StarRating rating={skill.marg_rating} />
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {skill.marg_notes && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#666', fontWeight: 600, marginBottom: 5 }}>MARG&apos;S NOTES</div>
              <p style={{ fontSize: 13, color: '#bbb', lineHeight: '19px', margin: 0 }}>{skill.marg_notes}</p>
            </div>
          )}
          {skill.marg_rating && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#666', fontWeight: 600, marginBottom: 5 }}>QUALITY RATING</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} style={{ fontSize: 16, color: i <= (skill.marg_rating || 0) ? '#f59e0b' : '#333' }}>★</span>
                ))}
              </div>
            </div>
          )}
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(e) }}
              style={{
                background: skill.is_favorite ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                border: skill.is_favorite ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: skill.is_favorite ? '#f87171' : '#aaa',
                padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 500,
              }}
            >{skill.is_favorite ? '💔 Unfavourite' : '⭐ Favourite'}</button>
            {!skill.is_installed ? (
              <button
                onClick={(e) => { e.stopPropagation(); onAskInstall() }}
                style={{
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 8, color: '#a5b4fc', padding: '7px 14px', fontSize: 12,
                  cursor: 'pointer', fontWeight: 500,
                }}
              >Ask Marg to Install</button>
            ) : (
              <span style={{
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 8, color: '#4ade80', padding: '7px 14px', fontSize: 12, fontWeight: 500,
              }}>✓ Installed</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SkillShopApp({ onBack }: { onBack: () => void }) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<ShopTab>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [installedSkills, setInstalledSkills] = useState<InstalledSkill[]>([])
  const [installedLoading, setInstalledLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didSetup = useRef(false)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }, [])

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch('/api/skill-shop')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      return (data.skills || []) as Skill[]
    } catch {
      return [] as Skill[]
    }
  }, [])

  const runSetup = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/skill-shop', { method: 'POST' })
      const data = await res.json()
      const fresh = await fetchSkills()
      setSkills(fresh)
      if (data.count > 0) {
        showToast(`Skills refreshed! Found ${data.count} skills`)
      }
    } catch {
      showToast('Could not connect to ClawHub')
    } finally {
      setRefreshing(false)
    }
  }, [fetchSkills, showToast])

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const cached = await fetchSkills()
      setSkills(cached)
      setLoading(false)
      // Auto-setup on first load if empty
      if (cached.length === 0 && !didSetup.current) {
        didSetup.current = true
        await runSetup()
      }
    }
    load()
  }, [fetchSkills, runSetup])

  // Load installed skills when tab is opened
  useEffect(() => {
    if (activeTab !== 'installed') return
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
  }, [activeTab])

  // Debounced live search
  useEffect(() => {
    if (activeTab !== 'search') return
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
    }, 350)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [searchQuery, activeTab])

  const toggleFavorite = useCallback(async (skill: Skill, e: React.MouseEvent) => {
    e.stopPropagation()
    const newVal = !skill.is_favorite
    setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, is_favorite: newVal } : s))
    showToast(newVal ? `Added to favourites ⭐` : 'Removed from favourites')
    try {
      await fetch('/api/skill-shop/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: skill.slug, favorite: newVal }),
      })
    } catch {
      // Revert on error
      setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, is_favorite: !newVal } : s))
    }
  }, [showToast])

  const askInstall = useCallback((skill: Skill) => {
    showToast(`Ask Marg in chat to install ${skill.display_name}!`)
  }, [showToast])

  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    await runSetup()
  }, [refreshing, runSetup])

  // ── Derived data for sections ──────────────────────────────────────────
  const recommended = skills.filter(s =>
    s.category === 'recommended' ||
    /event|hospitality|schedule|crm|email|social|content|automat|calendar/i.test(s.summary || s.display_name)
  )
  const recentlyUpdated = [...skills].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 10)
  const devTools = skills.filter(s => s.category === 'dev-tools')
  const communication = skills.filter(s => s.category === 'communication')
  const automation = skills.filter(s => s.category === 'automation')
  const business = skills.filter(s => s.category === 'business')
  const favourites = skills.filter(s => s.is_favorite)

  const readySkills = installedSkills.filter(s => s.eligible)
  const needsSetupSkills = installedSkills.filter(s => !s.eligible)

  // ── Chip style ─────────────────────────────────────────────────────────
  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 20, border: 'none', fontSize: 13,
    fontWeight: active ? 600 : 400, cursor: 'pointer',
    background: active ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.06)',
    color: active ? '#c4b5fd' : '#999',
    transition: 'all 0.2s', whiteSpace: 'nowrap' as const, flexShrink: 0,
  })

  // ── Render helpers ─────────────────────────────────────────────────────
  const renderCard = (skill: Skill) => (
    <SkillCard
      key={skill.id}
      skill={skill}
      expanded={expandedId === skill.id}
      onToggleExpand={() => setExpandedId(expandedId === skill.id ? null : skill.id)}
      onToggleFavorite={(e) => toggleFavorite(skill, e)}
      onAskInstall={() => askInstall(skill)}
    />
  )

  const renderSection = (emoji: string, title: string, items: Skill[]) => {
    if (items.length === 0) return null
    return (
      <div key={title}>
        <SectionHeader emoji={emoji} title={title} count={items.length} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(renderCard)}
        </div>
      </div>
    )
  }

  const renderEmpty = (emoji: string, msg: string) => (
    <div style={{
      textAlign: 'center', padding: '48px 24px',
      background: 'rgba(255,255,255,0.02)', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.06)', marginTop: 16,
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</div>
      <p style={{ color: '#888', fontSize: 14, margin: 0, lineHeight: '20px' }}>{msg}</p>
    </div>
  )

  const renderInstalledSkill = (s: InstalledSkill) => (
    <div key={s.slug} style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F0EEE8', marginBottom: 3 }}>{s.name}</div>
          {s.description && (
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px', lineHeight: '17px' }}>{s.description}</p>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, color: '#666',
              background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 7px',
            }}>{SOURCE_LABELS[s.source] || s.source}</span>
            {!s.eligible && s.missing.length > 0 && (
              <span style={{ fontSize: 11, color: '#f59e0b' }}>
                Missing: {s.missing.join(', ')}
              </span>
            )}
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, flexShrink: 0,
          color: s.eligible ? '#22c55e' : '#f59e0b',
          background: s.eligible ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
          border: `1px solid ${s.eligible ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
          borderRadius: 6, padding: '2px 8px',
        }}>{s.eligible ? 'Ready' : 'Needs Setup'}</span>
      </div>
    </div>
  )

  return (
    <div style={{ paddingTop: 52 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(168,85,247,0.9)', color: '#fff', padding: '10px 24px',
          borderRadius: 12, fontSize: 14, fontWeight: 500, zIndex: 999,
          backdropFilter: 'blur(10px)', whiteSpace: 'nowrap',
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12,
          color: '#aaa', padding: '10px 16px', fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>{backIcon} Back</button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, color: refreshing ? '#666' : '#aaa',
            padding: '10px 14px', fontSize: 13, cursor: refreshing ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ display: 'inline-flex', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>
            {refreshIcon}
          </span>
          {refreshing ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EEE8', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
          🦀 Skill Shop
        </h1>
        <p style={{ color: '#888', fontSize: 14, margin: '4px 0 0' }}>
          {skills.length} skill{skills.length !== 1 ? 's' : ''} · {skills.filter(s => s.is_installed).length} installed · {skills.filter(s => s.is_favorite).length} favourited
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 18 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={chipStyle(activeTab === t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* ── ALL TAB ── */}
      {!loading && activeTab === 'all' && (
        <div>
          {skills.length === 0 ? (
            renderEmpty('🦀', 'No skills found yet. Tap Refresh to search ClawHub!')
          ) : (
            <>
              {renderSection('🎯', 'Recommended for You', recommended.slice(0, 6))}
              {renderSection('🆕', 'Recently Updated', recentlyUpdated)}
              {renderSection('📊', 'Business', business)}
              {renderSection('🤖', 'Automation', automation)}
              {renderSection('💬', 'Communication', communication)}
              {renderSection('🔧', 'Developer Tools', devTools)}
            </>
          )}
        </div>
      )}

      {/* ── FAVOURITES TAB ── */}
      {!loading && activeTab === 'favourites' && (
        <div>
          {favourites.length === 0
            ? renderEmpty('⭐', 'No favourites yet. Browse the shop and tap ❤️ on skills you like!')
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{favourites.map(renderCard)}</div>
          }
        </div>
      )}

      {/* ── INSTALLED TAB ── */}
      {!loading && activeTab === 'installed' && (
        <div>
          {installedLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : installedSkills.length === 0 ? (
            renderEmpty('📦', 'No installed skills found. Install skills via the openclaw CLI!')
          ) : (
            <>
              {readySkills.length > 0 && (
                <div>
                  <SectionHeader emoji="✅" title="Ready to Use" count={readySkills.length} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {readySkills.map(renderInstalledSkill)}
                  </div>
                </div>
              )}
              {needsSetupSkills.length > 0 && (
                <div>
                  <SectionHeader emoji="⚙️" title="Needs Setup" count={needsSetupSkills.length} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {needsSetupSkills.map(renderInstalledSkill)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── RECOMMENDED TAB ── */}
      {!loading && activeTab === 'recommended' && (
        <div>
          {recommended.length === 0
            ? renderEmpty('🎯', 'No recommended skills found. Try refreshing to load from ClawHub!')
            : (
              <div>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
                  Skills tailored for events, hospitality, business and automation.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recommended.map(renderCard)}
                </div>
              </div>
            )
          }
        </div>
      )}

      {/* ── SEARCH TAB ── */}
      {activeTab === 'search' && (
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search ClawHub for skills…"
            autoFocus
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)', color: '#F0EEE8',
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
              marginBottom: 16, fontFamily: 'Inter, system-ui, sans-serif',
            }}
          />
          {searchLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}
          {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
            renderEmpty('🔍', 'No skills found for that search. Try different keywords!')
          )}
          {!searchLoading && searchResults.length > 0 && (
            <div>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} from ClawHub
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchResults.map((r, i) => {
                  const slug = ((r.slug || r.name || '') as string).toLowerCase().replace(/\s+/g, '-')
                  const cachedSkill = skills.find(s => s.slug === slug)
                  const synth: Skill = {
                    id: slug || String(i),
                    slug,
                    display_name: (r.display_name || r.name || slug) as string,
                    summary: (r.summary || r.description || null) as string | null,
                    category: (r.category || 'other') as string,
                    is_installed: cachedSkill?.is_installed || false,
                    is_favorite: cachedSkill?.is_favorite || false,
                    marg_rating: null,
                    marg_notes: null,
                    trust_level: (r.source === 'bundled' ? 'verified' : 'looks-ok'),
                    source: ((r.source || 'clawhub') as string).toLowerCase(),
                    updated_at: new Date().toISOString(),
                    cached_at: new Date().toISOString(),
                  }
                  return (
                    <SkillCard
                      key={synth.id}
                      skill={synth}
                      expanded={expandedId === synth.id}
                      onToggleExpand={() => setExpandedId(expandedId === synth.id ? null : synth.id)}
                      onToggleFavorite={(e) => {
                        if (cachedSkill) {
                          toggleFavorite(cachedSkill, e)
                        } else {
                          e.stopPropagation()
                          showToast('Save to favourites: refresh first to cache this skill')
                        }
                      }}
                      onAskInstall={() => askInstall(synth)}
                    />
                  )
                })}
              </div>
            </div>
          )}
          {!searchQuery.trim() && (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#555', fontSize: 14 }}>
              Type to search ClawHub for skills…
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
