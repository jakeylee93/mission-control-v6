'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type TabId = 'business' | 'personal' | 'laboratory'

interface Agent {
  id: string
  name: string
  role: string
  model: string
  provider: string
  avatar: string
  accent: string
  monthSpend: string
  lastActive: string
}

const AGENTS: Agent[] = [
  { id: 'marg', name: 'Margarita', role: 'Orchestrator', model: 'Claude Opus', provider: 'Anthropic', avatar: '/images/marg.png', accent: '#FFD700', monthSpend: '£847.20', lastActive: 'Just now' },
  { id: 'doc', name: 'Doc', role: 'Builder', model: 'Codex', provider: 'OpenAI', avatar: '/images/doc.png', accent: '#60A5FA', monthSpend: '£124.50', lastActive: '2h ago' },
  { id: 'cindy', name: 'Cindy', role: 'Assistant', model: 'Kimi (Moonshot)', provider: 'Moonshot', avatar: '/images/cindy.png', accent: '#C084FC', monthSpend: '£31.80', lastActive: '5h ago' },
]

interface AppIcon {
  emoji: string
  label: string
  color: string
  href?: string
}

const BUSINESS_APPS: AppIcon[] = [
  { emoji: '📧', label: 'Email', color: '#3b82f6' },
  { emoji: '📅', label: 'Calendar', color: '#10b981' },
  { emoji: '💷', label: 'Costs', color: '#f59e0b' },
  { emoji: '📊', label: 'Analytics', color: '#8b5cf6' },
  { emoji: '📋', label: 'Tasks', color: '#ef4444' },
  { emoji: '👥', label: 'Contacts', color: '#06b6d4' },
  { emoji: '📄', label: 'Documents', color: '#64748b' },
  { emoji: '🔔', label: 'Alerts', color: '#f43f5e' },
  { emoji: '🌐', label: 'Websites', color: '#6366f1', href: 'https://anyos.co.uk/portfolio' },
  { emoji: '💬', label: 'Messages', color: '#22c55e' },
]

const PERSONAL_APPS: AppIcon[] = [
  { emoji: '☀️', label: 'Weather', color: '#f59e0b' },
  { emoji: '🏋️', label: 'Health', color: '#ef4444' },
  { emoji: '🎵', label: 'Music', color: '#ec4899' },
  { emoji: '📸', label: 'Photos', color: '#8b5cf6' },
  { emoji: '🗺️', label: 'Maps', color: '#10b981' },
  { emoji: '📝', label: 'Notes', color: '#f59e0b' },
  { emoji: '🛒', label: 'Shopping', color: '#06b6d4' },
  { emoji: '🏠', label: 'Home', color: '#64748b' },
  { emoji: '📚', label: 'Reading', color: '#a855f7' },
  { emoji: '🎮', label: 'Downtime', color: '#6366f1' },
]

const LAB_APPS: AppIcon[] = [
  { emoji: '🤖', label: 'Agents', color: '#6366f1' },
  { emoji: '🧠', label: 'Memory', color: '#ec4899' },
  { emoji: '⚙️', label: 'Settings', color: '#64748b' },
  { emoji: '📡', label: 'APIs', color: '#10b981' },
  { emoji: '🔧', label: 'Tools', color: '#f59e0b' },
  { emoji: '🧪', label: 'Playground', color: '#8b5cf6' },
  { emoji: '📈', label: 'Usage', color: '#ef4444' },
  { emoji: '🔄', label: 'Automations', color: '#06b6d4' },
  { emoji: '🗄️', label: 'Database', color: '#22c55e' },
  { emoji: '📦', label: 'Deploy', color: '#3b82f6' },
]

const TAB_APPS: Record<TabId, AppIcon[]> = {
  business: BUSINESS_APPS,
  personal: PERSONAL_APPS,
  laboratory: LAB_APPS,
}

const TAB_META: Record<TabId, { label: string; emoji: string }> = {
  business: { label: 'Business', emoji: '🏢' },
  personal: { label: 'Personal', emoji: '🏠' },
  laboratory: { label: 'Laboratory', emoji: '🧪' },
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${agent.accent}20`,
      borderRadius: 20,
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: `linear-gradient(145deg, ${agent.accent}20, ${agent.accent}08)`,
        border: `1.5px solid ${agent.accent}30`,
        overflow: 'hidden', flexShrink: 0,
      }}>
        <Image src={agent.avatar} alt={agent.name} width={56} height={56} style={{ width: 56, height: 56, objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{agent.name}</span>
          <span style={{ fontSize: 11, color: '#666', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 6 }}>{agent.role}</span>
        </div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{agent.model} · {agent.provider}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          <span style={{ color: agent.accent, fontWeight: 700 }}>{agent.monthSpend}</span>
          <span style={{ color: '#555' }}>this month</span>
          <span style={{ color: '#444', marginLeft: 'auto' }}>{agent.lastActive}</span>
        </div>
      </div>
    </div>
  )
}

function AppIconButton({ app }: { app: AppIcon }) {
  const handleClick = () => {
    if (app.href) {
      window.open(app.href, '_blank')
    }
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 8, borderRadius: 16, transition: 'transform 0.1s',
        WebkitTapHighlightColor: 'transparent',
      }}
      className="app-icon-btn"
    >
      <div style={{
        width: 60, height: 60, borderRadius: 16,
        background: `${app.color}15`,
        border: `1px solid ${app.color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28,
        transition: 'all 0.2s',
      }}>
        {app.emoji}
      </div>
      <span style={{ fontSize: 11, color: '#999', fontWeight: 500, letterSpacing: 0.2 }}>
        {app.label}
      </span>
    </button>
  )
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('business')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateFmt = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeFmt = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const apps = TAB_APPS[activeTab]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
      color: '#F0EEE8',
      fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '5%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 500, margin: '0 auto', padding: '0 20px',
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh', width: '100%',
      }}>
        {/* Header */}
        <header style={{ paddingTop: 48, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ color: '#555', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            {dayName} · {dateFmt}
          </div>
          <h1 style={{
            fontSize: 40, fontWeight: 700, margin: 0, letterSpacing: -1,
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          }}>Jake</h1>
          <div style={{ color: '#666', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 }}>
            Mission Control
          </div>
          <div style={{
            fontSize: 30, fontWeight: 200, fontFamily: 'monospace',
            letterSpacing: 3, marginTop: 8, opacity: 0.7,
          }}>{timeFmt}</div>
        </header>

        {/* Agent Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {AGENTS.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
          {/* Total spend */}
          <div style={{
            textAlign: 'center', fontSize: 12, color: '#555', marginTop: 4,
          }}>
            Total this month: <span style={{ color: '#6366f1', fontWeight: 700 }}>£1,003.50</span>
          </div>
        </div>

        {/* App Grid */}
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '24px 24px 0 0',
          border: '1px solid rgba(255,255,255,0.05)',
          borderBottom: 'none',
          padding: '24px 16px 120px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 4,
            justifyItems: 'center',
          }}>
            {apps.map((app, i) => (
              <AppIconButton key={i} app={app} />
            ))}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(10,8,18,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'center',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingTop: 10,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', gap: 0, maxWidth: 400, width: '100%', justifyContent: 'space-around' }}>
          {(['business', 'personal', 'laboratory'] as TabId[]).map(tab => {
            const isActive = activeTab === tab
            const meta = TAB_META[tab]
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 16px',
                  opacity: isActive ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                }}
              >
                <span style={{ fontSize: 20 }}>{meta.emoji}</span>
                <span style={{
                  fontSize: 10, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#6366f1' : '#888',
                  letterSpacing: 0.5,
                }}>{meta.label}</span>
                {isActive && (
                  <div style={{
                    width: 4, height: 4, borderRadius: 2,
                    background: '#6366f1', marginTop: 1,
                  }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        .app-icon-btn:active { transform: scale(0.92); }
        .app-icon-btn:active > div:first-child { background: rgba(255,255,255,0.08) !important; }
      `}</style>
    </div>
  )
}
