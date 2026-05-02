'use client'

import { useState } from 'react'

export default function DataExport() {
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState('')

  const handleExport = async (type: string, format: string) => {
    setExporting(true)
    setMessage('')
    
    try {
      const response = await fetch(`/api/export?type=${type}&format=${format}`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Set filename based on type and format
      const filenames: Record<string, Record<string, string>> = {
        calendar: { ics: 'calendar.ics', json: 'calendar.json' },
        tasks: { csv: 'tasks.csv', json: 'tasks.json' },
        all: { json: 'backup.json' },
      }
      a.download = `mission-control-${filenames[type]?.[format] || 'export.txt'}`
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      setMessage(`✅ Exported ${type} as ${format.toUpperCase()}`)
    } catch {
      setMessage('❌ Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Calendar Export */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#E9E6FF' }}>Calendar</div>
            <div style={{ fontSize: 11, color: '#888' }}>Export events to ICS or JSON</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => handleExport('calendar', 'ics')}
              disabled={exporting}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(99,102,241,0.3)',
                background: 'rgba(99,102,241,0.1)',
                color: '#6366f1',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ICS
            </button>
            <button
              onClick={() => handleExport('calendar', 'json')}
              disabled={exporting}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(99,102,241,0.3)',
                background: 'rgba(99,102,241,0.1)',
                color: '#6366f1',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              JSON
            </button>
          </div>
        </div>

        {/* Tasks Export */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#E9E6FF' }}>Tasks</div>
            <div style={{ fontSize: 11, color: '#888' }}>Export tasks to CSV or JSON</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => handleExport('tasks', 'csv')}
              disabled={exporting}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(99,102,241,0.3)',
                background: 'rgba(99,102,241,0.1)',
                color: '#6366f1',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              CSV
            </button>
            <button
              onClick={() => handleExport('tasks', 'json')}
              disabled={exporting}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(99,102,241,0.3)',
                background: 'rgba(99,102,241,0.1)',
                color: '#6366f1',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              JSON
            </button>
          </div>
        </div>

        {/* Full Backup */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#E9E6FF' }}>Full Backup</div>
            <div style={{ fontSize: 11, color: '#888' }}>Export everything as JSON</div>
          </div>
          <button
            onClick={() => handleExport('all', 'json')}
            disabled={exporting}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid rgba(34,197,94,0.3)',
              background: 'rgba(34,197,94,0.1)',
              color: '#22c55e',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {exporting ? 'Exporting...' : 'Backup All'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: message.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.startsWith('✅') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, fontSize: 12, color: message.startsWith('✅') ? '#22c55e' : '#ef4444' }}>
          {message}
        </div>
      )}
    </div>
  )
}
