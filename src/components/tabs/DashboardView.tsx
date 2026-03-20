'use client'

import { useEffect, useMemo, useState } from 'react'

interface DashboardViewProps {
  onQuickAction: (text: string) => void
}

interface CardData {
  label: string
  value: string
  detail: string
}

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning, Jake'
  if (hour < 18) return 'Good afternoon, Jake'
  return 'Good evening, Jake'
}

export function DashboardView({ onQuickAction }: DashboardViewProps) {
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<CardData[]>([])
  const now = useMemo(() => new Date(), [])

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      try {
        const [calendarRes, costsRes, weatherRes, activityRes] = await Promise.all([
          fetch('/api/calendar/events', { cache: 'no-store' }),
          fetch('/api/costs/total', { cache: 'no-store' }),
          fetch('/api/weather', { cache: 'no-store' }),
          fetch('/api/activity?limit=1', { cache: 'no-store' }),
        ])

        const calendarData = calendarRes.ok ? await calendarRes.json() : { events: [] }
        const costsData = costsRes.ok ? await costsRes.json() : null
        const weatherData = weatherRes.ok ? await weatherRes.json() : null
        const activityData = activityRes.ok ? await activityRes.json() : []

        const nextEvent = (calendarData?.events || [])[0]
        const latestActivity = activityData?.[0]

        const nextEventTime = nextEvent?.start
          ? new Date(nextEvent.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : 'No events'

        const newCards: CardData[] = [
          {
            label: 'Calendar',
            value: nextEvent?.title || 'No upcoming event',
            detail: nextEvent?.start ? `${nextEventTime} · ${nextEvent.calendar || 'Calendar'}` : 'Next 30 days clear',
          },
          {
            label: 'Costs',
            value: `£${Number(costsData?.allTime?.cost_gbp || 0).toFixed(4)}`,
            detail: 'API spend today/all-time feed',
          },
          {
            label: 'Weather',
            value: weatherData?.temperatureC ? `${weatherData.temperatureC}°C` : 'N/A',
            detail: weatherData?.description || 'London, UK',
          },
          {
            label: 'Activity',
            value: latestActivity?.type || 'No recent activity',
            detail: latestActivity?.timestamp
              ? new Date(latestActivity.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              : 'Waiting for events',
          },
        ]

        if (mounted) setCards(newCards)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="mx-4 flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-2xl">
      <h2 className="text-xl font-semibold">{greetingForHour(new Date().getHours())}</h2>
      <p className="mt-1 text-sm text-white/70">{now.toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</p>

      <div className="mt-3 grid flex-1 grid-cols-2 gap-2 overflow-hidden">
        {(loading ? new Array(4).fill(null) : cards).map((card, idx) => (
          <article key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
            {loading ? (
              <div className="space-y-2">
                <div className="h-3 w-14 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
              </div>
            ) : (
              <>
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/60">{card.label}</p>
                <p className="mt-1 line-clamp-2 text-sm font-medium">{card.value}</p>
                <p className="mt-1 line-clamp-2 text-[11px] text-white/60">{card.detail}</p>
              </>
            )}
          </article>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {['Check emails', "What's on today", 'Brief me'].map((action) => (
          <button
            key={action}
            onClick={() => onQuickAction(action)}
            className="rounded-xl border border-white/15 bg-white/10 px-2 py-2 text-[11px] font-medium text-white/90"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  )
}
