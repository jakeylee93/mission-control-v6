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

type TabId = 'business' | 'personal' | 'laboratory'
type ActiveApp = string | null
type QuickChatMessage = { role: 'user' | 'assistant'; content: string }

interface Agent {
  id: string; name: string; role: string; model: string; provider: string
  avatar: string; thumbnail: string; accent: string; monthSpend: string; lastActive: string; weekSummary: string
}

const AGENTS: Agent[] = [
  { id: 'marg', name: 'Margarita', role: 'Orchestrator', model: 'Claude Opus', provider: 'Anthropic', avatar: '/images/marg-new.png', thumbnail: '/images/marg-new.png', accent: '#FFD700', monthSpend: '£847.20', lastActive: 'Just now', weekSummary: 'Health app, Media List, Maps redesign' },
  { id: 'doc', name: 'Doc', role: 'Builder', model: 'Codex', provider: 'OpenAI', avatar: '/images/doc.png', thumbnail: '/images/doc.png', accent: '#60A5FA', monthSpend: '£124.50', lastActive: '2h ago', weekSummary: 'Mission Control builds' },
  { id: 'cindy', name: 'Cindy', role: 'Assistant', model: 'Kimi (Moonshot)', provider: 'Moonshot', avatar: '/images/cindy.png', thumbnail: '/images/cindy.png', accent: '#C084FC', monthSpend: '£31.80', lastActive: '5h ago', weekSummary: 'Calendar & contacts' },
]

/* ── SVG Icons ── */
const I = {
  email: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  calendar: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  costs: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  analytics: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  tasks: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  contacts: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  docs: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  alerts: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  web: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  messages: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  newspaper: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9h4"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
  weather: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  health: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  music: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  photos: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  maps: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  notes: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  shopping: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  home: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  reading: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  downtime: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  agents: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>,
  memory: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  settings: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  apis: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  tools: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  playground: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  usage: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  automations: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  database: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  deploy: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  lovely: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  briefcase: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  user: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  flask: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v7l5 8a3 3 0 0 1-2.5 4.5h-11A3 3 0 0 1 4 18l5-8V3z"/><line x1="9" y1="3" x2="15" y2="3"/></svg>,
  skillshop: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20 C7 15 12 11 17 9"/><path d="M17 9 C19 6 22 5 23 3 C23 1 21 1 19 3 C18 5 17 9 17 9"/><path d="M17 9 C19 11 21 14 20 16 C19 18 17 17 16 15 C15 13 17 9 17 9"/></svg>,
}

interface AppDef { icon: JSX.Element; label: string; color: string; id: string; href?: string }

const BUSINESS: AppDef[] = [
  { icon: I.email, label: 'Email', color: '#3b82f6', id: 'email' },
  { icon: I.calendar, label: 'Calendar', color: '#10b981', id: 'calendar' },
  { icon: I.costs, label: 'Costs', color: '#f59e0b', id: 'costs' },
  { icon: I.analytics, label: 'Analytics', color: '#8b5cf6', id: 'analytics' },
  { icon: I.tasks, label: 'Tasks', color: '#ef4444', id: 'tasks' },
  { icon: I.contacts, label: 'Contacts', color: '#06b6d4', id: 'contacts' },
  { icon: I.docs, label: 'Docs', color: '#64748b', id: 'docs' },
  { icon: I.notes, label: 'Plans', color: '#a855f7', id: 'plans' },
  { icon: I.alerts, label: 'Alerts', color: '#f43f5e', id: 'alerts' },
  { icon: I.web, label: 'Websites', color: '#6366f1', id: 'websites', href: 'https://anyos.co.uk/portfolio' },
  { icon: I.messages, label: 'Messages', color: '#22c55e', id: 'messages' },
  { icon: I.newspaper, label: 'News', color: '#f97316', id: 'newshub' },
]

const PERSONAL: AppDef[] = [
  { icon: I.weather, label: 'Weather', color: '#f59e0b', id: 'weather' },
  { icon: I.health, label: 'Health', color: '#ef4444', id: 'health' },
  { icon: I.music, label: 'Music', color: '#ec4899', id: 'music' },
  { icon: I.photos, label: 'Photos', color: '#8b5cf6', id: 'photos' },
  { icon: I.maps, label: 'Maps', color: '#10b981', id: 'maps' },
  { icon: I.notes, label: 'Notes', color: '#f59e0b', id: 'notes' },
  { icon: I.shopping, label: 'Shopping', color: '#06b6d4', id: 'shopping' },
  { icon: I.home, label: 'Home', color: '#64748b', id: 'home' },
  { icon: I.reading, label: 'Reading', color: '#a855f7', id: 'reading' },
  { icon: I.downtime, label: 'Downtime', color: '#6366f1', id: 'downtime' },
  { icon: I.lovely, label: 'Lovely', color: '#FFD700', id: 'lovely' },
]

const LAB: AppDef[] = [
  { icon: I.playground, label: 'Roadmap', color: '#f59e0b', id: 'roadmap' },
  { icon: I.agents, label: 'Agents', color: '#6366f1', id: 'agents' },
  { icon: I.memory, label: 'Memory', color: '#ec4899', id: 'memory' },
  { icon: I.settings, label: 'Settings', color: '#64748b', id: 'settings' },
  { icon: I.apis, label: 'APIs', color: '#10b981', id: 'apis' },
  { icon: I.tools, label: 'Tools', color: '#f59e0b', id: 'tools' },
  { icon: I.playground, label: 'Playground', color: '#8b5cf6', id: 'playground' },
  { icon: I.usage, label: 'Usage', color: '#ef4444', id: 'usage' },
  { icon: I.automations, label: 'Autos', color: '#06b6d4', id: 'automations' },
  { icon: I.database, label: 'Database', color: '#22c55e', id: 'database' },
  { icon: I.deploy, label: 'Deploy', color: '#3b82f6', id: 'deploy' },
  { icon: I.skillshop, label: 'Skill Shop', color: '#ef4444', id: 'skillshop' },
]

const TABS: Record<TabId, AppDef[]> = { business: BUSINESS, personal: PERSONAL, laboratory: LAB }

interface CalEvent { summary?: string; title?: string; start: string; end: string; location?: string; color?: string; calendar?: string; isAllDay?: boolean }
interface CalendarInfo { id: string; name: string; color: string; primary: boolean }

// Global cache for calendar data
let calCache: { events: CalEvent[]; calendars: CalendarInfo[]; fetchedAt: number } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/* ── Calendar App View ── */
function CalendarView({ onBack }: { onBack: () => void }) {
  const [events, setEvents] = useState<CalEvent[]>(calCache?.events || [])
  const [calendars, setCalendars] = useState<CalendarInfo[]>(calCache?.calendars || [])
  const [loading, setLoading] = useState(!calCache || (Date.now() - calCache.fetchedAt > CACHE_TTL))
  const [activeCalendar, setActiveCalendar] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch('/api/calendar/events')
      const data = await res.json()
      const evts = data.events || []
      const cals = data.calendars || []
      setEvents(evts)
      setCalendars(cals)
      calCache = { events: evts, calendars: cals, fetchedAt: Date.now() }
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    // Only fetch if cache is stale or empty
    if (!calCache || (Date.now() - calCache.fetchedAt > CACHE_TTL)) {
      fetchEvents()
    }
  }, [fetchEvents])

  const today = new Date()
  const filtered = activeCalendar === 'all' ? events : events.filter(e => e.calendar === activeCalendar)
  const upcoming = filtered.filter(e => new Date(e.start) >= today).slice(0, 30)
  const grouped: Record<string, CalEvent[]> = {}
  upcoming.forEach(e => {
    const d = new Date(e.start).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(e)
  })

  // Get unique calendar names for filter
  const calNames = Array.from(new Set(events.map(e => e.calendar).filter(Boolean))) as string[]

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12,
          color: '#aaa', padding: '8px 14px', fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>{I.back} Back</button>
        <button onClick={() => fetchEvents(true)} style={{
          background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12,
          color: refreshing ? '#6366f1' : '#aaa', padding: '8px 14px', fontSize: 13, cursor: 'pointer',
        }}>{refreshing ? 'Refreshing...' : 'Refresh'}</button>
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>Calendar</h2>
      <p style={{ fontSize: 12, color: '#666', marginBottom: 14 }}>
        {events.length} events · jake@anyvendor.co.uk
      </p>

      {/* Calendar filter pills */}
      {calNames.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, WebkitOverflowScrolling: 'touch' as const }}>
          <button
            onClick={() => setActiveCalendar('all')}
            style={{
              padding: '6px 14px', borderRadius: 16, fontSize: 11, fontWeight: 600,
              whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
              background: activeCalendar === 'all' ? '#6366f1' : 'rgba(255,255,255,0.06)',
              color: activeCalendar === 'all' ? '#fff' : '#888',
            }}
          >All</button>
          {calNames.map(name => {
            const cal = calendars.find(c => c.name === name)
            return (
              <button
                key={name}
                onClick={() => setActiveCalendar(name)}
                style={{
                  padding: '6px 14px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                  whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
                  background: activeCalendar === name ? (cal?.color || '#6366f1') : 'rgba(255,255,255,0.06)',
                  color: activeCalendar === name ? '#fff' : '#888',
                }}
              >{name}</button>
            )
          })}
        </div>
      )}

      {loading && <div style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading calendar...</div>}

      {!loading && Object.entries(grouped).map(([date, dayEvents]) => (
        <div key={date} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{date}</div>
          {dayEvents.map((ev, i) => {
            const start = new Date(ev.start)
            const end = new Date(ev.end)
            const time = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 14,
                padding: '14px 16px', marginBottom: 8,
                borderLeft: `3px solid ${ev.color || '#6366f1'}`,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{ev.title || ev.summary}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{ev.isAllDay ? 'All day' : `${time} – ${endTime}`}</div>
                {ev.calendar && <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>{ev.calendar}</div>}
                {ev.location && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>📍 {ev.location}</div>}
              </div>
            )
          })}
        </div>
      ))}

      {!loading && upcoming.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', padding: '40px 0', fontSize: 14 }}>
          No upcoming events{activeCalendar !== 'all' ? ` in ${activeCalendar}` : ''}
        </div>
      )}
    </div>
  )
}

/* ── Main ── */
export default function HomePage() {
  const [tab, setTab] = useState<TabId>('business')
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

  const featuredAgent = AGENTS.find(a => a.id === selectedAgent) || AGENTS[0]

  const fetchAgentActivity = useCallback(async (agentId: string) => {
    setActivityLoading(true)
    try {
      const res = await fetch(`/api/agent-activity?agent=${agentId}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAgentActivity(data)
    } catch {
      setAgentActivity(null)
    } finally {
      setActivityLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetch('/api/setup', {
      method: 'POST',
      cache: 'no-store',
    }).catch((error) => {
      console.error('Auto setup failed:', error)
    })
  }, [])

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])

  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateFmt = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeFmt = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const handleAppClick = useCallback((app: AppDef) => {
    if (app.href) { window.open(app.href, '_blank'); return }
    if (app.id === 'calendar') { setActiveApp('calendar'); return }
    if (app.id === 'maps') { setActiveApp('maps'); return }
    if (app.id === 'lovely') { setActiveApp('lovely'); return }
    if (app.id === 'health') { setActiveApp('health'); return }
    if (app.id === 'memory') { setActiveApp('memory'); return }
    if (app.id === 'docs') { setActiveApp('docs'); return }
    if (app.id === 'plans') { setActiveApp('plans'); return }
    if (app.id === 'newshub') { setActiveApp('newshub'); return }
    if (app.id === 'reading') { setActiveApp('reading'); return }
    if (app.id === 'skillshop') { setActiveApp('skillshop'); return }
    if (app.id === 'roadmap') { setActiveApp('roadmap'); return }
    // Future: other apps
  }, [])

  const handleQuickChatSend = useCallback(async () => {
    const message = quickInput.trim()
    if (!message || quickLoading) return

    setQuickLoading(true)
    setQuickExpanded(false)
    setQuickReply('')
    setQuickInput('')
    setQuickHistory((prev) => [...prev, { role: 'user' as const, content: message }].slice(-10))

    try {
      const response = await fetch('/api/chat-quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: quickHistory.slice(-10),
        }),
      })

      if (!response.ok) throw new Error('chat-quick request failed')
      const data = await response.json()
      const text = String(data?.text || '').trim() || 'Sorry, I could not generate a response.'

      setQuickReply(text)
      setQuickHistory((prev) => [...prev, { role: 'assistant' as const, content: text }].slice(-10))
    } catch {
      const fallback = 'Sorry, something went wrong. Please try again.'
      setQuickReply(fallback)
      setQuickHistory((prev) => [...prev, { role: 'assistant' as const, content: fallback }].slice(-10))
    } finally {
      setQuickLoading(false)
    }
  }, [quickHistory, quickInput, quickLoading])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
      color: '#F0EEE8', fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ position: 'fixed', top: '5%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 500, margin: '0 auto', padding: '0 16px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header — compact on mobile */}
        <header style={{ paddingTop: 44, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ color: '#555', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>{dayName} · {dateFmt}</div>
          <h1 style={{ fontSize: 34, fontWeight: 700, margin: '2px 0', letterSpacing: -1, fontFamily: "'Space Grotesk', sans-serif" }}>Jake</h1>
          <div style={{ color: '#555', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>Mission Control</div>
          <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>v6.1</div>
          <div style={{ fontSize: 26, fontWeight: 200, fontFamily: 'monospace', letterSpacing: 3, marginTop: 6, opacity: 0.7 }}>{timeFmt}</div>
        </header>

        {/* Agent Selector — Hero Section */}
        {!activeApp && (
          <div style={{ marginBottom: 18 }}>
            {/* Featured Agent Card */}
            <div
              onClick={() => {
                if (!agentDetailOpen) fetchAgentActivity(selectedAgent)
                setAgentDetailOpen(v => !v)
              }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid rgba(255,255,255,0.06)`,
                borderRadius: 20,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Accent glow */}
              <div style={{
                position: 'absolute', top: -40, left: -40, width: 120, height: 120,
                borderRadius: '50%', background: `${featuredAgent.accent}08`,
                filter: 'blur(40px)', pointerEvents: 'none',
              }} />

              {/* Character Thumbnail */}
              <div style={{
                width: 100, height: 110, flexShrink: 0,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                position: 'relative',
              }}>
                <Image
                  src={featuredAgent.thumbnail}
                  alt={featuredAgent.name}
                  width={100}
                  height={110}
                  style={{ objectFit: 'contain', transition: 'opacity 0.3s ease' }}
                />
              </div>

              {/* Agent Info */}
              <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 20, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -0.5 }}>{featuredAgent.name}</span>
                  <span style={{
                    fontSize: 10, color: featuredAgent.accent, background: `${featuredAgent.accent}15`,
                    padding: '2px 8px', borderRadius: 10, fontWeight: 600, letterSpacing: 0.3,
                  }}>{featuredAgent.role}</span>
                </div>
                <div style={{ fontSize: 12, color: '#777', marginBottom: 6 }}>
                  {featuredAgent.model} · {featuredAgent.provider}
                </div>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>
                  <span style={{ color: '#666' }}>This week:</span>{' '}
                  <span style={{ color: '#aaa' }}>{featuredAgent.weekSummary}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: featuredAgent.accent, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {featuredAgent.monthSpend}
                  <span style={{ fontSize: 10, fontWeight: 400, color: '#555', marginLeft: 4 }}>this month</span>
                </div>
              </div>

              {/* Expand indicator */}
              <div style={{
                position: 'absolute', bottom: 8, right: 14, fontSize: 10, color: '#444',
                transition: 'transform 0.3s ease',
                transform: agentDetailOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {/* Expanded Detail Panel */}
            <div style={{
              maxHeight: agentDetailOpen ? 400 : 0,
              opacity: agentDetailOpen ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.4s ease, opacity 0.3s ease',
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderTop: 'none',
                borderRadius: '0 0 20px 20px',
                padding: '14px 18px 16px',
                maxHeight: 340,
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ccc', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {featuredAgent.name} — Last 7 Days
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setAgentDetailOpen(false) }}
                    style={{
                      background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
                      color: '#666', padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                    }}
                  >Close</button>
                </div>

                {activityLoading && (
                  <div style={{ color: '#555', fontSize: 12, padding: '16px 0', textAlign: 'center' }}>Loading activity...</div>
                )}

                {!activityLoading && agentActivity && (
                  <>
                    <p style={{ fontSize: 12, color: '#999', lineHeight: 1.5, marginBottom: 14 }}>{agentActivity.summary}</p>
                    {agentActivity.days.map(day => (
                      <div key={day.date} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                          {new Date(day.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        {day.items.map((item, i) => (
                          <div key={i} style={{ fontSize: 11, color: '#888', paddingLeft: 10, marginBottom: 2, position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0, color: '#444' }}>·</span>
                            {item}
                          </div>
                        ))}
                      </div>
                    ))}
                  </>
                )}

                {!activityLoading && !agentActivity && (
                  <div style={{ color: '#555', fontSize: 12, padding: '16px 0', textAlign: 'center' }}>Activity summary coming soon...</div>
                )}
              </div>
            </div>

            {/* Agent Switcher Chips */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 20, marginTop: 14,
            }}>
              {AGENTS.map(a => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedAgent(a.id)
                    setAgentDetailOpen(false)
                    setAgentActivity(null)
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 20,
                    border: selectedAgent === a.id ? `2px solid ${a.accent}` : '2px solid transparent',
                    padding: 2,
                    transition: 'all 0.3s ease',
                    boxShadow: selectedAgent === a.id ? `0 0 12px ${a.accent}30` : 'none',
                  }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      overflow: 'hidden', background: 'rgba(255,255,255,0.06)',
                    }}>
                      <Image src={a.avatar} alt={a.name} width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: selectedAgent === a.id ? 700 : 500,
                    color: selectedAgent === a.id ? a.accent : '#555',
                    transition: 'all 0.3s ease',
                  }}>{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!activeApp && (
          <div style={{
            marginBottom: 14,
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '8px 10px',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleQuickChatSend()
                  }
                }}
                placeholder="Ask anything..."
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  height: 34,
                  color: '#EDE9FE',
                  fontSize: 13,
                  padding: '0 10px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleQuickChatSend}
                disabled={quickLoading || !quickInput.trim()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid rgba(99,102,241,0.35)',
                  background: quickLoading ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.28)',
                  color: '#E9E6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: quickLoading ? 'default' : 'pointer',
                  opacity: quickInput.trim() ? 1 : 0.55,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>

            {(quickLoading || quickReply) && (
              <div
                onClick={() => setQuickExpanded((v) => !v)}
                style={{
                  marginTop: 8,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: 'rgba(15,12,26,0.72)',
                  border: `1px solid ${quickExpanded ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: '#BDB6DF',
                  fontSize: 12,
                  lineHeight: 1.4,
                  maxHeight: quickExpanded ? 220 : 72,
                  overflowY: 'auto',
                  cursor: 'pointer',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {quickLoading ? 'thinking...' : quickReply}
              </div>
            )}
          </div>
        )}

        {/* App Content Area */}
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.02)',
          borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.05)',
          borderBottom: 'none', padding: '20px 12px 110px',
        }}>
          {(activeApp === 'calendar' || activeApp === 'lovely' || activeApp === 'maps' || activeApp === 'health' || activeApp === 'memory' || activeApp === 'docs' || activeApp === 'plans' || activeApp === 'newshub' || activeApp === 'roadmap') ? null : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '12px 2px',
              justifyItems: 'center',
            }}>
              {TABS[tab].map(app => (
                <button key={app.id} onClick={() => handleAppClick(app)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                  WebkitTapHighlightColor: 'transparent',
                }} className="app-btn">
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `${app.color}12`, border: `1px solid ${app.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: app.color, transition: 'transform 0.1s',
                  }}>{app.icon}</div>
                  <span style={{ fontSize: 10, color: '#888', fontWeight: 500 }}>{app.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full-screen app views */}
      {activeApp === 'calendar' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const,
          paddingBottom: 80,
        }}>
          <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px', paddingTop: 52 }}>
            <CalendarView onBack={() => setActiveApp(null)} />
          </div>
        </div>
      )}

      {activeApp === 'lovely' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const,
          paddingBottom: 80,
        }}>
          <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>
            <div style={{ paddingTop: 52, marginBottom: 8 }}>
              <button onClick={() => setActiveApp(null)} style={{
                background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12,
                color: '#aaa', padding: '10px 16px', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>{I.back} Back</button>
            </div>
            <LovelyTab />
          </div>
        </div>
      )}

      {activeApp === 'maps' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const,
          paddingBottom: 80,
        }}>
          <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px', paddingTop: 52 }}>
            <MapsApp onBack={() => setActiveApp(null)} />
          </div>
        </div>
      )}

      {activeApp === 'memory' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ maxWidth: 800, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '52px 16px 8px' }}>
              <button onClick={() => setActiveApp(null)} style={{
                background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12,
                color: '#aaa', padding: '10px 16px', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>{I.back} Back</button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <MemoryView />
            </div>
          </div>
        </div>
      )}

      {activeApp === 'health' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const,
          paddingBottom: 80,
        }}>
          <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>
            <HealthApp onBack={() => setActiveApp(null)} />
          </div>
        </div>
      )}

      {activeApp === 'docs' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const,
          paddingBottom: 80,
        }}>
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
            <div style={{ paddingTop: 52, marginBottom: 8 }}>
              <button onClick={() => setActiveApp(null)} style={{
                background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12,
                color: '#aaa', padding: '10px 16px', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>{I.back} Back</button>
            </div>
            <DocsTab />
          </div>
        </div>
      )}

      {activeApp === 'plans' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const,
          paddingBottom: 80,
        }}>
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
            <div style={{ paddingTop: 52, marginBottom: 8 }}>
              <button onClick={() => setActiveApp(null)} style={{
                background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12,
                color: '#aaa', padding: '10px 16px', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>{I.back} Back</button>
            </div>
            <PlansTab />
          </div>
        </div>
      )}

      {activeApp === 'newshub' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ maxWidth: 600, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <NewsHubApp onBack={() => setActiveApp(null)} />
          </div>
        </div>
      )}

      {activeApp === 'reading' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const,
          paddingBottom: 80,
        }}>
          <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>
            <MediaListApp onBack={() => setActiveApp(null)} />
          </div>
        </div>
      )}

      {activeApp === 'skillshop' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const,
          paddingBottom: 80,
        }}>
          <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>
            <SkillShopApp onBack={() => setActiveApp(null)} />
          </div>
        </div>
      )}

      {activeApp === 'roadmap' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ maxWidth: 600, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <AppRoadmapApp onBack={() => setActiveApp(null)} />
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(10,8,18,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'center',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))', paddingTop: 8, zIndex: 100,
      }}>
        <div style={{ display: 'flex', maxWidth: 360, width: '100%', justifyContent: 'space-around' }}>
          {([
            { id: 'business' as TabId, icon: I.briefcase, label: 'Business' },
            { id: 'personal' as TabId, icon: I.user, label: 'Personal' },
            { id: 'laboratory' as TabId, icon: I.flask, label: 'Laboratory' },
          ]).map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setActiveApp(null) }} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 16px',
              color: tab === t.id ? '#6366f1' : '#555', transition: 'color 0.2s',
            }}>
              {t.icon}
              <span style={{ fontSize: 9, fontWeight: tab === t.id ? 700 : 500, letterSpacing: 0.5 }}>{t.label}</span>
              {tab === t.id && <div style={{ width: 4, height: 4, borderRadius: 2, background: '#6366f1' }} />}
            </button>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        .app-btn:active > div:first-child { transform: scale(0.9); }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  )
}
