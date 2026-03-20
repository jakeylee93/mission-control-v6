'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Agent, ChatMessage } from '@/components/types'

interface ChatAreaProps {
  agent: Agent
  messages: ChatMessage[]
  isThinking: boolean
  audioPlayingId: string | null
  onReplayAudio: (message: ChatMessage) => void
}

function MiniWaveform({ color }: { color: string }) {
  const bars = [6, 11, 8, 14, 7, 12, 9, 6, 11, 8]
  return (
    <div className="flex items-end gap-[2px]">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[2px] rounded-sm opacity-70"
          style={{ height: h, backgroundColor: color }}
        />
      ))}
    </div>
  )
}

export function ChatArea({ agent, messages, isThinking, onReplayAudio, audioPlayingId }: ChatAreaProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  return (
    <section className="mx-4 mb-3 flex h-[24vh] min-h-[190px] flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl">
      <div className="flex-1 overflow-y-auto pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <div key={msg.id} className={`mb-2 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[88%] items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isUser && (
                  <Image src={agent.avatar} alt={agent.name} width={22} height={22} className="h-[22px] w-[22px] rounded-full" />
                )}
                <div
                  className={`rounded-2xl px-3 py-2 text-xs leading-snug transition-colors ${
                    isUser
                      ? 'rounded-br-md border border-indigo-300/30 bg-indigo-500/25 text-indigo-100'
                      : 'rounded-bl-md border border-white/10 bg-white/5 text-white/85'
                  }`}
                >
                  {msg.hasAudio && msg.audioBase64 && !isUser && (
                    <button
                      onClick={() => onReplayAudio(msg)}
                      className="mb-1.5 flex items-center gap-2 rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/80"
                      aria-label="Replay audio"
                    >
                      <span>{audioPlayingId === msg.id ? '■' : '▶'}</span>
                      <MiniWaveform color={agent.accent} />
                    </button>
                  )}
                  <p>{msg.content}</p>
                </div>
              </div>
            </div>
          )
        })}

        {isThinking && <p className="text-xs text-white/60">Thinking...</p>}
        <div ref={endRef} />
      </div>
    </section>
  )
}
