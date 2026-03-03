import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const PLANS_DIR = path.join(process.cwd(), '..', 'memory', 'plans')
const VALID_CATEGORIES = ['mission-control', 'companies', 'personal', 'finance', 'relationships', 'lifestyle', 'future']

function readCategoryPlans(category: string) {
  const filePath = path.join(PLANS_DIR, category + '.md')
  if (!fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf8')
  const match = content.match(/<!-- plans-data\n([\s\S]*?)\n-->/)
  if (!match) return []
  try { return JSON.parse(match[1]) } catch { return [] }
}

function writeCategoryPlans(category: string, plans: any[]) {
  if (!fs.existsSync(PLANS_DIR)) fs.mkdirSync(PLANS_DIR, { recursive: true })
  const filePath = path.join(PLANS_DIR, category + '.md')
  let header = ''
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf8')
    const markerIdx = existing.indexOf('<!-- plans-data')
    if (markerIdx > -1) header = existing.slice(0, markerIdx)
    else header = existing.trimEnd() + '\n\n'
  } else {
    const label = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    header = '# ' + label + ' Plans\n\n'
  }
  const content = header + '<!-- plans-data\n' + JSON.stringify(plans, null, 2) + '\n-->\n'
  fs.writeFileSync(filePath, content)
}

export async function PUT(req: NextRequest, { params }: { params: { cat: string; id: string } }) {
  const { cat, id } = params
  if (!VALID_CATEGORIES.includes(cat)) return NextResponse.json({ error: 'Unknown category' }, { status: 400 })
  const body = await req.json()
  const plans = readCategoryPlans(cat)
  const idx = plans.findIndex((p: any) => p.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  plans[idx] = { ...plans[idx], ...body }
  writeCategoryPlans(cat, plans)
  return NextResponse.json(plans[idx])
}

export async function DELETE(req: NextRequest, { params }: { params: { cat: string; id: string } }) {
  const { cat, id } = params
  if (!VALID_CATEGORIES.includes(cat)) return NextResponse.json({ error: 'Unknown category' }, { status: 400 })
  let plans = readCategoryPlans(cat)
  const len = plans.length
  plans = plans.filter((p: any) => p.id !== id)
  if (plans.length === len) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  writeCategoryPlans(cat, plans)
  return NextResponse.json({ ok: true })
}
