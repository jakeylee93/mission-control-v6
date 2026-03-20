'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { TabBar } from '@/components/TabBar'
import { DashboardView } from '@/components/tabs/DashboardView'
import { ChatView } from '@/components/tabs/ChatView'
import { MemoryView } from '@/components/tabs/MemoryView'
import { SettingsView } from '@/components/tabs/SettingsView'
import { AGENTS, AgentId, ChatMessage, TabId, VoiceState } from '@/components/types'

function makeMessage(role: 'user' | 'assistant', content: string, options?: Partial<ChatMessage>): ChatMessage {
  return {
    id: options?.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    hasAudio: options?.hasAudio,
    audioBase64: options?.audioBase64,
    createdAt: options?.createdAt || new Date().toISOString(),
  }
}

function pickMimeType(): { mimeType?: string; ext: string } {
  if (typeof MediaRecorder === 'undefined') return { ext: '.webm' }
  if (MediaRecorder.isTypeSupported('audio/mp4')) return { mimeType: 'audio/mp4', ext: '.mp4' }
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return { mimeType: 'audio/webm;codecs=opus', ext: '.webm' }
  if (MediaRecorder.isTypeSupported('audio/webm')) return { mimeType: 'audio/webm', ext: '.webm' }
  return { ext: '.webm' }
}

export default function HomePage() {
  const [now, setNow] = useState(new Date())
  const [activeAgent, setActiveAgent] = useState<AgentId>('marg')
  const [activeTab, setActiveTab] = useState<TabId>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [textInput, setTextInput] = useState('')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [autoPlayTts, setAutoPlayTts] = useState(true)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])

  const agent = AGENTS[activeAgent]
  messagesRef.current = messages

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const stopMicStream = useCallback(async () => {
    mediaSourceRef.current?.disconnect()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    mediaSourceRef.current = null

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      await audioCtxRef.current.close()
    }

    audioCtxRef.current = null
    setAnalyser(null)
  }, [])

  const playAudio = useCallback(async (base64: string, messageId: string) => {
    if (!base64) return

    setAudioPlayingId(messageId)
    setVoiceState('speaking')

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    const audio = new Audio(`data:audio/mpeg;base64,${base64}`)
    audioRef.current = audio

    await new Promise<void>((resolve) => {
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })

    setAudioPlayingId(null)
    setVoiceState('idle')
  }, [])

  const sendMessage = useCallback(
    async (rawText: string, options?: { appendUser?: boolean }) => {
      const text = rawText.trim()
      if (!text) return

      const appendUser = options?.appendUser !== false
      if (appendUser) {
        const userMsg = makeMessage('user', text)
        setMessages((prev) => [...prev, userMsg])
      }
      setVoiceState('thinking')

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            agent: activeAgent,
            history: messagesRef.current.slice(-10).map((msg) => ({ role: msg.role, content: msg.content })),
          }),
        })

        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Chat request failed')
        }

        const assistantMsg = makeMessage('assistant', data.text || 'No response.', {
          hasAudio: Boolean(data.audioBase64),
          audioBase64: data.audioBase64,
        })

        setMessages((prev) => [...prev, assistantMsg])

        if (data.audioBase64 && autoPlayTts) {
          await playAudio(data.audioBase64, assistantMsg.id)
        } else {
          setVoiceState('idle')
        }
      } catch (error) {
        const fallback = makeMessage('assistant', 'Sorry, something went wrong.')
        setMessages((prev) => [...prev, fallback])
        setVoiceState('idle')
        console.error(error)
      }
    },
    [activeAgent, autoPlayTts, playAudio]
  )

  const loadChatHistory = useCallback(async (agentId: AgentId) => {
    try {
      const res = await fetch(`/api/chat-history?agent=${agentId}&limit=80`, { cache: 'no-store' })
      const data = await res.json()
      const loaded = (data.messages || []).map((msg: any) =>
        makeMessage(msg.role, msg.content, {
          id: msg.id,
          hasAudio: msg.has_audio,
          createdAt: msg.created_at,
        })
      )
      setMessages(loaded)
    } catch (error) {
      console.error('Failed loading chat history:', error)
      setMessages([])
    }
  }, [])

  useEffect(() => {
    loadChatHistory(activeAgent)
  }, [activeAgent, loadChatHistory])

  useEffect(() => {
    return () => {
      void stopMicStream()
      if (audioRef.current) audioRef.current.pause()
    }
  }, [stopMicStream])

  const startRecording = useCallback(async () => {
    if (voiceState !== 'idle') return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      if (audioCtx.state === 'suspended') await audioCtx.resume()
      audioCtxRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(stream)
      const analyserNode = audioCtx.createAnalyser()
      analyserNode.fftSize = 128
      analyserNode.smoothingTimeConstant = 0.5
      source.connect(analyserNode)

      mediaSourceRef.current = source
      setAnalyser(analyserNode)

      const { mimeType, ext } = pickMimeType()
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const recorder = new MediaRecorder(stream, options)
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        await stopMicStream()

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' })
        chunksRef.current = []
        if (blob.size < 100) {
          setVoiceState('idle')
          return
        }

        try {
          setVoiceState('transcribing')
          const formData = new FormData()
          formData.append('file', blob, `recording${ext}`)

          const transcribeRes = await fetch('/api/memory/transcribe', {
            method: 'POST',
            body: formData,
          })

          const transcribeData = await transcribeRes.json()
          const text = String(transcribeData?.text || '').trim()

          if (!transcribeRes.ok || !text) {
            setVoiceState('idle')
            return
          }

          setMessages((prev) => [...prev, makeMessage('user', text)])
          await sendMessage(text, { appendUser: false })
        } catch (error) {
          console.error('Voice flow error:', error)
          setVoiceState('idle')
        }
      }

      recorderRef.current = recorder
      recorder.start(200)
      setVoiceState('recording')
    } catch (error) {
      console.error('Mic permission error:', error)
      setVoiceState('idle')
    }
  }, [sendMessage, stopMicStream, voiceState])

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return
    recorder.stop()
  }, [])

  const tabContent = useMemo(() => {
    if (activeTab === 'dashboard') {
      return <DashboardView onQuickAction={(text) => {
        setActiveTab('chat')
        void sendMessage(text)
      }} />
    }

    if (activeTab === 'memory') {
      return <MemoryView />
    }

    if (activeTab === 'settings') {
      return <SettingsView autoPlayTts={autoPlayTts} onToggleAutoPlay={() => setAutoPlayTts((v) => !v)} />
    }

    return (
      <ChatView
        agent={agent}
        messages={messages}
        voiceState={voiceState}
        analyser={analyser}
        textInput={textInput}
        audioPlayingId={audioPlayingId}
        onTextChange={setTextInput}
        onSwitchAgent={(agentId) => {
          setActiveAgent(agentId)
          setVoiceState('idle')
        }}
        onReplayAudio={(message) => {
          if (!message.audioBase64) return
          void playAudio(message.audioBase64, message.id)
        }}
        onStartRecording={() => void startRecording()}
        onStopRecording={stopRecording}
        onSendText={() => {
          const text = textInput.trim()
          if (!text || voiceState !== 'idle') return
          setTextInput('')
          void sendMessage(text)
        }}
      />
    )
  }, [activeTab, sendMessage, autoPlayTts, agent, messages, voiceState, analyser, textInput, audioPlayingId, playAudio, startRecording, stopRecording])

  return (
    <main
      className="h-screen overflow-hidden text-white"
      style={{
        background: 'linear-gradient(180deg, #0a0812 0%, #110d20 45%, #0e0a18 100%)',
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-[480px] flex-col">
        <Header now={now} />

        <section className="relative flex-1 overflow-hidden pb-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {tabContent}
            </motion.div>
          </AnimatePresence>
        </section>

        <TabBar activeTab={activeTab} onTabChange={setActiveTab} accent={agent.accent} />
      </div>
    </main>
  )
}
