'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface CheckIn {
  date: string
  time: string
  mood: number
  energy: number
  sleep: number
  gratitude: string
  note: string
  wins: string
  selfCareToday: string[]
}

const MOOD_EMOJIS = ['😞', '😔', '😐', '🙂', '😊']
const MOOD_LABELS = ['Rough', 'Low', 'Okay', 'Good', 'Great']
const MOOD_COLORS = ['#EF4444', '#F59E0B', '#6B7280', '#22C55E', '#10B981']
const ENERGY_EMOJIS = ['🪫', '😴', '⚡', '🔋', '⚡⚡']

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

export default function LovelyTab() {
  const [affirmation, setAffirmation] = useState('')
  const [randomAff, setRandomAff] = useState('')
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [todayCheckin, setTodayCheckin] = useState<CheckIn | null>(null)
  const [streak, setStreak] = useState(0)
  const [totalCheckins, setTotalCheckins] = useState(0)
  const [averageMood, setAverageMood] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCheckin, setShowCheckin] = useState(false)
  const [saved, setSaved] = useState(false)

  // Check-in form state
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [sleep, setSleepHours] = useState(7)
  const [gratitude, setGratitude] = useState('')
  const [note, setNote] = useState('')
  const [wins, setWins] = useState('')
  const [selfCare, setSelfCare] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/lovely/affirmation').then(r => r.json()).catch(() => ({})),
      fetch('/api/lovely/checkin').then(r => r.json()).catch(() => ({})),
    ]).then(([affData, checkinData]) => {
      setAffirmation(affData.daily || '')
      setRandomAff(affData.random || '')
      setCheckins(checkinData.checkins || [])
      setTodayCheckin(checkinData.todayCheckin || null)
      setStreak(checkinData.streak || 0)
      setTotalCheckins(checkinData.totalCheckins || 0)
      setAverageMood(checkinData.averageMood)

      if (checkinData.todayCheckin) {
        const t = checkinData.todayCheckin
        setMood(t.mood)
        setEnergy(t.energy)
        setSleepHours(t.sleep)
        setGratitude(t.gratitude || '')
        setNote(t.note || '')
        setWins(t.wins || '')
        setSelfCare(t.selfCareToday || [])
      }
      setLoading(false)
    })
  }, [])

  async function saveCheckin() {
    setSaving(true)
    try {
      const res = await fetch('/api/lovely/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, energy, sleep, gratitude, note, wins, selfCareToday: selfCare }),
      })
      const data = await res.json()
      if (data.ok) {
        setTodayCheckin(data.checkin)
        setStreak(data.streak)
        setSaved(true)
        setTimeout(() => { setSaved(false); setShowCheckin(false) }, 2000)
        // Refresh data
        const fresh = await fetch('/api/lovely/checkin').then(r => r.json())
        setCheckins(fresh.checkins || [])
        setAverageMood(fresh.averageMood)
        setTotalCheckins(fresh.totalCheckins || 0)
      }
    } catch {}
    setSaving(false)
  }

  function toggleSelfCare(id: string) {
    setSelfCare(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Lovely</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>{greeting}, Jake</p>
        </div>

        {/* Daily Affirmation Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card rounded-2xl p-5 mb-4 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(168,85,247,0.08))', border: '1px solid rgba(255,215,0,0.15)' }}
        >
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#FFD700' }}>Today&apos;s Message</div>
          <p className="text-base leading-relaxed" style={{ color: 'var(--c-text)' }}>{affirmation}</p>
          <button
            onClick={() => setAffirmation(randomAff)}
            className="mt-3 text-xs px-3 py-1 rounded-lg"
            style={{ color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}
          >
            🔄 Another one
          </button>
        </motion.div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: '#FFD700' }}>{streak}</div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>Day Streak</div>
          </div>
          <div className="card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: '#A855F7' }}>{totalCheckins}</div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>Check-ins</div>
          </div>
          <div className="card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: averageMood && parseFloat(averageMood) >= 3 ? '#22C55E' : '#F59E0B' }}>
              {averageMood ? `${averageMood}` : '—'}
            </div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>Avg Mood (7d)</div>
          </div>
        </div>

        {/* Check-in Button / Status */}
        {!showCheckin && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCheckin(true)}
            className="w-full card rounded-2xl p-5 mb-4 text-center"
            style={{ border: todayCheckin ? '1px solid rgba(34,197,94,0.3)' : '2px solid rgba(255,215,0,0.4)' }}
          >
            {todayCheckin ? (
              <div>
                <div className="text-2xl mb-1">{MOOD_EMOJIS[(todayCheckin.mood || 3) - 1]}</div>
                <div className="text-sm font-semibold" style={{ color: '#22C55E' }}>Checked in today</div>
                <div className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>
                  Mood: {MOOD_LABELS[(todayCheckin.mood || 3) - 1]} · Energy: {ENERGY_EMOJIS[(todayCheckin.energy || 3) - 1]} · Sleep: {todayCheckin.sleep}h
                </div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--c-muted)' }}>Tap to update</div>
              </div>
            ) : (
              <div>
                <div className="text-3xl mb-2">👋</div>
                <div className="text-base font-semibold" style={{ color: '#FFD700' }}>How are you feeling?</div>
                <div className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>Tap to check in — takes 30 seconds</div>
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
                  <div className="text-sm font-semibold mb-4" style={{ color: '#FFD700' }}>Daily Check-in</div>

                  {/* Mood */}
                  <div className="mb-4">
                    <div className="text-xs mb-2" style={{ color: 'var(--c-muted)' }}>How&apos;s your mood?</div>
                    <div className="flex gap-2 justify-between">
                      {MOOD_EMOJIS.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => setMood(i + 1)}
                          className="flex-1 py-2 rounded-xl text-center text-xl transition-all"
                          style={{
                            background: mood === i + 1 ? `${MOOD_COLORS[i]}20` : 'var(--c-panel)',
                            border: `2px solid ${mood === i + 1 ? MOOD_COLORS[i] : 'var(--c-border)'}`,
                            transform: mood === i + 1 ? 'scale(1.1)' : 'scale(1)',
                          }}
                        >
                          {emoji}
                          <div className="text-[9px] mt-0.5" style={{ color: mood === i + 1 ? MOOD_COLORS[i] : 'var(--c-muted)' }}>{MOOD_LABELS[i]}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Energy */}
                  <div className="mb-4">
                    <div className="text-xs mb-2" style={{ color: 'var(--c-muted)' }}>Energy level?</div>
                    <div className="flex gap-2 justify-between">
                      {ENERGY_EMOJIS.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => setEnergy(i + 1)}
                          className="flex-1 py-2 rounded-xl text-center text-lg transition-all"
                          style={{
                            background: energy === i + 1 ? '#FFD70015' : 'var(--c-panel)',
                            border: `2px solid ${energy === i + 1 ? '#FFD700' : 'var(--c-border)'}`,
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sleep */}
                  <div className="mb-4">
                    <div className="text-xs mb-2" style={{ color: 'var(--c-muted)' }}>Hours of sleep?</div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={12}
                        step={0.5}
                        value={sleep}
                        onChange={e => setSleepHours(parseFloat(e.target.value))}
                        className="flex-1 accent-purple-500"
                      />
                      <span className="text-lg font-bold w-12 text-right" style={{ color: sleep >= 7 ? '#22C55E' : sleep >= 5 ? '#F59E0B' : '#EF4444' }}>{sleep}h</span>
                    </div>
                  </div>

                  {/* Self-care checklist */}
                  <div className="mb-4">
                    <div className="text-xs mb-2" style={{ color: 'var(--c-muted)' }}>Did you do any of these today?</div>
                    <div className="flex flex-wrap gap-1.5">
                      {SELF_CARE_OPTIONS.map(opt => {
                        const active = selfCare.includes(opt.id)
                        return (
                          <button
                            key={opt.id}
                            onClick={() => toggleSelfCare(opt.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs transition-all"
                            style={{
                              background: active ? `${opt.color}20` : 'var(--c-panel)',
                              color: active ? opt.color : 'var(--c-muted)',
                              border: `1px solid ${active ? `${opt.color}40` : 'var(--c-border)'}`,
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
                    <div className="text-xs mb-1.5" style={{ color: 'var(--c-muted)' }}>One thing you&apos;re grateful for today</div>
                    <input
                      value={gratitude}
                      onChange={e => setGratitude(e.target.value)}
                      placeholder="Even small things count..."
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                    />
                  </div>

                  {/* Wins */}
                  <div className="mb-3">
                    <div className="text-xs mb-1.5" style={{ color: 'var(--c-muted)' }}>Any wins today? (big or small)</div>
                    <input
                      value={wins}
                      onChange={e => setWins(e.target.value)}
                      placeholder="Got out of bed counts..."
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                    />
                  </div>

                  {/* Free note */}
                  <div className="mb-4">
                    <div className="text-xs mb-1.5" style={{ color: 'var(--c-muted)' }}>Anything on your mind?</div>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="No one sees this but you. Say whatever you need to..."
                      rows={3}
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setShowCheckin(false)} className="px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>Cancel</button>
                    <button
                      onClick={saveCheckin}
                      disabled={saving}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      style={{ background: '#FFD700', color: '#000' }}
                    >
                      {saving ? '💛 Saving...' : '💛 Save Check-in'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mood History */}
        {checkins.length > 0 && (
          <div className="card rounded-2xl p-4 mb-4">
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>This Week</div>
            <div className="flex justify-between gap-1">
              {checkins.map((c: CheckIn, i: number) => {
                const moodIdx = (c.mood || 3) - 1
                const day = new Date(c.date).toLocaleDateString('en-GB', { weekday: 'short' })
                return (
                  <div key={i} className="flex-1 text-center">
                    <div className="text-xl mb-1">{MOOD_EMOJIS[moodIdx]}</div>
                    <div className="w-full rounded-full h-2 mb-1" style={{ background: 'var(--c-panel)' }}>
                      <div className="rounded-full h-2 transition-all" style={{ width: `${(c.mood || 3) * 20}%`, background: MOOD_COLORS[moodIdx] }} />
                    </div>
                    <div className="text-[9px]" style={{ color: 'var(--c-muted)' }}>{day}</div>
                    {c.sleep && <div className="text-[8px]" style={{ color: c.sleep >= 7 ? '#22C55E' : '#F59E0B' }}>{c.sleep}h</div>}
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
            <div className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>Climbing</div>
            <div className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>When did you last go?</div>
            <div className="text-[10px] mt-2" style={{ color: '#22C55E' }}>Movement is medicine</div>
          </div>
          <div className="card rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">😴</div>
            <div className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>Sleep Score</div>
            <div className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>
              {checkins.length > 0 ? `Avg: ${(checkins.reduce((s, c) => s + (c.sleep || 0), 0) / checkins.length).toFixed(1)}h` : 'Start tracking'}
            </div>
            <div className="text-[10px] mt-2" style={{ color: checkins.length > 0 && (checkins.reduce((s, c) => s + (c.sleep || 0), 0) / checkins.length) >= 7 ? '#22C55E' : '#F59E0B' }}>
              {checkins.length > 0 && (checkins.reduce((s, c) => s + (c.sleep || 0), 0) / checkins.length) < 7 ? 'Try for 7+ hours' : 'Good sleep pattern'}
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div className="card rounded-2xl p-4 mb-4" style={{ border: '1px solid rgba(168,85,247,0.15)' }}>
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#A855F7' }}>Remember</div>
          <div className="space-y-2 text-sm" style={{ color: 'var(--c-text)' }}>
            <div className="flex items-start gap-2">
              <span>💪</span>
              <span>You built multiple businesses from nothing. That took courage most people don&apos;t have.</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🧗</span>
              <span>Climbing isn&apos;t just exercise — it&apos;s your reset button. Book a session if it&apos;s been a while.</span>
            </div>
            <div className="flex items-start gap-2">
              <span>⏰</span>
              <span>Working silly hours doesn&apos;t make you more productive. Set a finish time tonight.</span>
            </div>
            <div className="flex items-start gap-2">
              <span>💛</span>
              <span>You deserve good things. Not because you earned them — just because you do.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs py-4" style={{ color: 'var(--c-muted)' }}>
          💛 You&apos;re doing better than you think · 10am email coming daily
        </div>
      </div>
    </div>
  )
}
