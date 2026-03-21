import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'
import { ensureLovelyTables, isMissingTableError } from '../_lib/tables'

type DbCheckin = {
  id: string
  date: string
  mood: number
  energy: number
  sleep: number
  gratitude: string | null
  wins: string | null
  note: string | null
  self_care: string[] | null
  created_at: string
  updated_at: string
}

type ApiCheckin = {
  id?: string
  date: string
  mood: number
  energy: number
  sleep: number
  gratitude: string
  wins: string
  note: string
  selfCareToday: string[]
  createdAt?: string
  updatedAt?: string
}

function dateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function toApiCheckin(row: DbCheckin): ApiCheckin {
  return {
    id: row.id,
    date: row.date,
    mood: row.mood,
    energy: row.energy,
    sleep: Number(row.sleep),
    gratitude: row.gratitude ?? '',
    wins: row.wins ?? '',
    note: row.note ?? '',
    selfCareToday: row.self_care ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0
  const set = new Set(dates)
  let streak = 0
  const today = new Date()

  for (let i = 0; i < 3650; i++) {
    const current = new Date(today)
    current.setUTCDate(current.getUTCDate() - i)
    const key = dateString(current)

    if (set.has(key)) {
      streak += 1
      continue
    }

    if (i === 0) {
      return 0
    }

    break
  }

  return streak
}

function emptyDashboard(selectedDate?: string | null) {
  return {
    checkins: [],
    todayCheckin: null,
    streak: 0,
    totalCheckins: 0,
    averageMood: null,
    ...(selectedDate ? { checkin: null } : {}),
  }
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const selectedDate = req.nextUrl.searchParams.get('date')
  const today = dateString(new Date())

  const [{ data: latestRows, error: latestError }, { data: dateRows, error: dateError }, { data: selectedRow, error: selectedError }] =
    await Promise.all([
      supabase
        .from('lovely_checkins')
        .select('*')
        .order('date', { ascending: false })
        .limit(30),
      supabase
        .from('lovely_checkins')
        .select('date,mood')
        .order('date', { ascending: false }),
      selectedDate
        ? supabase
            .from('lovely_checkins')
            .select('*')
            .eq('date', selectedDate)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

  if (latestError || dateError || selectedError) {
    if (isMissingTableError(latestError) || isMissingTableError(dateError) || isMissingTableError(selectedError)) {
      return NextResponse.json(emptyDashboard(selectedDate))
    }

    return NextResponse.json(
      { error: latestError?.message || dateError?.message || selectedError?.message || 'Failed to load check-ins' },
      { status: 500 },
    )
  }

  const checkins = (latestRows as DbCheckin[]).map(toApiCheckin)
  const allDates = (dateRows ?? []).map((row) => String(row.date))
  const streak = calculateStreak(allDates)
  const todayCheckin = checkins.find((c) => c.date === today) ?? null

  const sevenDayMoodRows = (dateRows ?? []).slice(0, 7)
  const averageMood = sevenDayMoodRows.length
    ? (sevenDayMoodRows.reduce((sum, row) => sum + Number(row.mood || 0), 0) / sevenDayMoodRows.length).toFixed(1)
    : null

  const body: {
    checkins: ApiCheckin[]
    todayCheckin: ApiCheckin | null
    streak: number
    totalCheckins: number
    averageMood: string | null
    checkin?: ApiCheckin | null
  } = {
    checkins,
    todayCheckin,
    streak,
    totalCheckins: allDates.length,
    averageMood,
  }

  if (selectedDate) {
    body.checkin = selectedRow ? toApiCheckin(selectedRow as DbCheckin) : null
  }

  return NextResponse.json(body)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  const data = await req.json().catch(() => ({}))

  const date = typeof data.date === 'string' && data.date ? data.date : dateString(new Date())

  const payload = {
    date,
    mood: Number(data.mood) || 3,
    energy: Number(data.energy) || 3,
    sleep: Number(data.sleep) || 7,
    gratitude: data.gratitude || '',
    note: data.note || '',
    wins: data.wins || '',
    self_care: Array.isArray(data.selfCareToday) ? data.selfCareToday : [],
    updated_at: new Date().toISOString(),
  }

  let { data: upserted, error: upsertError } = await supabase
    .from('lovely_checkins')
    .upsert(payload, { onConflict: 'date' })
    .select('*')
    .single()

  if (upsertError && isMissingTableError(upsertError)) {
    const setup = await ensureLovelyTables(supabase)
    if (setup.ok) {
      const retry = await supabase
        .from('lovely_checkins')
        .upsert(payload, { onConflict: 'date' })
        .select('*')
        .single()
      upserted = retry.data
      upsertError = retry.error
    } else {
      return NextResponse.json(
        { ok: false, error: `Check-in table is missing and setup failed: ${setup.error}` },
        { status: 200 },
      )
    }
  }

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message || 'Failed to save check-in' }, { status: 500 })
  }

  const { data: streakRows, error: streakError } = await supabase
    .from('lovely_checkins')
    .select('date')
    .order('date', { ascending: false })

  if (streakError) {
    if (isMissingTableError(streakError)) {
      return NextResponse.json({
        ok: true,
        checkin: toApiCheckin(upserted as DbCheckin),
        streak: 1,
      })
    }

    return NextResponse.json({ error: streakError.message || 'Failed to calculate streak' }, { status: 500 })
  }

  const streak = calculateStreak((streakRows ?? []).map((row) => String(row.date)))

  return NextResponse.json({
    ok: true,
    checkin: toApiCheckin(upserted as DbCheckin),
    streak,
  })
}
