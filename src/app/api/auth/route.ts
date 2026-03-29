import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const correct = process.env.MC_PASSWORD || '3108'

  // Compare as strings, trim whitespace
  if (String(password).trim() === String(correct).trim()) {
    const res = NextResponse.json({ ok: true })
    // Set cookie that lasts 90 days
    res.cookies.set('mc_auth', 'authenticated', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 90, // 90 days
      path: '/',
    })
    return res
  }

  return NextResponse.json({ ok: false, error: 'Wrong password' }, { status: 401 })
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('mc_auth')
  if (cookie?.value === 'authenticated') {
    return NextResponse.json({ ok: true, authenticated: true })
  }
  return NextResponse.json({ ok: false, authenticated: false })
}
