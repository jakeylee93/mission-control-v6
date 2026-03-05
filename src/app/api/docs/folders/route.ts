import { execSync } from 'child_process'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  webViewLink: string
  size: number | null
  parents: string[]
}

type UnknownRecord = Record<string, unknown>

function parseJsonOutput(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) return []

  try {
    return JSON.parse(trimmed)
  } catch {
    const firstBrace = trimmed.indexOf('{')
    const firstBracket = trimmed.indexOf('[')
    const starts = [firstBrace, firstBracket].filter((idx) => idx >= 0)
    if (starts.length === 0) throw new Error('No JSON payload found in gog output')

    const start = Math.min(...starts)
    const slice = trimmed.slice(start)
    const lastCurly = slice.lastIndexOf('}')
    const lastSquare = slice.lastIndexOf(']')
    const end = Math.max(lastCurly, lastSquare)
    if (end < 0) throw new Error('No JSON payload found in gog output')
    return JSON.parse(slice.slice(0, end + 1))
  }
}

function toRecord(value: unknown): UnknownRecord | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as UnknownRecord
  }
  return null
}

function toFileList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload

  const record = toRecord(payload)
  if (!record) return []

  const candidates = ['files', 'items', 'results', 'data']
  for (const key of candidates) {
    const value = record[key]
    if (Array.isArray(value)) return value
  }

  return []
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function normalizeDriveFile(value: unknown): DriveFile | null {
  const record = toRecord(value)
  if (!record) return null

  const id = typeof record.id === 'string' ? record.id : typeof record.fileId === 'string' ? record.fileId : ''
  const name = typeof record.name === 'string' ? record.name : typeof record.title === 'string' ? record.title : ''
  if (!id || !name) return null

  const mimeType = typeof record.mimeType === 'string' ? record.mimeType : 'application/octet-stream'
  const modifiedTime = typeof record.modifiedTime === 'string'
    ? record.modifiedTime
    : typeof record.modifiedDateTime === 'string'
      ? record.modifiedDateTime
      : typeof record.updatedTime === 'string'
        ? record.updatedTime
        : ''
  const webViewLink = typeof record.webViewLink === 'string'
    ? record.webViewLink
    : typeof record.alternateLink === 'string'
      ? record.alternateLink
      : typeof record.url === 'string'
        ? record.url
        : ''
  const parents = Array.isArray(record.parents)
    ? record.parents.filter((item): item is string => typeof item === 'string')
    : []

  return {
    id,
    name,
    mimeType,
    modifiedTime,
    webViewLink,
    size: toNumber(record.size),
    parents,
  }
}

function runDriveSearch(query: string, max: number): DriveFile[] {
  const cmd = `/opt/homebrew/bin/gog drive search ${JSON.stringify(query)} --max ${max} --json`
  const output = execSync(cmd, { encoding: 'utf8', timeout: 15000 })
  const parsed = parseJsonOutput(output)
  const files = toFileList(parsed)
  return files
    .map((entry) => normalizeDriveFile(entry))
    .filter((entry): entry is DriveFile => Boolean(entry))
}

export async function GET() {
  try {
    const files = runDriveSearch("mimeType='application/vnd.google-apps.folder'", 100)
    return NextResponse.json({ files })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch folders from Google Drive'
    return NextResponse.json({ files: [], error: message }, { status: 500 })
  }
}
