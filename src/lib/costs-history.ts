import path from 'path'
import fs from 'fs'

export const HISTORY_FILE = path.join(process.cwd(), '..', 'memory', 'costs', 'history.json')
const DAILY_FILE = path.join(process.cwd(), '..', 'memory', 'costs', 'daily.json')
const MAX_DAYS = 90

export interface HistoryDay {
  date: string
  kimi:   { calls: number; inputTokens: number; outputTokens: number; totalTokens: number; cost_gbp: number }
  claude: { calls: number; inputTokens: number; outputTokens: number; totalTokens: number; cost_gbp: number }
  total:  { calls: number; inputTokens: number; outputTokens: number; totalTokens: number; cost_gbp: number }
}

export interface HistoryFile {
  version: number
  lastUpdated: string
  days: HistoryDay[]
}

const EMPTY = () => ({ calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost_gbp: 0 })

export function readHistory(): HistoryFile {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) as HistoryFile
  } catch {
    return { version: 1, lastUpdated: '', days: [] }
  }
}

export function saveHistory(h: HistoryFile) {
  fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true })
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2))
}

// Merge today's daily.json into history
export function archiveToday(history: HistoryFile): HistoryFile {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const daily = JSON.parse(fs.readFileSync(DAILY_FILE, 'utf8'))
    if (daily.date && daily.totals) {
      const todayRecord: HistoryDay = {
        date:   daily.date,
        kimi:   daily.totals.kimi   || EMPTY(),
        claude: daily.totals.claude || EMPTY(),
        total:  daily.totals.total  || EMPTY(),
      }
      const idx = history.days.findIndex(d => d.date === daily.date)
      if (idx >= 0) {
        history.days[idx] = todayRecord
      } else {
        history.days.push(todayRecord)
      }
    }
  } catch {}

  history.days.sort((a, b) => a.date.localeCompare(b.date))
  if (history.days.length > MAX_DAYS) {
    history.days = history.days.slice(-MAX_DAYS)
  }
  history.lastUpdated = today
  return history
}
