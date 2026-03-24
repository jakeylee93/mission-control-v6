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

// Medication icons
export function PillIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pill tablet - oval shape */}
      <rect x="8" y="12" width="20" height="12" rx="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Dividing line */}
      <line x1="18" y1="12" x2="18" y2="24" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      {/* Shine */}
      <path d="M12 16c0-1 1-2 2-2" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
    </svg>
  )
}

export function VitaminIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Capsule - vertical */}
      <rect x="12" y="4" width="12" height="28" rx="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Dividing line */}
      <line x1="12" y1="18" x2="24" y2="18" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      {/* Top half fill */}
      <path d="M12.5 18V10a5.5 5.5 0 0111 0v8" fill={color} opacity="0.15"/>
      {/* Shine */}
      <path d="M15 10c0-1.5 1-3 2.5-3" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
    </svg>
  )
}

export function PrescriptionIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Medicine bottle */}
      <rect x="9" y="10" width="18" height="22" rx="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Cap */}
      <rect x="11" y="6" width="14" height="5" rx="1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Label area */}
      <rect x="12" y="16" width="12" height="10" rx="1" stroke={color} strokeWidth="1" opacity="0.4"/>
      {/* Cross on label */}
      <line x1="18" y1="18" x2="18" y2="24" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <line x1="15" y1="21" x2="21" y2="21" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

export function FirstAidIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cross shape */}
      <rect x="13" y="6" width="10" height="24" rx="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="6" y="13" width="24" height="10" rx="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Inner glow */}
      <rect x="13" y="13" width="10" height="10" fill={color} opacity="0.1"/>
    </svg>
  )
}

// Exercise icons
export function DumbbellIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bar */}
      <line x1="8" y1="18" x2="28" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {/* Left weights */}
      <rect x="4" y="12" width="5" height="12" rx="1.5" stroke={color} strokeWidth="1.5"/>
      <rect x="7" y="14" width="3" height="8" rx="1" stroke={color} strokeWidth="1.2" opacity="0.6"/>
      {/* Right weights */}
      <rect x="27" y="12" width="5" height="12" rx="1.5" stroke={color} strokeWidth="1.5"/>
      <rect x="26" y="14" width="3" height="8" rx="1" stroke={color} strokeWidth="1.2" opacity="0.6"/>
    </svg>
  )
}

export function RunningIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="22" cy="6" r="3" stroke={color} strokeWidth="1.5"/>
      {/* Torso */}
      <path d="M20 12l-4 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Arms */}
      <path d="M14 14l6-2 6 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Legs */}
      <path d="M16 20l-6 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 20l4 6 4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Motion lines */}
      <line x1="6" y1="10" x2="10" y2="10" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
      <line x1="4" y1="14" x2="9" y2="14" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.25"/>
    </svg>
  )
}

export function FootstepsIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left footprint */}
      <path d="M11 14c-2-1-3-4-2.5-7S11 3 13 4s3 4 2.5 7S13 15 11 14z" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="11" cy="17" rx="2.5" ry="1.5" stroke={color} strokeWidth="1.2" opacity="0.6"/>
      {/* Right footprint */}
      <path d="M23 24c-2-1-3-4-2.5-7S23 13 25 14s3 4 2.5 7S25 25 23 24z" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="23" cy="27" rx="2.5" ry="1.5" stroke={color} strokeWidth="1.2" opacity="0.6"/>
      {/* Toe dots left */}
      <circle cx="9" cy="6" r="1" fill={color} opacity="0.4"/>
      <circle cx="14.5" cy="5.5" r="1" fill={color} opacity="0.35"/>
      {/* Toe dots right */}
      <circle cx="21" cy="16" r="1" fill={color} opacity="0.4"/>
      <circle cx="26.5" cy="15.5" r="1" fill={color} opacity="0.35"/>
    </svg>
  )
}

export function SportsIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ball */}
      <circle cx="18" cy="18" r="12" stroke={color} strokeWidth="1.5"/>
      {/* Seam lines */}
      <path d="M6 18c4-3 8-3 12 0s8 3 12 0" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
      <path d="M18 6c-3 4-3 8 0 12s3 8 0 12" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
      {/* Highlight */}
      <path d="M12 12c0-2 2-3 3-3" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.25"/>
    </svg>
  )
}

export function ActivityIcon({ size = 36, color = '#e0e0e0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Heart rate / activity line */}
      <path d="M4 18h6l3-8 4 16 4-12 3 4h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Pulse dots */}
      <circle cx="18" cy="18" r="1.5" fill={color} opacity="0.3"/>
      {/* Subtle circle */}
      <circle cx="18" cy="18" r="14" stroke={color} strokeWidth="1" opacity="0.15"/>
    </svg>
  )
}
