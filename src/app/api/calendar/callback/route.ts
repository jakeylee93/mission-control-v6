import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

const CREDS_FILE = path.join(process.cwd(), '..', 'google-credentials.json')
const TOKEN_FILE = path.join(process.cwd(), '..', 'memory', 'google-tokens.json')
const REDIRECT_URI = 'http://localhost:3001/api/calendar/callback'

function getOAuthClient() {
  const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'))
  const { client_id, client_secret } = creds.installed
  return new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return new NextResponse(
      `<html><body style="font-family:monospace;background:#000;color:#f00;padding:2rem">
        <h2>OAuth Error</h2><p>${error}</p>
        <a href="/" style="color:#FFD700">← Back to Mission Control</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  try {
    const oauth2Client = getOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2))

    return new NextResponse(
      `<html><body style="font-family:monospace;background:#000;color:#FFD700;padding:2rem">
        <h2 style="color:#22C55E">✓ Google Calendar Connected</h2>
        <p style="color:#aaa">Tokens saved. You can close this tab.</p>
        <script>setTimeout(() => window.close(), 1500)</script>
        <a href="/" style="color:#FFD700">← Back to Mission Control</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  } catch (err) {
    return new NextResponse(
      `<html><body style="font-family:monospace;background:#000;color:#f00;padding:2rem">
        <h2>Token Exchange Failed</h2><p>${String(err)}</p>
        <p style="color:#aaa;font-size:0.8em">Note: You may need to add http://localhost:3001/api/calendar/callback as an authorized redirect URI in Google Cloud Console.</p>
        <a href="/" style="color:#FFD700">← Back to Mission Control</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}
