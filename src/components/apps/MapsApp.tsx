'use client'

import { useEffect, useState } from 'react'

type CategoryKey = 'favourites' | 'restaurants' | 'pubs' | 'friends' | 'suppliers' | 'exhibition'

interface Place {
  name: string
  address: string
  phone: string
  note?: string
  type?: string
}

interface Category {
  key: CategoryKey
  title: string
  accent: string
  places: Place[]
}

interface UpcomingEvent {
  summary: string
  location: string
  start: string
  end: string
}

const TEXT_COLOR = '#F0EEE8'
const MUTED_COLOR = '#888'
const PANEL_COLOR = 'rgba(255,255,255,0.04)'
const BORDER_COLOR = 'rgba(255,255,255,0.08)'

const HOME_ADDRESS = '60 Dukes Avenue, CM16 7HF'

function getRouteFromHomeUrl(name: string, address: string) {
  const origin = encodeURIComponent(HOME_ADDRESS)
  const destination = encodeURIComponent(address)
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
}

function getPlaceSearchUrl(name: string, address: string) {
  const query = encodeURIComponent(address).replace(/%20/g, '+')
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

function getAccentBackground(accent: string) {
  if (!accent.startsWith('#') || accent.length !== 7) return 'rgba(255,255,255,0.2)'
  const r = Number.parseInt(accent.slice(1, 3), 16)
  const g = Number.parseInt(accent.slice(3, 5), 16)
  const b = Number.parseInt(accent.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.2)`
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase()
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '')
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isToday = d.toDateString() === now.toDateString()
  const isTomorrow = d.toDateString() === tomorrow.toDateString()

  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  if (isToday) return `Today ${time}`
  if (isTomorrow) return `Tomorrow ${time}`
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ` ${time}`
}

const CATEGORIES: Category[] = [
  {
    key: 'favourites',
    title: 'FAVOURITES',
    accent: '#FFD700',
    places: [
      { name: 'Home', address: '60 Dukes Avenue, CM16 7HF', phone: '01921 812793', note: 'Home' },
    ],
  },
  {
    key: 'exhibition',
    title: 'EXHIBITION CENTRES',
    accent: '#6366f1',
    places: [
      { name: 'NAEC Stoneleigh', address: 'Stoneleigh Park, Kenilworth CV8 2LZ', phone: '024 7669 6969', note: 'National Agricultural & Exhibition Centre' },
      { name: 'ExCeL London', address: 'Royal Victoria Dock, 1 Western Gateway, London E16 1XL', phone: '020 7069 5000' },
      { name: 'Olympia London', address: 'Hammersmith Road, Kensington, London W14 8UX', phone: '020 7385 1200' },
      { name: 'NEC Birmingham', address: 'North Avenue, Marston Green, Birmingham B40 1NT', phone: '0121 780 4141' },
      { name: 'Alexandra Palace', address: 'Alexandra Palace Way, Muswell Hill, London N22 7AY', phone: '020 8365 2121' },
      { name: 'Manchester Central', address: 'Windmill Street, Manchester M2 3GX', phone: '0161 834 2700' },
      { name: 'ACC Liverpool', address: "King's Dock, Liverpool L3 4FP", phone: '0151 475 8888' },
    ],
  },
  {
    key: 'suppliers',
    title: 'SUPPLIERS',
    accent: '#10b981',
    places: [
      { name: 'TM Event Hire', address: 'Unit 16, Griffin Farm, Great Canfield, Essex CM6 1JZ', phone: '07595 979451', note: 'Event equipment suppliers' },
      { name: 'N2 Group', address: 'Unit C, Foxholes Business Park, John Tate Road, Hertford SG13 7DT', phone: '01992 440333', note: 'Print & visual communications' },
    ],
  },
  {
    key: 'restaurants',
    title: 'RESTAURANTS',
    accent: '#ef4444',
    places: [
      { name: 'Il Bacio', address: '19B Forest Drive, Theydon Bois, Epping CM16 7EX', phone: '01992 812826', type: 'Italian', note: 'Modern Italian with Sardinian influence' },
      { name: 'Churchills Fish & Chips', address: '15 Forest Drive, Theydon Bois, Epping CM16 7EX', phone: '01992 812193', type: 'Fish & Chips' },
      { name: 'Indian Ocean', address: '1 Coppice Row, Theydon Bois CM16 7ES', phone: '01992 812658', type: 'Indian' },
      { name: 'Filika', address: '13 Forest Drive, Theydon Bois, Epping CM16 7EX', phone: '01992 812000', type: 'Turkish/Mediterranean' },
      { name: 'Theydon Bois Balti House', address: 'Station Approach, Coppice Row, Theydon Bois CM16 7HR', phone: '01992 813850', type: 'Indian/Balti' },
    ],
  },
  {
    key: 'pubs',
    title: 'PUBS',
    accent: '#f59e0b',
    places: [],
  },
  {
    key: 'friends',
    title: 'FRIENDS',
    accent: '#ec4899',
    places: [],
  },
]

const BackIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronDown = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ChevronRight = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export default function MapsApp({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<{ place: Place; accent: string } | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['favourites']))
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  // Fetch upcoming events with locations from calendar
  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const res = await fetch('/api/calendar/events')
        if (res.ok) {
          const data = await res.json()
          const events = (data.events || [])
            .filter((e: any) => e.location && e.location.trim().length > 0)
            .filter((e: any) => new Date(e.start) >= new Date())
            .slice(0, 5)
            .map((e: any) => ({
              summary: e.summary || e.title || 'Event',
              location: e.location,
              start: e.start,
              end: e.end,
            }))
          setUpcomingEvents(events)
        }
      } catch (err) {
        console.error('Failed to load upcoming events:', err)
      } finally {
        setLoadingEvents(false)
      }
    }
    fetchUpcoming()
  }, [])

  useEffect(() => {
    if (!selected) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [selected])

  function toggleCategory(key: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const closeModal = () => setSelected(null)

  return (
    <div style={{ padding: '0 4px', color: TEXT_COLOR }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12,
          color: '#aaa', padding: '8px 14px', fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {BackIcon} Back
        </button>
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>Maps</h2>
      <p style={{ fontSize: 12, color: MUTED_COLOR, marginBottom: 14 }}>Your places and upcoming locations.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Favourites — always visible, not collapsible */}
        <section style={{ marginBottom: 4 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: '#FFD700', textTransform: 'uppercase' }}>
            FAVOURITES
          </h3>
          {CATEGORIES[0].places.map((place) => (
            <button key={place.name} onClick={() => setSelected({ place, accent: '#FFD700' })} style={{
              width: '100%', textAlign: 'left', borderRadius: 12,
              border: `1px solid ${BORDER_COLOR}`, background: PANEL_COLOR,
              color: TEXT_COLOR, padding: '10px 12px', cursor: 'pointer', marginBottom: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,215,0,0.2)', color: '#FFD700',
                  fontSize: 16, fontWeight: 700, flexShrink: 0,
                }}>{getInitial(place.name)}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{place.name}</div>
                  <div style={{ fontSize: 11, color: MUTED_COLOR }}>{place.address}</div>
                </div>
              </div>
            </button>
          ))}
        </section>

        {/* Upcoming — from calendar */}
        <section style={{ marginBottom: 4 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase' }}>
            UPCOMING
          </h3>
          {loadingEvents ? (
            <div style={{ padding: '12px', borderRadius: 12, border: `1px solid ${BORDER_COLOR}`, background: PANEL_COLOR, color: MUTED_COLOR, fontSize: 12, textAlign: 'center' }}>
              Loading calendar...
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div style={{ padding: '12px', borderRadius: 12, border: `1px solid ${BORDER_COLOR}`, background: PANEL_COLOR, color: MUTED_COLOR, fontSize: 12, textAlign: 'center' }}>
              No upcoming events with locations
            </div>
          ) : (
            upcomingEvents.map((event, idx) => (
              <button key={idx} onClick={() => setSelected({
                place: { name: event.summary, address: event.location, phone: '' },
                accent: '#22c55e'
              })} style={{
                width: '100%', textAlign: 'left', borderRadius: 12,
                border: `1px solid ${BORDER_COLOR}`, background: PANEL_COLOR,
                color: TEXT_COLOR, padding: '10px 12px', cursor: 'pointer', marginBottom: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(34,197,94,0.2)', color: '#22c55e',
                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>{getInitial(event.summary)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.summary}</div>
                    <div style={{ fontSize: 11, color: MUTED_COLOR, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.location}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {formatEventDate(event.start)}
                  </div>
                </div>
              </button>
            ))
          )}
        </section>

        {/* Collapsible categories */}
        {CATEGORIES.slice(1).map((category) => {
          const isExpanded = expandedCategories.has(category.key)
          return (
            <section key={category.key}>
              <button onClick={() => toggleCategory(category.key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: PANEL_COLOR, border: `1px solid ${BORDER_COLOR}`, borderRadius: 12,
                padding: '12px 14px', cursor: 'pointer', color: TEXT_COLOR,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: 7,
                    background: getAccentBackground(category.accent), color: category.accent,
                    fontSize: 13, fontWeight: 700,
                  }}>{category.places.length}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>{category.title}</span>
                </div>
                <span style={{ color: MUTED_COLOR, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(0)' : 'rotate(-90deg)' }}>
                  {ChevronDown}
                </span>
              </button>

              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, paddingLeft: 4 }}>
                  {category.places.length === 0 && (
                    <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', color: MUTED_COLOR, fontSize: 12, textAlign: 'center' }}>
                      No places added yet
                    </div>
                  )}
                  {category.places.map((place) => (
                    <button
                      key={`${category.key}-${place.name}`}
                      onClick={() => setSelected({ place, accent: category.accent })}
                      style={{
                        width: '100%', textAlign: 'left', borderRadius: 10,
                        border: `1px solid ${BORDER_COLOR}`, background: 'rgba(255,255,255,0.02)',
                        color: TEXT_COLOR, padding: '10px 12px', cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 30, height: 30, borderRadius: 8,
                          background: getAccentBackground(category.accent), color: category.accent,
                          fontSize: 14, fontWeight: 700, flexShrink: 0,
                        }}>{getInitial(place.name)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{place.name}</div>
                          <div style={{ fontSize: 11, color: MUTED_COLOR, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.address}</div>
                        </div>
                        <span style={{ color: MUTED_COLOR }}>{ChevronRight}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {/* Place Detail Modal */}
      {selected && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            position: 'fixed', left: 0, right: 0, bottom: 0,
            background: '#0f0f10', borderRadius: '22px 22px 0 0',
            borderTop: `1px solid ${BORDER_COLOR}`,
            padding: '20px 18px 18px', maxHeight: '80vh', overflowY: 'auto',
          }}>
            <button onClick={closeModal} style={{
              position: 'absolute', top: 12, right: 12, border: 'none',
              background: 'rgba(255,255,255,0.08)', color: TEXT_COLOR,
              width: 32, height: 32, borderRadius: 999, fontSize: 18, lineHeight: 1, cursor: 'pointer',
            }} aria-label="Close">×</button>

            <h3 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: TEXT_COLOR }}>{selected.place.name}</h3>
            <div style={{ fontSize: 13, color: MUTED_COLOR, lineHeight: 1.5, marginBottom: 10 }}>{selected.place.address}</div>

            {selected.place.phone && (
              <div style={{ marginBottom: 10 }}>
                <a href={`tel:${normalizePhone(selected.place.phone)}`} style={{ fontSize: 13, color: '#9ecbff', textDecoration: 'none' }}>
                  {selected.place.phone}
                </a>
              </div>
            )}

            {selected.place.type && (
              <div style={{ fontSize: 12, color: selected.accent, fontWeight: 700, letterSpacing: 0.3, marginBottom: 8 }}>{selected.place.type}</div>
            )}

            {selected.place.note && <div style={{ fontSize: 13, color: '#bbb', lineHeight: 1.5, marginBottom: 16 }}>{selected.place.note}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => window.open(getPlaceSearchUrl(selected.place.name, selected.place.address), '_blank', 'noopener,noreferrer')} style={{
                  flex: 1, border: 'none', borderRadius: 12, padding: '12px 14px',
                  fontSize: 14, fontWeight: 700, color: '#fff', background: selected.accent, cursor: 'pointer',
                }}>Navigate</button>

                {selected.place.phone && (
                  <a href={`tel:${normalizePhone(selected.place.phone)}`} style={{
                    flex: 1, borderRadius: 12, padding: '12px 14px', fontSize: 14, fontWeight: 700,
                    color: selected.accent, border: `1px solid ${selected.accent}`,
                    textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>Call</a>
                )}
              </div>

              {selected.place.name !== 'Home' && (
                <button onClick={() => window.open(getRouteFromHomeUrl(selected.place.name, selected.place.address), '_blank', 'noopener,noreferrer')} style={{
                  width: '100%', border: 'none', borderRadius: 12, padding: '12px 14px',
                  fontSize: 13, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.08)', cursor: 'pointer',
                }}>Route from Home</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
