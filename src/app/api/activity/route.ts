import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const ACTIVITY_FILE = path.join(process.cwd(), '..', 'mission-control-v2', 'activity.json')

function readActivity() {
  if (!fs.existsSync(ACTIVITY_FILE)) return []
  try { return JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf8')) } catch { return [] }
}

export async function GET(req: NextRequest) {
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 500)
  const activity = readActivity()
  return NextResponse.json(activity.slice(0, limit))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const entry = {
    id: `mc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    timestamp: new Date().toISOString(),
    ...body,
  }
  const activity = readActivity()
  activity.unshift(entry)
  try { fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(activity, null, 2)) } catch {}
  return NextResponse.json(entry)
}
