import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const PLANS_DIR = path.join(process.cwd(), '..', 'memory', 'plans')
const VALID_CATEGORIES = ['mission-control', 'companies', 'personal', 'finance', 'relationships', 'lifestyle', 'future']

interface Plan {
  id: string
  title: string
  description?: string
  status: string
  priority?: string
  createdDate?: string
  dueDate?: string
  notes?: string
}

function readCategoryPlans(category: string): Plan[] {
  const filePath = path.join(PLANS_DIR, category + '.md')
  if (!fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf8')
  const match = content.match(/<!-- plans-data\n([\s\S]*?)\n-->/)
  if (!match) return []
  try { return JSON.parse(match[1]) } catch { return [] }
}

function getAllPlans(): Plan[] {
  const all: Plan[] = []
  VALID_CATEGORIES.forEach((cat) => {
    const plans = readCategoryPlans(cat)
    all.push(...plans)
  })
  return all
}

export async function GET() {
  const plans = getAllPlans()
  const today = new Date().toISOString().split('T')[0]
  
  const overdue = plans.filter(p => p.dueDate && p.dueDate < today && p.status !== 'done')
  const dueToday = plans.filter(p => p.dueDate === today && p.status !== 'done')
  const inProgress = plans.filter(p => p.status === 'in-progress')
  const highPriority = plans.filter(p => p.priority === 'high' && p.status !== 'done')
  
  return NextResponse.json({
    total: plans.length,
    overdue: overdue.length,
    dueToday: dueToday.length,
    inProgress: inProgress.length,
    highPriority: highPriority.length,
    tasks: [...overdue, ...dueToday, ...highPriority].slice(0, 10),
  })
}
