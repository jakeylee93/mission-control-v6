import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const CALENDAR_FILE = path.join(process.cwd(), '..', 'memory', 'calendar.json')
const DEFAULT_EVENTS = [
  { id: 'ev-1', title: 'CEW 2026', date: '2026-03-05', allDay: true, calendar: 'Jobs', color: '#4ecdc4' },
  { id: 'ev-2', title: 'Northern Restaurant Show', date: '2026-03-08', endDate: '2026-03-11', allDay: true, calendar: 'Jobs', color: '#4ecdc4' },
  { id: 'ev-3', title: 'Notts Trent + Liverpool', date: '2026-03-11', allDay: true, calendar: 'Jobs', color: '#4ecdc4' },
  { id: 'ev-4', title: 'DRS HMRC Call', date: '2026-03-29', time: '10:00', calendar: 'Personal', color: '#a855f7' },
]

export async function GET() {
  if (fs.existsSync(CALENDAR_FILE)) {
    try { return NextResponse.json(JSON.parse(fs.readFileSync(CALENDAR_FILE, 'utf8'))) } catch {}
  }
  return NextResponse.json(DEFAULT_EVENTS)
}
