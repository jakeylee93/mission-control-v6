'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { AGENTS, Agent, AgentId } from '@/components/types'

interface AgentHeroProps {
  agent: Agent
  isSpeaking: boolean
  onSwitchAgent: (agentId: AgentId) => void
}

export function AgentHero({ agent, isSpeaking, onSwitchAgent }: AgentHeroProps) {
  const otherAgents = (Object.keys(AGENTS) as AgentId[]).filter((id) => id !== agent.id)

  return (
    <section className="relative mx-4 mb-3 rounded-3xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-2xl">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-60" style={{ background: `radial-gradient(circle, ${agent.accent}33, transparent 70%)` }} />

      <div className="absolute right-3 top-3 z-10 flex gap-2">
        {otherAgents.map((id) => {
          const choice = AGENTS[id]
          return (
            <button
              key={id}
              onClick={() => onSwitchAgent(id)}
              className="h-9 w-9 overflow-hidden rounded-full border border-white/20 bg-white/5"
              style={{ borderColor: `${choice.accent}66` }}
              aria-label={`Switch to ${choice.name}`}
            >
              <Image src={choice.avatar} alt={choice.name} width={36} height={36} className="h-full w-full object-cover" />
            </button>
          )
        })}
      </div>

      <div className="flex h-[32vh] min-h-[240px] flex-col items-center justify-center">
        <motion.div
          className="relative rounded-full p-2"
          animate={{
            boxShadow: isSpeaking
              ? [`0 0 10px ${agent.accent}66`, `0 0 34px ${agent.accent}CC`, `0 0 10px ${agent.accent}66`]
              : [`0 0 8px ${agent.accent}40`, `0 0 18px ${agent.accent}7A`, `0 0 8px ${agent.accent}40`],
            scale: isSpeaking ? [1, 1.03, 1] : [1, 1.015, 1],
          }}
          transition={{ duration: isSpeaking ? 1 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ border: `2px solid ${agent.accent}` }}
        >
          <Image
            src={agent.avatar}
            alt={agent.name}
            width={220}
            height={220}
            className="h-[200px] w-[200px] rounded-full object-cover sm:h-[220px] sm:w-[220px]"
          />
        </motion.div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{agent.name}</h2>
        <p className="text-sm text-white/70">{agent.role}</p>
      </div>
    </section>
  )
}
