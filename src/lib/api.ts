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
  brain:   { calls: number; cost: number; tokens: number; inputTokens?: number; outputTokens?: number }
  muscles: { calls: number; cost: number; tokens: number; inputTokens?: number; outputTokens?: number }
  total:   { calls: number; cost: number; tokens: number; inputTokens?: number; outputTokens?: number }
  entries?: CostEntry[]
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
  provider: 'kimi' | 'claude'
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
  chat: () => fetchJSON<{ messages: ChatMessage[]; typing: Record<string, boolean> }>('/api/chat'),
  sendMessage: (text: string, sender: string) =>
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sender }),
    }).then((r) => r.json()),
  typing: (sender: string, typing: boolean) =>
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, typing }),
    }),
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
