import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const MEMORY_DIR = '/Users/margaritabot/.openclaw/workspace/memory'
const ROOT_MEMORY_FILE = '/Users/margaritabot/.openclaw/workspace/MEMORY.md'

interface MemoryFileResponse {
  name: string
  path: string
  content: string
  lastModified: string
}

function readMarkdownFile(filePath: string, displayName?: string): MemoryFileResponse | null {
  try {
    const stats = fs.statSync(filePath)
    if (!stats.isFile()) return null

    return {
      name: displayName || path.basename(filePath),
      path: filePath,
      content: fs.readFileSync(filePath, 'utf8'),
      lastModified: stats.mtime.toISOString(),
    }
  } catch {
    return null
  }
}

function scanDir(dir: string, prefix: string = ''): MemoryFileResponse[] {
  const results: MemoryFileResponse[] = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...scanDir(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name))
    } else if (entry.name.toLowerCase().endsWith('.md') || entry.name.toLowerCase().endsWith('.json')) {
      const displayName = prefix ? `${prefix}/${entry.name}` : entry.name
      const record = readMarkdownFile(fullPath, displayName)
      if (record) results.push(record)
    }
  }
  return results
}

export async function GET() {
  try {
    const files: MemoryFileResponse[] = scanDir(MEMORY_DIR)

    if (fs.existsSync(ROOT_MEMORY_FILE)) {
      const rootRecord = readMarkdownFile(ROOT_MEMORY_FILE)
      if (rootRecord) files.push(rootRecord)
    }

    files.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ files })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
