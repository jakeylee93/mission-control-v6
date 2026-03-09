'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, formatCost } from '@/lib/api'
import MargCharacter from '@/components/characters/MargCharacter'
import DocCharacter from '@/components/characters/DocCharacter'
import CindyCharacter from '@/components/characters/CindyCharacter'
import Room from '@/components/rooms/Room'
import AgentDetailPanel from '@/components/rooms/AgentDetailPanel'

type AgentId = 'marg' | 'doc' | 'cindy'
type RoomId = 'lobby' | 'dev' | 'comms' | 'brain' | 'ops'
type AgentState = 'active' | 'thinking' | 'idle' | 'error'

interface AgentInfo {
  id: AgentId
  name: string
  role: string
  accent: string
  state: AgentState
  currentRoom: string
  description: string
  model: string
  activities: { time: string; action: string; room: string }[]
}

const AGENT_DATA: Record<AgentId, AgentInfo> = {
  marg: {
    id: 'marg',
    name: 'Marg',
    role: 'Orchestrator',
    accent: '#FFD700',
    state: 'active',
    currentRoom: 'Ops Room',
    description: 'Coordinates everything — assigns tasks to agents, monitors system health, routes information, and keeps the whole operation running smoothly.',
    model: 'Claude Opus 4.6',
    activities: [
      { time: '09:14', action: 'Analysing today\'s schedule and prioritising tasks', room: 'Ops Room' },
      { time: '09:06', action: 'Synced memory to Supabase — 24 entries updated', room: 'Brain Room' },
      { time: '08:58', action: 'Delegated calendar sync task to Cindy', room: 'Ops Room' },
      { time: '08:45', action: 'Reviewed overnight build with Doc', room: 'Dev Room' },
      { time: '08:30', action: 'Morning briefing completed', room: 'Lobby' },
    ],
  },
  doc: {
    id: 'doc',
    name: 'Doc',
    role: 'Builder & Coder',
    accent: '#16A34A',
    state: 'idle',
    currentRoom: 'Dev Room',
    description: 'Builds websites, features, and systems. Writes clean code, deploys changes, and brings technical ideas to life. Named in memory of a real doctor who inspired the team.',
    model: 'Claude Sonnet 4.6',
    activities: [
      { time: '09:01', action: 'Standing by — awaiting new build task', room: 'Dev Room' },
      { time: '08:45', action: 'Reviewed Teams tab rebuild brief', room: 'Dev Room' },
      { time: '08:30', action: 'Completed Belongings tab colour detection update', room: 'Dev Room' },
      { time: '08:12', action: 'Deployed v6.0 build to production', room: 'Dev Room' },
      { time: '07:55', action: 'Fixed image search product sizing bug', room: 'Dev Room' },
    ],
  },
  cindy: {
    id: 'cindy',
    name: 'Cindy',
    role: 'Executive Assistant',
    accent: '#A855F7',
    state: 'thinking',
    currentRoom: 'Comms Room',
    description: 'Manages the calendar, handles emails, organises schedules, and keeps everything neatly arranged. Precise, reliable, and always one step ahead.',
    model: 'Claude Haiku 4.5',
    activities: [
      { time: '09:10', action: 'Preparing daily briefing email for 10am send', room: 'Comms Room' },
      { time: '09:02', action: 'Synced Google Calendar — 3 new events found', room: 'Comms Room' },
      { time: '08:55', action: 'Drafted response to property agent', room: 'Comms Room' },
      { time: '08:40', action: 'Updated weekly schedule in Supabase', room: 'Brain Room' },
      { time: '08:25', action: 'Morning motivational email sent successfully', room: 'Comms Room' },
    ],
  },
}

const ROOM_ORDER: RoomId[] = ['lobby', 'dev', 'comms', 'brain', 'ops']

const ROOM_META: Record<RoomId, { name: string; emoji: string }> = {
  lobby: { name: 'Lobby', emoji: '🏠' },
  dev: { name: 'Dev Room', emoji: '💻' },
  comms: { name: 'Comms Room', emoji: '📧' },
  brain: { name: 'Brain Room', emoji: '🧠' },
  ops: { name: 'Ops Room', emoji: '📊' },
}

// Default room assignments
const AGENT_ROOMS: Record<AgentId, RoomId> = {
  marg: 'ops',
  doc: 'dev',
  cindy: 'comms',
}

const LIVE_FEED = [
  { ts: '09:14', agent: 'Marg', agentId: 'marg' as AgentId, color: '#FFD700', action: 'Analysing today\'s schedule', room: 'Ops Room' },
  { ts: '09:10', agent: 'Cindy', agentId: 'cindy' as AgentId, color: '#A855F7', action: 'Preparing 10am briefing email', room: 'Comms Room' },
  { ts: '09:06', agent: 'Marg', agentId: 'marg' as AgentId, color: '#FFD700', action: 'Synced memory to Supabase', room: 'Brain Room' },
  { ts: '09:02', agent: 'Cindy', agentId: 'cindy' as AgentId, color: '#A855F7', action: 'Synced Google Calendar', room: 'Comms Room' },
  { ts: '09:01', agent: 'Doc', agentId: 'doc' as AgentId, color: '#16A34A', action: 'Standing by — ready for tasks', room: 'Dev Room' },
  { ts: '08:45', agent: 'Marg', agentId: 'marg' as AgentId, color: '#FFD700', action: 'Reviewed overnight build with Doc', room: 'Dev Room' },
  { ts: '08:30', agent: 'Doc', agentId: 'doc' as AgentId, color: '#16A34A', action: 'Completed Belongings tab update', room: 'Dev Room' },
]

function CharacterInRoom({
  agentId,
  state,
  isSelected,
  onClick,
}: {
  agentId: AgentId
  state: AgentState
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      style={{ cursor: 'pointer' }}
    >
      {agentId === 'marg' && <MargCharacter size={62} state={state} isSelected={isSelected} />}
      {agentId === 'doc' && <DocCharacter size={62} state={state} isSelected={isSelected} />}
      {agentId === 'cindy' && <CindyCharacter size={62} state={state} isSelected={isSelected} />}
    </motion.div>
  )
}

export default function TeamsTab() {
  const [todayCost, setTodayCost] = useState(0)
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<RoomId | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const data = await api.costs()
        if (active) setTodayCost(data.total?.cost || 0)
      } catch {
        if (active) setTodayCost(0)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const agentPanel = useMemo(
    () => (selectedAgent ? AGENT_DATA[selectedAgent] : null),
    [selectedAgent]
  )

  const handleAgentClick = (agentId: AgentId) => {
    setSelectedAgent(prev => (prev === agentId ? null : agentId))
    setSelectedRoom(null)
  }

  const handleRoomClick = (roomId: RoomId) => {
    setSelectedRoom(prev => (prev === roomId ? null : roomId))
    setSelectedAgent(null)
  }

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto">
      <div style={{ padding: '16px 16px 40px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: 'var(--c-text)', fontSize: 24, fontWeight: 700, margin: 0 }}>Teams</h1>
          <p style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 4 }}>
            Your AI agents — live in their rooms
          </p>
        </div>

        {/* Status strip */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--c-panel)',
            borderRadius: 16,
            padding: '12px 16px',
            marginBottom: 20,
            border: '1px solid var(--c-border)',
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--c-text)' }}>
            <motion.div
              style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }}
              animate={{ boxShadow: ['0 0 6px #22C55E', '0 0 14px #22C55E', '0 0 6px #22C55E'] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span style={{ fontSize: 14, fontWeight: 600 }}>3 agents online</span>
          </div>
          <div style={{ color: 'var(--c-text)', fontSize: 14 }}>
            <span style={{ fontWeight: 600 }}>1</span>
            <span style={{ color: 'var(--c-muted)' }}> active task</span>
          </div>
          <div style={{ color: 'var(--c-text)', fontSize: 14 }}>
            Today: <span style={{ fontWeight: 700, color: '#FFD700' }}>{formatCost(todayCost)}</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {(['marg', 'doc', 'cindy'] as AgentId[]).map(id => (
              <motion.div
                key={id}
                onClick={() => handleAgentClick(id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 32, height: 32,
                  borderRadius: '50%',
                  background: AGENT_DATA[id].accent + '20',
                  border: `1.5px solid ${selectedAgent === id ? AGENT_DATA[id].accent : AGENT_DATA[id].accent + '60'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 13, fontWeight: 700,
                  color: AGENT_DATA[id].accent,
                }}
              >
                {AGENT_DATA[id].name[0]}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rooms — horizontal scroll on mobile, row on desktop */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: 12,
            marginBottom: 24,
            WebkitOverflowScrolling: 'touch',
          }}
          className="scrollbar-hide"
        >
          {ROOM_ORDER.map((roomId, roomIdx) => {
            const { name, emoji } = ROOM_META[roomId]
            const agentsInRoom = (Object.entries(AGENT_ROOMS) as [AgentId, RoomId][])
              .filter(([, r]) => r === roomId)
              .map(([agentId]) => agentId)

            return (
              <motion.div
                key={roomId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: roomIdx * 0.07, duration: 0.3 }}
                style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
              >
                <Room
                  id={roomId}
                  name={name}
                  emoji={emoji}
                  isSelected={selectedRoom === roomId}
                  onRoomClick={() => handleRoomClick(roomId)}
                >
                  {agentsInRoom.map(agentId => (
                    <CharacterInRoom
                      key={agentId}
                      agentId={agentId}
                      state={AGENT_DATA[agentId].state}
                      isSelected={selectedAgent === agentId}
                      onClick={() => handleAgentClick(agentId)}
                    />
                  ))}
                </Room>
              </motion.div>
            )
          })}
        </div>

        {/* Agent quick-select chips when a room is selected */}
        <AnimatePresence>
          {selectedRoom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: 20, overflow: 'hidden' }}
            >
              <div style={{
                background: 'var(--c-panel)',
                borderRadius: 14,
                padding: '12px 16px',
                border: '1px solid var(--c-border)',
              }}>
                <p style={{ color: 'var(--c-muted)', fontSize: 12, margin: '0 0 8px' }}>
                  {ROOM_META[selectedRoom].emoji} {ROOM_META[selectedRoom].name} —
                  {' '}
                  {(Object.entries(AGENT_ROOMS) as [AgentId, RoomId][]).filter(([, r]) => r === selectedRoom).length === 0
                    ? 'empty right now'
                    : `${(Object.entries(AGENT_ROOMS) as [AgentId, RoomId][]).filter(([, r]) => r === selectedRoom).length} agent(s) here`}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(Object.entries(AGENT_ROOMS) as [AgentId, RoomId][])
                    .filter(([, r]) => r === selectedRoom)
                    .map(([agentId]) => (
                      <motion.button
                        key={agentId}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleAgentClick(agentId)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          background: AGENT_DATA[agentId].accent + '20',
                          border: `1px solid ${AGENT_DATA[agentId].accent}60`,
                          color: AGENT_DATA[agentId].accent,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {AGENT_DATA[agentId].name}
                      </motion.button>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Activity Feed */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'var(--c-panel)',
            borderRadius: 20,
            padding: '16px 18px',
            border: '1px solid var(--c-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <motion.div
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <h3 style={{ color: 'var(--c-text)', fontSize: 16, fontWeight: 600, margin: 0 }}>Live Activity</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
            {LIVE_FEED.map((item, idx) => (
              <motion.div
                key={`${item.agent}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                onClick={() => handleAgentClick(item.agentId)}
                style={{
                  background: 'var(--c-bg)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  border: `1px solid ${item.color}30`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ color: 'var(--c-dim)', fontFamily: 'monospace', fontSize: 11, flexShrink: 0 }}>
                  {item.ts}
                </span>
                <span style={{ color: item.color, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {item.agent}
                </span>
                <span style={{ color: 'var(--c-text-2)', fontSize: 12, flex: 1 }}>
                  {item.action}
                </span>
                <span style={{
                  color: item.color,
                  fontSize: 10,
                  opacity: 0.7,
                  flexShrink: 0,
                  background: item.color + '15',
                  borderRadius: 6,
                  padding: '2px 7px',
                }}>
                  {item.room}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* Detail panel */}
      <AgentDetailPanel
        agent={agentPanel}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  )
}
