'use client'

import { FormEvent, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Agent, VoiceState } from '@/components/types'

interface VoiceInputProps {
  agent: Agent
  voiceState: VoiceState
  analyser: AnalyserNode | null
  textInput: string
  onTextChange: (value: string) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onSendText: () => void
}

function statusLabel(state: VoiceState) {
  if (state === 'recording') return 'Recording'
  if (state === 'transcribing') return 'Transcribing'
  if (state === 'thinking') return 'Thinking'
  if (state === 'speaking') return 'Speaking'
  return 'Idle'
}

export function VoiceInput({
  agent,
  voiceState,
  analyser,
  textInput,
  onTextChange,
  onStartRecording,
  onStopRecording,
  onSendText,
}: VoiceInputProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const busy = voiceState !== 'idle'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    if (!analyser || voiceState !== 'recording') {
      ctx.clearRect(0, 0, width, height)
      return
    }

    const barCount = 42
    const data = new Uint8Array(analyser.frequencyBinCount)

    const draw = () => {
      analyser.getByteFrequencyData(data)
      ctx.clearRect(0, 0, width, height)

      const barW = 3
      const gap = (width - barCount * barW) / (barCount - 1)
      const step = Math.max(1, Math.floor(data.length / barCount))

      for (let i = 0; i < barCount; i += 1) {
        const value = data[i * step] || 0
        const barH = Math.max(3, (value / 255) * height)
        const x = i * (barW + gap)
        const y = (height - barH) / 2

        ctx.fillStyle = agent.accent
        ctx.globalAlpha = 0.9
        ctx.beginPath()
        ctx.roundRect(x, y, barW, barH, 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [analyser, voiceState, agent.accent])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (busy || !textInput.trim()) return
    onSendText()
  }

  return (
    <section className="mx-4 mb-2 flex h-[15vh] min-h-[128px] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl">
      <div className="flex items-center justify-center gap-2 text-xs text-white/65">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: agent.accent }} />
        <span>{statusLabel(voiceState)}</span>
      </div>

      <div className="flex items-center justify-center">
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          onClick={voiceState === 'recording' ? onStopRecording : onStartRecording}
          disabled={voiceState === 'transcribing' || voiceState === 'thinking'}
          className="relative flex h-14 w-14 items-center justify-center rounded-full border text-white"
          style={{ borderColor: `${agent.accent}99`, background: `${agent.accent}22` }}
          aria-label={voiceState === 'recording' ? 'Stop recording' : 'Start recording'}
        >
          {voiceState === 'recording' ? (
            <span className="h-4 w-4 rounded bg-red-400" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0" />
              <path d="M12 18v4" />
              <path d="M8 22h8" />
            </svg>
          )}
        </motion.button>
      </div>

      <canvas ref={canvasRef} width={310} height={30} className="mx-auto h-[30px] w-full max-w-[310px]" />

      <form onSubmit={onSubmit} className="mt-1 flex items-center gap-2">
        <input
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={`Message ${agent.name}...`}
          className="h-9 flex-1 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35"
          disabled={busy}
        />
        <button
          type="submit"
          className="h-9 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white/90 disabled:opacity-40"
          disabled={busy || !textInput.trim()}
        >
          Send
        </button>
      </form>
    </section>
  )
}
