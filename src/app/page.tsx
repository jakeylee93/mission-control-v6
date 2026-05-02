'use client'

import { useState, type ReactNode } from 'react'
import CalendarTab from '@/components/tabs/CalendarTab'
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
import CostHistoryPanel from '@/components/CostHistoryPanel'
import LiveFeed from '@/components/LiveFeed'
import DataExport from '@/components/DataExport'

type DataFreshness = 'live' | 'manual'
type Tone = 'ok' | 'warn' | 'error' | 'neutral'

type CapacityItem = {
  provider: string
  headline: string
  detail: string
  freshness: DataFreshness
  checkedAt: string
  tone: Tone
}

type AgentItem = {
  name: string
  role: string
  provider: string
  primaryModel: string
  fallbackModel: string
  plan: string
  remaining: string
  status: string
  nextAction: string
}

type HealthItem = {
  label: string
  value: string
  note: string
  freshness: DataFreshness
  checkedAt: string
  tone: Tone
}

type ProjectItem = {
  name: string
  status: string
  note: string
}

type RoadmapItem = {
  phase: string
  title: string
  note: string
}

type AppId =
  | 'calendar'
  | 'plans'
  | 'health'
  | 'memory'
  | 'docs'
  | 'news'
  | 'media'
  | 'maps'
  | 'lovely'
  | 'skillshop'
  | 'roadmap'
  | 'costs'
  | 'live'
  | 'export'

type AppDefinition = {
  id: AppId
  name: string
  group: 'Work' | 'Life' | 'Lab' | 'Data'
  icon: string
  description: string
  dataSource: string
  status: 'Live data' | 'Local data' | 'Needs connection' | 'Utility'
}

type MainTab = 'today' | 'work' | 'life' | 'agents' | 'data'

const capacity: CapacityItem[] = [
  {
    provider: 'OpenAI API',
    headline: '$19.41 remaining',
    detail: 'Auto recharge is off.',
    freshness: 'live',
    checkedAt: 'May 2, 2026',
    tone: 'ok',
  },
  {
    provider: 'Anthropic API',
    headline: 'Unknown balance',
    detail: 'Usage check failed with HTTP 401 invalid bearer token.',
    freshness: 'live',
    checkedAt: 'May 2, 2026',
    tone: 'error',
  },
  {
    provider: 'Moonshot API',
    headline: 'Unknown balance',
    detail: 'Needs provider usage integration.',
    freshness: 'manual',
    checkedAt: 'Needs integration',
    tone: 'warn',
  },
  {
    provider: 'ElevenLabs',
    headline: 'Key present',
    detail: 'Credits unknown until API usage check is wired.',
    freshness: 'manual',
    checkedAt: 'Needs integration',
    tone: 'warn',
  },
  {
    provider: 'Brave',
    headline: 'Enabled',
    detail: 'Usage and quota visibility not integrated yet.',
    freshness: 'manual',
    checkedAt: 'Needs integration',
    tone: 'neutral',
  },
]

const agents: AgentItem[] = [
  {
    name: 'Marg',
    role: 'Main orchestrator',
    provider: 'Anthropic',
    primaryModel: 'Claude Opus 4.6',
    fallbackModel: 'Moonshot Kimi',
    plan: 'Anthropic API (auth issue currently)',
    remaining: 'Unknown until auth is fixed',
    status: 'Active',
    nextAction: 'Rotate bearer token and re-run Anthropic usage check.',
  },
  {
    name: 'Doc',
    role: 'Builder / implementation agent',
    provider: 'OpenAI',
    primaryModel: 'GPT-5.5',
    fallbackModel: 'GPT-4o',
    plan: 'OpenAI API credit balance',
    remaining: '$19.41 shared API credit',
    status: 'Active',
    nextAction: 'Keep $ threshold alerting and optional auto-recharge decision.',
  },
  {
    name: 'Cindy',
    role: 'Ops assistant',
    provider: 'Moonshot',
    primaryModel: 'Kimi K2.6',
    fallbackModel: 'None configured',
    plan: 'Moonshot API usage pending integration',
    remaining: 'Unknown until Moonshot usage endpoint is wired',
    status: 'Standing by',
    nextAction: 'Add Moonshot usage endpoint and surface monthly burn trend.',
  },
]

const health: HealthItem[] = [
  {
    label: 'OpenClaw runtime',
    value: 'Running',
    note: 'Core orchestration process appears healthy.',
    freshness: 'live',
    checkedAt: 'May 2, 2026',
    tone: 'ok',
  },
  {
    label: 'Gateway',
    value: 'Reachable',
    note: 'Routing path available for agent activity.',
    freshness: 'live',
    checkedAt: 'May 2, 2026',
    tone: 'ok',
  },
  {
    label: 'Active sessions',
    value: 'Observed (count not yet wired)',
    note: 'Placeholder until direct OpenClaw session count integration.',
    freshness: 'manual',
    checkedAt: 'Last checked: May 2, 2026',
    tone: 'warn',
  },
  {
    label: 'Memory note',
    value: 'Persistence available',
    note: 'Long-term memory metrics are not yet surfaced in this view.',
    freshness: 'manual',
    checkedAt: 'Needs integration',
    tone: 'neutral',
  },
]

const projects: ProjectItem[] = [
  {
    name: 'The Bar People',
    status: 'In progress',
    note: 'Execution active, keep weekly KPI pulse visible.',
  },
  {
    name: 'AnyVendor',
    status: 'Stabilizing',
    note: 'Prioritize current delivery blockers and quick wins.',
  },
  {
    name: 'Mission Control',
    status: 'MVP build',
    note: 'This dashboard is Phase 1 baseline.',
  },
  {
    name: 'Client Sites',
    status: 'Maintenance',
    note: 'Track support queue and launch windows.',
  },
  {
    name: 'Personal Ops',
    status: 'Active',
    note: 'Keep habits, admin and planning in one loop.',
  },
]

const roadmap: RoadmapItem[] = [
  {
    phase: 'Phase 1',
    title: 'Static useful dashboard',
    note: 'Shippable command-center baseline with trusted labels.',
  },
  {
    phase: 'Phase 2',
    title: 'OpenClaw status integration',
    note: 'Wire live session counts and heartbeat details.',
  },
  {
    phase: 'Phase 3',
    title: 'Provider APIs',
    note: 'Add OpenAI, Anthropic, Moonshot, ElevenLabs usage calls.',
  },
  {
    phase: 'Phase 4',
    title: 'Tasks and waiting-on',
    note: 'Track commitments, blockers, and owners per area.',
  },
  {
    phase: 'Phase 5',
    title: 'Command centre',
    note: 'Live controls, alerting, and decision automation.',
  },

]

const apps: AppDefinition[] = [
  { id: 'calendar', name: 'Calendar', group: 'Work', icon: '📅', description: 'Google Calendar events, week/agenda view and reconnect flow.', dataSource: 'Google Calendar API via existing routes', status: 'Live data' },
  { id: 'plans', name: 'Plans', group: 'Work', icon: '✅', description: 'Tasks, ventures, planning tiers and active priorities.', dataSource: 'Existing plans/categories APIs', status: 'Live data' },
  { id: 'news', name: 'News Hub', group: 'Work', icon: '📰', description: 'Sources, campaigns, newsletters, AI drafts and saved items.', dataSource: 'News Hub API + Supabase where configured', status: 'Live data' },
  { id: 'health', name: 'Health', group: 'Life', icon: '❤️', description: 'Daily health, nutrition, drinks and quick actions.', dataSource: 'Health APIs + Supabase tables', status: 'Live data' },
  { id: 'maps', name: 'Maps', group: 'Life', icon: '🗺️', description: 'Places and location workflows preserved from the old app.', dataSource: 'Existing maps component data', status: 'Local data' },
  { id: 'lovely', name: 'Lovely', group: 'Life', icon: '🌙', description: 'Personal wellbeing, water, lager, affirmations and check-ins.', dataSource: 'Lovely APIs + Supabase tables', status: 'Live data' },
  { id: 'media', name: 'Media List', group: 'Life', icon: '🎧', description: 'Books, podcasts, films and saved recommendations.', dataSource: 'Media list API + Supabase tables', status: 'Live data' },
  { id: 'memory', name: 'Memory', group: 'Lab', icon: '🧠', description: 'Search and browse the memory layer without leaving Mission Control.', dataSource: 'Existing memory APIs/files', status: 'Live data' },
  { id: 'docs', name: 'Docs', group: 'Lab', icon: '📁', description: 'Document vault, folders, uploads and search.', dataSource: 'Docs API + local workspace storage', status: 'Live data' },
  { id: 'skillshop', name: 'Skill Shop', group: 'Lab', icon: '🧩', description: 'Skill discovery, queue and favourites.', dataSource: 'Skill Shop APIs', status: 'Live data' },
  { id: 'roadmap', name: 'Roadmap', group: 'Lab', icon: '🚀', description: 'App roadmap and build pipeline view.', dataSource: 'Existing app roadmap API', status: 'Live data' },
  { id: 'costs', name: 'Cost History', group: 'Data', icon: '💷', description: 'AI cost history, trends and budget pressure.', dataSource: 'Costs APIs + Supabase/local fallback', status: 'Live data' },
  { id: 'live', name: 'Live Feed', group: 'Data', icon: '📡', description: 'Realtime events and system activity stream.', dataSource: 'SSE /api/socket', status: 'Live data' },
  { id: 'export', name: 'Data Export', group: 'Data', icon: '📦', description: 'Export calendar, tasks and full backups.', dataSource: 'Export API', status: 'Utility' },
]

function freshnessLabel(freshness: DataFreshness): string {
  return freshness === 'live' ? 'Live checked' : 'Manual / needs integration'
}

function toneClasses(tone: Tone): string {
  if (tone === 'ok') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
  if (tone === 'warn') return 'border-amber-400/40 bg-amber-500/10 text-amber-200'
  if (tone === 'error') return 'border-rose-400/40 bg-rose-500/10 text-rose-200'
  return 'border-zinc-500/40 bg-zinc-500/10 text-zinc-200'
}

export default function HomePage() {
  const [activeApp, setActiveApp] = useState<AppId | null>(null)
  const [activeTab, setActiveTab] = useState<MainTab>('today')

  return (
    <main className="min-h-screen bg-[#05070c] pb-24 text-[#f4f6fb]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(57,87,142,0.28),_transparent_48%),radial-gradient(circle_at_80%_20%,_rgba(50,124,92,0.2),_transparent_42%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-6 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <HeaderBar />
        <div className="mt-5">
          {activeTab === 'today' && <TodayTab onOpenApp={setActiveApp} />}
          {activeTab === 'work' && <WorkTab onOpenApp={setActiveApp} />}
          {activeTab === 'life' && <LifeTab onOpenApp={setActiveApp} />}
          {activeTab === 'agents' && <AgentsTab />}
          {activeTab === 'data' && <DataTab onOpenApp={setActiveApp} />}
        </div>
      </div>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      {activeApp && <ActiveAppOverlay appId={activeApp} onClose={() => setActiveApp(null)} />}
    </main>
  )
}

function HeaderBar() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[linear-gradient(140deg,rgba(9,13,23,0.95),rgba(10,17,30,0.82))] p-4 shadow-[0_20px_80px_rgba(1,6,18,0.55)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Jake&apos;s Life Mission Control</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold text-white sm:text-3xl">Today&apos;s run</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Short briefing first. Work, Life, Agents and Data live behind the bottom tabs — no endless wall of cards.
          </p>
        </div>
        <a href="/legacy" className="w-fit rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:border-white/25 hover:bg-white/10">
          Legacy workspace
        </a>
      </div>
    </section>
  )
}

function TodayTab({ onOpenApp }: { onOpenApp: (app: AppId) => void }) {
  const openAi = capacity.find((item) => item.provider === 'OpenAI API')
  const urgentProjects = projects.slice(0, 3)

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3">
        <BriefCard label="Next up" value="Check calendar" note="Open Calendar for the live day run." action="Calendar" onClick={() => onOpenApp('calendar')} />
        <BriefCard label="Priority" value="Keep builds moving" note="Plans holds the working task list." action="Plans" onClick={() => onOpenApp('plans')} />
        <BriefCard label="AI balance" value={openAi?.headline ?? 'Unknown'} note={openAi?.detail ?? 'Needs usage sync.'} action="Agents" />
      </section>

      <Panel title="Good run of the day" subtitle="The only things that should be on the home dashboard">
        <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Today</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Start with the calendar, then the top tasks.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Mission Control should behave like a chief of staff: tell you what matters, then get out of the way. The old apps are still present, just tucked into their proper tabs.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton onClick={() => onOpenApp('calendar')}>Open Calendar</ActionButton>
              <ActionButton onClick={() => onOpenApp('plans')}>Open Plans</ActionButton>
              <ActionButton onClick={() => onOpenApp('costs')}>AI Spend</ActionButton>
            </div>
          </div>
          <div className="space-y-3">
            {urgentProjects.map((project) => (
              <article key={project.name} className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{project.name}</p>
                  <span className="rounded-full border border-white/15 px-2 py-1 text-[11px] text-slate-200">{project.status}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-400">{project.note}</p>
              </article>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Attention strip" subtitle="Tiny status bar, not a dashboard avalanche">
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStatus title="OpenClaw" value="Running" tone="ok" />
          <MiniStatus title="Anthropic" value="Auth issue" tone="error" />
          <MiniStatus title="Auto recharge" value="Off" tone="warn" />
        </div>
      </Panel>
    </div>
  )
}

function WorkTab({ onOpenApp }: { onOpenApp: (app: AppId) => void }) {
  return (
    <div className="space-y-4">
      <Panel title="Work" subtitle="Business tools and working data">
        <AppGrid apps={apps.filter((app) => app.group === 'Work')} onOpenApp={onOpenApp} />
      </Panel>
      <Panel title="Work areas" subtitle="The business lanes to keep moving">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.filter((project) => project.name !== 'Personal Ops').map((project) => <ProjectCard key={project.name} project={project} />)}
        </div>
      </Panel>
    </div>
  )
}

function LifeTab({ onOpenApp }: { onOpenApp: (app: AppId) => void }) {
  return (
    <div className="space-y-4">
      <Panel title="Life" subtitle="Personal operating system, health and places">
        <AppGrid apps={apps.filter((app) => app.group === 'Life')} onOpenApp={onOpenApp} />
      </Panel>
      <Panel title="Personal ops" subtitle="Keep the non-work stuff visible but calm">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProjectCard project={projects.find((project) => project.name === 'Personal Ops') ?? projects[0]} />
          <div className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-4">
            <p className="text-sm font-medium text-white">Today&apos;s life check</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Health, Lovely, Maps and Media are one tap away — no need for them to clutter the morning briefing.</p>
          </div>
        </div>
      </Panel>
    </div>
  )
}

function AgentsTab() {
  return (
    <div className="space-y-4">
      <Panel title="Agents" subtitle="Models, providers, capacity and next action">
        <div className="grid gap-3 md:grid-cols-3">
          {agents.map((agent) => (
            <article key={agent.name} className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-medium text-white">{agent.name}</p>
                <span className="rounded-full border border-sky-300/30 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-200">{agent.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-300">{agent.role}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <Row term="Provider" value={agent.provider} />
                <Row term="Primary" value={agent.primaryModel} />
                <Row term="Fallback" value={agent.fallbackModel} />
                <Row term="Remaining" value={agent.remaining} />
              </dl>
              <p className="mt-3 rounded-lg border border-indigo-300/20 bg-indigo-500/10 p-2 text-xs text-indigo-100">Next: {agent.nextAction}</p>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="AI Credits / Capacity" subtitle="Provider balances and auth state">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {capacity.map((item) => <CapacityCard key={item.provider} item={item} />)}
        </div>
      </Panel>
    </div>
  )
}

function DataTab({ onOpenApp }: { onOpenApp: (app: AppId) => void }) {
  return (
    <div className="space-y-4">
      <Panel title="Data & Lab" subtitle="Memory, costs, exports, roadmap and system tools">
        <AppGrid apps={apps.filter((app) => app.group === 'Data' || app.group === 'Lab')} onOpenApp={onOpenApp} />
      </Panel>
      <Panel title="System health" subtitle="Small status snapshot">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {health.map((item) => (
            <article key={item.label} className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
                </div>
                <Tag label={freshnessLabel(item.freshness)} tone={item.tone} />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{item.note}</p>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Roadmap" subtitle="What this grows into next">
        <ol className="grid gap-3 md:grid-cols-5">
          {roadmap.map((item) => (
            <li key={item.phase} className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{item.phase}</p>
              <p className="mt-1 text-sm font-medium text-white">{item.title}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{item.note}</p>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  )
}

function AppGrid({ apps, onOpenApp }: { apps: AppDefinition[]; onOpenApp: (app: AppId) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map((app) => (
        <button
          key={app.id}
          type="button"
          onClick={() => onOpenApp(app.id)}
          className="group rounded-xl border border-white/10 bg-[#0b1220]/85 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-[#101a2d]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-2xl" aria-hidden="true">{app.icon}</div>
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">{app.status}</span>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-white">{app.name}</h3>
          <p className="mt-1 min-h-[2.5rem] text-xs leading-5 text-slate-400">{app.description}</p>
          <p className="mt-3 border-t border-white/10 pt-3 text-[11px] text-slate-500">{app.dataSource}</p>
        </button>
      ))}
    </div>
  )
}

function BottomNav({ activeTab, onChange }: { activeTab: MainTab; onChange: (tab: MainTab) => void }) {
  const tabs: { id: MainTab; label: string; icon: string }[] = [
    { id: 'today', label: 'Today', icon: '☀️' },
    { id: 'work', label: 'Work', icon: '💼' },
    { id: 'life', label: 'Life', icon: '🌿' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'data', label: 'Data', icon: '📊' },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#070b13]/95 px-3 py-2 backdrop-blur-xl">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`rounded-2xl px-2 py-2 text-center text-[11px] transition ${active ? 'bg-cyan-500/15 text-cyan-100' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
            >
              <div className="text-lg leading-none" aria-hidden="true">{tab.icon}</div>
              <div className="mt-1 font-medium">{tab.label}</div>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function BriefCard({ label, value, note, action, onClick }: { label: string; value: string; note: string; action?: string; onClick?: () => void }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#0a101c]/75 p-4 shadow-[0_12px_40px_rgba(2,8,20,0.45)]">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
      <p className="mt-2 min-h-[2.5rem] text-xs leading-5 text-slate-400">{note}</p>
      {action && onClick && <button type="button" onClick={onClick} className="mt-3 text-xs font-medium text-cyan-200">{action} →</button>}
    </article>
  )
}

function ActionButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-xl border border-cyan-300/25 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-500/15">{children}</button>
}

function MiniStatus({ title, value, tone }: { title: string; value: string; tone: Tone }) {
  return (
    <div className={`rounded-xl border p-3 ${toneClasses(tone)}`}>
      <p className="text-xs uppercase tracking-wide opacity-75">{title}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

function ProjectCard({ project }: { project: ProjectItem }) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">{project.name}</p>
        <span className="rounded-full border border-white/15 px-2 py-1 text-[11px] text-slate-200">{project.status}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{project.note}</p>
    </article>
  )
}

function CapacityCard({ item }: { item: CapacityItem }) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{item.provider}</p>
          <p className="mt-1 text-base font-medium text-white">{item.headline}</p>
        </div>
        <Tag label={freshnessLabel(item.freshness)} tone={item.tone} />
      </div>
      <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
      <p className="mt-2 text-xs text-slate-500">{item.checkedAt}</p>
    </article>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a101c]/75 p-4 shadow-[0_12px_40px_rgba(2,8,20,0.55)] sm:p-5">
      <div className="mb-3">
        <h2 className="font-heading text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function Tag({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClasses(tone)}`}>{label}</span>
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.2rem_1fr] gap-2">
      <dt className="text-slate-400">{term}</dt>
      <dd className="text-slate-200">{value}</dd>
    </div>
  )
}
function ActiveAppOverlay({ appId, onClose }: { appId: AppId; onClose: () => void }) {
  const app = apps.find((item) => item.id === appId)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#05070c] text-[#f4f6fb]">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#05070c]/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/75">Mission Control App</p>
            <h2 className="text-base font-semibold text-white">{app?.name ?? 'App'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-white/25 hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
      <div className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {app && (
          <div className="mb-4 rounded-2xl border border-white/10 bg-[#0a101c]/75 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-300">{app.description}</p>
                <p className="mt-1 text-xs text-slate-500">Data source: {app.dataSource}</p>
              </div>
              <span className="w-fit rounded-full border border-emerald-300/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                {app.status}
              </span>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-white/10 bg-[#080d18]/65 p-3 sm:p-4">
          {renderActiveApp(appId, onClose)}
        </div>
      </div>
    </div>
  )
}

function renderActiveApp(appId: AppId, onClose: () => void) {
  if (appId === 'calendar') return <CalendarTab />
  if (appId === 'plans') return <PlansTab />
  if (appId === 'health') return <HealthApp onBack={onClose} />
  if (appId === 'memory') return <MemoryView />
  if (appId === 'docs') return <DocsTab />
  if (appId === 'news') return <NewsHubApp onBack={onClose} />
  if (appId === 'media') return <MediaListApp onBack={onClose} />
  if (appId === 'maps') return <MapsApp onBack={onClose} />
  if (appId === 'lovely') return <LovelyTab />
  if (appId === 'skillshop') return <SkillShopApp onBack={onClose} />
  if (appId === 'roadmap') return <AppRoadmapApp onBack={onClose} />
  if (appId === 'costs') return <CostHistoryPanel />
  if (appId === 'live') return <LiveFeed />
  return <DataExport />
}

