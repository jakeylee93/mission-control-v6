'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from '@/components/Navigation'
import DashTab from '@/components/tabs/DashTab'
import SystemTab from '@/components/tabs/SystemTab'
import PlansTab from '@/components/tabs/PlansTab'
import CalendarTab from '@/components/tabs/CalendarTab'
import CaptureTab from '@/components/tabs/CaptureTab'

export type Tab = 'DASH' | 'SYSTEM' | 'PLANS' | 'CALENDAR' | 'CAPTURE'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('DASH')
  const [time, setTime] = useState(new Date())
  const [isDayMode, setIsDayMode] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isDayMode) {
      document.documentElement.classList.add('day-mode')
      document.documentElement.style.background = '#FFFFFF'
    } else {
      document.documentElement.classList.remove('day-mode')
      document.documentElement.style.background = '#000000'
    }
  }, [isDayMode])

  const tabVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-bg)' }}>
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        time={time}
        isDayMode={isDayMode}
        toggleMode={() => setIsDayMode(!isDayMode)}
      />

      <main className="pt-[100px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeTab === 'DASH' && <DashTab />}
            {activeTab === 'SYSTEM' && <SystemTab />}
            {activeTab === 'PLANS' && <PlansTab />}
            {activeTab === 'CALENDAR' && <CalendarTab />}
            {activeTab === 'CAPTURE' && <CaptureTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
