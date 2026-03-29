'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('mc_theme')
    if (stored === 'light') setIsDark(false)
  }, [])

  const handleSubmit = async (code?: string) => {
    const pin = code || password
    if (!pin.trim() || loading) return
    setLoading(true)
    setError(false)

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pin }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError(true)
      setPassword('')
    }
    setLoading(false)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit()
  }

  const handlePadPress = (num: string) => {
    if (password.length >= 8) return
    const next = password + num
    setPassword(next)
    setError(false)
    // Auto-submit at 4 digits
    if (next.length === 4) {
      setTimeout(() => handleSubmit(next), 150)
    }
  }

  const handleBackspace = () => {
    setPassword(p => p.slice(0, -1))
    setError(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)' : 'linear-gradient(170deg, #f8f9fb 0%, #eef0f5 35%, #f0f2f7 70%, #e8eaf0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      transition: 'background 0.4s ease',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 340, padding: '0 24px',
        textAlign: 'center',
      }}>
        {/* Logo / Title */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 10, color: isDark ? '#555' : '#aaa', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8,
          }}>Mission Control</div>
          <h1 style={{
            fontSize: 32, fontWeight: 700, color: isDark ? '#f0eee8' : '#1a1a2e', margin: 0,
            fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1,
          }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: isDark ? '#666' : '#999', marginTop: 6 }}>Enter your passcode to continue</p>
        </div>

        {/* Passcode dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 24 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: '50%',
              background: password.length > i ? (error ? '#ef4444' : '#6366f1') : 'rgba(255,255,255,0.1)',
              border: error && password.length === 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.15s ease',
              transform: password.length > i ? 'scale(1.1)' : 'scale(1)',
            }} />
          ))}
        </div>

        {error && (
          <div style={{
            fontSize: 12, color: '#ef4444', marginBottom: 16,
            animation: 'shake 0.4s ease',
          }}>
            Wrong passcode
          </div>
        )}

        {loading && (
          <div style={{ fontSize: 12, color: '#6366f1', marginBottom: 16 }}>Checking...</div>
        )}

        {/* Number pad */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12, maxWidth: 260, margin: '0 auto',
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button key={num} onClick={() => handlePadPress(num)} style={{
              width: '100%', aspectRatio: '1.4', borderRadius: 16,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              color: isDark ? '#f0eee8' : '#1a1a2e', fontSize: 24, fontWeight: 400,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.1s',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>{num}</button>
          ))}
          {/* Bottom row: empty, 0, backspace */}
          <div />
          <button onClick={() => handlePadPress('0')} style={{
            width: '100%', aspectRatio: '1.4', borderRadius: 16,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            color: isDark ? '#f0eee8' : '#1a1a2e', fontSize: 24, fontWeight: 400,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>0</button>
          <button onClick={handleBackspace} style={{
            width: '100%', aspectRatio: '1.4', borderRadius: 16,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            color: isDark ? '#888' : '#999', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
              <line x1="18" y1="9" x2="12" y2="15"/>
              <line x1="12" y1="9" x2="18" y2="15"/>
            </svg>
          </button>
        </div>

        {/* Hidden form for keyboard input fallback */}
        <form onSubmit={handleFormSubmit} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
          <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(false) }} autoFocus />
        </form>

        <div style={{ fontSize: 10, color: '#333', marginTop: 40 }}>
          v6.1 · Jake Lee
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
