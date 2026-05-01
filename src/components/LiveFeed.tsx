'use client'

import { useState, useEffect, useRef } from 'react'

interface LiveEvent {
  id: string
  type: 'calendar' | 'task' | 'agent' | 'alert' | 'cost'
  message: string
  time: string
  icon?: string
}

export default function LiveFeed() {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // Connect to SSE endpoint
    const es = new EventSource('/api/socket')
    eventSourceRef.current = es

    es.onopen = () => {
      setConnected(true)
    }

    es.onmessage = (e) => {
      if (e.data.startsWith(':')) return // keepalive
      
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'connected') return
        
        const newEvent: LiveEvent = {
          id: Math.random().toString(36).slice(2),
          type: data.type || 'alert',
          message: data.message || 'New update',
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          icon: data.icon || '📡',
        }
        
        setEvents(prev => [newEvent, ...prev].slice(0, 20))
      } catch {}
    }

    es.onerror = () => {
      setConnected(false)
    }

    return () => {
      es.close()
    }
  }, [])

  // Simulate live events for demo
  useEffect(() => {
    const demoEvents = [
      { type: 'agent', message: 'Margarita completed a task', icon: '🤖' },
      { type: 'calendar', message: 'New event added: Team Standup', icon: '📅' },
      { type: 'task', message: 'Task moved to Done: Review PR', icon: '✅' },
      { type: 'cost', message: 'AI spend updated: £4.20 today', icon: '💰' },
      { type: 'alert', message: 'Meeting in 15 minutes', icon: '⏰' },
    ]

    const interval = setInterval(() => {
      const random = demoEvents[Math.floor(Math.random() * demoEvents.length)]
      const newEvent: LiveEvent = {
        id: Math.random().toString(36).slice(2),
        type: random.type as any,
        message: random.message,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        icon: random.icon,
      }
      setEvents(prev => [newEvent, ...prev].slice(0, 20))
    }, 30000) // New event every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: connected ? '#22c55e' : '#ef4444',
          boxShadow: connected ? '0 0 8px #22c55e' : 'none',
        }} />
        <span style={{ fontSize: 11, color: connected ? '#22c55e' : '#ef4444' }}>
          {connected ? 'Live' : 'Reconnecting...'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
        {events.length === 0 && (
          <div style={{ fontSize: 12, color: '#666', textAlign: 'center', padding: '20px 0' }}>
            Waiting for updates...
          </div>
        )}
        {events.map((event, i) => (
          <div key={event.id} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '8px 0',
            borderBottom: i < events.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            animation: 'slideIn 0.3s ease',
          }}>
            <span style={{ fontSize: 16 }}>{event.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#aaa' }}>{event.message}</div>
              <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{event.time}</div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
