import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const UPLOADS_DIR = path.join(process.cwd(), '..', 'memory', 'uploads')

export async function GET() {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return NextResponse.json({ uploads: [] })
    }

    const files = fs.readdirSync(UPLOADS_DIR)

    // Only read .json metadata files
    const metaFiles = files.filter((f) => f.endsWith('.json')).sort().reverse()

    const uploads = metaFiles.slice(0, 50).map((f) => {
      try {
        const raw = fs.readFileSync(path.join(UPLOADS_DIR, f), 'utf8')
        return JSON.parse(raw)
      } catch {
        return null
      }
    }).filter(Boolean)

    return NextResponse.json({ uploads, count: uploads.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
