import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const venture = formData.get('venture') as string

  if (!file || !venture) {
    return NextResponse.json({ error: 'Missing file or venture' }, { status: 400 })
  }

  const slug = toSlug(venture)
  const originalExt = file.name.split('.').pop()?.toLowerCase() || 'png'
  const ext = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(originalExt) ? originalExt : 'png'
  const filename = `${slug}.${ext}`

  const logosDir = path.join(process.cwd(), 'public', 'logos')
  await mkdir(logosDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(logosDir, filename), buffer)

  return NextResponse.json({ path: `/logos/${filename}` })
}
