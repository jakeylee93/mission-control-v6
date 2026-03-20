'use client'

import { TabId } from '@/components/types'

interface TabBarProps {
  activeTab: TabId
  accent: string
  onTabChange: (tab: TabId) => void
}

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'chat', label: 'Chat', icon: '◉' },
  { id: 'memory', label: 'Memory', icon: '◌' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export function TabBar({ activeTab, onTabChange, accent }: TabBarProps) {
  return (
    <nav className="mx-3 mb-2 grid h-[8vh] min-h-[58px] grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.04] px-1 backdrop-blur-xl">
      {TABS.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex flex-col items-center justify-center rounded-xl text-[10px] uppercase tracking-[0.08em] text-white/70 transition-colors"
            style={{ color: active ? accent : undefined }}
          >
            <span className="text-base leading-none">{tab.icon}</span>
            <span className="mt-1">{tab.label}</span>
            {active && (
              <span
                className="absolute bottom-1 h-1 w-8 rounded-full"
                style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}` }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
