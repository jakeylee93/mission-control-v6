import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const ACTIVITY_FILE = path.join(process.cwd(), '..', 'mission-control-v2', 'activity.json')

function readActivity() {
  if (!fs.existsSync(ACTIVITY_FILE)) return []
  try { return JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf8')) } catch { return [] }
}

export async function GET() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const all = readActivity()
  const recent = all.filter((e: any) => new Date(e.timestamp) >= since)
  const last5 = new Date(Date.now() - 5 * 60 * 1000)
  const recent5 = all.filter((e: any) => new Date(e.timestamp) >= last5)

  const agentNames = ['Margarita', 'Doc', 'Martini']
  const agentMap: Record<string, any> = {}

  const matchFn = (e: any, name: string) => {
    const a = (e.agent || '').toLowerCase()
    if (name === 'Margarita') return a.includes('margarita') || a.includes('claude') || a.includes('mission') || e.type === 'chat'
    if (name === 'Doc') return a.includes('doc') || a.includes('kimi') || a.includes('moonshot') || a.includes('brain') || e.type === 'search' || e.type === 'research'
    if (name === 'Martini') return a.includes('martini') || a.includes('codex') || (a.includes('claude') && e.type === 'code')
    return false
  }

  agentNames.forEach((name) => {
    const entries = recent.filter((e: any) => matchFn(e, name))
    const cost24h = entries.reduce((s: number, e: any) => s + (e.cost || 0), 0)
    const tokens24h = entries.reduce((s: number, e: any) => s + (e.tokens || 0), 0)
    const recent5entries = recent5.filter((e: any) => matchFn(e, name))

    let state = 'idle'
    if (recent5entries.length > 0) {
      state = name === 'Margarita' && recent5entries.some((e: any) => e.type === 'chat') ? 'active' : 'thinking'
    }

    agentMap[name] = { name, state, cost24h, tokens24h, entries24h: entries.slice(0, 20) }
  })

  // Check most recent entry
  const latest = all[0]
  if (latest && (Date.now() - new Date(latest.timestamp).getTime()) < 60000) {
    if (latest.status === 'running' || latest.type === 'chat') {
      agentMap['Margarita'].state = 'active'
    }
  }

  return NextResponse.json(agentMap)
}
