import { NextResponse } from 'next/server'
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

export async function GET() {
  const result: Record<string, any[]> = {}
  VALID_CATEGORIES.forEach((cat) => { result[cat] = readCategoryPlans(cat) })
  return NextResponse.json(result)
}
