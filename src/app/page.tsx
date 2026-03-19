'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Keep Tab export for backward compat with Navigation component
export type Tab = 'TEAMS' | 'PLANS' | 'BRAIN' | 'DOCS' | 'BELONGINGS' | 'LOVELY' | 'PROPERTY' | 'CALENDAR' | 'CAPTURE' | 'SYSTEM'

/* ── types ── */
type AgentId = 'marg' | 'doc' | 'cindy'
type MsgRole = 'user' | 'assistant'

interface ChatMsg {
  role: MsgRole
  content: string
  audioBase64?: string
  ts: Date
}

interface Agent {
  id: AgentId
  name: string
  role: string
  accent: string
  initial: string
}

const AGENTS: Record<AgentId, Agent> = {
  marg: { id: 'marg', name: 'Margarita', role: 'Orchestrator', accent: '#FFD700', initial: 'M' },
  doc: { id: 'doc', name: 'Doc', role: 'Builder', accent: '#60A5FA', initial: 'D' },
  cindy: { id: 'cindy', name: 'Cindy', role: 'Assistant', accent: '#C084FC', initial: 'C' },
}

/* ── speech recognition hook ── */
function useSpeechRecognition() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recRef = useRef<any>(null)

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Speech recognition not supported in this browser'); return }
    const rec = new SR()
    rec.lang = 'en-GB'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript
      setTranscript(t)
      setListening(false)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recRef.current = rec
    setTranscript('')
    setListening(true)
    rec.start()
  }, [])

  const stop = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, transcript, start, stop, setTranscript }
}

/* ── waveform ── */
function Waveform({ color, bars = 20, h = 24, animate: anim = true }: { color: string; bars?: number; h?: number; animate?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, height: h }}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          style={{ width: 2, borderRadius: 1, background: color, opacity: 0.8 }}
          animate={anim ? { height: [2, h * 0.25 + Math.random() * h * 0.65, 2] } : { height: h * 0.3 }}
          transition={anim ? { duration: 0.5 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' } : {}}
        />
      ))}
    </div>
  )
}

/* ── main ── */
export default function Home() {
  const [active, setActive] = useState<AgentId>('marg')
  const [now, setNow] = useState(new Date())
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [loading, setLoading] = useState(false)
  const [playingAudio, setPlayingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { listening, transcript, start, stop, setTranscript } = useSpeechRecognition()

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-send when transcript is ready
  useEffect(() => {
    if (transcript && !loading) {
      sendMessage(transcript)
      setTranscript('')
    }
  }, [transcript])

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const agent = AGENTS[active]
  const others = (['marg', 'doc', 'cindy'] as AgentId[]).filter(id => id !== active)
  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateFmt = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeFmt = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  async function sendMessage(text: string) {
    const userMsg: ChatMsg = { role: 'user', content: text, ts: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agent: active,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const assistantMsg: ChatMsg = {
        role: 'assistant',
        content: data.text,
        audioBase64: data.audioBase64,
        ts: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])

      // Auto-play audio
      if (data.audioBase64) {
        playAudio(data.audioBase64)
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.', ts: new Date() }])
    } finally {
      setLoading(false)
    }
  }

  function playAudio(base64: string) {
    if (audioRef.current) {
      audioRef.current.pause()
    }
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
      color: '#F0EEE8',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,80,200,0.08), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* ─── Header ─── */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ paddingTop: 40, marginBottom: 24, textAlign: 'center', flexShrink: 0 }}
        >
          <div style={{ color: '#555', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            {dayName} · {dateFmt}
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 700, margin: 0, letterSpacing: -1, fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
            Jake
          </h1>
          <div style={{ color: '#666', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 }}>
            Mission Control
          </div>
          <div style={{ fontSize: 28, fontWeight: 200, fontFamily: 'monospace', letterSpacing: 3, marginTop: 8, opacity: 0.7 }}>
            {timeFmt}
          </div>
        </motion.header>

        {/* ─── Agent Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 28,
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* Glow */}
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 200, height: 200,
            borderRadius: '50%', background: `radial-gradient(circle, ${agent.accent}10, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Agent name + switcher */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `linear-gradient(145deg, ${agent.accent}30, ${agent.accent}10)`,
                border: `1.5px solid ${agent.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: agent.accent,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {agent.initial}
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {agent.name}
                </h2>
                <div style={{ color: '#555', fontSize: 11 }}>{agent.role}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {others.map(id => (
                <motion.button
                  key={id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setActive(id); setMessages([]) }}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${AGENTS[id].accent}20, ${AGENTS[id].accent}08)`,
                    border: `1.5px solid ${AGENTS[id].accent}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 13, fontWeight: 700, color: AGENTS[id].accent,
                  }}
                >
                  {AGENTS[id].initial}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div style={{
            maxHeight: messages.length > 0 ? 320 : 0,
            overflowY: 'auto',
            transition: 'max-height 0.3s ease',
            marginBottom: messages.length > 0 ? 14 : 0,
          }}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  gap: 8,
                  marginBottom: 10,
                  alignItems: 'flex-end',
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 10, flexShrink: 0,
                    background: `${agent.accent}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: agent.accent,
                  }}>
                    {agent.initial}
                  </div>
                )}
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  {msg.audioBase64 && msg.role === 'assistant' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => playAudio(msg.audioBase64!)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: `${agent.accent}25`,
                          border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: agent.accent, fontSize: 12,
                        }}
                      >
                        ▶
                      </motion.button>
                      <Waveform color={agent.accent} bars={14} h={18} animate={false} />
                    </div>
                  ) : null}
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: msg.role === 'user' ? '#C8C8E8' : '#C0C0C0' }}>
                    {msg.content}
                  </p>
                  <div style={{ fontSize: 9, color: '#444', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {msg.ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 10,
                  background: `${agent.accent}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: agent.accent,
                }}>
                  {agent.initial}
                </div>
                <Waveform color={agent.accent} bars={12} h={16} />
                <span style={{ color: '#555', fontSize: 11 }}>thinking...</span>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Mic button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
            {listening && <Waveform color={agent.accent} bars={12} h={24} />}

            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              onClick={listening ? stop : start}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: listening
                  ? `radial-gradient(circle at 35% 35%, #EF444480, #EF444430)`
                  : `radial-gradient(circle at 35% 35%, ${agent.accent}45, ${agent.accent}15)`,
                border: `1.5px solid ${listening ? '#EF444460' : agent.accent + '40'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
              }}
            >
              {/* Pulse */}
              <motion.div
                style={{
                  position: 'absolute', inset: -6, borderRadius: '50%',
                  border: `1px solid ${listening ? '#EF444430' : agent.accent + '20'}`,
                }}
                animate={listening ? { scale: [1, 1.3, 1], opacity: [0.6, 0.1, 0.6] } : { scale: [1, 1.15, 1], opacity: [0.4, 0.15, 0.4] }}
                transition={{ duration: listening ? 1 : 2.5, repeat: Infinity }}
              />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={listening ? '#EF4444' : agent.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="1" width="6" height="11" rx="3" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </motion.button>

            {listening && <Waveform color={agent.accent} bars={12} h={24} />}
          </div>

          {listening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', color: '#EF4444', fontSize: 12, marginTop: 10 }}
            >
              Listening...
            </motion.div>
          )}

          {playingAudio && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', color: agent.accent, fontSize: 11, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <motion.div
                style={{ width: 6, height: 6, borderRadius: '50%', background: agent.accent }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              Speaking...
            </motion.div>
          )}
        </motion.div>

      </div>
    </div>
  )
}
