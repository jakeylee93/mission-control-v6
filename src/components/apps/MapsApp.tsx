'use client'

type CategoryKey = 'favourites' | 'restaurants' | 'exhibition'
type PlaceIcon = 'home' | 'work'

interface Place {
  name: string
  address: string
  phone?: string
  note?: string
  type?: string
  icon?: PlaceIcon
}

interface Category {
  key: CategoryKey
  title: string
  accent: string
  places: Place[]
}

const TEXT_COLOR = '#F0EEE8'
const MUTED_COLOR = '#888'
const PANEL_COLOR = 'rgba(255,255,255,0.04)'
const BORDER_COLOR = 'rgba(255,255,255,0.08)'

const CATEGORIES: Category[] = [
  {
    key: 'favourites',
    title: 'FAVOURITES',
    accent: '#FFD700',
    places: [
      { name: 'Home', address: '60 Duke Avenue, Theydon Bois, Essex CM16 6HF', icon: 'home' },
      { name: 'TM Event Hire', address: 'Unit 16, Griffin Farm, Great Canfield, Essex CM6 1JZ', phone: '07595 979451', icon: 'work', note: 'Event equipment suppliers' },
      { name: 'N2 Group', address: 'Unit C, Foxholes Business Park, John Tate Road, Hertford SG13 7DT', icon: 'work', note: 'Print & visual communications' },
    ],
  },
  {
    key: 'restaurants',
    title: 'RESTAURANTS',
    accent: '#ef4444',
    places: [
      { name: 'Il Bacio', address: '19B Forest Drive, Theydon Bois CM16 7EX', phone: '01992 812826', type: 'Italian', note: 'Modern Italian with Sardinian influence' },
      { name: "Churchill's Fish & Chips", address: '15 Forest Drive, Theydon Bois CM16 7EX', phone: '01992 812193', type: 'Fish & Chips' },
      { name: 'Indian Ocean', address: '1 Coppice Row, Theydon Bois CM16 7ES', phone: '01992 812658', type: 'Indian' },
      { name: 'Filika', address: '13 Forest Drive, Theydon Bois CM16 7EX', phone: '01992 812000', type: 'Turkish/Mediterranean' },
    ],
  },
  {
    key: 'exhibition',
    title: 'EXHIBITION CENTRES',
    accent: '#6366f1',
    places: [
      { name: 'ExCeL London', address: 'Royal Victoria Dock, 1 Western Gateway, London E16 1XL', phone: '020 7069 5000' },
      { name: 'Olympia London', address: 'Hammersmith Road, London W14 8UX', phone: '020 7385 1200' },
      { name: 'NEC Birmingham', address: 'North Avenue, Marston Green, Birmingham B40 1NT', phone: '0121 780 4141' },
      { name: 'Alexandra Palace', address: 'Alexandra Palace Way, London N22 7AY', phone: '020 8365 2121' },
    ],
  },
]

const BackIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const HomeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const WorkIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '')
}

function getDirectionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}

export default function MapsApp({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: '0 4px', color: TEXT_COLOR }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: 12,
            color: '#aaa',
            padding: '8px 14px',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {BackIcon} Back
        </button>
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>Maps</h2>
      <p style={{ fontSize: 12, color: '#666', marginBottom: 14 }}>Tap any place for directions from your current location.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {CATEGORIES.map((category) => (
          <section key={category.key}>
            <h3
              style={{
                margin: '0 0 10px',
                fontSize: 12,
                letterSpacing: 1,
                fontWeight: 700,
                color: category.accent,
              }}
            >
              {category.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {category.places.map((place) => (
                <button
                  key={`${category.key}-${place.name}`}
                  onClick={() => window.open(getDirectionsUrl(place.address), '_blank', 'noopener,noreferrer')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: 14,
                    border: `1px solid ${BORDER_COLOR}`,
                    background: PANEL_COLOR,
                    color: TEXT_COLOR,
                    padding: '12px 14px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {place.icon && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          border: `1px solid ${category.accent}55`,
                          color: category.accent,
                          background: `${category.accent}22`,
                        }}
                      >
                        {place.icon === 'home' ? HomeIcon : WorkIcon}
                      </span>
                    )}
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{place.name}</div>
                  </div>
                  <div style={{ fontSize: 12, color: MUTED_COLOR, lineHeight: 1.45 }}>{place.address}</div>
                  {place.type && <div style={{ fontSize: 12, color: category.accent, marginTop: 6 }}>{place.type}</div>}
                  {place.phone && (
                    <div style={{ marginTop: 6 }}>
                      <a
                        href={`tel:${normalizePhone(place.phone)}`}
                        onClick={(event) => event.stopPropagation()}
                        style={{ fontSize: 12, color: '#9ecbff', textDecoration: 'none' }}
                      >
                        {place.phone}
                      </a>
                    </div>
                  )}
                  {place.note && <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>{place.note}</div>}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
