interface IconProps {
  size?: number
  color?: string
}

export function BeerIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Beer glass with handle */}
      <path d="M8 8h16v22a2 2 0 01-2 2H10a2 2 0 01-2-2V8z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 12h4a2 2 0 012 2v6a2 2 0 01-2 2h-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Foam */}
      <path d="M8 8c0-2 1-4 4-4s3 3 5 3 3-3 5-3 4 2 4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Bubbles */}
      <circle cx="13" cy="20" r="1" fill={color} opacity="0.4"/>
      <circle cx="18" cy="16" r="1.2" fill={color} opacity="0.3"/>
      <circle cx="15" cy="25" r="0.8" fill={color} opacity="0.3"/>
    </svg>
  )
}

export function WineIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bowl */}
      <path d="M10 6h16l-2 10c-.5 3-3 5-6 5s-5.5-2-6-5L10 6z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Stem */}
      <line x1="18" y1="21" x2="18" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Base */}
      <path d="M12 29h12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Wine level */}
      <path d="M11.5 12h13" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </svg>
  )
}

export function SpiritsIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tumbler glass - wider at top */}
      <path d="M9 6h18l-2 24H11L9 6z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Liquid level */}
      <path d="M12.5 18h11" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      {/* Ice cubes */}
      <rect x="14" y="20" width="4" height="3" rx="0.5" stroke={color} strokeWidth="1" opacity="0.5"/>
      <rect x="19" y="22" width="3.5" height="3" rx="0.5" stroke={color} strokeWidth="1" opacity="0.4"/>
    </svg>
  )
}

export function CocktailIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Martini glass */}
      <path d="M6 6h24L18 20v9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Base */}
      <path d="M12 29h12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Liquid */}
      <path d="M10 10h16" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      {/* Olive/garnish */}
      <circle cx="22" cy="8" r="1.5" stroke={color} strokeWidth="1" opacity="0.6"/>
      <line x1="22" y1="4" x2="22" y2="6.5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    </svg>
  )
}

export function SoftDrinkIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tall glass */}
      <path d="M11 4h14l-1 26H12L11 4z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Straw */}
      <line x1="21" y1="2" x2="19" y2="18" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      {/* Bubbles */}
      <circle cx="15" cy="20" r="0.8" fill={color} opacity="0.3"/>
      <circle cx="18" cy="24" r="1" fill={color} opacity="0.3"/>
      <circle cx="20" cy="21" r="0.6" fill={color} opacity="0.25"/>
      <circle cx="16" cy="26" r="0.7" fill={color} opacity="0.3"/>
    </svg>
  )
}

export function WaterIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Water glass */}
      <path d="M10 5h16l-1.5 24a2 2 0 01-2 2h-9a2 2 0 01-2-2L10 5z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Water level */}
      <path d="M11.2 14c1.5 1 3 1.5 4.5 0s3 -1 4.5 0 3 1 4.3 0" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      {/* Water drop */}
      <path d="M18 19c-1.5 2-3 4-3 5.5a3 3 0 006 0c0-1.5-1.5-3.5-3-5.5z" fill={color} opacity="0.25"/>
    </svg>
  )
}

// Food category icons
export function BreakfastIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Coffee cup */}
      <path d="M6 14h18v12a4 4 0 01-4 4H10a4 4 0 01-4-4V14z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 17h3a3 3 0 010 6h-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Steam */}
      <path d="M11 10c0-2 2-2 2-4" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      <path d="M15 10c0-2 2-2 2-4" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      <path d="M19 10c0-2 2-2 2-4" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      {/* Saucer */}
      <path d="M4 30h22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function LunchIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sandwich - bottom bread */}
      <path d="M6 22h24l-2 6H8L6 22z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Top bread */}
      <path d="M6 22c0-5 5-10 12-10s12 5 12 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Filling layers */}
      <path d="M7 20h22" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      <path d="M7.5 18c2 1 4 0 6 1s4 0 6 1 4-1 6 0" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
    </svg>
  )
}

export function DinnerIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Plate */}
      <ellipse cx="18" cy="22" rx="14" ry="6" stroke={color} strokeWidth="1.5"/>
      <ellipse cx="18" cy="22" rx="9" ry="3.5" stroke={color} strokeWidth="1" opacity="0.3"/>
      {/* Fork */}
      <path d="M8 4v10M6 4v6a2 2 0 002 2M10 4v6a2 2 0 01-2 2" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      {/* Knife */}
      <path d="M28 4v12M28 4c2 0 3 2 3 4s-1 4-3 4" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    </svg>
  )
}

export function SnackIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Apple shape */}
      <path d="M18 8c-6 0-10 5-10 12s4 12 10 12 10-5 10-12S24 8 18 8z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Stem */}
      <path d="M18 8c0-3 2-5 4-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      {/* Leaf */}
      <path d="M20 4c2 0 4 1 4 3s-2 2-4 1" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
      {/* Highlight */}
      <path d="M13 16c0-3 2-5 4-5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.25"/>
    </svg>
  )
}
