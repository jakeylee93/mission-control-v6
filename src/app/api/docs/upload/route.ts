import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync, mkdirSync } from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const parentId = formData.get('parentId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Save to temp
    const tmpDir = '/tmp/mc-uploads'
    mkdirSync(tmpDir, { recursive: true })
    const tmpPath = path.join(tmpDir, file.name)
    const buffer = Buffer.from(await file.arrayBuffer())
    writeFileSync(tmpPath, buffer)

    try {
      // Upload to Google Drive
      let cmd = `/opt/homebrew/bin/gog drive upload "${tmpPath}"`
      if (parentId) {
        cmd += ` --parent "${parentId}"`
      }
      cmd += ' --json 2>&1'

      const result = execSync(cmd, { encoding: 'utf8', timeout: 30000 })

      // Clean up temp file
      try { unlinkSync(tmpPath) } catch {}

      // Try to parse JSON response
      let parsed
      try {
        parsed = JSON.parse(result)
      } catch {
        parsed = { raw: result.trim() }
      }

      return NextResponse.json({ ok: true, file: parsed })
    } catch (err: any) {
      try { unlinkSync(tmpPath) } catch {}
      return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
