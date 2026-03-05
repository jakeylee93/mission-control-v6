import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, parentId } = body

    if (!name) {
      return NextResponse.json({ error: 'No folder name provided' }, { status: 400 })
    }

    let cmd = `/opt/homebrew/bin/gog drive mkdir "${name}"`
    if (parentId) {
      cmd += ` --parent "${parentId}"`
    }
    cmd += ' --json 2>&1'

    try {
      const result = execSync(cmd, { encoding: 'utf8', timeout: 15000 })
      let parsed
      try {
        parsed = JSON.parse(result)
      } catch {
        parsed = { raw: result.trim() }
      }
      return NextResponse.json({ ok: true, folder: parsed })
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Create folder failed' }, { status: 500 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Create folder failed' }, { status: 500 })
  }
}
