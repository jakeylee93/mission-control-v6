import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

const TOKEN_FILE = path.join(process.cwd(), '..', 'memory', 'google-tokens.json')

export async function GET() {
  const connected = fs.existsSync(TOKEN_FILE)
  if (!connected) return NextResponse.json({ connected: false })

  try {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'))
    const expired = tokens.expiry_date && Date.now() > tokens.expiry_date
    return NextResponse.json({ connected: true, expired: !!expired })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
