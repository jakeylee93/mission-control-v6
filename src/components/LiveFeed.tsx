'use client'

import { useMemo } from 'react'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { LocalNotificationSettings, RealtimeEventList } from '@/components/realtime/RealtimeWidgets'

export default function LiveFeed() {
  const realtime = useRealtimeSync()

  const headline = useMemo(() => {
    if (realtime.connected) return 'Realtime stream is live'
    if (realtime.status === 'reconnecting') return 'Realtime stream reconnecting'
    return 'Connecting to realtime stream'
  }, [realtime.connected, realtime.status])

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-[#0b1220]/85 p-3">
        <p className="text-sm font-medium text-white">{headline}</p>
        <p className="mt-1 text-xs text-slate-300">
          Session: {realtime.sessionId ?? 'pending'} · Last message: {realtime.lastMessageAt ? new Date(realtime.lastMessageAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'n/a'}
        </p>
      </div>

      <RealtimeEventList events={realtime.events} title="Mission activity" maxItems={20} />
      <LocalNotificationSettings />
    </div>
  )
}
