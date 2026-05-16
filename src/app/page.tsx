import type { ReactNode } from 'react'

type AccessState = 'yes' | 'partial' | 'no'

type Agent = {
  name: string
  system: 'Hermes' | 'OpenClaw'
  profile: string
  role: string
  provider: string
  model: string
  gateway: string
  auth: string
  access: {
    discord: AccessState
    email: AccessState
    githubVercel: AccessState
    supabase: AccessState
    terminalFileBrowser: AccessState
    memory: AccessState
    voiceMedia: AccessState
  }
  notes: string
}

const agents: Agent[] = [
  {
    name: 'Peach',
    system: 'Hermes',
    profile: 'default',
    role: 'Main day-to-day business agent and coordinator',
    provider: 'OpenAI Codex',
    model: 'gpt-5.5',
    gateway: 'Discord gateway running',
    auth: 'Codex logged in; Microsoft 365 email configured for jake@thebarpeople.co.uk',
    access: {
      discord: 'yes',
      email: 'yes',
      githubVercel: 'yes',
      supabase: 'partial',
      terminalFileBrowser: 'yes',
      memory: 'yes',
      voiceMedia: 'yes',
    },
    notes: 'Primary controller for inbox-approved email, deployments, research, schedules, and agent coordination.',
  },
  {
    name: 'Honey',
    system: 'Hermes',
    profile: 'honey',
    role: 'Project-capable build agent',
    provider: 'OpenAI Codex',
    model: 'gpt-5.5',
    gateway: 'Discord gateway running',
    auth: 'Fresh Codex OAuth credential added today',
    access: {
      discord: 'yes',
      email: 'no',
      githubVercel: 'yes',
      supabase: 'yes',
      terminalFileBrowser: 'yes',
      memory: 'yes',
      voiceMedia: 'yes',
    },
    notes: 'Can build, test, push, deploy and use shared anyOS Supabase environment through machine-level auth.',
  },
  {
    name: 'Nivi',
    system: 'Hermes',
    profile: 'nivi',
    role: 'Project-capable build agent',
    provider: 'OpenAI Codex',
    model: 'gpt-5.5',
    gateway: 'Discord gateway running',
    auth: 'Fresh Codex OAuth credential added today',
    access: {
      discord: 'yes',
      email: 'no',
      githubVercel: 'yes',
      supabase: 'yes',
      terminalFileBrowser: 'yes',
      memory: 'yes',
      voiceMedia: 'yes',
    },
    notes: 'Smoke-tested today after re-auth; ready for branch/worktree/build/deploy tasks.',
  },
  {
    name: 'Cindy',
    system: 'Hermes',
    profile: 'cindy',
    role: 'Ops assistant and build-capable helper',
    provider: 'OpenAI Codex',
    model: 'gpt-5.5',
    gateway: 'Discord gateway running',
    auth: 'Fresh Codex OAuth credential added today',
    access: {
      discord: 'yes',
      email: 'no',
      githubVercel: 'yes',
      supabase: 'yes',
      terminalFileBrowser: 'yes',
      memory: 'yes',
      voiceMedia: 'yes',
    },
    notes: 'Smoke-tested today after re-auth; Hermes Cindy is separate from the older OpenClaw Cindy token issue.',
  },
  {
    name: 'Doc',
    system: 'Hermes',
    profile: 'docs',
    role: 'Documentation and implementation helper',
    provider: 'OpenAI Codex',
    model: 'gpt-5.5',
    gateway: 'Discord gateway running',
    auth: 'Codex profile configured',
    access: {
      discord: 'yes',
      email: 'no',
      githubVercel: 'yes',
      supabase: 'yes',
      terminalFileBrowser: 'yes',
      memory: 'yes',
      voiceMedia: 'yes',
    },
    notes: 'Hermes Doc token is distinct from Honey; older OpenClaw Doc is a different system.',
  },
  {
    name: 'Alhambra',
    system: 'Hermes',
    profile: 'alhambra',
    role: 'Gemini-backed research/build agent',
    provider: 'Gemini',
    model: 'gemini-2.5-pro',
    gateway: 'Discord gateway running',
    auth: 'Gemini API key configured',
    access: {
      discord: 'yes',
      email: 'no',
      githubVercel: 'yes',
      supabase: 'yes',
      terminalFileBrowser: 'yes',
      memory: 'yes',
      voiceMedia: 'yes',
    },
    notes: 'Useful when Codex profiles are busy or need a non-Codex viewpoint.',
  },
  {
    name: 'Clobber',
    system: 'Hermes',
    profile: 'clobber',
    role: 'Claude-backed builder/reviewer',
    provider: 'Anthropic',
    model: 'claude-sonnet-4-5',
    gateway: 'Discord gateway running',
    auth: 'Anthropic API key configured',
    access: {
      discord: 'yes',
      email: 'no',
      githubVercel: 'yes',
      supabase: 'yes',
      terminalFileBrowser: 'yes',
      memory: 'yes',
      voiceMedia: 'yes',
    },
    notes: 'Best for code review, careful reasoning and non-Codex fallback work.',
  },
  {
    name: 'Lippy',
    system: 'Hermes',
    profile: 'lippy',
    role: 'Kimi-backed builder and fixer',
    provider: 'Kimi / Moonshot',
    model: 'kimi-k2.6',
    gateway: 'Discord gateway running',
    auth: 'Kimi API key configured',
    access: {
      discord: 'yes',
      email: 'no',
      githubVercel: 'yes',
      supabase: 'yes',
      terminalFileBrowser: 'yes',
      memory: 'yes',
      voiceMedia: 'yes',
    },
    notes: 'Good fallback route when Codex OAuth needs attention or capacity is stretched.',
  },
  {
    name: 'Rusty',
    system: 'Hermes',
    profile: 'rusty',
    role: 'Kimi-backed support agent',
    provider: 'Kimi / Moonshot',
    model: 'kimi-k2.6',
    gateway: 'Discord gateway running',
    auth: 'Kimi API key configured',
    access: {
      discord: 'yes',
      email: 'no',
      githubVercel: 'yes',
      supabase: 'yes',
      terminalFileBrowser: 'yes',
      memory: 'yes',
      voiceMedia: 'yes',
    },
    notes: 'Project-capable support profile with the same shared machine GitHub/Vercel path.',
  },
  {
    name: 'Margarita',
    system: 'Hermes',
    profile: 'margarita',
    role: 'Separate Hermes Margarita profile',
    provider: 'OpenAI Codex',
    model: 'gpt-5.5',
    gateway: 'Gateway stopped at last inventory',
    auth: 'Codex profile configured; not currently a live Discord responder',
    access: {
      discord: 'partial',
      email: 'no',
      githubVercel: 'partial',
      supabase: 'no',
      terminalFileBrowser: 'yes',
      memory: 'yes',
      voiceMedia: 'yes',
    },
    notes: 'Do not confuse with OpenClaw Margarita/main. This is a Hermes profile with a separate bot identity.',
  },
  {
    name: 'Margarita / main',
    system: 'OpenClaw',
    profile: 'main',
    role: 'Older OpenClaw main agent',
    provider: 'Anthropic via OpenClaw',
    model: 'claude-opus-4-6 with Kimi fallback',
    gateway: 'OpenClaw Discord token returned 401 in last audit',
    auth: 'Model route configured; Discord bot token needs repair before live use',
    access: {
      discord: 'no',
      email: 'no',
      githubVercel: 'yes',
      supabase: 'partial',
      terminalFileBrowser: 'yes',
      memory: 'partial',
      voiceMedia: 'no',
    },
    notes: 'Older OpenClaw runtime still exists. Keep separate from Hermes Margarita to avoid name confusion.',
  },
  {
    name: 'Doc / doc',
    system: 'OpenClaw',
    profile: 'doc',
    role: 'Older OpenClaw documentation/build agent',
    provider: 'OpenAI via OpenClaw',
    model: 'gpt-4o with gpt-4.1-mini and Kimi fallbacks',
    gateway: 'OpenClaw Discord token returned 401 in last audit',
    auth: 'Needs Discord token repair before live Discord use',
    access: {
      discord: 'no',
      email: 'no',
      githubVercel: 'yes',
      supabase: 'partial',
      terminalFileBrowser: 'yes',
      memory: 'partial',
      voiceMedia: 'no',
    },
    notes: 'Distinct from Hermes Doc/docs. Keep both visible until OpenClaw tokens are fixed or retired.',
  },
]

const accessColumns: Array<{ key: keyof Agent['access']; label: string }> = [
  { key: 'discord', label: 'Discord' },
  { key: 'email', label: 'Email' },
  { key: 'githubVercel', label: 'GitHub/Vercel' },
  { key: 'supabase', label: 'Supabase' },
  { key: 'terminalFileBrowser', label: 'Tools' },
  { key: 'memory', label: 'Memory' },
  { key: 'voiceMedia', label: 'Voice/media' },
]

function badgeClass(state: AccessState) {
  if (state === 'yes') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
  if (state === 'partial') return 'border-amber-400/30 bg-amber-400/10 text-amber-200'
  return 'border-red-400/30 bg-red-400/10 text-red-200'
}

function labelFor(state: AccessState) {
  if (state === 'yes') return 'Yes'
  if (state === 'partial') return 'Partial'
  return 'No'
}

const liveHermes = agents.filter((agent) => agent.system === 'Hermes' && agent.gateway.includes('running')).length
const codexAgents = agents.filter((agent) => agent.provider.includes('Codex')).length
const projectReady = agents.filter(
  (agent) => agent.access.githubVercel === 'yes' && agent.access.terminalFileBrowser === 'yes',
).length
const emailAgents = agents.filter((agent) => agent.access.email === 'yes').length

export default function MissionControlV10() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_28%),#05040a] px-4 py-6 text-stone-100 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex rounded-full border border-purple-300/20 bg-purple-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-purple-100">
                Mission Control v10 - agent fleet dashboard
              </p>
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Who is online, what they run on, and what they can touch.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-stone-300 sm:text-lg">
                First cut of the new Mission Control: a clean smart list of the Hermes and OpenClaw agents, their models, gateway state and practical access levels. No secrets are shown.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[460px]">
              <Stat label="Live Hermes" value={String(liveHermes)} tone="green" />
              <Stat label="Codex profiles" value={String(codexAgents)} tone="purple" />
              <Stat label="Build/deploy ready" value={String(projectReady)} tone="gold" />
              <Stat label="Email agents" value={String(emailAgents)} tone="blue" />
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl text-white">Smart agent list</h2>
                <p className="text-sm text-stone-400">Sorted by practical readiness first, then older OpenClaw items needing attention.</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">{agents.length} agents tracked</span>
            </div>

            <div className="space-y-3">
              {agents.map((agent) => (
                <article key={`${agent.system}-${agent.profile}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-purple-300/40 hover:bg-white/[0.06]">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${agent.gateway.includes('running') ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : agent.gateway.includes('401') ? 'bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]' : 'bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.7)]'}`} />
                        <h3 className="font-heading text-xl font-semibold text-white">{agent.name}</h3>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-stone-300">{agent.system}</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-stone-300">{agent.profile}</span>
                      </div>
                      <p className="mt-2 text-sm text-stone-300">{agent.role}</p>
                      <p className="mt-2 text-xs leading-5 text-stone-500">{agent.notes}</p>
                    </div>
                    <div className="grid min-w-[260px] gap-2 rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
                      <Info label="Provider" value={agent.provider} />
                      <Info label="Model" value={agent.model} />
                      <Info label="Gateway" value={agent.gateway} />
                      <Info label="Auth" value={agent.auth} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {accessColumns.map((column) => (
                      <div key={column.key} className={`rounded-xl border px-3 py-2 ${badgeClass(agent.access[column.key])}`}>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75">{column.label}</div>
                        <div className="mt-1 text-sm font-semibold">{labelFor(agent.access[column.key])}</div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <Panel title="What this version is for">
              <ul className="space-y-3 text-sm leading-6 text-stone-300">
                <li>• Give Jake one plain-English view of all current agents.</li>
                <li>• Separate Hermes profiles from older OpenClaw agents so Doc/Honey/Margarita confusion is obvious.</li>
                <li>• Show model/provider choices without exposing tokens or credential details.</li>
                <li>• Make access visible: Discord, email, GitHub/Vercel, Supabase, tools, memory and media.</li>
              </ul>
            </Panel>

            <Panel title="Current go / no-go">
              <div className="space-y-3">
                <Callout tone="green" title="Go" text="Hermes Honey, Nivi and Cindy have been freshly re-authenticated on Codex and smoke-tested." />
                <Callout tone="green" title="Go" text="Most Hermes agents have Discord, terminal, file, browser, code, memory, skills, cron and messaging toolsets enabled." />
                <Callout tone="amber" title="Watch" text="Codex OAuth can still collide if many profiles reuse rotating OAuth credentials. API-key providers are safer for long-running secondary bots." />
                <Callout tone="red" title="No-go" text="Older OpenClaw Discord tokens for main/doc/cindy returned 401 in the latest audit, so those Discord bots need token repair before use." />
              </div>
            </Panel>

            <Panel title="Next v10 phases">
              <ol className="space-y-3 text-sm leading-6 text-stone-300">
                <li><strong className="text-white">1.</strong> Live status collector from Hermes/OpenClaw config and gateway health.</li>
                <li><strong className="text-white">2.</strong> Filter chips for provider, live/broken, build-ready and email-capable agents.</li>
                <li><strong className="text-white">3.</strong> Safe action buttons: re-auth guide, restart gateway, smoke test.</li>
                <li><strong className="text-white">4.</strong> Audit trail showing who changed models/tokens and when, without revealing secrets.</li>
                <li><strong className="text-white">5.</strong> Agent task launcher for branch, build, deploy and witness checks.</li>
              </ol>
            </Panel>
          </aside>
        </section>
      </section>
    </main>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'green' | 'purple' | 'gold' | 'blue' }) {
  const tones = {
    green: 'from-emerald-300/20 to-emerald-500/5 text-emerald-100',
    purple: 'from-purple-300/20 to-purple-500/5 text-purple-100',
    gold: 'from-amber-300/20 to-amber-500/5 text-amber-100',
    blue: 'from-sky-300/20 to-sky-500/5 text-sky-100',
  }
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${tones[tone]} p-4`}>
      <div className="text-3xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.18em] opacity-80">{label}</div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</span>
      <span className="text-stone-200">{value}</span>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
      <h2 className="font-heading mb-4 text-xl font-semibold text-white">{title}</h2>
      {children}
    </section>
  )
}

function Callout({ tone, title, text }: { tone: 'green' | 'amber' | 'red'; title: string; text: string }) {
  const tones = {
    green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
    red: 'border-red-400/20 bg-red-400/10 text-red-100',
  }
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="text-sm font-semibold uppercase tracking-[0.16em]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-stone-200">{text}</p>
    </div>
  )
}
