import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const MEMORY_DIR = path.join(process.cwd(), '..', 'memory')
const CHAT_TYPING_FILE = path.join(MEMORY_DIR, 'chat-typing.json')

export async function POST(req: NextRequest) {
  const body = await req.json()
  const sender = (body.sender || '').trim()
  const typing = !!body.typing
  if (sender !== 'Jake' && sender !== 'Margarita') return NextResponse.json({ error: 'Invalid sender' }, { status: 400 })
  let state: any = { Jake: { typing: false, updatedAt: 0 }, Margarita: { typing: false, updatedAt: 0 } }
  if (fs.existsSync(CHAT_TYPING_FILE)) {
    try { state = JSON.parse(fs.readFileSync(CHAT_TYPING_FILE, 'utf8')) } catch {}
  }
  state[sender] = { typing, updatedAt: Date.now() }
  try { fs.writeFileSync(CHAT_TYPING_FILE, JSON.stringify(state, null, 2)) } catch {}
  return NextResponse.json({ ok: true })
}
