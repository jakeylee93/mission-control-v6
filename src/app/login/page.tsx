'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || loading) return
    setLoading(true)
    setError(false)

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
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
            fontSize: 10, color: '#555', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8,
          }}>Mission Control</div>
          <h1 style={{
            fontSize: 32, fontWeight: 700, color: '#f0eee8', margin: 0,
            fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1,
          }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: '#666', marginTop: 6 }}>Enter your passcode to continue</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false) }}
              placeholder="••••"
              autoFocus
              style={{
                width: '100%', padding: '16px 20px', borderRadius: 14,
                background: 'rgba(255,255,255,0.06)',
                border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                color: '#f0eee8', fontSize: 24, fontWeight: 300,
                letterSpacing: 12, textAlign: 'center',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            />
            {error && (
              <div style={{
                fontSize: 12, color: '#ef4444', marginTop: 8,
                animation: 'shake 0.4s ease',
              }}>
                Wrong passcode
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!password.trim() || loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              border: 'none', cursor: password.trim() ? 'pointer' : 'not-allowed',
              background: password.trim() ? 'rgba(99,102,241,0.8)' : 'rgba(99,102,241,0.2)',
              color: password.trim() ? '#fff' : '#666',
              fontSize: 15, fontWeight: 700,
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
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
