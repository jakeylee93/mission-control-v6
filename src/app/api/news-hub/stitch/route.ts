import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  const apiKey = process.env.STITCH_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'STITCH_API_KEY not set' }, { status: 500 })
  }

  // Dynamic import for ESM module
  const { stitch } = await import('@google/stitch-sdk')

  if (action === 'projects') {
    try {
      const projects = await stitch.projects()
      const result = []
      for (const p of projects) {
        const screens = await p.screens()
        const screenList = []
        for (const s of screens) {
          let imageUrl = null
          try { imageUrl = await s.getImage() } catch { /* no image */ }
          screenList.push({ id: s.id, imageUrl })
        }
        result.push({ id: p.id, projectId: p.projectId, screens: screenList })
      }
      return NextResponse.json({ ok: true, projects: result })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load projects'
      return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
  }

  if (action === 'html') {
    const projectId = searchParams.get('project_id')
    const screenId = searchParams.get('screen_id')
    if (!projectId || !screenId) {
      return NextResponse.json({ ok: false, error: 'project_id and screen_id required' }, { status: 400 })
    }

    try {
      const project = stitch.project(projectId)
      const screens = await project.screens()
      const screen = screens.find((s: { id: string }) => s.id === screenId)
      if (!screen) {
        return NextResponse.json({ ok: false, error: 'Screen not found' }, { status: 404 })
      }

      const htmlUrl = await screen.getHtml()
      // Download the actual HTML
      const htmlRes = await fetch(htmlUrl)
      const html = await htmlRes.text()

      return NextResponse.json({ ok: true, html, htmlUrl })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to get HTML'
      return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: false, error: 'Use action=projects or action=html' }, { status: 400 })
}
