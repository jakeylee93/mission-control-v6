import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const UPLOADS_DIR = path.join(process.cwd(), '..', 'memory', 'uploads')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function formatTimestamp(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export async function POST(req: NextRequest) {
  try {
    ensureDir(UPLOADS_DIR)

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'Personal'
    const note = (formData.get('note') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const now = new Date()
    const ts = formatTimestamp(now)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${ts}-${safeName}`
    const metaFilename = `${ts}-${safeName.replace(/\.[^.]+$/, '')}.json`

    const filePath = path.join(UPLOADS_DIR, filename)
    const metaPath = path.join(UPLOADS_DIR, metaFilename)

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    // Write metadata
    const meta = {
      filename,
      originalName: file.name,
      date: now.toISOString(),
      category,
      note,
      fileType: file.type,
      size: file.size,
    }
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))

    return NextResponse.json({ ok: true, filename, meta })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
