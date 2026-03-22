'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface CheckIn {
  id?: string
  date: string
  mood: number
  energy: number
  sleep: number
  gratitude: string
  note: string
  wins: string
  selfCareToday: string[]
  createdAt?: string
  updatedAt?: string
}

interface WaterState {
  glasses: number
  goal: number
  log: string[]
}

interface LagerState {
  glasses: number
  goal: number
  log: string[]
}

const MOOD_EMOJIS = ['😞', '😔', '😐', '🙂', '😊']
const MOOD_LABELS = ['Rough', 'Low', 'Okay', 'Good', 'Great']
const MOOD_COLORS = ['#EF4444', '#F59E0B', '#6B7280', '#22C55E', '#10B981']
const ENERGY_EMOJIS = ['🪫', '😴', '⚡', '🔋', '⚡⚡']

const TEXT_COLOR = '#F0EEE8'
const MUTED_COLOR = '#888'
const PANEL_COLOR = 'rgba(255,255,255,0.04)'
const BORDER_COLOR = 'rgba(255,255,255,0.08)'

const SELF_CARE_OPTIONS = [
  { id: 'climb', label: '🧗 Climbing', color: '#22C55E' },
  { id: 'walk', label: '🚶 Walk/Fresh Air', color: '#60A5FA' },
  { id: 'water', label: '💧 Hydrated', color: '#06B6D4' },
  { id: 'sleep8', label: '😴 8h Sleep', color: '#8B5CF6' },
  { id: 'social', label: '👥 Social Time', color: '#EC4899' },
  { id: 'meal', label: '🍽️ Proper Meal', color: '#F59E0B' },
  { id: 'break', label: '☕ Took Breaks', color: '#A855F7' },
  { id: 'music', label: '🎵 Music/Fun', color: '#EF4444' },
  { id: 'journal', label: '📝 Journaled', color: '#FFD700' },
  { id: 'limit', label: '⏰ Finished On Time', color: '#10B981' },
]

function todayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDay(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function toDateStringLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatWaterTime(isoTime: string): string {
  const dt = new Date(isoTime)
  if (Number.isNaN(dt.getTime())) return ''

  return dt.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatSelectedDateLabel(date: string, today: string): string {
  if (date === today) return 'Today'
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function normalizeTrackerState(input: unknown, fallbackGoal: number): WaterState {
  if (!input || typeof input !== 'object') {
    return { glasses: 0, goal: fallbackGoal, log: [] }
  }

  const value = input as { glasses?: unknown; goal?: unknown; log?: unknown }
  return {
    glasses: Number(value.glasses) || 0,
    goal: Number(value.goal) || fallbackGoal,
    log: Array.isArray(value.log) ? value.log.filter((item): item is string => typeof item === 'string') : [],
  }
}

export default function LovelyTab() {
  const [affirmation, setAffirmation] = useState('')
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [todayCheckin, setTodayCheckin] = useState<CheckIn | null>(null)
  const [streak, setStreak] = useState(0)
  const [totalCheckins, setTotalCheckins] = useState(0)
  const [averageMood, setAverageMood] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCheckin, setShowCheckin] = useState(false)
  const [saved, setSaved] = useState(false)
  const [water, setWater] = useState<WaterState>({ glasses: 0, goal: 8, log: [] })
  const [waterSaving, setWaterSaving] = useState(false)
  const [lager, setLager] = useState<LagerState>({ glasses: 0, goal: 0, log: [] })
  const [lagerSaving, setLagerSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(todayDate())
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // Check-in form state
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [sleep, setSleepHours] = useState(7)
  const [gratitude, setGratitude] = useState('')
  const [note, setNote] = useState('')
  const [wins, setWins] = useState('')
  const [selfCare, setSelfCare] = useState<string[]>([])

  const today = todayDate()

  const checkinDates = useMemo(() => new Set(checkins.map((checkin) => checkin.date)), [checkins])
  const moodTrend = useMemo(() => [...checkins].slice(0, 7).reverse(), [checkins])

  async function loadDashboard() {
    const response = await fetch('/api/lovely/checkin')
    const data = await response.json()
    setCheckins(data.checkins || [])
    setTodayCheckin(data.todayCheckin || null)
    setStreak(data.streak || 0)
    setTotalCheckins(data.totalCheckins || 0)
    setAverageMood(data.averageMood ?? null)
  }

  async function loadWater(date: string) {
    const response = await fetch(`/api/lovely/water?date=${date}`)
    const data = await response.json()
    setWater(normalizeTrackerState(data, 8))
  }

  async function loadLager(date: string) {
    const response = await fetch(`/api/lovely/lager?date=${date}`)
    const data = await response.json()
    setLager(normalizeTrackerState(data, 0))
  }

  async function loadAffirmation() {
    try {
      // Try smart message first
      const smartResponse = await fetch('/api/lovely/smart-message')
      if (smartResponse.ok) {
        const smartData = await smartResponse.json()
        setAffirmation(smartData.message || '')
        return
      }
    } catch (error) {
      console.log('Smart message failed, falling back to random affirmation')
    }
    
    // Fallback to regular affirmation
    const response = await fetch('/api/lovely/affirmation')
    const data = await response.json()
    setAffirmation(data.daily || '')
  }

  function applyCheckinToForm(checkin: CheckIn | null) {
    if (!checkin) {
      setMood(3)
      setEnergy(3)
      setSleepHours(7)
      setGratitude('')
      setNote('')
      setWins('')
      setSelfCare([])
      return
    }

    setMood(checkin.mood || 3)
    setEnergy(checkin.energy || 3)
    setSleepHours(checkin.sleep || 7)
    setGratitude(checkin.gratitude || '')
    setNote(checkin.note || '')
    setWins(checkin.wins || '')
    setSelfCare(checkin.selfCareToday || [])
  }

  async function openCheckinForDate(date: string) {
    if (date > today) return

    setSelectedDate(date)
    setShowCheckin(true)
    setSaved(false)

    try {
      const response = await fetch(`/api/lovely/checkin?date=${date}`)
      const data = await response.json()
      applyCheckinToForm(data.checkin || null)
    } catch {
      applyCheckinToForm(null)
    }
  }

  async function requestAnotherAffirmation() {
    try {
      // Always try smart message when refreshing
      const smartResponse = await fetch('/api/lovely/smart-message')
      if (smartResponse.ok) {
        const smartData = await smartResponse.json()
        setAffirmation(smartData.message || '')
        return
      }
    } catch (error) {
      console.log('Smart message failed, using random affirmation')
    }
    
    try {
      const response = await fetch('/api/lovely/affirmation')
      const data = await response.json()
      if (data.random) {
        setAffirmation(data.random)
      }
    } catch {
      // keep current message if request fails
    }
  }

  useEffect(() => {
    Promise.all([loadAffirmation(), loadDashboard()])
      .catch(() => {
        // Keep tab usable even if requests fail.
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    Promise.all([loadWater(selectedDate), loadLager(selectedDate)]).catch(() => {
      // Keep trackers usable even if requests fail.
    })
  }, [selectedDate])

  async function saveCheckin() {
    setSaving(true)
    try {
      const res = await fetch('/api/lovely/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, mood, energy, sleep, gratitude, note, wins, selfCareToday: selfCare }),
      })
      const data = await res.json()
      if (data.ok) {
        setSaved(true)
        setTimeout(() => {
          setSaved(false)
          setShowCheckin(false)
        }, 1500)
        await loadDashboard()
      }
    } catch {
      // no-op
    }
    setSaving(false)
  }

  function toggleSelfCare(id: string) {
    setSelfCare((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  function changeMonth(offset: number) {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  async function updateWater(action: 'drink' | 'reset') {
    setWaterSaving(true)
    try {
      const res = await fetch('/api/lovely/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, date: selectedDate }),
      })
      const data = await res.json()
      setWater(normalizeTrackerState(data, 8))
    } catch {
      // no-op
    }
    setWaterSaving(false)
  }

  async function updateLager(action: 'drink' | 'reset') {
    setLagerSaving(true)
    try {
      const res = await fetch('/api/lovely/lager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, date: selectedDate }),
      })
      const data = await res.json()
      setLager(normalizeTrackerState(data, 0))
    } catch {
      // no-op
    }
    setLagerSaving(false)
  }

  function drinkWater() {
    if (waterSaving) return
    updateWater('drink')
  }

  function resetWater() {
    if (waterSaving) return
    updateWater('reset')
  }

  function drinkLager() {
    if (lagerSaving) return
    updateLager('drink')
  }

  function resetLager() {
    if (lagerSaving) return
    updateLager('reset')
  }

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const start = new Date(year, month, 1)
    const firstWeekday = (start.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7

    return Array.from({ length: totalCells }, (_, index) => {
      const dayOffset = index - firstWeekday
      const cellDate = new Date(year, month, 1 + dayOffset)
      const cellDateStr = toDateStringLocal(cellDate)

      return {
        key: cellDateStr,
        day: cellDate.getDate(),
        date: cellDateStr,
        inCurrentMonth: cellDate.getMonth() === month,
        isFuture: cellDateStr > today,
        isToday: cellDateStr === today,
        hasCheckin: checkinDates.has(cellDateStr),
      }
    })
  }, [checkinDates, currentMonth, today])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const waterProgress = Math.min((water.glasses / Math.max(1, water.goal)) * 100, 100)
  const lagerProgress = Math.min((lager.glasses / 8) * 100, 100)
  const selectedDateLabel = formatSelectedDateLabel(selectedDate, today)

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="text-2xl">💛</div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-[800px] mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl mb-2">💛</motion.div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT_COLOR }}>Lovely</h1>
          <p className="text-sm mt-1" style={{ color: MUTED_COLOR }}>{greeting}, Jake</p>
        </div>

        {/* Calendar */}
        <div className="card rounded-2xl p-4 mb-4" style={{ border: `1px solid ${BORDER_COLOR}` }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => changeMonth(-1)} className="px-2 py-1 rounded-lg text-sm" style={{ color: MUTED_COLOR, border: `1px solid ${BORDER_COLOR}` }}>
              &lt;
            </button>
            <div className="text-sm font-semibold" style={{ color: '#FFD700' }}>
              {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={() => changeMonth(1)} className="px-2 py-1 rounded-lg text-sm" style={{ color: MUTED_COLOR, border: `1px solid ${BORDER_COLOR}` }}>
              &gt;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-[10px] text-center" style={{ color: MUTED_COLOR }}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const clickable = !cell.isFuture
              const isSelected = selectedDate === cell.date
              const background = isSelected
                ? 'rgba(255,215,0,0.3)'
                : cell.hasCheckin
                  ? 'rgba(34,197,94,0.25)'
                  : PANEL_COLOR
              const border = isSelected
                ? '1px solid #FFD700'
                : cell.isToday
                  ? '1px solid #FFD700'
                  : `1px solid ${BORDER_COLOR}`
              return (
                <button
                  key={cell.key}
                  onClick={() => clickable && openCheckinForDate(cell.date)}
                  disabled={!clickable}
                  className="h-11 rounded-lg text-xs relative disabled:opacity-35"
                  style={{
                    color: cell.inCurrentMonth ? TEXT_COLOR : '#666',
                    background,
                    border,
                    cursor: clickable ? 'pointer' : 'default',
                  }}
                >
                  <span>{cell.day}</span>
                  {cell.hasCheckin && (
                    <span
                      className="absolute bottom-0.5 right-1 text-xs font-bold"
                      style={{ color: '#22C55E' }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Daily Affirmation Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card rounded-2xl p-5 mb-4 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(168,85,247,0.08))', border: '1px solid rgba(255,215,0,0.15)' }}
        >
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#FFD700' }}>Today&apos;s Message</div>
          <p className="text-base leading-relaxed" style={{ color: TEXT_COLOR }}>{affirmation}</p>
          <button
            onClick={requestAnotherAffirmation}
            className="mt-3 text-xs px-3 py-1 rounded-lg"
            style={{ color: MUTED_COLOR, border: `1px solid ${BORDER_COLOR}` }}
          >
            🔄 Another one
          </button>
        </motion.div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: '#FFD700' }}>{streak}</div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: MUTED_COLOR }}>Day Streak</div>
          </div>
          <div className="card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: '#A855F7' }}>{totalCheckins}</div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: MUTED_COLOR }}>Check-ins</div>
          </div>
          <div className="card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: averageMood && parseFloat(averageMood) >= 3 ? '#22C55E' : '#F59E0B' }}>
              {averageMood ? `${averageMood}` : '—'}
            </div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: MUTED_COLOR }}>Avg Mood (7d)</div>
          </div>
        </div>

        {/* Water Intake */}
        <div className="card rounded-2xl p-4 mb-4" style={{ border: `1px solid ${BORDER_COLOR}` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-widest" style={{ color: MUTED_COLOR }}>Water Intake</div>
              <div className="text-[11px]" style={{ color: MUTED_COLOR }}>{selectedDateLabel}</div>
              <div className="text-sm" style={{ color: TEXT_COLOR }}>
                <motion.span
                  key={water.glasses}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block font-semibold"
                  style={{ color: '#06B6D4' }}
                >
                  {water.glasses}
                </motion.span>
                /{water.goal} glasses
              </div>
            </div>
            <button
              onClick={resetWater}
              disabled={waterSaving || water.glasses === 0}
              className="px-2.5 py-1 rounded-lg text-[11px] disabled:opacity-50"
              style={{ color: MUTED_COLOR, border: `1px solid ${BORDER_COLOR}` }}
            >
              Reset
            </button>
          </div>

          <div className="w-full rounded-full h-2.5 mb-3" style={{ background: PANEL_COLOR }}>
            <motion.div
              className="rounded-full h-2.5"
              style={{ background: 'linear-gradient(90deg, #06B6D4, #22C55E)' }}
              animate={{ width: `${waterProgress}%` }}
              transition={{ type: 'spring', stiffness: 170, damping: 22 }}
            />
          </div>

          <button
            onClick={drinkWater}
            disabled={waterSaving}
            className="w-full rounded-xl py-3 text-sm font-semibold mb-3 disabled:opacity-60"
            style={{ color: '#001018', background: '#06B6D4' }}
          >
            + Water
          </button>

          <div className="flex flex-wrap gap-1.5">
            {(water.log || []).slice(-10).map((entry, idx) => {
              const formatted = formatWaterTime(entry)
              if (!formatted) return null
              return (
                <span
                  key={`${entry}-${idx}`}
                  className="px-2 py-1 rounded-md text-[10px]"
                  style={{ color: TEXT_COLOR, background: PANEL_COLOR, border: `1px solid ${BORDER_COLOR}` }}
                >
                  {formatted}
                </span>
              )
            })}
            {water.log.length === 0 && (
              <span className="text-xs" style={{ color: MUTED_COLOR }}>No glasses logged yet for this day.</span>
            )}
          </div>
        </div>

        {/* Lager Intake */}
        <div className="card rounded-2xl p-4 mb-4" style={{ border: `1px solid ${BORDER_COLOR}` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-widest" style={{ color: MUTED_COLOR }}>Lager Tracker 🍺</div>
              <div className="text-[11px]" style={{ color: MUTED_COLOR }}>{selectedDateLabel}</div>
              <div className="text-sm" style={{ color: TEXT_COLOR }}>
                <motion.span
                  key={lager.glasses}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block font-semibold"
                  style={{ color: '#f59e0b' }}
                >
                  {lager.glasses}
                </motion.span>
                {' '}glasses
              </div>
            </div>
            <button
              onClick={resetLager}
              disabled={lagerSaving || lager.glasses === 0}
              className="px-2.5 py-1 rounded-lg text-[11px] disabled:opacity-50"
              style={{ color: MUTED_COLOR, border: `1px solid ${BORDER_COLOR}` }}
            >
              Reset
            </button>
          </div>

          <div className="w-full rounded-full h-2.5 mb-3" style={{ background: PANEL_COLOR }}>
            <motion.div
              className="rounded-full h-2.5"
              style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
              animate={{ width: `${lagerProgress}%` }}
              transition={{ type: 'spring', stiffness: 170, damping: 22 }}
            />
          </div>

          <button
            onClick={drinkLager}
            disabled={lagerSaving}
            className="w-full rounded-xl py-3 text-sm font-semibold mb-3 disabled:opacity-60"
            style={{ color: '#1F1200', background: '#f59e0b' }}
          >
            + Lager
          </button>

          <div className="flex flex-wrap gap-1.5">
            {(lager.log || []).slice(-10).map((entry, idx) => {
              const formatted = formatWaterTime(entry)
              if (!formatted) return null
              return (
                <span
                  key={`${entry}-${idx}`}
                  className="px-2 py-1 rounded-md text-[10px]"
                  style={{ color: TEXT_COLOR, background: PANEL_COLOR, border: `1px solid ${BORDER_COLOR}` }}
                >
                  {formatted}
                </span>
              )
            })}
            {lager.log.length === 0 && (
              <span className="text-xs" style={{ color: MUTED_COLOR }}>No pints logged yet for this day.</span>
            )}
          </div>
        </div>

        {/* Check-in Button / Status */}
        {!showCheckin && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openCheckinForDate(today)}
            className="w-full card rounded-2xl p-5 mb-4 text-center"
            style={{ border: todayCheckin ? '1px solid rgba(34,197,94,0.3)' : '2px solid rgba(255,215,0,0.4)' }}
          >
            {todayCheckin ? (
              <div>
                <div className="text-2xl mb-1">{MOOD_EMOJIS[(todayCheckin.mood || 3) - 1]}</div>
                <div className="text-sm font-semibold" style={{ color: '#22C55E' }}>Checked in today</div>
                <div className="text-xs mt-1" style={{ color: MUTED_COLOR }}>
                  Mood: {MOOD_LABELS[(todayCheckin.mood || 3) - 1]} · Energy: {ENERGY_EMOJIS[(todayCheckin.energy || 3) - 1]} · Sleep: {todayCheckin.sleep}h
                </div>
                <div className="text-[10px] mt-1" style={{ color: MUTED_COLOR }}>Tap to update</div>
              </div>
            ) : (
              <div>
                <div className="text-3xl mb-2">👋</div>
                <div className="text-base font-semibold" style={{ color: '#FFD700' }}>How are you feeling?</div>
                <div className="text-xs mt-1" style={{ color: MUTED_COLOR }}>Tap to check in — takes 30 seconds</div>
              </div>
            )}
          </motion.button>
        )}

        {/* Check-in Form */}
        <AnimatePresence>
          {showCheckin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card rounded-2xl p-5 mb-4 overflow-hidden"
              style={{ border: '1px solid rgba(255,215,0,0.2)' }}
            >
              {saved ? (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-6">
                  <div className="text-4xl mb-2">💛</div>
                  <div className="text-lg font-semibold" style={{ color: '#FFD700' }}>Saved! Nice one, Jake.</div>
                </motion.div>
              ) : (
                <>
                  <div className="text-sm font-semibold" style={{ color: '#FFD700' }}>Daily Check-in</div>
                  <div className="text-xs mb-4" style={{ color: MUTED_COLOR }}>For {formatDay(selectedDate)}</div>

                  {/* Mood */}
                  <div className="mb-4">
                    <div className="text-xs mb-2" style={{ color: MUTED_COLOR }}>How&apos;s your mood?</div>
                    <div className="flex gap-2 justify-between">
                      {MOOD_EMOJIS.map((emoji, i) => (
                        <button
                          key={emoji}
                          onClick={() => setMood(i + 1)}
                          className="flex-1 py-2 rounded-xl text-center text-xl transition-all"
                          style={{
                            background: mood === i + 1 ? `${MOOD_COLORS[i]}20` : PANEL_COLOR,
                            border: `2px solid ${mood === i + 1 ? MOOD_COLORS[i] : BORDER_COLOR}`,
                            transform: mood === i + 1 ? 'scale(1.1)' : 'scale(1)',
                          }}
                        >
                          {emoji}
                          <div className="text-[9px] mt-0.5" style={{ color: mood === i + 1 ? MOOD_COLORS[i] : MUTED_COLOR }}>{MOOD_LABELS[i]}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Energy */}
                  <div className="mb-4">
                    <div className="text-xs mb-2" style={{ color: MUTED_COLOR }}>Energy level?</div>
                    <div className="flex gap-2 justify-between">
                      {ENERGY_EMOJIS.map((emoji, i) => (
                        <button
                          key={`${emoji}-${i}`}
                          onClick={() => setEnergy(i + 1)}
                          className="flex-1 py-2 rounded-xl text-center text-lg transition-all"
                          style={{
                            background: energy === i + 1 ? '#FFD70015' : PANEL_COLOR,
                            border: `2px solid ${energy === i + 1 ? '#FFD700' : BORDER_COLOR}`,
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sleep */}
                  <div className="mb-4">
                    <div className="text-xs mb-2" style={{ color: MUTED_COLOR }}>Hours of sleep?</div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={12}
                        step={0.5}
                        value={sleep}
                        onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                        className="flex-1 accent-purple-500"
                      />
                      <span className="text-lg font-bold w-12 text-right" style={{ color: sleep >= 7 ? '#22C55E' : sleep >= 5 ? '#F59E0B' : '#EF4444' }}>{sleep}h</span>
                    </div>
                  </div>

                  {/* Self-care checklist */}
                  <div className="mb-4">
                    <div className="text-xs mb-2" style={{ color: MUTED_COLOR }}>Did you do any of these today?</div>
                    <div className="flex flex-wrap gap-1.5">
                      {SELF_CARE_OPTIONS.map((opt) => {
                        const active = selfCare.includes(opt.id)
                        return (
                          <button
                            key={opt.id}
                            onClick={() => toggleSelfCare(opt.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs transition-all"
                            style={{
                              background: active ? `${opt.color}20` : PANEL_COLOR,
                              color: active ? opt.color : MUTED_COLOR,
                              border: `1px solid ${active ? `${opt.color}40` : BORDER_COLOR}`,
                            }}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Gratitude */}
                  <div className="mb-3">
                    <div className="text-xs mb-1.5" style={{ color: MUTED_COLOR }}>One thing you&apos;re grateful for today</div>
                    <input
                      value={gratitude}
                      onChange={(e) => setGratitude(e.target.value)}
                      placeholder="Even small things count..."
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ background: PANEL_COLOR, border: `1px solid ${BORDER_COLOR}`, color: TEXT_COLOR }}
                    />
                  </div>

                  {/* Wins */}
                  <div className="mb-3">
                    <div className="text-xs mb-1.5" style={{ color: MUTED_COLOR }}>Any wins today? (big or small)</div>
                    <input
                      value={wins}
                      onChange={(e) => setWins(e.target.value)}
                      placeholder="Got out of bed counts..."
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ background: PANEL_COLOR, border: `1px solid ${BORDER_COLOR}`, color: TEXT_COLOR }}
                    />
                  </div>

                  {/* Free note */}
                  <div className="mb-4">
                    <div className="text-xs mb-1.5" style={{ color: MUTED_COLOR }}>Anything on your mind?</div>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="No one sees this but you. Say whatever you need to..."
                      rows={3}
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ background: PANEL_COLOR, border: `1px solid ${BORDER_COLOR}`, color: TEXT_COLOR }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setShowCheckin(false)} className="px-3 py-2 rounded-lg text-sm" style={{ color: MUTED_COLOR, border: `1px solid ${BORDER_COLOR}` }}>Cancel</button>
                    <button
                      onClick={saveCheckin}
                      disabled={saving}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      style={{ background: '#FFD700', color: '#000' }}
                    >
                      {saving ? '💛 Saving...' : `💛 Save ${selectedDate}`}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mood History */}
        {moodTrend.length > 0 && (
          <div className="card rounded-2xl p-4 mb-4">
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: MUTED_COLOR }}>7 Check-ins</div>
            <div className="flex justify-between gap-1">
              {moodTrend.map((c) => {
                const moodIdx = (c.mood || 3) - 1
                const day = new Date(`${c.date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short' })
                return (
                  <div key={c.date} className="flex-1 text-center">
                    <div className="text-xl mb-1">{MOOD_EMOJIS[moodIdx]}</div>
                    <div className="w-full rounded-full h-2 mb-1" style={{ background: PANEL_COLOR }}>
                      <div className="rounded-full h-2 transition-all" style={{ width: `${(c.mood || 3) * 20}%`, background: MOOD_COLORS[moodIdx] }} />
                    </div>
                    <div className="text-[9px]" style={{ color: MUTED_COLOR }}>{day}</div>
                    {c.sleep ? <div className="text-[8px]" style={{ color: c.sleep >= 7 ? '#22C55E' : '#F59E0B' }}>{c.sleep}h</div> : null}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">🧗</div>
            <div className="text-sm font-semibold" style={{ color: TEXT_COLOR }}>Climbing</div>
            <div className="text-xs mt-1" style={{ color: MUTED_COLOR }}>When did you last go?</div>
            <div className="text-[10px] mt-2" style={{ color: '#22C55E' }}>Movement is medicine</div>
          </div>
          <div className="card rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">😴</div>
            <div className="text-sm font-semibold" style={{ color: TEXT_COLOR }}>Sleep Score</div>
            <div className="text-xs mt-1" style={{ color: MUTED_COLOR }}>
              {checkins.length > 0 ? `Avg: ${(checkins.reduce((sum, checkin) => sum + (checkin.sleep || 0), 0) / checkins.length).toFixed(1)}h` : 'Start tracking'}
            </div>
            <div className="text-[10px] mt-2" style={{ color: checkins.length > 0 && (checkins.reduce((sum, checkin) => sum + (checkin.sleep || 0), 0) / checkins.length) >= 7 ? '#22C55E' : '#F59E0B' }}>
              {checkins.length > 0 && (checkins.reduce((sum, checkin) => sum + (checkin.sleep || 0), 0) / checkins.length) < 7 ? 'Try for 7+ hours' : 'Good sleep pattern'}
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div className="card rounded-2xl p-4 mb-4" style={{ border: '1px solid rgba(168,85,247,0.15)' }}>
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#A855F7' }}>Remember</div>
          <div className="space-y-2 text-sm" style={{ color: TEXT_COLOR }}>
            <div className="flex items-start gap-2">
              <span>💪</span>
              <span>You built multiple businesses from nothing. That took courage most people don&apos;t have.</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🧗</span>
              <span>Climbing isn&apos;t just exercise - it&apos;s your reset button. Book a session if it&apos;s been a while.</span>
            </div>
            <div className="flex items-start gap-2">
              <span>⏰</span>
              <span>Working silly hours doesn&apos;t make you more productive. Set a finish time tonight.</span>
            </div>
            <div className="flex items-start gap-2">
              <span>💛</span>
              <span>You deserve good things. Not because you earned them - just because you do.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs py-4" style={{ color: MUTED_COLOR }}>
          💛 You&apos;re doing better than you think · 10am email coming daily
        </div>
      </div>
    </div>
  )
}
