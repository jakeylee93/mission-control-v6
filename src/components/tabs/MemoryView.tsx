'use client'

import { useEffect, useState } from 'react'

interface JournalEntry {
  id: string
  date: string
  channel: string
  content: string
  created_at: string
  title: string
  what: string
  decisions: string
  keyInsight: string
  timestamp: string
}

interface DateEntry {
  date: string
  count: number
}

const CHANNEL_COLORS: Record<string, string> = {
  discord: '#5865F2',
  telegram: '#0088cc',
  webchat: '#667eea',
  system: '#888',
  merged: '#764ba2',
  unknown: '#555'
}

function formatTime(ts: string) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function formatDateLabel(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (dateStr === todayStr) return 'Today'
    if (dateStr === yesterdayStr) return 'Yesterday'

    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch { return dateStr }
}

export function MemoryView() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [dates, setDates] = useState<DateEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)

  useEffect(() => {
    loadJournal()
  }, [selectedDate])

  async function loadJournal() {
    setLoading(true)
    try {
      let url = '/api/memory/journal?'
      if (selectedDate) url += `date=${selectedDate}&`
      if (search) url += `search=${encodeURIComponent(search)}&`

      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      setEntries(data.entries || [])
      if (data.dates?.length > 0) setDates(data.dates)
    } catch (error) {
      console.error('Failed to load journal:', error)
    } finally {
      setLoading(false)
    }
  }

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2 || search.length === 0) {
        loadJournal()
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: 'transparent',
      position: 'relative'
    }}>
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 20,
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8,
          color: '#fff',
          padding: '6px 10px',
          fontSize: 12,
          cursor: 'pointer',
          display: 'none'
        }}
        className="mobile-sidebar-toggle"
      >
        📅 {selectedDate ? formatDateLabel(selectedDate) : 'All Dates'}
      </button>

      {/* Date Sidebar */}
      <div style={{
        width: 130,
        minWidth: 130,
        borderRight: '1px solid rgba(255,255,255,0.08)',
        overflowY: 'auto',
        padding: '52px 0 12px',
        flexShrink: 0
      }}>
        <div style={{ padding: '0 8px', marginBottom: 10 }}>
          <div style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6
          }}>
            Journal
          </div>
          <button
            onClick={() => setSelectedDate(null)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: 6,
              border: 'none',
              background: !selectedDate ? 'rgba(102,126,234,0.2)' : 'transparent',
              color: !selectedDate ? '#667eea' : 'rgba(255,255,255,0.6)',
              fontSize: 12,
              fontWeight: !selectedDate ? 600 : 400,
              textAlign: 'left',
              cursor: 'pointer',
              marginBottom: 4
            }}
          >
            📋 All Entries
          </button>
        </div>

        <div style={{
          padding: '0 8px',
          fontSize: 10,
          color: 'rgba(255,255,255,0.3)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 6
        }}>
          By Date
        </div>

        {dates.map(({ date, count }) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            style={{
              width: '100%',
              padding: '5px 8px',
              border: 'none',
              background: selectedDate === date ? 'rgba(102,126,234,0.15)' : 'transparent',
              color: selectedDate === date ? '#667eea' : 'rgba(255,255,255,0.5)',
              fontSize: 11,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>{formatDateLabel(date)}</span>
            <span style={{
              background: selectedDate === date ? 'rgba(102,126,234,0.3)' : 'rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '1px 5px',
              fontSize: 9,
              flexShrink: 0,
              color: selectedDate === date ? '#667eea' : 'rgba(255,255,255,0.4)'
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '52px 16px 16px'
      }}>
        {/* Search Bar */}
        <div style={{ marginBottom: 16 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search journal entries..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: '#fff',
              fontSize: 13,
              outline: 'none'
            }}
          />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <div>
            <h2 style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 600,
              margin: 0
            }}>
              {selectedDate ? formatDateLabel(selectedDate) : 'All Journal Entries'}
            </h2>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              {selectedDate && ` · ${selectedDate}`}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 80,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && entries.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: 'rgba(255,255,255,0.4)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧠</div>
            <div style={{ fontSize: 14 }}>No journal entries found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {search ? 'Try a different search term' : 'Memory entries will appear here as they are created'}
            </div>
          </div>
        )}

        {/* Journal Entries */}
        {!loading && entries.map((entry) => {
          const isExpanded = expandedEntry === entry.id
          const channelColor = CHANNEL_COLORS[entry.channel] || CHANNEL_COLORS.unknown

          return (
            <div
              key={entry.id}
              onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
            >
              {/* Entry Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    marginBottom: 4
                  }}>
                    {entry.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      background: channelColor + '22',
                      color: channelColor,
                      borderRadius: 6,
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 600
                    }}>
                      {entry.channel}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                </div>
                <div style={{
                  color: 'rgba(255,255,255,0.2)',
                  fontSize: 16,
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}>
                  ▾
                </div>
              </div>

              {/* Structured Content */}
              {entry.what && !isExpanded && (
                <div style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {entry.what.slice(0, 120)}
                </div>
              )}

              {/* Expanded View */}
              {isExpanded && (
                <div style={{ marginTop: 8 }}>
                  {entry.what && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{
                        color: '#667eea',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 4
                      }}>
                        What
                      </div>
                      <div style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 13,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.what}
                      </div>
                    </div>
                  )}

                  {entry.decisions && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{
                        color: '#f59e0b',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 4
                      }}>
                        Decisions
                      </div>
                      <div style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 13,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.decisions}
                      </div>
                    </div>
                  )}

                  {entry.keyInsight && (
                    <div>
                      <div style={{
                        color: '#10b981',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 4
                      }}>
                        Key Insight
                      </div>
                      <div style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 13,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {entry.keyInsight}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .mobile-sidebar-toggle { display: block !important; }
        }
      `}</style>
    </div>
  )
}