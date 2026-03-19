'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type Tab = 'TEAMS' | 'PLANS' | 'BRAIN' | 'DOCS' | 'BELONGINGS' | 'LOVELY' | 'PROPERTY' | 'CALENDAR' | 'CAPTURE' | 'SYSTEM'

type AgentId = 'marg' | 'doc' | 'cindy'
type MsgRole = 'user' | 'assistant'

interface ChatMsg {
  role: MsgRole
  content: string
  audioBase64?: string
  ts: Date
}

interface Agent {
  id: AgentId; name: string; role: string; accent: string; initial: string
}

const AGENTS: Record<AgentId, Agent> = {
  marg: { id: 'marg', name: 'Margarita', role: 'Orchestrator', accent: '#FFD700', initial: 'M' },
  doc: { id: 'doc', name: 'Doc', role: 'Builder', accent: '#60A5FA', initial: 'D' },
  cindy: { id: 'cindy', name: 'Cindy', role: 'Assistant', accent: '#C084FC', initial: 'C' },
}

/* ── real audio waveform via analyser ── */
function useAudioAnalyser() {
  const [levels, setLevels] = useState<number[]>(new Array(32).fill(0))
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = new AudioContext()
      ctxRef.current = ctx
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      src.connect(analyser)
      analyserRef.current = analyser

      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        setLevels(Array.from(data))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch (e) {
      console.error('Mic access error:', e)
    }
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    ctxRef.current?.close()
    setLevels(new Array(32).fill(0))
  }, [])

  return { levels, start, stop }
}

/* ── speech recognition ── */
function useSpeechRecognition() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recRef = useRef<any>(null)

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Speech recognition not supported'); return }
    const rec = new SR()
    rec.lang = 'en-GB'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e: any) => { setTranscript(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recRef.current = rec
    setTranscript('')
    setListening(true)
    rec.start()
  }, [])

  const stop = useCallback(() => { recRef.current?.stop(); setListening(false) }, [])

  return { listening, transcript, start, stop, setTranscript }
}

/* ── live waveform bars ── */
function LiveWaveform({ levels, color, barCount = 28 }: { levels: number[]; color: string; barCount?: number }) {
  const step = Math.max(1, Math.floor(levels.length / barCount))
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, height: 40 }}>
      {Array.from({ length: barCount }).map((_, i) => {
        const val = levels[i * step] || 0
        const h = Math.max(3, (val / 255) * 40)
        return (
          <div
            key={i}
            style={{
              width: 3, borderRadius: 2, background: color,
              height: h, transition: 'height 0.06s ease-out',
              opacity: 0.8,
            }}
          />
        )
      })}
    </div>
  )
}

/* ── static waveform (for played messages) ── */
function StaticWaveform({ color, bars = 18, h = 18 }: { color: string; bars?: number; h?: number }) {
  const heights = useRef(Array.from({ length: bars }, () => 3 + Math.random() * (h - 3)))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, height: h }}>
      {heights.current.map((barH, i) => (
        <div key={i} style={{ width: 2.5, borderRadius: 1, background: color, height: barH, opacity: 0.6 }} />
      ))}
    </div>
  )
}

/* ── timer display ── */
function RecordTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 100)
    return () => clearInterval(t)
  }, [startTime])
  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0')
  const secs = (elapsed % 60).toString().padStart(2, '0')
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#EF4444', fontWeight: 600, letterSpacing: 1 }}>
      {mins}:{secs}
    </span>
  )
}

/* ── main ── */
export default function Home() {
  const [active, setActive] = useState<AgentId>('marg')
  const [now, setNow] = useState(new Date())
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [loading, setLoading] = useState(false)
  const [playingAudio, setPlayingAudio] = useState(false)
  const [recordStart, setRecordStart] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const { listening, transcript, start: startSR, stop: stopSR, setTranscript } = useSpeechRecognition()
  const { levels, start: startAnalyser, stop: stopAnalyser } = useAudioAnalyser()

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (transcript && !loading) {
      sendMessage(transcript)
      setTranscript('')
    }
  }, [transcript])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const agent = AGENTS[active]
  const others = (['marg', 'doc', 'cindy'] as AgentId[]).filter(id => id !== active)
  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateFmt = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeFmt = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  function startRecording() {
    startSR()
    startAnalyser()
    setRecordStart(Date.now())
  }

  function stopRecording() {
    stopSR()
    stopAnalyser()
    setRecordStart(0)
  }

  async function sendMessage(text: string) {
    const userMsg: ChatMsg = { role: 'user', content: text, ts: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text, agent: active,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const assistantMsg: ChatMsg = { role: 'assistant', content: data.text, audioBase64: data.audioBase64, ts: new Date() }
      setMessages(prev => [...prev, assistantMsg])
      if (data.audioBase64) playAudio(data.audioBase64)
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.', ts: new Date() }])
    } finally { setLoading(false) }
  }

  function playAudio(base64: string) {
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`)
    audioRef.current = audio
    setPlayingAudio(true)
    audio.play()
    audio.onended = () => setPlayingAudio(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
      color: '#F0EEE8', fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,80,200,0.07), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Header */}
        <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingTop: 48, marginBottom: 28, textAlign: 'center', flexShrink: 0 }}>
          <div style={{ color: '#555', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            {dayName} · {dateFmt}
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 700, margin: 0, letterSpacing: -1, fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>Jake</h1>
          <div style={{ color: '#666', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 }}>Mission Control</div>
          <div style={{ fontSize: 32, fontWeight: 200, fontFamily: 'monospace', letterSpacing: 3, marginTop: 10, opacity: 0.75 }}>{timeFmt}</div>
        </motion.header>

        {/* Agent Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 28, padding: '22px',
            position: 'relative', overflow: 'hidden', flexShrink: 0,
          }}
        >
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${agent.accent}10, transparent 70%)`, pointerEvents: 'none' }} />

          {/* Agent header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `linear-gradient(145deg, ${agent.accent}25, ${agent.accent}08)`,
                border: `1.5px solid ${agent.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: agent.accent, fontFamily: "'Space Grotesk', sans-serif",
              }}>{agent.initial}</div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>{agent.name}</h2>
                <div style={{ color: '#555', fontSize: 11 }}>{agent.role}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {others.map(id => (
                <motion.button key={id} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => { setActive(id); setMessages([]) }}
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${AGENTS[id].accent}18, ${AGENTS[id].accent}06)`,
                    border: `1.5px solid ${AGENTS[id].accent}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 14, fontWeight: 700, color: AGENTS[id].accent,
                  }}
                >{AGENTS[id].initial}</motion.button>
              ))}
            </div>
          </div>

          {/* Chat messages */}
          <div style={{ maxHeight: messages.length > 0 ? 280 : 0, overflowY: 'auto', transition: 'max-height 0.3s', marginBottom: messages.length > 0 ? 16 : 0 }}>
            {messages.map((msg, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: `${agent.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: agent.accent }}>{agent.initial}</div>
                )}
                <div style={{
                  maxWidth: '80%', padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  {msg.audioBase64 && msg.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => playAudio(msg.audioBase64!)}
                        style={{ width: 26, height: 26, borderRadius: '50%', background: `${agent.accent}20`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: agent.accent, fontSize: 11 }}>▶</motion.button>
                      <StaticWaveform color={agent.accent} bars={16} h={16} />
                    </div>
                  )}
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: msg.role === 'user' ? '#C8C8E8' : '#B8B8B8' }}>{msg.content}</p>
                  <div style={{ fontSize: 9, color: '#3A3A3A', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' as any }}>
                    {msg.ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: `${agent.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: agent.accent }}>{agent.initial}</div>
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ color: '#555', fontSize: 12 }}>thinking...</motion.div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ─── Recording area ─── */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <AnimatePresence mode="wait">
              {listening ? (
                <motion.div key="recording" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 0' }}>
                  
                  {/* Recording indicator + timer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <motion.div
                      style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>Recording</span>
                    <RecordTimer startTime={recordStart} />
                  </div>

                  {/* Live waveform */}
                  <LiveWaveform levels={levels} color={agent.accent} barCount={32} />

                  {/* Stop button */}
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={stopRecording}
                    style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, rgba(239,68,68,0.5), rgba(239,68,68,0.2))',
                      border: '2px solid rgba(239,68,68,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', position: 'relative',
                    }}
                  >
                    <motion.div
                      style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '1px solid rgba(239,68,68,0.2)' }}
                      animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.1, 0.5] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    {/* Stop square icon */}
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: '#EF4444' }} />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                  
                  {playingAudio && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <motion.div style={{ width: 6, height: 6, borderRadius: '50%', background: agent.accent }}
                        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity }} />
                      <span style={{ color: agent.accent, fontSize: 11 }}>Speaking...</span>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={startRecording}
                    style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: `radial-gradient(circle at 35% 35%, ${agent.accent}40, ${agent.accent}12)`,
                      border: `2px solid ${agent.accent}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', position: 'relative',
                    }}
                  >
                    <motion.div
                      style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `1px solid ${agent.accent}18` }}
                      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={agent.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="1" width="6" height="11" rx="3" />
                      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
