import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

const DATA_DIR = '/Users/margaritabot/.openclaw/workspace/memory/lovely'
const CHECKINS_FILE = path.join(DATA_DIR, 'checkins.json')

function loadCheckins(): any[] {
  try {
    if (existsSync(CHECKINS_FILE)) return JSON.parse(readFileSync(CHECKINS_FILE, 'utf8'))
  } catch {}
  return []
}

function saveCheckins(checkins: any[]) {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(CHECKINS_FILE, JSON.stringify(checkins, null, 2))
}

export async function GET() {
  const checkins = loadCheckins()
  const today = new Date().toISOString().split('T')[0]
  const todayCheckin = checkins.find((c: any) => c.date === today)
  const last7 = checkins.slice(-7)
  const streak = calculateStreak(checkins)

  return NextResponse.json({
    checkins: last7,
    todayCheckin,
    streak,
    totalCheckins: checkins.length,
    averageMood: last7.length > 0 ? (last7.reduce((s: number, c: any) => s + (c.mood || 0), 0) / last7.length).toFixed(1) : null,
  })
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  const checkins = loadCheckins()
  const today = new Date().toISOString().split('T')[0]

  const checkin = {
    date: today,
    time: new Date().toISOString(),
    mood: data.mood, // 1-5
    energy: data.energy, // 1-5
    sleep: data.sleep, // hours
    gratitude: data.gratitude || '',
    note: data.note || '',
    wins: data.wins || '',
    selfCareToday: data.selfCareToday || [],
  }

  const idx = checkins.findIndex((c: any) => c.date === today)
  if (idx >= 0) {
    checkins[idx] = checkin
  } else {
    checkins.push(checkin)
  }

  saveCheckins(checkins)
  return NextResponse.json({ ok: true, checkin, streak: calculateStreak(checkins) })
}

function calculateStreak(checkins: any[]): number {
  if (checkins.length === 0) return 0
  let streak = 0
  const today = new Date()
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if (checkins.some((c: any) => c.date === dateStr)) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}
