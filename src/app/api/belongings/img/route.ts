import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const BELONGINGS_DIR = path.join(process.cwd(), 'public', 'belongings')

// Serve belongings images dynamically (Next.js production can't serve
// files added to public/ after build)
export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get('f')
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filepath = path.join(BELONGINGS_DIR, filename)
  if (!existsSync(filepath)) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const buffer = readFileSync(filepath)
    const ext = path.extname(filename).toLowerCase()
    const contentType =
      ext === '.png' ? 'image/png' :
      ext === '.webp' ? 'image/webp' :
      ext === '.gif' ? 'image/gif' :
      'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Error reading file', { status: 500 })
  }
}
