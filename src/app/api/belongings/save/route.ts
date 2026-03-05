import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const BELONGINGS_FILE = path.join(process.cwd(), '..', 'memory', 'belongings.json')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items = Array.isArray(body?.items) ? body.items : null

    if (!items) {
      return NextResponse.json({ ok: false, error: 'Invalid items payload' }, { status: 400 })
    }

    ensureDir(path.dirname(BELONGINGS_FILE))
    fs.writeFileSync(BELONGINGS_FILE, JSON.stringify(items, null, 2), 'utf8')

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to save belongings:', error)
    return NextResponse.json({ ok: false, error: 'Failed to save belongings' }, { status: 500 })
  }
}
