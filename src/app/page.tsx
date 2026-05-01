'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import LovelyTab from '@/components/tabs/LovelyTab'
import MapsApp from '@/components/apps/MapsApp'
import { HealthApp } from '@/components/HealthApp'
import { MemoryView } from '@/components/tabs/MemoryView'
import DocsTab from '@/components/tabs/DocsTab'
import PlansTab from '@/components/tabs/PlansTab'
import NewsHubApp from '@/components/apps/NewsHubApp'
import MediaListApp from '@/components/apps/MediaListApp'
import SkillShopApp from '@/components/apps/SkillShopApp'
import AppRoadmapApp from '@/components/apps/AppRoadmapApp'
import { useTheme } from '@/lib/theme'

type SpaceId = 'today' | 'work' | 'life' | 'lab' | 'review'
type ActiveApp = string | null
type QuickChatMessage = { role: 'user' | 'assistant'; content: string }

interface Agent {
  id: string; name: string; role: string; model: string; provider: string
  avatar: string; thumbnail: string; accent: string; monthSpend: string; lastActive: string; weekSummary: string
}

const AGENTS: Agent[] = [
  { id: 'marg', name: 'Margarita', role: 'Orchestrator', model: 'Claude Opus', provider: 'Anthropic', avatar: '/images/marg-robot.png', thumbnail: '/images/marg-robot.png', accent: '#FFD700', monthSpend: '£847.20', lastActive: 'Just now', weekSummary: 'Health app, Media List, Maps redesign' },
  { id: 'doc', name: 'Doc', role: 'Builder', model: 'Codex', provider: 'OpenAI', avatar: '/images/doc-robot.png', thumbnail: '/images/doc-robot.png', accent: '#60A5FA', monthSpend: '£124.50', lastActive: '2h ago', weekSummary: 'Mission Control builds' },
  { id: 'cindy', name: 'Cindy', role: 'Assistant', model: 'Kimi (Moonshot)', provider: 'Moonshot', avatar: '/images/cindy-robot.png', thumbnail: '/images/cindy-robot.png', accent: '#C084FC', monthSpend: '£31.80', lastActive: '5h ago', weekSummary: 'Calendar & contacts' },
]

/* ── SVG Icons ── */
const I = {
  email: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  costs: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  tasks: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  weather: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>,
  health: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  notes: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  news: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9h4"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
  agents: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>,
  memory: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  usage: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  chevronRight: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  mapPin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  zap: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  lovely: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  flask: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v7l5 8a3 3 0 0 1-2.5 4.5h-11A3 3 0 0 1 4 18l5-8V3z"/><line x1="9" y1="3" x2="15" y2="3"/></svg>,
  briefcase: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  command: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>,
}

interface CalEvent { summary?: string; title?: string; start: string; end: string; location?: string; color?: string; calendar?: string; isAllDay?: boolean }

interface WeatherData {
  temp: number
  condition: string
  icon: string
  location: string
  forecast: { day: string; temp: number; condition: string; icon: string }[]
}

let calCache: { events: CalEvent[]; fetchedAt: number } | null = null
const CACHE_TTL = 60 * 60 * 1000

/* ── Command Bar ── */
function CommandBar({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (app: string) => void }) {
  const [query, setQuery] = useState('')
  const commands = [
    { label: 'Calendar', app: 'calendar', icon: I.calendar, keywords: 'calendar events schedule meetings' },
    { label: 'Plans', app: 'plans', icon: I.tasks, keywords: 'plans tasks todo ventures projects' },
    { label: 'News Hub', app: 'newshub', icon: I.news, keywords: 'news articles newsletter' },
    { label: 'Health', app: 'health', icon: I.health, keywords: 'health fitness wellness' },
    { label: 'Maps', app: 'maps', icon: I.mapPin, keywords: 'maps locations places' },
    { label: 'Memory', app: 'memory', icon: I.memory, keywords: 'memory search brain' },
    { label: 'Docs', app: 'docs', icon: I.notes, keywords: 'docs documents vault files' },
    { label: 'Media List', app: 'reading', icon: I.notes, keywords: 'media reading podcasts newsletters' },
    { label: 'Skill Shop', app: 'skillshop', icon: I.settings, keywords: 'skills shop marketplace' },
    { label: 'Roadmap', app: 'roadmap', icon: I.zap, keywords: 'roadmap apps tracker' },
    { label: 'Lovely', app: 'lovely', icon: I.lovely, keywords: 'lovely personal' },
  ]
  const filtered = query.trim() ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.keywords.toLowerCase().includes(query.toLowerCase())) : commands
  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; if (open) window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler) }, [open, onClose])
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }} onClick={onClose}>
      <div style={{ width: '90%', maxWidth: 480, background: 'rgba(15,12,26,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{I.search}<input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search apps, actions..." style={{ flex: 1, background: 'none', border: 'none', color: '#F0EEE8', fontSize: 15, outline: 'none' }} /><span style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>ESC</span></div>
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {filtered.map((cmd, i) => (<button key={cmd.label} onClick={() => { onNavigate(cmd.app); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', background: i === 0 ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', color: '#aaa', cursor: 'pointer', textAlign: 'left', fontSize: 14 }}><span style={{ color: '#6366f1' }}>{cmd.icon}</span><span style={{ color: '#F0EEE8' }}>{cmd.label}</span></button>))}
          {filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#555', fontSize: 13 }}>No results</div>}
        </div>
      </div>
    </div>
  )
}

/* ── Calendar App View ── */
function CalendarView({ onBack }: { onBack: () => void }) {
  const [events, setEvents] = useState<CalEvent[]>(calCache?.events || [])
  const [loading, setLoading] = useState(!calCache || (Date.now() - (calCache?.fetchedAt || 0) > CACHE_TTL))
  const [refreshing, setRefreshing] = useState(false)
  const [activeCalendar, setActiveCalendar] = useState<string>('all')
  const fetchEvents = useCallback(async (isRefresh = false) => { if (isRefresh) setRefreshing(true); else setLoading(true); try { const res = await fetch('/api/calendar/events'); const data = await res.json(); const evts = data.events || []; setEvents(evts); calCache = { events: evts, fetchedAt: Date.now() } } catch {} finally { setLoading(false); setRefreshing(false) } }, [])
  useEffect(() => { if (!calCache || (Date.now() - calCache.fetchedAt > CACHE_TTL)) fetchEvents() }, [fetchEvents])
  const today = new Date()
  const filtered = activeCalendar === 'all' ? events : events.filter(e => e.calendar === activeCalendar)
  const upcoming = filtered.filter(e => new Date(e.start) >= today).slice(0, 30)
  const grouped: Record<string, CalEvent[]> = {}
  upcoming.forEach(e => { const d = new Date(e.start).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }); if (!grouped[d]) grouped[d] = []; grouped[d].push(e) })
  const calNames = Array.from(new Set(events.map(e => e.calendar).filter(Boolean))) as string[]
  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#aaa', padding: '8px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{I.back} Back</button>
        <button onClick={() => fetchEvents(true)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: refreshing ? '#6366f1' : '#aaa', padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>{refreshing ? 'Refreshing...' : 'Refresh'}</button>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>Calendar</h2>
      <p style={{ fontSize: 12, color: '#666', marginBottom: 14 }}>{events.length} events</p>
      {calNames.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }}>
          <button onClick={() => setActiveCalendar('all')} style={{ padding: '6px 14px', borderRadius: 16, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: 'none', background: activeCalendar === 'all' ? '#6366f1' : 'rgba(255,255,255,0.06)', color: activeCalendar === 'all' ? '#fff' : '#888' }}>All</button>
          {calNames.map(name => (<button key={name} onClick={() => setActiveCalendar(name)} style={{ padding: '6px 14px', borderRadius: 16, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: 'none', background: activeCalendar === name ? '#6366f1' : 'rgba(255,255,255,0.06)', color: activeCalendar === name ? '#fff' : '#888' }}>{name}</button>))}
        </div>
      )}
      {loading && <div style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading calendar...</div>}
      {!loading && Object.entries(grouped).map(([date, dayEvents]) => (
        <div key={date} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{date}</div>
          {dayEvents.map((ev, i) => { const start = new Date(ev.start); const end = new Date(ev.end); const time = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); return (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px', marginBottom: 8, borderLeft: `3px solid ${ev.color || '#6366f1'}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{ev.title || ev.summary}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{ev.isAllDay ? 'All day' : `${time} – ${endTime}`}</div>
              {ev.calendar && <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>{ev.calendar}</div>}
              {ev.location && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>📍 {ev.location}</div>}
            </div>
          ) })}
        </div>
      ))}
      {!loading && upcoming.length === 0 && <div style={{ textAlign: 'center', color: '#666', padding: '40px 0', fontSize: 14 }}>No upcoming events{activeCalendar !== 'all' ? ` in ${activeCalendar}` : ''}</div>}
    </div>
  )
}

/* ── Card Component ── */
function Card({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 16px', transition: 'all 0.2s ease', cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  )
}

/* ── Section Header ── */
function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1.2 }}>{title}</span>
      {action && onAction && <button onClick={onAction} style={{ fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>{action} {I.chevronRight}</button>}
    </div>
  )
}

/* ── Main Page ── */
export default function HomePage() {
  const [space, setSpace] = useState<SpaceId>('today')
  const [activeApp, setActiveApp] = useState<ActiveApp>(null)
  const [now, setNow] = useState(new Date())
  const [quickInput, setQuickInput] = useState('')
  const [quickHistory, setQuickHistory] = useState<QuickChatMessage[]>([])
  const [quickReply, setQuickReply] = useState('')
  const [quickLoading, setQuickLoading] = useState(false)
  const [quickExpanded, setQuickExpanded] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string>('marg')
  const [agentDetailOpen, setAgentDetailOpen] = useState(false)
  const [agentActivity, setAgentActivity] = useState<{ summary: string; days: { date: string; items: string[] }[] } | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [todayCosts, setTodayCosts] = useState<{ brain: number; muscles: number; total: number } | null>(null)
  const [calendarPreview, setCalendarPreview] = useState<CalEvent[]>([])
  const [calLoading, setCalLoading] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [tasks, setTasks] = useState<{ total: number; overdue: number; dueToday: number; inProgress: number; highPriority: number; tasks: { id: string; title: string; status: string; priority?: string; dueDate?: string }[] } | null>(null)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [emails, setEmails] = useState<{ total: number; unread: number; emails: { id: string; sender: string; subject: string; preview: string; time: string; unread: boolean }[] } | null>(null)
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [alerts, setAlerts] = useState<{ alerts: { id: string; type: string; message: string; urgency: string; action?: string; actionUrl?: string; dismissible: boolean }[]; highPriority: number } | null>(null)
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])

  const { isDark, toggle: toggleTheme, t } = useTheme()
  const featuredAgent = AGENTS.find(a => a.id === selectedAgent) || AGENTS[0]

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateFmt = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  const timeFmt = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => { const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(v => !v) } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler) }, [])
  useEffect(() => { fetch('/api/costs').then(r => r.json()).then(d => { if (d?.brain != null && d?.muscles != null) setTodayCosts(d) }).catch(() => {}) }, [])
  useEffect(() => { setCalLoading(true); fetch('/api/calendar/events').then(r => r.json()).then(d => { const evts = d.events || []; const today = new Date(); const upcoming = evts.filter((e: CalEvent) => new Date(e.start) >= today).slice(0, 3); setCalendarPreview(upcoming); calCache = { events: evts, fetchedAt: Date.now() } }).catch(() => {}).finally(() => setCalLoading(false)) }, [])
  useEffect(() => { setWeatherLoading(true); fetch('/api/weather').then(r => r.json()).then(d => { setWeather(d) }).catch(() => {}).finally(() => setWeatherLoading(false)) }, [])
  useEffect(() => { setTasksLoading(true); fetch('/api/tasks').then(r => r.json()).then(d => { setTasks(d) }).catch(() => {}).finally(() => setTasksLoading(false)) }, [])
  useEffect(() => { setEmailsLoading(true); fetch('/api/email-preview').then(r => r.json()).then(d => { setEmails(d) }).catch(() => {}).finally(() => setEmailsLoading(false)) }, [])
  useEffect(() => { setAlertsLoading(true); fetch('/api/alerts').then(r => r.json()).then(d => { setAlerts(d) }).catch(() => {}).finally(() => setAlertsLoading(false)) }, [])

  const fetchAgentActivity = useCallback(async (agentId: string) => { setActivityLoading(true); try { const res = await fetch(`/api/agent-activity?agent=${agentId}`); if (!res.ok) throw new Error('Failed'); const data = await res.json(); setAgentActivity(data) } catch { setAgentActivity(null) } finally { setActivityLoading(false) } }, [])

  const handleAppClick = useCallback((appId: string) => { setActiveApp(appId) }, [])
  const handleQuickChatSend = useCallback(async () => { const message = quickInput.trim(); if (!message || quickLoading) return; setQuickLoading(true); setQuickExpanded(false); setQuickReply(''); setQuickInput(''); setQuickHistory((prev: QuickChatMessage[]) => [...prev, { role: 'user' as const, content: message }].slice(-10)); try { const response = await fetch('/api/chat-quick', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, history: quickHistory.slice(-10) }) }); if (!response.ok) throw new Error('Failed'); const data = await response.json(); const text = String(data?.text || '').trim() || 'Sorry, I could not generate a response.'; setQuickReply(text); setQuickHistory((prev: QuickChatMessage[]) => [...prev, { role: 'assistant' as const, content: text }].slice(-10)) } catch { const fallback = 'Sorry, something went wrong.'; setQuickReply(fallback); setQuickHistory((prev: QuickChatMessage[]) => [...prev, { role: 'assistant' as const, content: fallback }].slice(-10)) } finally { setQuickLoading(false) } }, [quickHistory, quickInput, quickLoading])

  const spaces: { id: SpaceId; label: string; icon: JSX.Element }[] = [
    { id: 'today', label: 'Today', icon: I.home },
    { id: 'work', label: 'Work', icon: I.briefcase },
    { id: 'life', label: 'Life', icon: I.lovely },
    { id: 'lab', label: 'Lab', icon: I.flask },
    { id: 'review', label: 'Review', icon: I.calendar },
  ]

  const quickLinks = [
    { id: 'calendar', label: 'Calendar', icon: I.calendar, color: '#10b981' },
    { id: 'plans', label: 'Plans', icon: I.tasks, color: '#a855f7' },
    { id: 'newshub', label: 'News', icon: I.news, color: '#f97316' },
    { id: 'health', label: 'Health', icon: I.health, color: '#ef4444' },
    { id: 'maps', label: 'Maps', icon: I.mapPin, color: '#10b981' },
    { id: 'memory', label: 'Memory', icon: I.memory, color: '#ec4899' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: t.bgGradient, color: t.text, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.4s ease, color 0.3s ease' }}>
      <div style={{ position: 'fixed', top: '5%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${t.bgGlow}, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 500, margin: '0 auto', padding: '0 16px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <header style={{ paddingTop: 40, marginBottom: 16, textAlign: 'center', position: 'relative' }}>
          <button onClick={toggleTheme} style={{ position: 'absolute', top: 44, right: 0, zIndex: 10, width: 36, height: 36, borderRadius: 18, background: t.bgCard, border: `1px solid ${t.border}`, color: isDark ? '#f59e0b' : '#6366f1', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{isDark ? '☀️' : '🌙'}</button>
          <button onClick={() => setCmdOpen(true)} style={{ position: 'absolute', top: 44, left: 0, zIndex: 10, width: 36, height: 36, borderRadius: 18, background: t.bgCard, border: `1px solid ${t.border}`, color: '#888', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{I.command}</button>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 20px', borderRadius: 12, background: t.clockBg, border: `1px solid ${t.clockBorder}`, boxShadow: `0 0 20px ${t.clockGlow}`, marginBottom: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 400, fontFamily: "'SF Mono', monospace", color: '#22c55e', letterSpacing: 4, textShadow: isDark ? '0 0 10px rgba(34,197,94,0.5)' : '0 0 6px rgba(34,197,94,0.3)' }}>{timeFmt}</span>
          </div>
          <div style={{ color: t.textDim, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>{dayName} · {dateFmt}</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '4px 0', letterSpacing: -1, fontFamily: "'Space Grotesk', sans-serif" }}>{greeting}, Jake</h1>
          <div style={{ fontSize: 10, color: t.textDim, letterSpacing: 3, textTransform: 'uppercase' }}>Mission Control <span style={{ opacity: 0.5 }}>v7</span></div>
        </header>

        {/* Space Pills */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, overflowX: 'auto' }}>
          {spaces.map(s => (
            <button key={s.id} onClick={() => { setSpace(s.id); setActiveApp(null) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: space === s.id ? '#6366f1' : 'rgba(255,255,255,0.04)', color: space === s.id ? '#fff' : '#888', transition: 'all 0.2s' }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, paddingBottom: 100 }}>
          
          {/* ── TODAY SPACE ── */}
          {space === 'today' && !activeApp && (
            <>
              {/* Alerts */}
              {alertsLoading ? null : alerts && alerts.alerts.filter(a => !dismissedAlerts.includes(a.id)).length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  {alerts.alerts.filter(a => !dismissedAlerts.includes(a.id)).map((alert, i) => (
                    <div key={alert.id} style={{
                      background: alert.urgency === 'high' ? 'rgba(239,68,68,0.08)' : alert.urgency === 'medium' ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
                      border: `1px solid ${alert.urgency === 'high' ? 'rgba(239,68,68,0.2)' : alert.urgency === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}`,
                      borderRadius: 14,
                      padding: '12px 14px',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: alert.urgency === 'high' ? '#ef4444' : alert.urgency === 'medium' ? '#f59e0b' : '#6366f1',
                        marginTop: 4,
                        flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#E9E6FF', marginBottom: 2 }}>{alert.message}</div>
                        {alert.action && (
                          <button onClick={() => alert.actionUrl && alert.actionUrl.startsWith('#') ? setActiveApp(alert.actionUrl.slice(1)) : alert.actionUrl && window.open(alert.actionUrl, '_blank')} style={{
                            fontSize: 11,
                            color: alert.urgency === 'high' ? '#ef4444' : alert.urgency === 'medium' ? '#f59e0b' : '#6366f1',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            fontWeight: 600,
                          }}>{alert.action} →</button>
                        )}
                      </div>
                      {alert.dismissible && (
                        <button onClick={() => setDismissedAlerts(prev => [...prev, alert.id])} style={{
                          background: 'none',
                          border: 'none',
                          color: '#666',
                          cursor: 'pointer',
                          fontSize: 16,
                          padding: 0,
                          lineHeight: 1,
                        }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Morning Brief */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(99,102,241,0.05) 100%)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 20,
                padding: '20px',
                marginBottom: 20,
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', filter: 'blur(40px)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>{hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙'}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#E9E6FF', fontFamily: "'Space Grotesk', sans-serif" }}>Morning Brief</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* Next Event */}
                    <div>
                      <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Next Up</div>
                      {calendarPreview.length > 0 ? (
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#E9E6FF' }}>{calendarPreview[0].title || calendarPreview[0].summary}</div>
                          <div style={{ fontSize: 11, color: '#888' }}>
                            {new Date(calendarPreview[0].start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            {calendarPreview[0].calendar && ` · ${calendarPreview[0].calendar}`}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#666' }}>No events today</div>
                      )}
                    </div>
                    
                    {/* AI Spend */}
                    <div>
                      <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>AI Spend</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', fontFamily: "'Space Grotesk', sans-serif" }}>{todayCosts ? `£${todayCosts.total.toFixed(2)}` : '—'}</div>
                      <div style={{ fontSize: 10, color: '#666' }}>Today so far</div>
                    </div>
                  </div>
                  
                  {/* Date + Weather */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {I.calendar}
                      <span style={{ fontSize: 12, color: '#aaa' }}>{dayName}, {dateFmt}</span>
                    </div>
                    <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
                    {weatherLoading ? (
                      <span style={{ fontSize: 12, color: '#666' }}>Loading weather...</span>
                    ) : weather ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{weather.icon}</span>
                        <span style={{ fontSize: 12, color: '#aaa' }}>{weather.temp}°C {weather.condition}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {I.weather}
                        <span style={{ fontSize: 12, color: '#aaa' }}>Weather unavailable</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Calendar Preview */}
              <SectionHeader title="Up Next" action="See all" onAction={() => setActiveApp('calendar')} />
              {calLoading ? <Card><div style={{ color: '#666', fontSize: 13 }}>Loading...</div></Card> : calendarPreview.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {calendarPreview.map((ev, i) => { const start = new Date(ev.start); const time = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); return (
                    <Card key={i} onClick={() => setActiveApp('calendar')}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 4, height: 40, borderRadius: 2, background: ev.color || '#6366f1', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{ev.title || ev.summary}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{ev.isAllDay ? 'All day' : time} · {ev.calendar}</div>
                        </div>
                      </div>
                    </Card>
                  ) })}
                </div>
              ) : <Card><div style={{ fontSize: 13, color: '#666' }}>No upcoming events</div></Card>}

              {/* Weather Card */}
              <SectionHeader title="Weather" />
              {weatherLoading ? <Card><div style={{ color: '#666', fontSize: 13 }}>Loading weather...</div></Card> : weather ? (
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 36 }}>{weather.icon}</span>
                      <div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#E9E6FF', fontFamily: "'Space Grotesk', sans-serif" }}>{weather.temp}°C</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{weather.condition}</div>
                        <div style={{ fontSize: 10, color: '#666' }}>{weather.location}</div>
                      </div>
                    </div>
                  </div>
                  {/* Forecast */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {weather.forecast.map((f, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{f.day}</div>
                        <div style={{ fontSize: 18, marginBottom: 2 }}>{f.icon}</div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{f.temp}°</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : <Card><div style={{ fontSize: 13, color: '#666' }}>Weather unavailable</div></Card>}

              {/* Tasks Due */}
              <SectionHeader title="Tasks" action="See all" onAction={() => setActiveApp('plans')} />
              {tasksLoading ? <Card><div style={{ color: '#666', fontSize: 13 }}>Loading tasks...</div></Card> : tasks ? (
                <Card onClick={() => setActiveApp('plans')}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {tasks.overdue > 0 && (
                      <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{tasks.overdue}</div>
                        <div style={{ fontSize: 10, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5 }}>Overdue</div>
                      </div>
                    )}
                    {tasks.dueToday > 0 && (
                      <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(245,158,11,0.1)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>{tasks.dueToday}</div>
                        <div style={{ fontSize: 10, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Due Today</div>
                      </div>
                    )}
                    <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(99,102,241,0.1)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>{tasks.inProgress}</div>
                      <div style={{ fontSize: 10, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5 }}>In Progress</div>
                    </div>
                  </div>
                  {tasks.tasks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {tasks.tasks.slice(0, 3).map((task, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <div style={{ width: 6, height: 6, borderRadius: 3, background: task.status === 'blocked' ? '#ef4444' : task.priority === 'high' ? '#f59e0b' : '#6366f1', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                          </div>
                          {task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && (
                            <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>Overdue</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ) : <Card><div style={{ fontSize: 13, color: '#666' }}>No tasks found</div></Card>}

              {/* Email Preview */}
              <SectionHeader title="Inbox" action="Open Gmail" onAction={() => window.open('https://mail.google.com', '_blank')} />
              {emailsLoading ? <Card><div style={{ color: '#666', fontSize: 13 }}>Loading emails...</div></Card> : emails ? (
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: emails.unread > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', borderRadius: 10, border: `1px solid ${emails.unread > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: emails.unread > 0 ? '#ef4444' : '#22c55e' }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: emails.unread > 0 ? '#ef4444' : '#22c55e' }}>{emails.unread} unread</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#666' }}>{emails.total} total</span>
                  </div>
                  {emails.emails.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {emails.emails.slice(0, 3).map((email, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 16, background: email.unread ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: email.unread ? '#6366f1' : '#888', flexShrink: 0 }}>
                            {email.sender.charAt(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 12, fontWeight: email.unread ? 700 : 500, color: email.unread ? '#E9E6FF' : '#aaa' }}>{email.sender}</span>
                              <span style={{ fontSize: 10, color: '#666' }}>{email.time}</span>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: email.unread ? 600 : 400, color: email.unread ? '#ccc' : '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email.subject}</div>
                            <div style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{email.preview}</div>
                          </div>
                          {email.unread && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#6366f1', flexShrink: 0 }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ) : <Card><div style={{ fontSize: 13, color: '#666' }}>No emails found</div></Card>}

              {/* Costs */}
              <SectionHeader title="AI Spend Today" />
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e', fontFamily: "'Space Grotesk', sans-serif" }}>{todayCosts ? `£${todayCosts.total.toFixed(2)}` : '—'}</div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{todayCosts ? `${todayCosts.brain.toFixed(2)} brain · ${todayCosts.muscles.toFixed(2)} muscles` : 'Loading...'}</div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>{I.costs}</div>
                </div>
              </Card>

              {/* Agent Status */}
              <SectionHeader title="Agents" />
              <Card>
                <div style={{ display: 'flex', gap: 12 }}>
                  {AGENTS.map(a => (
                    <button key={a.id} onClick={() => { setSelectedAgent(a.id); setSpace('lab'); setAgentDetailOpen(true) }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, overflow: 'hidden', border: `2px solid ${a.accent}40` }}><Image src={a.avatar} alt={a.name} width={44} height={44} style={{ objectFit: 'cover' }} /></div>
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 6, background: '#22c55e', border: '2px solid #0a0812' }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#aaa' }}>{a.name}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Quick Links */}
              <SectionHeader title="Quick Access" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {quickLinks.map(link => (
                  <button key={link.id} onClick={() => setActiveApp(link.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, cursor: 'pointer', color: link.color }}>
                    {link.icon}
                    <span style={{ fontSize: 11, color: '#aaa', fontWeight: 500 }}>{link.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── WORK SPACE ── */}
          {space === 'work' && !activeApp && (
            <>
              <SectionHeader title="Calendar" action="Open" onAction={() => setActiveApp('calendar')} />
              <Card onClick={() => setActiveApp('calendar')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>{I.calendar}<span style={{ fontSize: 13 }}>View all events</span></div>
              </Card>
              <SectionHeader title="Plans" action="Open" onAction={() => setActiveApp('plans')} />
              <Card onClick={() => setActiveApp('plans')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>{I.tasks}<span style={{ fontSize: 13 }}>Track ventures & projects</span></div>
              </Card>
              <SectionHeader title="News Hub" action="Open" onAction={() => setActiveApp('newshub')} />
              <Card onClick={() => setActiveApp('newshub')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>{I.news}<span style={{ fontSize: 13 }}>Industry news & newsletters</span></div>
              </Card>
              <SectionHeader title="Costs" />
              <Card>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>{todayCosts ? `£${todayCosts.total.toFixed(2)}` : '—'}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Today's AI compute</div>
              </Card>
            </>
          )}

          {/* ── LIFE SPACE ── */}
          {space === 'life' && !activeApp && (
            <>
              <SectionHeader title="Health" action="Open" onAction={() => setActiveApp('health')} />
              <Card onClick={() => setActiveApp('health')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>{I.health}<span style={{ fontSize: 13 }}>Track fitness & wellness</span></div>
              </Card>
              <SectionHeader title="Maps" action="Open" onAction={() => setActiveApp('maps')} />
              <Card onClick={() => setActiveApp('maps')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>{I.mapPin}<span style={{ fontSize: 13 }}>Saved places & directions</span></div>
              </Card>
              <SectionHeader title="Lovely" action="Open" onAction={() => setActiveApp('lovely')} />
              <Card onClick={() => setActiveApp('lovely')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>{I.lovely}<span style={{ fontSize: 13 }}>Personal notes & thoughts</span></div>
              </Card>
              <SectionHeader title="Media List" action="Open" onAction={() => setActiveApp('reading')} />
              <Card onClick={() => setActiveApp('reading')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>{I.notes}<span style={{ fontSize: 13 }}>Podcasts, newsletters, reading</span></div>
              </Card>
            </>
          )}

          {/* ── LAB SPACE ── */}
          {space === 'lab' && !activeApp && (
            <>
              <SectionHeader title="Memory" action="Open" onAction={() => setActiveApp('memory')} />
              <Card onClick={() => setActiveApp('memory')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>{I.memory}<span style={{ fontSize: 13 }}>Search & browse memory</span></div>
              </Card>
              <SectionHeader title="Docs" action="Open" onAction={() => setActiveApp('docs')} />
              <Card onClick={() => setActiveApp('docs')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>{I.notes}<span style={{ fontSize: 13 }}>The Vault — documents</span></div>
              </Card>
              <SectionHeader title="Skill Shop" action="Open" onAction={() => setActiveApp('skillshop')} />
              <Card onClick={() => setActiveApp('skillshop')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>{I.settings}<span style={{ fontSize: 13 }}>ClawHub marketplace</span></div>
              </Card>
              <SectionHeader title="Roadmap" action="Open" onAction={() => setActiveApp('roadmap')} />
              <Card onClick={() => setActiveApp('roadmap')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>{I.zap}<span style={{ fontSize: 13 }}>App tracker & ideas</span></div>
              </Card>

              {/* Agent Detail */}
              <SectionHeader title={featuredAgent.name} />
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 16, overflow: 'hidden' }}><Image src={featuredAgent.thumbnail} alt={featuredAgent.name} width={60} height={60} style={{ objectFit: 'cover' }} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{featuredAgent.name} <span style={{ fontSize: 10, color: featuredAgent.accent, background: `${featuredAgent.accent}15`, padding: '2px 8px', borderRadius: 10 }}>{featuredAgent.role}</span></div>
                    <div style={{ fontSize: 12, color: '#888' }}>{featuredAgent.model} · {featuredAgent.provider}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{featuredAgent.weekSummary}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {AGENTS.map(a => (
                    <button key={a.id} onClick={() => setSelectedAgent(a.id)} style={{ flex: 1, padding: '6px 0', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: selectedAgent === a.id ? a.accent : 'rgba(255,255,255,0.04)', color: selectedAgent === a.id ? '#000' : '#888' }}>{a.name}</button>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── REVIEW SPACE ── */}
          {space === 'review' && !activeApp && (
            <>
              <SectionHeader title="This Week" />
              <Card>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(99,102,241,0.08)', borderRadius: 12 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1', fontFamily: "'Space Grotesk', sans-serif" }}>{calendarPreview.length}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>Events</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(34,197,94,0.08)', borderRadius: 12 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e', fontFamily: "'Space Grotesk', sans-serif" }}>{todayCosts ? `£${todayCosts.total.toFixed(0)}` : '—'}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>AI Spend</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(239,68,68,0.08)', borderRadius: 12 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', fontFamily: "'Space Grotesk', sans-serif" }}>{tasks?.overdue || 0}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>Overdue</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(245,158,11,0.08)', borderRadius: 12 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', fontFamily: "'Space Grotesk', sans-serif" }}>{tasks?.inProgress || 0}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>In Progress</div>
                  </div>
                </div>
              </Card>

              <SectionHeader title="Agent Activity" />
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {AGENTS.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden' }}><Image src={a.thumbnail} alt={a.name} width={36} height={36} style={{ objectFit: 'cover' }} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{a.weekSummary}</div>
                      </div>
                      <div style={{ fontSize: 11, color: a.accent, fontWeight: 600 }}>{a.monthSpend}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <SectionHeader title="Build Progress" />
              <Card>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#aaa' }}>Mission Control v7</span>
                    <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>6 / 11 phases</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '55%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, color: '#22c55e' }}>✅ Phase 1: Foundation</div>
                  <div style={{ fontSize: 11, color: '#22c55e' }}>✅ Phase 2: Morning Brief</div>
                  <div style={{ fontSize: 11, color: '#22c55e' }}>✅ Phase 3: Weather</div>
                  <div style={{ fontSize: 11, color: '#22c55e' }}>✅ Phase 4: Task Cards</div>
                  <div style={{ fontSize: 11, color: '#22c55e' }}>✅ Phase 5: Email Preview</div>
                  <div style={{ fontSize: 11, color: '#22c55e' }}>✅ Phase 6: Proactive Alerts</div>
                  <div style={{ fontSize: 11, color: '#6366f1' }}>🔄 Phase 7: Weekly Review</div>
                  <div style={{ fontSize: 11, color: '#666' }}>⏳ Phase 8: Mobile PWA</div>
                  <div style={{ fontSize: 11, color: '#666' }}>⏳ Phase 9: Voice Capture</div>
                  <div style={{ fontSize: 11, color: '#666' }}>⏳ Phase 10: Cross-Space Search</div>
                  <div style={{ fontSize: 11, color: '#666' }}>⏳ Phase 11: Cost Prediction</div>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Quick Chat */}
        {!activeApp && (
          <div style={{ position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 468, zIndex: 50 }}>
            <div style={{ background: t.bgCard, border: `1px solid ${t.borderLight}`, borderRadius: 14, padding: '8px 10px', backdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input value={quickInput} onChange={e => setQuickInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleQuickChatSend() } }} placeholder="Ask anything..." style={{ flex: 1, background: t.bgInput, border: `1px solid ${t.borderLight}`, borderRadius: 10, height: 34, color: t.text, fontSize: 13, padding: '0 10px', outline: 'none' }} />
                <button onClick={handleQuickChatSend} disabled={quickLoading || !quickInput.trim()} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(99,102,241,0.35)', background: quickLoading ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.28)', color: '#E9E6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: quickLoading ? 'default' : 'pointer', opacity: quickInput.trim() ? 1 : 0.55 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
              {(quickLoading || quickReply) && (
                <div onClick={() => setQuickExpanded(v => !v)} style={{ marginTop: 8, padding: '8px 10px', borderRadius: 10, background: isDark ? 'rgba(15,12,26,0.72)' : 'rgba(0,0,0,0.04)', border: `1px solid ${quickExpanded ? 'rgba(99,102,241,0.35)' : t.borderLight}`, color: t.textSecondary, fontSize: 12, lineHeight: 1.4, maxHeight: quickExpanded ? 220 : 72, overflowY: 'auto', cursor: 'pointer', whiteSpace: 'pre-wrap' }}>
                  {quickLoading ? 'thinking...' : quickReply}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Nav */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: t.tabBar, backdropFilter: 'blur(20px)', borderTop: `1px solid ${t.tabBorder}`, display: 'flex', justifyContent: 'center', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', paddingTop: 8, zIndex: 100 }}>
          <div style={{ display: 'flex', maxWidth: 360, width: '100%', justifyContent: 'space-around' }}>
            {spaces.map(s => (
              <button key={s.id} onClick={() => { setSpace(s.id); setActiveApp(null) }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 16px', color: space === s.id ? '#6366f1' : t.textDim, transition: 'color 0.2s' }}>
                {s.icon}
                <span style={{ fontSize: 9, fontWeight: space === s.id ? 700 : 500, letterSpacing: 0.5 }}>{s.label}</span>
                {space === s.id && <div style={{ width: 4, height: 4, borderRadius: 2, background: '#6366f1' }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Full-screen App Views */}
        {activeApp === 'calendar' && <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)', overflowY: 'auto', paddingBottom: 80 }}><div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px', paddingTop: 52 }}><CalendarView onBack={() => setActiveApp(null)} /></div></div>}
        {activeApp === 'lovely' && <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)', overflowY: 'auto', paddingBottom: 80 }}><div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}><div style={{ paddingTop: 52, marginBottom: 8 }}><button onClick={() => setActiveApp(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#aaa', padding: '10px 16px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{I.back} Back</button></div><LovelyTab /></div></div>}
        {activeApp === 'maps' && <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)', overflowY: 'auto', paddingBottom: 80 }}><div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px', paddingTop: 52 }}><MapsApp onBack={() => setActiveApp(null)} /></div></div>}
        {activeApp === 'health' && <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)', overflowY: 'auto', paddingBottom: 80 }}><div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}><HealthApp onBack={() => setActiveApp(null)} /></div></div>}
        {activeApp === 'memory' && <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}><div style={{ maxWidth: 800, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}><div style={{ padding: '52px 16px 8px' }}><button onClick={() => setActiveApp(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#aaa', padding: '10px 16px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{I.back} Back</button></div><div style={{ flex: 1, overflow: 'hidden' }}><MemoryView /></div></div></div>}
        {activeApp === 'docs' && <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)', overflowY: 'auto', paddingBottom: 80 }}><div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}><div style={{ paddingTop: 52, marginBottom: 8 }}><button onClick={() => setActiveApp(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#aaa', padding: '10px 16px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{I.back} Back</button></div><DocsTab /></div></div>}
        {activeApp === 'plans' && <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)', overflowY: 'auto', paddingBottom: 80 }}><div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}><div style={{ paddingTop: 52, marginBottom: 8 }}><button onClick={() => setActiveApp(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#aaa', padding: '10px 16px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{I.back} Back</button></div><PlansTab /></div></div>}
        {activeApp === 'newshub' && <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}><div style={{ maxWidth: 600, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}><NewsHubApp onBack={() => setActiveApp(null)} /></div></div>}
        {activeApp === 'reading' && <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)', overflowY: 'auto', paddingBottom: 80 }}><div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}><MediaListApp onBack={() => setActiveApp(null)} /></div></div>}
        {activeApp === 'skillshop' && <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)', overflowY: 'auto', paddingBottom: 80 }}><div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}><SkillShopApp onBack={() => setActiveApp(null)} /></div></div>}
        {activeApp === 'roadmap' && <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}><div style={{ maxWidth: 600, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}><AppRoadmapApp onBack={() => setActiveApp(null)} /></div></div>}

        {/* Command Bar */}
        <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={(app) => setActiveApp(app)} />

      </div>
    </div>
  )
}
