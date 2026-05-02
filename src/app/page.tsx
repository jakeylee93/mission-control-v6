import type { ReactNode } from 'react'

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
  return (
    <main className="min-h-screen bg-[#05070c] text-[#f4f6fb]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(57,87,142,0.28),_transparent_48%),radial-gradient(circle_at_80%_20%,_rgba(50,124,92,0.2),_transparent_42%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <section className="rounded-2xl border border-white/10 bg-[linear-gradient(140deg,rgba(9,13,23,0.95),rgba(10,17,30,0.82))] p-5 shadow-[0_20px_80px_rgba(1,6,18,0.55)] sm:p-7">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Jake&apos;s Life Mission Control</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-white sm:text-3xl">Mission Control Lite</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                First MVP dashboard for credits, agents, system health, and life areas. Values are explicitly tagged as
                live checked vs manual placeholders. The previous full workspace is preserved at /legacy.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <div className="rounded-xl border border-cyan-300/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                Snapshot date: May 2, 2026
              </div>
              <a href="/legacy" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:border-white/25 hover:bg-white/10">
                Open legacy workspace
              </a>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel title="AI Credits / Capacity" subtitle="Do not expose secrets. Show confidence level clearly.">
            <div className="space-y-3">
              {capacity.map((item) => (
                <article key={item.provider} className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-4">
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
              ))}
            </div>
          </Panel>

          <Panel title="System Health" subtitle="Operational status with integration boundaries">
            <div className="space-y-3">
              {health.map((item) => (
                <article key={item.label} className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                      <p className="mt-1 text-base font-medium text-white">{item.value}</p>
                    </div>
                    <Tag label={freshnessLabel(item.freshness)} tone={item.tone} />
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{item.note}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.checkedAt}</p>
                </article>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-4">
          <Panel title="Agents" subtitle="Role, model stack, plan, remaining capacity, and immediate next action">
            <div className="grid gap-3 md:grid-cols-3">
              {agents.map((agent) => (
                <article key={agent.name} className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-medium text-white">{agent.name}</p>
                    <span className="rounded-full border border-sky-300/30 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-200">
                      {agent.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{agent.role}</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <Row term="Provider" value={agent.provider} />
                    <Row term="Primary" value={agent.primaryModel} />
                    <Row term="Fallback" value={agent.fallbackModel} />
                    <Row term="Plan" value={agent.plan} />
                    <Row term="Remaining" value={agent.remaining} />
                  </dl>
                  <p className="mt-3 rounded-lg border border-indigo-300/20 bg-indigo-500/10 p-2 text-xs text-indigo-100">
                    Next: {agent.nextAction}
                  </p>
                </article>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Projects / Life Areas" subtitle="Simple status sweep across active domains">
            <div className="space-y-3">
              {projects.map((project) => (
                <article key={project.name} className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{project.name}</p>
                    <span className="rounded-full border border-white/15 px-2 py-1 text-[11px] text-slate-200">{project.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{project.note}</p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Roadmap" subtitle="Incremental path from static dashboard to command centre">
            <ol className="space-y-3">
              {roadmap.map((item) => (
                <li key={item.phase} className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{item.phase}</p>
                  <p className="mt-1 text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.note}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </section>
      </div>
    </main>
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
