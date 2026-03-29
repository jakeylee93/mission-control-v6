'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface ThemeColors {
  // Backgrounds
  bg: string
  bgGradient: string
  bgCard: string
  bgCardHover: string
  bgInput: string
  bgOverlay: string
  bgGlow: string
  
  // Text
  text: string
  textSecondary: string
  textMuted: string
  textDim: string
  
  // Borders
  border: string
  borderLight: string
  
  // Accents (stay the same)
  accent: string
  accentBg: string
  
  // Special
  tabBar: string
  tabBorder: string
  clockBg: string
  clockBorder: string
  clockGlow: string
}

const DARK: ThemeColors = {
  bg: '#0a0812',
  bgGradient: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.06)',
  bgInput: 'rgba(255,255,255,0.04)',
  bgOverlay: 'rgba(255,255,255,0.02)',
  bgGlow: 'rgba(99,102,241,0.06)',
  text: '#F0EEE8',
  textSecondary: '#aaa',
  textMuted: '#888',
  textDim: '#555',
  border: 'rgba(255,255,255,0.06)',
  borderLight: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  accentBg: 'rgba(99,102,241,0.15)',
  tabBar: 'rgba(10,8,18,0.95)',
  tabBorder: 'rgba(255,255,255,0.06)',
  clockBg: 'rgba(0,20,0,0.4)',
  clockBorder: 'rgba(34,197,94,0.2)',
  clockGlow: 'rgba(34,197,94,0.1)',
}

const LIGHT: ThemeColors = {
  bg: '#f8f9fb',
  bgGradient: 'linear-gradient(170deg, #f8f9fb 0%, #eef0f5 35%, #f0f2f7 70%, #e8eaf0 100%)',
  bgCard: 'rgba(0,0,0,0.03)',
  bgCardHover: 'rgba(0,0,0,0.05)',
  bgInput: 'rgba(0,0,0,0.04)',
  bgOverlay: 'rgba(0,0,0,0.02)',
  bgGlow: 'rgba(99,102,241,0.08)',
  text: '#1a1a2e',
  textSecondary: '#555',
  textMuted: '#777',
  textDim: '#aaa',
  border: 'rgba(0,0,0,0.08)',
  borderLight: 'rgba(0,0,0,0.06)',
  accent: '#6366f1',
  accentBg: 'rgba(99,102,241,0.1)',
  tabBar: 'rgba(255,255,255,0.95)',
  tabBorder: 'rgba(0,0,0,0.08)',
  clockBg: 'rgba(0,20,0,0.06)',
  clockBorder: 'rgba(34,197,94,0.25)',
  clockGlow: 'rgba(34,197,94,0.08)',
}

interface ThemeContextType {
  isDark: boolean
  toggle: () => void
  t: ThemeColors
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggle: () => {},
  t: DARK,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('mc_theme')
    if (stored === 'light') setIsDark(false)
  }, [])

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem('mc_theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggle, t: isDark ? DARK : LIGHT }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
