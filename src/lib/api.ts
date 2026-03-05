// API client — calls Next.js API routes which proxy v2 data files

export interface ActivityEntry {
  id: string
  timestamp: string
  agent: string
  model: string
  task: string
  status: string
  duration: number
  tokens: number | null
  cost: number | null
  type: string
}

export interface AgentStatus {
  name: string
  state: 'active' | 'thinking' | 'idle'
  cost24h: number
  tokens24h: number
  entries24h: ActivityEntry[]
}

export interface CostSummary {
  moonshot?: { calls: number; cost: number; tokens: number; inputTokens?: number; outputTokens?: number }
  anthropic?: { calls: number; cost: number; tokens: number; inputTokens?: number; outputTokens?: number }
  openai?: { calls: number; cost: number; tokens: number; inputTokens?: number; outputTokens?: number }
  brain:   { calls: number; cost: number; tokens: number; inputTokens?: number; outputTokens?: number }
  muscles: { calls: number; cost: number; tokens: number; inputTokens?: number; outputTokens?: number }
  total:   { calls: number; cost: number; tokens: number; inputTokens?: number; outputTokens?: number }
  avgCostPerCall?: number
  currentModel?: string | null
  entries?: CostEntry[]
  modelBreakdown?: Array<{
    model: string
    provider: 'kimi' | 'claude' | 'openai'
    calls: number
    inputTokens: number
    outputTokens: number
    totalTokens: number
    cost_gbp: number
  }>
  last7Days?: Array<{
    date: string
    cost_gbp: number
    calls: number
    kimi: number
    claude: number
    openai?: number
  }>
  source?: 'supabase' | 'local'
  date?: string
  hasRealData?: boolean
}

export interface CostEntry {
  id: string
  timestamp: string
  agent: string
  model: string
  task: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost_gbp: number
  provider: 'kimi' | 'claude' | 'openai'
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  endDate?: string
  time?: string
  allDay?: boolean
  calendar?: string
  color?: string
}

export interface ChatMessage {
  time: string
  sender: string
  text: string
}

export interface Plan {
  id: string
  title: string
  description?: string
  status: string
  priority?: string
  createdDate?: string
  notes?: string
  subcategory?: string
  company?: string
  isExpansion?: boolean
}

export interface ApiService {
  id: string
  name: string
  icon?: string
  status: string
  lastUsed?: string | null
  model?: string
  color?: string
}

export interface CostHistoryDay {
  date: string
  cost_gbp: number
  calls: number
  kimi: number
  claude: number
  openai?: number
}

export interface CostHistory {
  days: CostHistoryDay[]
  total: number
  oldest: string | null
  newest: string | null
}

export interface CostTotal {
  allTime:    { calls: number; totalTokens: number; cost_gbp: number }
  kimi:       { calls: number; cost_gbp: number }
  claude:     { calls: number; cost_gbp: number }
  openai?:    { calls: number; cost_gbp: number }
  dailyAvg:   number
  activeDays: number
  totalDays:  number
  firstDate:  string | null
  lastDate:   string | null
}

export interface CostTrends {
  thisWeek:   { cost: number; days: number }
  lastWeek:   { cost: number; days: number }
  weekChange: number | null
  thisMonth:  { cost: number; days: number }
  lastMonth:  { cost: number; days: number }
  monthChange: number | null
  trend:      'up' | 'down' | 'flat'
  last30:     CostHistoryDay[]
}

export interface ProviderUsage {
  provider: 'moonshot' | 'anthropic'
  keyMasked: string
  keyType?: 'inference' | 'admin'
  note?: string
  // API-sourced (when available)
  balance_cny?: number | null
  balance_gbp?: number | null
  consumed_cny?: number | null
  consumed_gbp?: number | null      // real all-time spend from Moonshot balance API
  apiTodayCost_gbp?: number | null
  apiInputTokens?: number | null
  apiOutputTokens?: number | null
  // Local tracking totals
  todayLocal_gbp: number
  todayLocal_calls: number
  todayLocal_tokens: number
  allTimeLocal_gbp?: number | null  // sum of history.json for this provider
  allTimeCalls?: number | null
  weeklyAvg_gbp: number
  source: 'api' | 'local'
  apiError?: string
  apiErrors?: string[]
  updatedAt: string
}

const BASE = ''

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
}

export const api = {
  activity: (limit = 50) => fetchJSON<ActivityEntry[]>(`/api/activity?limit=${limit}`),
  costs: () => fetchJSON<CostSummary>('/api/costs'),
  agents: () => fetchJSON<Record<string, AgentStatus>>('/api/agents'),
  calendarEvents: () => fetchJSON<CalendarEvent[]>('/api/calendar-events'),
  categories: () => fetchJSON<Record<string, Plan[]>>('/api/categories'),
  addPlan: (cat: string, plan: Omit<Plan, 'id'>) =>
    fetch(`/api/categories/${cat}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...plan, id: `plan-${Date.now()}` }),
    }).then((r) => r.json()),
  updatePlan: (cat: string, id: string, data: Partial<Plan>) =>
    fetch(`/api/categories/${cat}/plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  deletePlan: (cat: string, id: string) =>
    fetch(`/api/categories/${cat}/plans/${id}`, { method: 'DELETE' }).then((r) => r.json()),
  apisStatus: () => fetchJSON<ApiService[]>('/api/apis-status'),
  usageMoonshot: () => fetchJSON<ProviderUsage>('/api/usage/moonshot'),
  usageAnthropic: () => fetchJSON<ProviderUsage>('/api/usage/anthropic'),
  costsHistory: (days = 30) => fetchJSON<CostHistory>(`/api/costs/history?days=${days}`),
  costsTotal: () => fetchJSON<CostTotal>('/api/costs/total'),
  costsTrends: () => fetchJSON<CostTrends>('/api/costs/trends'),
  logCost: (data: { model: string; agent?: string; task?: string; inputTokens: number; outputTokens: number }) =>
    fetch('/api/costs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
}

export function formatCost(cost: number): string {
  if (cost === 0) return '£0.00'
  if (cost < 0.001) return `£0.00`
  if (cost < 0.01) return `£${cost.toFixed(4)}`
  return `£${cost.toFixed(2)}`
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
  return String(tokens)
}

export function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
