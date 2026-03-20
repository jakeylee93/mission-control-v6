import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://wttr.in/London?format=j1', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 502 })
    }

    const data = await res.json()
    const current = data?.current_condition?.[0]

    return NextResponse.json({
      temperatureC: current?.temp_C ?? null,
      description: current?.weatherDesc?.[0]?.value ?? 'Unknown',
      humidity: current?.humidity ?? null,
      feelsLikeC: current?.FeelsLikeC ?? null,
      fetchedAt: new Date().toISOString(),
      raw: data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Weather request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
