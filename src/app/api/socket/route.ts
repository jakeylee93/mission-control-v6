import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const target = new URL('/api/realtime/stream', request.url)
  return NextResponse.redirect(target)
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: 'Legacy socket publish is disabled. Use /api/realtime/stream snapshots/events instead.',
    },
    { status: 410 }
  )
}
