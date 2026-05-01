'use client'

import { useState, useEffect } from 'react'

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    
    // Check if installed after appinstalled event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstall(false)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
    setShowInstall(false)
  }

  if (isInstalled || !showInstall) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 200,
      background: 'rgba(99,102,241,0.95)',
      backdropFilter: 'blur(12px)',
      borderRadius: 16,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
      maxWidth: 400,
      width: '90%',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Add to Home Screen</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Install Mission Control for quick access</div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: '#fff',
          color: '#6366f1',
          border: 'none',
          borderRadius: 10,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Install
      </button>
      <button
        onClick={() => setShowInstall(false)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 18,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}
