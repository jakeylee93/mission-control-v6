import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

interface JournalEntry {
  id: string
  date: string
  channel: string
  content: string
  created_at: string
  title: string
  what: string
  decisions: string
  keyInsight: string
  timestamp: string
}

function parseEntry(raw: any): JournalEntry {
  const content = raw.content || ''
  const lines = content.split('\n').filter((l: string) => l.trim())

  let title = ''
  let what = ''
  let decisions = ''
  let keyInsight = ''

  // Check for structured format
  const whatMatch = content.match(/\*\*What\*\*:?\s*([\s\S]+?)(?=\*\*|$)/)
  const decisionMatch = content.match(/\*\*Decision[s]?\*\*:?\s*([\s\S]+?)(?=\*\*|$)/)
  const insightMatch = content.match(/\*\*(?:Key )?Insight[s]?\*\*:?\s*([\s\S]+?)(?=\*\*|$)/)

  if (whatMatch) {
    what = whatMatch[1].trim()
    decisions = decisionMatch?.[1]?.trim() || ''
    keyInsight = insightMatch?.[1]?.trim() || ''
    title = what.split(/[.!?\n]/)[0].trim().slice(0, 80)
  } else {
    // Unstructured — extract meaningful title from content
    const firstLine = lines[0]?.replace(/^[-#*>\s•]+/, '').trim() || 'Memory entry'
    title = firstLine.slice(0, 80)
    what = content.trim()
  }

  return {
    id: raw.id?.toString() || '',
    date: raw.date || '',
    channel: raw.channel || 'unknown',
    content,
    created_at: raw.created_at || '',
    title,
    what,
    decisions,
    keyInsight,
    timestamp: raw.created_at || ''
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseAdmin()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const search = searchParams.get('search')

    // Get entries
    let query = supabase
      .from('memory_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (date) {
      query = query.eq('date', date)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('Journal query error:', error)
      return NextResponse.json({ error: error.message, entries: [], dates: [] }, { status: 500 })
    }

    // Parse entries
    let entries = (logs || []).map(parseEntry)

    // Apply search filter
    if (search) {
      const q = search.toLowerCase()
      entries = entries.filter((e: JournalEntry) =>
        e.content.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.channel.toLowerCase().includes(q)
      )
    }

    // Get all unique dates for sidebar
    let allDates: { date: string; count: number }[] = []

    const { data: dateLogs, error: dateError } = await supabase
      .from('memory_logs')
      .select('date')
      .order('date', { ascending: false })
      .limit(365)

    if (!dateError && dateLogs) {
      const uniqueDates = new Map<string, number>()
      for (const log of dateLogs) {
        if (log.date) {
          uniqueDates.set(log.date, (uniqueDates.get(log.date) || 0) + 1)
        }
      }
      allDates = Array.from(uniqueDates.entries()).map(([d, c]) => ({ date: d, count: c }))
    }

    return NextResponse.json({
      entries,
      dates: allDates,
      totalEntries: entries.length,
      selectedDate: date
    })

  } catch (error: any) {
    console.error('Journal API error:', error)
    return NextResponse.json({ error: error.message, entries: [], dates: [] }, { status: 500 })
  }
}