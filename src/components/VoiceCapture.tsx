'use client'

import { useState, useRef, useCallback } from 'react'

interface VoiceCaptureProps {
  onTranscript: (text: string) => void
}

export default function VoiceCapture({ onTranscript }: VoiceCaptureProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef<any>(null)

  const startRecording = useCallback(() => {
    setError('')
    setTranscript('')
    
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setError('Voice capture not supported in this browser. Try Chrome or Safari.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-GB'

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognition.onerror = (event: any) => {
      setError(`Error: ${event.error}`)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      if (transcript) {
        onTranscript(transcript)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [onTranscript, transcript])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          border: isRecording ? '1px solid #ef4444' : '1px solid rgba(99,102,241,0.35)',
          background: isRecording ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.1)',
          color: isRecording ? '#ef4444' : '#6366f1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        title={isRecording ? 'Stop recording' : 'Start voice capture'}
      >
        {isRecording ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </button>
      
      {isRecording && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#ef4444',
            animation: 'pulse 1s infinite',
          }} />
          <span style={{ fontSize: 12, color: '#ef4444' }}>Recording...</span>
        </div>
      )}
      
      {transcript && !isRecording && (
        <span style={{ fontSize: 12, color: '#888', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {transcript}
        </span>
      )}
      
      {error && (
        <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
