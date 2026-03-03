import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const MEMORY_DIR = path.join(process.cwd(), '..', 'memory')
const SHARED_CHAT = path.join(MEMORY_DIR, 'shared-chat.md')
const CHAT_TYPING_FILE = path.join(MEMORY_DIR, 'chat-typing.json')

function parseSharedChat() {
  if (!fs.existsSync(SHARED_CHAT)) return []
  try {
    return fs.readFileSync(SHARED_CHAT, 'utf8')
      .split('\n')
      .filter((l) => l.trim())
      .map((line) => {
        const m = line.match(/^\[(.+?)\] (.+?): (.+)$/)
        return m ? { time: m[1], sender: m[2], text: m[3] } : null
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const ta = new Date(a.time).getTime()
        const tb = new Date(b.time).getTime()
        if (isNaN(ta) && isNaN(tb)) return 0
        if (isNaN(ta)) return 1
        if (isNaN(tb)) return -1
        return ta - tb
      })
  } catch { return [] }
}

function readTyping() {
  if (!fs.existsSync(CHAT_TYPING_FILE)) return { Jake: { typing: false, updatedAt: 0 }, Margarita: { typing: false, updatedAt: 0 } }
  try { return JSON.parse(fs.readFileSync(CHAT_TYPING_FILE, 'utf8')) } catch { return {} }
}

export async function GET() {
  const now = Date.now()
  const raw = readTyping()
  const typing = {
    Jake: raw.Jake?.typing && (now - (raw.Jake?.updatedAt || 0)) < 10000,
    Margarita: raw.Margarita?.typing && (now - (raw.Margarita?.updatedAt || 0)) < 10000,
  }
  return NextResponse.json(
    { messages: parseSharedChat(), typing },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const text = (body.text || '').trim()
  const sender = (body.sender || 'Jake').trim()
  if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  if (sender !== 'Jake' && sender !== 'Margarita') return NextResponse.json({ error: 'Invalid sender' }, { status: 400 })
  const ts = new Date().toISOString()
  const line = `[${ts}] ${sender}: ${text}\n`
  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true })
  fs.appendFileSync(SHARED_CHAT, line)
  return NextResponse.json({ ok: true, time: ts, sender })
}
