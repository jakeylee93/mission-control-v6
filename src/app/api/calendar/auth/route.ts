import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

const CREDS_FILE = path.join(process.cwd(), '..', 'google-credentials.json')
const REDIRECT_URI = 'http://localhost:3001/api/calendar/callback'
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

function getOAuthClient() {
  const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'))
  const { client_id, client_secret } = creds.installed
  return new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI)
}

export async function GET() {
  try {
    const oauth2Client = getOAuthClient()
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    })
    return NextResponse.json({ authUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
