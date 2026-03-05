'use client'

import { motion } from 'framer-motion'
import type { Tab } from '@/app/page'

interface TabDef {
  id: Tab
  label: string
  activeIcon: React.ReactNode
  icon: React.ReactNode
}

const TABS: TabDef[] = [
  {
    id: 'TEAMS',
    label: 'Teams',
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="7" r="2.5" />
        <path d="M3 19c0-2.8 2.2-5 5-5s5 2.2 5 5H3z" />
        <path d="M13 19c0-2.2 1.8-4 4-4s4 1.8 4 4h-8z" />
      </svg>
    ),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="7" r="2.5" />
        <path d="M3 19c0-2.8 2.2-5 5-5s5 2.2 5 5H3z" />
        <path d="M13 19c0-2.2 1.8-4 4-4s4 1.8 4 4h-8z" />
      </svg>
    ),
  },
  {
    id: 'PLANS',
    label: 'Plans',
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2" />
        <path d="m9 14 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 14h6M9 18h4" />
      </svg>
    ),
  },
  {
    id: 'BRAIN',
    label: 'Brain',
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="w-5 h-5">
        <path d="M9.5 8.5c0-2.3 1.6-4 3.8-4 1.8 0 3.2 1.1 3.7 2.8a3.2 3.2 0 0 1 2.9 3.2c0 2-1.6 3.6-3.6 3.6h-1" />
        <path d="M14.5 15.7A3.7 3.7 0 0 1 8.2 18a3 3 0 0 1-3.1-3 3 3 0 0 1 2.1-2.9V11a4 4 0 0 1 7.2-2.4" />
      </svg>
    ),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M9.5 8.5c0-2.3 1.6-4 3.8-4 1.8 0 3.2 1.1 3.7 2.8a3.2 3.2 0 0 1 2.9 3.2c0 2-1.6 3.6-3.6 3.6h-1" />
        <path d="M14.5 15.7A3.7 3.7 0 0 1 8.2 18a3 3 0 0 1-3.1-3 3 3 0 0 1 2.1-2.9V11a4 4 0 0 1 7.2-2.4" />
      </svg>
    ),
  },
  {
    id: 'DOCS',
    label: 'Docs',
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5" fill="var(--c-bg)" />
      </svg>
    ),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5" />
      </svg>
    ),
  },
  {
    id: 'BELONGINGS',
    label: 'Belongings',
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M4 7h16v12H4z" />
        <path d="M9 4h6v3H9z" />
      </svg>
    ),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M4 7h16v12H4z" />
        <path d="M9 4h6v3H9z" />
      </svg>
    ),
  },
  {
    id: 'PROPERTY',
    label: 'Property',
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3z" />
      </svg>
    ),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3z" />
      </svg>
    ),
  },
  {
    id: 'CAPTURE',
    label: 'Capture',
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
      </svg>
    ),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    id: 'SYSTEM',
    label: 'System',
    activeIcon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12A6 6 0 0 1 12 6zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
      </svg>
    ),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
]

interface Props {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  time: Date
  isDayMode: boolean
  toggleMode: () => void
}

export default function Navigation({ activeTab, setActiveTab, time, isDayMode, toggleMode }: Props) {
  const timeStr = time.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const dateStr = time.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm"
      style={{
        background: 'var(--c-bg)',
        borderBottom: '1px solid var(--c-border)',
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div
        className="flex items-center justify-between px-4 md:px-6 max-w-[1400px] mx-auto"
        style={{ height: '48px' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{ background: '#FFD700' }}
          >
            <span className="text-black text-xs font-bold leading-none">MC</span>
          </div>
          <span
            className="text-sm font-semibold hidden sm:block font-heading"
            style={{ color: 'var(--c-text)' }}
          >
            Mission Control
          </span>
          <span style={{ color: 'var(--c-dim)' }} className="text-xs font-mono hidden md:block">
            v6.3
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-mono tracking-wider" style={{ color: 'var(--c-text)' }}>
              {timeStr}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--c-dim)' }}>
              {dateStr}
            </div>
          </div>
          <button
            onClick={toggleMode}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: 'var(--c-panel)',
              border: '1px solid var(--c-border)',
              color: isDayMode ? '#F59E0B' : '#A855F7',
            }}
            title={isDayMode ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          >
            {isDayMode ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        className="flex items-stretch max-w-[1400px] mx-auto"
        style={{
          height: '52px',
          borderTop: '1px solid var(--c-border)',
        }}
      >
        {TABS.map(({ id, label, icon, activeIcon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 relative transition-all duration-150 active:scale-95"
              style={{ color: isActive ? '#FFD700' : 'var(--c-muted)' }}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-x-3 inset-y-1.5 rounded-xl"
                  style={{ background: 'rgba(255,215,0,0.07)' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="tab-dot"
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: '#FFD700', boxShadow: '0 0 6px rgba(255,215,0,0.8)' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                />
              )}
              <div className="relative z-10">
                {isActive ? activeIcon : icon}
              </div>
              <span
                className="text-[9px] font-semibold tracking-wider relative z-10 uppercase hidden sm:block"
                style={{ letterSpacing: '0.08em' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </header>
  )
}
