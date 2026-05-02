import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all'
  const format = searchParams.get('format') || 'json'

  try {
    switch (type) {
      case 'calendar': {
        // Export calendar events as ICS
        const events = [
          {
            title: 'Team Standup',
            start: '2026-05-02T09:00:00Z',
            end: '2026-05-02T09:30:00Z',
            location: 'Zoom',
            description: 'Daily team standup meeting',
          },
          {
            title: 'Terry Rusty\'s Birthday',
            start: '2026-09-26T00:00:00Z',
            end: '2026-09-27T00:00:00Z',
            location: '',
            description: 'Don\'t forget to get him a present!',
          },
        ]

        if (format === 'ics') {
          let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Mission Control//EN\n'
          events.forEach(event => {
            const uid = Math.random().toString(36).slice(2)
            ics += `BEGIN:VEVENT\n`
            ics += `UID:${uid}@mission-control\n`
            ics += `DTSTART:${event.start.replace(/[-:]/g, '')}\n`
            ics += `DTEND:${event.end.replace(/[-:]/g, '')}\n`
            ics += `SUMMARY:${event.title}\n`
            ics += `DESCRIPTION:${event.description}\n`
            if (event.location) ics += `LOCATION:${event.location}\n`
            ics += `END:VEVENT\n`
          })
          ics += 'END:VCALENDAR'

          return new NextResponse(ics, {
            headers: {
              'Content-Type': 'text/calendar',
              'Content-Disposition': 'attachment; filename="mission-control-calendar.ics"',
            }
          })
        }

        return NextResponse.json({ events })
      }

      case 'tasks': {
        const tasks = [
          { id: '1', title: 'Review PR #42', status: 'done', priority: 'high', dueDate: '2026-05-01' },
          { id: '2', title: 'Update documentation', status: 'in-progress', priority: 'medium', dueDate: '2026-05-03' },
          { id: '3', title: 'Fix navigation bug', status: 'todo', priority: 'high', dueDate: '2026-05-02' },
        ]

        if (format === 'csv') {
          const csv = 'ID,Title,Status,Priority,Due Date\n' +
            tasks.map(t => `${t.id},"${t.title}",${t.status},${t.priority},${t.dueDate}`).join('\n')
          
          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="mission-control-tasks.csv"',
            }
          })
        }

        return NextResponse.json({ tasks })
      }

      case 'all':
      default: {
        const exportData = {
          exportedAt: new Date().toISOString(),
          version: 'v7',
          calendar: [
            { title: 'Team Standup', start: '2026-05-02T09:00:00Z', end: '2026-05-02T09:30:00Z' },
            { title: 'Terry Rusty\'s Birthday', start: '2026-09-26T00:00:00Z', end: '2026-09-27T00:00:00Z' },
          ],
          tasks: [
            { id: '1', title: 'Review PR #42', status: 'done', priority: 'high' },
            { id: '2', title: 'Update documentation', status: 'in-progress', priority: 'medium' },
          ],
          agents: [
            { name: 'Margarita', role: 'Orchestrator', model: 'Claude Opus' },
            { name: 'Doc', role: 'Builder', model: 'Codex' },
            { name: 'Cindy', role: 'Assistant', model: 'Kimi' },
          ],
          settings: {
            theme: 'dark',
            version: 'v7',
          }
        }

        if (format === 'json') {
          return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': 'attachment; filename="mission-control-backup.json"',
            }
          })
        }

        return NextResponse.json(exportData)
      }
    }
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
