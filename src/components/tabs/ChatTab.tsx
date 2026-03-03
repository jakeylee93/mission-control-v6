'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, type ChatMessage } from '@/lib/api'

const SENDER = 'Jake'

function formatTime(ts: string): string {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts: string): string {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function groupByDate(messages: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = []
  let currentDate = ''
  for (const msg of messages) {
    const date = formatDate(msg.time)
    if (date !== currentDate) {
      groups.push({ date, messages: [] })
      currentDate = date
    }
    groups[groups.length - 1].messages.push(msg)
  }
  return groups
}

interface MessageBubbleProps {
  msg: ChatMessage
  isOwn: boolean
  showAvatar: boolean
}

function MessageBubble({ msg, isOwn, showAvatar }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="shrink-0 w-7 h-7">
        {showAvatar && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: isOwn ? '#FFFF00' : '#A855F7',
              color: isOwn ? '#000' : '#fff',
            }}
          >
            {msg.sender === 'Jake' ? 'J' : 'M'}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {showAvatar && (
          <div className={`text-[10px] text-[#444] px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {msg.sender}
          </div>
        )}
        <div
          className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words"
          style={{
            background: isOwn ? '#FFFF00' : '#111111',
            color: isOwn ? '#000' : '#F0EEE8',
            borderRadius: isOwn
              ? '18px 18px 4px 18px'
              : '18px 18px 18px 4px',
            border: isOwn ? 'none' : '1px solid #1A1A1A',
          }}
        >
          {msg.text}
        </div>
        <div className={`text-[10px] text-[#333] px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {formatTime(msg.time)}
        </div>
      </div>
    </motion.div>
  )
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-[#A855F7] text-white shrink-0">
        M
      </div>
      <div className="bg-[#111] border border-[#1A1A1A] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
        <span className="text-[10px] text-[#666] ml-1">{name} is typing</span>
      </div>
    </div>
  )
}

export default function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typing, setTyping] = useState<Record<string, boolean>>({})
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [lastCount, setLastCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const poll = useCallback(async () => {
    try {
      const data = await api.chat()
      setMessages(data.messages)
      setTyping(data.typing)
      if (data.messages.length > lastCount) {
        setLastCount(data.messages.length)
      }
    } catch {}
  }, [lastCount])

  useEffect(() => {
    poll()
    const timer = setInterval(poll, 2000)
    return () => clearInterval(timer)
  }, [poll])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typing])

  const sendTyping = useCallback((isTyping: boolean) => {
    api.typing(SENDER, isTyping).catch(() => {})
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    sendTyping(true)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => sendTyping(false), 3000)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')
    sendTyping(false)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)

    // Optimistic update
    const optimistic: ChatMessage = { time: new Date().toISOString(), sender: SENDER, text }
    setMessages((prev) => [...prev, optimistic])

    try {
      await api.sendMessage(text, SENDER)
      await poll()
    } catch {}
    setSending(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const grouped = groupByDate(messages)
  const margaritaTyping = typing['Margarita']

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[#1A1A1A] bg-[#050505]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#A855F7] flex items-center justify-center text-sm font-bold text-white">
            M
          </div>
          <div>
            <div className="text-[#F0EEE8] font-semibold text-sm">Margarita</div>
            <div className="text-[10px] text-[#666]">
              {margaritaTyping ? (
                <span className="text-[#A855F7]">typing...</span>
              ) : (
                'Brain · Kimi · OpenClaw'
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full dot-active" />
          <span className="text-xs text-[#444]">Polling 2s</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <div className="text-[#666] text-sm">No messages yet</div>
              <div className="text-[#444] text-xs mt-1">Start the conversation</div>
            </div>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-[#1A1A1A]" />
                <span className="text-[10px] text-[#444] px-2">{group.date}</span>
                <div className="flex-1 h-px bg-[#1A1A1A]" />
              </div>

              <div className="flex flex-col gap-2">
                {group.messages.map((msg, i) => {
                  const isOwn = msg.sender === SENDER
                  const prevMsg = i > 0 ? group.messages[i - 1] : null
                  const showAvatar = !prevMsg || prevMsg.sender !== msg.sender
                  return (
                    <MessageBubble key={`${msg.time}-${i}`} msg={msg} isOwn={isOwn} showAvatar={showAvatar} />
                  )
                })}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {margaritaTyping && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
            >
              <TypingIndicator name="Margarita" />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 md:px-6 py-3 border-t border-[#1A1A1A] bg-[#050505]">
        <div className="flex items-end gap-3">
          <div
            className="flex-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl px-4 py-3 focus-within:border-[#2A2A2A] transition-colors"
          >
            <textarea
              ref={inputRef}
              className="w-full bg-transparent text-[#F0EEE8] text-sm resize-none focus:outline-none placeholder:text-[#333] leading-relaxed"
              placeholder="Message Margarita..."
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
          </div>
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all shrink-0 mb-0.5"
            style={{
              background: input.trim() ? '#FFFF00' : '#111',
              color: input.trim() ? '#000' : '#333',
              boxShadow: input.trim() ? '0 0 12px rgba(255,255,0,0.3)' : 'none',
            }}
          >
            ↑
          </button>
        </div>
        <div className="text-[10px] text-[#333] mt-1.5 pl-1">Enter to send · Shift+Enter for newline</div>
      </div>
    </div>
  )
}
