'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from '@/components/Navigation'
import TeamsTab from '@/components/tabs/TeamsTab'
import SystemTab from '@/components/tabs/SystemTab'
import PlansTab from '@/components/tabs/PlansTab'
import CaptureTab from '@/components/tabs/CaptureTab'
import BrainTab from '@/components/tabs/BrainTab'
import DocsTab from '@/components/tabs/DocsTab'
import BelongingsTab from '@/components/tabs/BelongingsTab'
import PropertyTab from '@/components/tabs/PropertyTab'
import LovelyTab from '@/components/tabs/LovelyTab'
import CalendarTab from '@/components/tabs/CalendarTab'
export type Tab = 'TEAMS' | 'PLANS' | 'BRAIN' | 'DOCS' | 'BELONGINGS' | 'LOVELY' | 'PROPERTY' | 'CALENDAR' | 'CAPTURE' | 'SYSTEM'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('TEAMS')
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
            {activeTab === 'TEAMS' && <TeamsTab />}
            {activeTab === 'PLANS' && <PlansTab />}
            {activeTab === 'BRAIN' && <BrainTab />}
            {activeTab === 'DOCS' && <DocsTab />}
            {activeTab === 'BELONGINGS' && <BelongingsTab />}
            {activeTab === 'LOVELY' && <LovelyTab />}
            {activeTab === 'PROPERTY' && <PropertyTab />}
            {activeTab === 'CALENDAR' && <CalendarTab />}
            {activeTab === 'CAPTURE' && <CaptureTab />}
            {activeTab === 'SYSTEM' && <SystemTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
