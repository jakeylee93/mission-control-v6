import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json({ error: 'No fileId provided' }, { status: 400 })
    }

    try {
      execSync(`/opt/homebrew/bin/gog drive delete "${fileId}" --no-input 2>&1`, {
        encoding: 'utf8',
        timeout: 15000,
      })
      return NextResponse.json({ ok: true })
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
  }
}
