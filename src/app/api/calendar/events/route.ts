import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

const CREDS_FILE = path.join(process.cwd(), '..', 'google-credentials.json')
const TOKEN_FILE = path.join(process.cwd(), '..', 'memory', 'google-tokens.json')
const REDIRECT_URI = 'http://localhost:3001/api/calendar/callback'

const CALENDAR_COLORS: Record<string, string> = {
  '1': '#A4BDFC', '2': '#7AE7BF', '3': '#DBADFF', '4': '#FF887C',
  '5': '#FBD75B', '6': '#FFB878', '7': '#46D6DB', '8': '#E1E1E1',
  '9': '#5484ED', '10': '#51B749', '11': '#DC2626',
}

function loadJSON(filePath: string, envVar: string): Record<string, unknown> | null {
  // Try env var first (base64 encoded — for Vercel)
  const b64 = process.env[envVar]
  if (b64) {
    try {
      return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
    } catch {}
  }
  // Fall back to file (local dev)
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    }
  } catch {}
  return null
}

function getAuthClient() {
  const creds = loadJSON(CREDS_FILE, 'GOOGLE_CREDENTIALS_B64') as Record<string, Record<string, string>> | null
  const tokens = loadJSON(TOKEN_FILE, 'GOOGLE_TOKENS_B64')

  if (!creds || !tokens) {
    throw new Error('Missing Google credentials or tokens')
  }

  const installed = creds.installed || creds.web || creds
  const { client_id, client_secret } = installed
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI)
  oauth2Client.setCredentials(tokens as Record<string, unknown>)

  // Auto-refresh: save new tokens if refreshed (only works locally)
  oauth2Client.on('tokens', (newTokens) => {
    try {
      if (fs.existsSync(TOKEN_FILE)) {
        const existing = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'))
        const merged = { ...existing, ...newTokens }
        fs.writeFileSync(TOKEN_FILE, JSON.stringify(merged, null, 2))
      }
    } catch {}
  })
  return oauth2Client
}

export async function GET() {
  // Check if we have credentials (either env or file)
  const hasCreds = process.env.GOOGLE_CREDENTIALS_B64 || fs.existsSync(CREDS_FILE)
  const hasTokens = process.env.GOOGLE_TOKENS_B64 || fs.existsSync(TOKEN_FILE)

  if (!hasCreds || !hasTokens) {
    return NextResponse.json({ error: 'not_authenticated', events: [] }, { status: 401 })
  }

  try {
    const auth = getAuthClient()
    const calendarApi = google.calendar({ version: 'v3', auth })

    // Get list of calendars
    const calList = await calendarApi.calendarList.list()
    const calendars = calList.data.items || []

    // Fetch events from all calendars for next 30 days
    const now = new Date()
    const thirtyDaysOut = new Date(now)
    thirtyDaysOut.setDate(now.getDate() + 30)

    const allEvents: { id: string; title: string; start: string; end: string; isAllDay: boolean; date: string; endDate: string; time: string; calendar: string; calendarId: string; color: string; description: string; location: string; summary: string }[] = []

    await Promise.allSettled(
      calendars.map(async (cal) => {
        if (!cal.id) return
        try {
          const res = await calendarApi.events.list({
            calendarId: cal.id,
            timeMin: now.toISOString(),
            timeMax: thirtyDaysOut.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 50,
          })
          const events = res.data.items || []
          events.forEach((ev) => {
            const start = ev.start?.dateTime || ev.start?.date || ''
            const end = ev.end?.dateTime || ev.end?.date || ''
            const isAllDay = !ev.start?.dateTime
            allEvents.push({
              id: ev.id || '',
              title: ev.summary || '(No title)',
              summary: ev.summary || '(No title)',
              start,
              end,
              isAllDay,
              date: start.slice(0, 10),
              endDate: end ? end.slice(0, 10) : '',
              time: isAllDay ? '' : start.slice(11, 16),
              calendar: cal.summary || 'Calendar',
              calendarId: cal.id || '',
              color: cal.backgroundColor || CALENDAR_COLORS[cal.colorId || ''] || '#A855F7',
              description: ev.description || '',
              location: ev.location || '',
            })
          })
        } catch {}
      })
    )

    // Sort by start
    allEvents.sort((a, b) => a.start.localeCompare(b.start))

    return NextResponse.json({
      events: allEvents,
      calendars: calendars.map((c) => ({
        id: c.id,
        name: c.summary,
        color: c.backgroundColor || '#A855F7',
        primary: c.primary || false,
      })),
    })
  } catch (err: unknown) {
    const error = err as { code?: number; message?: string }
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return NextResponse.json({ error: 'token_expired', events: [] }, { status: 401 })
    }
    return NextResponse.json({ error: String(err), events: [] }, { status: 500 })
  }
}
