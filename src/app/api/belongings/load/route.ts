import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const BELONGINGS_FILE = path.join(process.cwd(), '..', 'memory', 'belongings.json')

export async function GET() {
  try {
    if (!fs.existsSync(BELONGINGS_FILE)) {
      return NextResponse.json({ items: [] })
    }

    const raw = fs.readFileSync(BELONGINGS_FILE, 'utf8')
    const items = JSON.parse(raw)

    return NextResponse.json({ items: Array.isArray(items) ? items : [] })
  } catch (error) {
    console.error('Failed to load belongings:', error)
    return NextResponse.json({ items: [] })
  }
}
