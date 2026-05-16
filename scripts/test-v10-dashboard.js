const fs = require('fs')
const path = require('path')

const page = fs.readFileSync(path.join(__dirname, '..', 'src/app/page.tsx'), 'utf8')
const layout = fs.readFileSync(path.join(__dirname, '..', 'src/app/layout.tsx'), 'utf8')

const required = [
  'Mission Control v10 - agent fleet dashboard',
  'Smart agent list',
  'Peach',
  'Honey',
  'Nivi',
  'Cindy',
  'OpenClaw',
  'OpenAI Codex',
  'claude-sonnet-4-5',
  'gemini-2.5-pro',
  'jake@thebarpeople.co.uk',
  'GitHub/Vercel',
  'Supabase',
  'No secrets are shown',
]

for (const phrase of required) {
  if (!page.includes(phrase) && !layout.includes(phrase)) {
    throw new Error(`Missing required dashboard phrase: ${phrase}`)
  }
}

const trackedAgents = (page.match(/name: '/g) || []).length
if (trackedAgents < 12) {
  throw new Error(`Expected at least 12 tracked agents, found ${trackedAgents}`)
}

if (!layout.includes("title: 'Mission Control v10'")) {
  throw new Error('Layout metadata title must be Mission Control v10')
}

console.log(`Mission Control v10 dashboard content OK: ${trackedAgents} agents tracked`)
