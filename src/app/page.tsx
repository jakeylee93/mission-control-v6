'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export type Tab = 'TEAMS' | 'PLANS' | 'BRAIN' | 'DOCS' | 'BELONGINGS' | 'LOVELY' | 'PROPERTY' | 'CALENDAR' | 'CAPTURE' | 'SYSTEM'

type AgentId = 'marg' | 'doc' | 'cindy'
type MsgRole = 'user' | 'assistant'
type VoiceState = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking'

interface ChatMsg {
  role: MsgRole
  content: string
  audioBase64?: string
  ts: Date
}

interface Agent {
  id: AgentId; name: string; role: string; accent: string; avatar: string
}

const AGENTS: Record<AgentId, Agent> = {
  marg: { id: 'marg', name: 'Margarita', role: 'Orchestrator', accent: '#FFD700', avatar: '/images/marg.png' },
  doc: { id: 'doc', name: 'Doc', role: 'Builder', accent: '#60A5FA', avatar: '/images/doc.png' },
  cindy: { id: 'cindy', name: 'Cindy', role: 'Assistant', accent: '#C084FC', avatar: '/images/cindy.png' },
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
    if (!startTime) return
    setElapsed(0)
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

/* ── agent avatar ── */
function AgentAvatar({ agent, size, borderRadius }: { agent: Agent; size: number; borderRadius: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius,
      background: `linear-gradient(145deg, ${agent.accent}25, ${agent.accent}08)`,
      border: `1.5px solid ${agent.accent}30`,
      overflow: 'hidden', flexShrink: 0,
    }}>
      <Image src={agent.avatar} alt={agent.name} width={size} height={size} style={{ width: size, height: size, objectFit: 'cover' }} />
    </div>
  )
}

/* ── main ── */
export default function Home() {
  const [active, setActive] = useState<AgentId>('marg')
  const [now, setNow] = useState(new Date())
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [recordStart, setRecordStart] = useState(0)
  const [textInput, setTextInput] = useState('')
  const [levels, setLevels] = useState<number[]>(new Array(32).fill(0))

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafRef = useRef<number>(0)

  const isBusy = voiceState !== 'idle'

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const agent = AGENTS[active]
  const others = (['marg', 'doc', 'cindy'] as AgentId[]).filter(id => id !== active)
  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateFmt = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeFmt = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  /* ── cleanup helpers ── */
  const stopMicStream = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    sourceRef.current?.disconnect()
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      ctxRef.current.close()
    }
    ctxRef.current = null
    analyserRef.current = null
    sourceRef.current = null
    streamRef.current = null
    setLevels(new Array(32).fill(0))
  }, [])

  /* ── start recording: mic → MediaRecorder + AudioContext analyser ── */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // AudioContext for waveform (created on user tap)
      const ctx = new AudioContext()
      if (ctx.state === 'suspended') await ctx.resume()
      ctxRef.current = ctx
      const src = ctx.createMediaStreamSource(stream)
      sourceRef.current = src
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.4
      src.connect(analyser)
      analyserRef.current = analyser

      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        setLevels(Array.from(data))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()

      // MediaRecorder for actual audio capture
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorderRef.current = recorder
      recorder.start()

      setVoiceState('recording')
      setRecordStart(Date.now())
    } catch (e) {
      console.error('Mic access error:', e)
    }
  }, [])

  /* ── stop recording → transcribe → chat ── */
  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    setVoiceState('transcribing')
    setRecordStart(0)

    recorder.onstop = async () => {
      // Stop mic and analyser
      stopMicStream()

      const mimeType = recorder.mimeType
      const ext = mimeType.includes('mp4') ? '.mp4' : '.webm'
      const blob = new Blob(chunksRef.current, { type: mimeType })
      chunksRef.current = []

      if (blob.size < 1000) {
        // Too short / empty recording
        setVoiceState('idle')
        return
      }

      try {
        // Transcribe via Whisper
        const formData = new FormData()
        formData.append('file', blob, `recording${ext}`)
        const transcribeRes = await fetch('/api/memory/transcribe', {
          method: 'POST',
          body: formData,
        })
        const transcribeData = await transcribeRes.json()
        if (!transcribeRes.ok || !transcribeData.text) {
          console.error('Transcribe error:', transcribeData.error)
          setVoiceState('idle')
          return
        }

        const text = transcribeData.text.trim()
        if (!text) {
          setVoiceState('idle')
          return
        }

        // Send to chat
        await sendMessageFromVoice(text)
      } catch (err) {
        console.error('Voice pipeline error:', err)
        setVoiceState('idle')
      }
    }

    recorder.stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopMicStream])

  /* ── send message (from voice flow, manages voiceState) ── */
  async function sendMessageFromVoice(text: string) {
    const userMsg: ChatMsg = { role: 'user', content: text, ts: new Date() }
    setMessages(prev => [...prev, userMsg])
    setVoiceState('thinking')

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
      if (data.audioBase64) {
        setVoiceState('speaking')
        await playAudioAsync(data.audioBase64)
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.', ts: new Date() }])
    }
    setVoiceState('idle')
  }

  /* ── send message (from text input) ── */
  async function sendMessageFromText(text: string) {
    const userMsg: ChatMsg = { role: 'user', content: text, ts: new Date() }
    setMessages(prev => [...prev, userMsg])
    setVoiceState('thinking')

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
      if (data.audioBase64) {
        setVoiceState('speaking')
        await playAudioAsync(data.audioBase64)
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.', ts: new Date() }])
    }
    setVoiceState('idle')
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = textInput.trim()
    if (!text || isBusy) return
    setTextInput('')
    sendMessageFromText(text)
  }

  function playAudioAsync(base64: string): Promise<void> {
    return new Promise((resolve) => {
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(`data:audio/mpeg;base64,${base64}`)
      audioRef.current = audio
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
  }

  function playAudioManual(base64: string) {
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`)
    audioRef.current = audio
    setVoiceState('speaking')
    audio.onended = () => setVoiceState('idle')
    audio.onerror = () => setVoiceState('idle')
    audio.play().catch(() => setVoiceState('idle'))
  }

  /* ── status label ── */
  const statusLabel = voiceState === 'transcribing' ? 'Transcribing...'
    : voiceState === 'thinking' ? 'Thinking...'
    : voiceState === 'speaking' ? 'Speaking...'
    : null

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
              <AgentAvatar agent={agent} size={48} borderRadius={14} />
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
                    overflow: 'hidden', padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  <Image src={AGENTS[id].avatar} alt={AGENTS[id].name} width={38} height={38} style={{ width: 38, height: 38, objectFit: 'cover' }} />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Chat messages */}
          <div style={{ maxHeight: messages.length > 0 ? 280 : 0, overflowY: 'auto', transition: 'max-height 0.3s', marginBottom: messages.length > 0 ? 16 : 0 }}>
            {messages.map((msg, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
                {msg.role === 'assistant' && (
                  <AgentAvatar agent={agent} size={26} borderRadius={8} />
                )}
                <div style={{
                  maxWidth: '80%', padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  {msg.audioBase64 && msg.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => playAudioManual(msg.audioBase64!)}
                        style={{ width: 26, height: 26, borderRadius: '50%', background: `${agent.accent}20`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: agent.accent, fontSize: 11 }}>▶</motion.button>
                      <StaticWaveform color={agent.accent} bars={16} h={16} />
                    </div>
                  )}
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: msg.role === 'user' ? '#C8C8E8' : '#B8B8B8' }}>{msg.content}</p>
                  <div style={{ fontSize: 9, color: '#3A3A3A', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {msg.ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
            {voiceState === 'thinking' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0' }}>
                <AgentAvatar agent={agent} size={26} borderRadius={8} />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ color: '#555', fontSize: 12 }}>thinking...</motion.div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ─── Recording area ─── */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <AnimatePresence mode="wait">
              {voiceState === 'recording' ? (
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
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: '#EF4444' }} />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 0' }}>

                  {statusLabel && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <motion.div style={{ width: 6, height: 6, borderRadius: '50%', background: agent.accent }}
                        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity }} />
                      <span style={{ color: agent.accent, fontSize: 11 }}>{statusLabel}</span>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={startRecording}
                    disabled={isBusy}
                    style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: `radial-gradient(circle at 35% 35%, ${agent.accent}40, ${agent.accent}12)`,
                      border: `2px solid ${agent.accent}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: isBusy ? 'not-allowed' : 'pointer', position: 'relative',
                      opacity: isBusy ? 0.5 : 1,
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

          {/* ─── Text input ─── */}
          <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: 8, marginTop: 12, position: 'relative', zIndex: 1 }}>
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder={`Message ${agent.name}...`}
              disabled={isBusy}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 16,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E0E0E0', fontSize: 13,
                fontFamily: "'Inter', system-ui, sans-serif",
                outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = `${agent.accent}40` }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              disabled={!textInput.trim() || isBusy}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: textInput.trim() ? `${agent.accent}25` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${textInput.trim() ? `${agent.accent}35` : 'rgba(255,255,255,0.06)'}`,
                cursor: textInput.trim() && !isBusy ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: textInput.trim() ? agent.accent : '#444',
                fontSize: 16, flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </motion.button>
          </form>
        </motion.div>

      </div>
    </div>
  )
}
