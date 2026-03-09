'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

type RoomType = 'lobby' | 'dev' | 'comms' | 'brain' | 'ops'

interface RoomProps {
  id: RoomType
  name: string
  emoji: string
  isSelected: boolean
  onRoomClick: () => void
  children?: ReactNode
}

// Animated background elements for each room type
function LobbyBackground() {
  const particles = Array.from({ length: 12 }, (_, i) => i)
  return (
    <svg viewBox="0 0 240 160" fill="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}>
      {/* Warm ambient light */}
      <radialGradient id="lobbyGlow" cx="50%" cy="60%" r="60%">
        <stop offset="0%" stopColor="#FFB347" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <rect width="240" height="160" fill="url(#lobbyGlow)" />
      {/* Simple couch silhouette */}
      <rect x="60" y="120" width="120" height="25" rx="8" fill="#2a1800" opacity="0.8" />
      <rect x="55" y="110" width="20" height="35" rx="5" fill="#2a1800" opacity="0.8" />
      <rect x="165" y="110" width="20" height="35" rx="5" fill="#2a1800" opacity="0.8" />
      <rect x="60" y="110" width="120" height="18" rx="5" fill="#3d2400" opacity="0.8" />
      {/* Floor lamp */}
      <line x1="200" y1="80" x2="200" y2="145" stroke="#4a3000" strokeWidth="2" />
      <ellipse cx="200" cy="80" rx="14" ry="10" fill="#4a3000" opacity="0.7" />
      <circle cx="200" cy="84" r="5" fill="#FFD700" opacity="0.8" />
      {/* Floating stars */}
      {particles.map((i) => (
        <motion.circle
          key={i}
          cx={20 + (i * 19) % 200}
          cy={20 + (i * 13) % 100}
          r={i % 3 === 0 ? 2.5 : 1.5}
          fill="#FFD700"
          animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -8, 0] }}
          transition={{ duration: 2.5 + (i % 4), repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  )
}

function DevBackground() {
  return (
    <svg viewBox="0 0 240 160" fill="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }}>
      {/* Screen glow */}
      <radialGradient id="devGlow" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stopColor="#16A34A" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <rect width="240" height="160" fill="url(#devGlow)" />
      {/* Monitor 1 (left) */}
      <rect x="20" y="40" width="70" height="50" rx="4" fill="#0D1117" stroke="#16A34A" strokeWidth="1.5" />
      <rect x="20" y="40" width="70" height="8" rx="4" fill="#16A34A" opacity="0.3" />
      {/* Code lines on monitor 1 */}
      <rect x="26" y="55" width="35" height="2" rx="1" fill="#4ADE80" opacity="0.7" />
      <rect x="26" y="61" width="50" height="2" rx="1" fill="#22C55E" opacity="0.5" />
      <rect x="30" y="67" width="40" height="2" rx="1" fill="#4ADE80" opacity="0.6" />
      <rect x="30" y="73" width="28" height="2" rx="1" fill="#86EFAC" opacity="0.4" />
      {/* Monitor stand */}
      <rect x="50" y="90" width="10" height="8" rx="1" fill="#1a2a1a" />
      <rect x="43" y="97" width="24" height="3" rx="1" fill="#1a2a1a" />
      {/* Monitor 2 (right) */}
      <rect x="150" y="35" width="75" height="55" rx="4" fill="#0D1117" stroke="#16A34A" strokeWidth="1.5" />
      <rect x="150" y="35" width="75" height="8" rx="4" fill="#16A34A" opacity="0.3" />
      {/* Code lines on monitor 2 */}
      <rect x="156" y="50" width="42" height="2" rx="1" fill="#4ADE80" opacity="0.7" />
      <rect x="160" y="56" width="55" height="2" rx="1" fill="#22C55E" opacity="0.5" />
      <rect x="156" y="62" width="30" height="2" rx="1" fill="#4ADE80" opacity="0.6" />
      <rect x="160" y="68" width="45" height="2" rx="1" fill="#86EFAC" opacity="0.4" />
      <rect x="156" y="74" width="20" height="2" rx="1" fill="#22C55E" opacity="0.5" />
      {/* Blinking cursor */}
      <motion.rect
        x="176" y="74" width="6" height="2" rx="1" fill="#4ADE80"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      {/* Monitor stand */}
      <rect x="181" y="90" width="13" height="8" rx="1" fill="#1a2a1a" />
      <rect x="174" y="97" width="27" height="3" rx="1" fill="#1a2a1a" />
      {/* Keyboard */}
      <rect x="145" y="108" width="70" height="18" rx="3" fill="#0D1117" stroke="#16A34A" strokeWidth="1" opacity="0.8" />
      {/* Keyboard keys */}
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={149 + (i % 7) * 9} y={112 + Math.floor(i / 7) * 6} width="7" height="4" rx="1" fill="#1a3a1a" />
      ))}
      {/* Matrix drips */}
      {[30, 70, 110, 170, 210].map((x, i) => (
        <motion.text
          key={i}
          x={x}
          y={20}
          fill="#22C55E"
          fontSize="10"
          fontFamily="monospace"
          opacity="0.3"
          animate={{ y: [10, 130], opacity: [0, 0.4, 0] }}
          transition={{ duration: 3 + i * 0.7, repeat: Infinity, delay: i * 1.2, ease: 'linear' }}
        >
          {['01', '10', '11', '00', '01'][i]}
        </motion.text>
      ))}
    </svg>
  )
}

function CommsBackground() {
  return (
    <svg viewBox="0 0 240 160" fill="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }}>
      {/* Background tint */}
      <radialGradient id="commsGlow" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#A855F7" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <rect width="240" height="160" fill="url(#commsGlow)" />
      {/* Calendar board */}
      <rect x="20" y="25" width="80" height="75" rx="3" fill="#111" stroke="#A855F7" strokeWidth="1.5" />
      <rect x="20" y="25" width="80" height="14" rx="3" fill="#7E22CE" />
      <text x="60" y="36" textAnchor="middle" fill="white" fontSize="7" fontFamily="sans-serif">MARCH 2026</text>
      {/* Calendar grid */}
      {Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 7 }, (_, col) => (
          <rect key={`${row}-${col}`} x={23 + col * 10} y={44 + row * 10} width="8" height="8" rx="1"
            fill={row === 0 && col === 0 ? '#A855F7' : '#1a1a1a'} stroke="#333" strokeWidth="0.5" />
        ))
      )}
      {/* Highlighted days */}
      <rect x="53" y="54" width="8" height="8" rx="1" fill="#A855F7" opacity="0.8" />
      <rect x="73" y="74" width="8" height="8" rx="1" fill="#7E22CE" opacity="0.7" />
      {/* Message bubbles floating */}
      {[
        { x: 120, y: 30, w: 60, from: 'left' },
        { x: 130, y: 65, w: 75, from: 'right' },
        { x: 115, y: 100, w: 55, from: 'left' },
      ].map((bubble, i) => (
        <motion.g key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.8 }}>
          <rect x={bubble.x} y={bubble.y} width={bubble.w} height="18" rx="9" fill="#1a0a2e" stroke="#A855F7" strokeWidth="1" opacity="0.8" />
          <rect x={bubble.x + 8} y={bubble.y + 6} width={bubble.w - 28} height="2" rx="1" fill="#A855F7" opacity="0.6" />
          <rect x={bubble.x + 8} y={bubble.y + 11} width={bubble.w - 40} height="2" rx="1" fill="#A855F7" opacity="0.4" />
        </motion.g>
      ))}
      {/* Envelope */}
      <motion.g animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity }}
        style={{ transformOrigin: '175px 135px' }}>
        <rect x="155" y="122" width="40" height="28" rx="3" fill="#1a0a2e" stroke="#A855F7" strokeWidth="1.5" />
        <path d="M155 122 L175 138 L195 122" stroke="#A855F7" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      </motion.g>
    </svg>
  )
}

function BrainBackground() {
  const nodes = [
    { cx: 60, cy: 45 }, { cx: 120, cy: 30 }, { cx: 180, cy: 45 },
    { cx: 40, cy: 85 }, { cx: 100, cy: 70 }, { cx: 160, cy: 80 }, { cx: 210, cy: 65 },
    { cx: 75, cy: 120 }, { cx: 135, cy: 110 }, { cx: 195, cy: 115 },
  ]
  const connections = [
    [0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [2, 6],
    [3, 4], [4, 5], [5, 6], [3, 7], [4, 8], [5, 9], [7, 8], [8, 9],
  ]
  return (
    <svg viewBox="0 0 240 160" fill="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.45 }}>
      <radialGradient id="brainGlow" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <rect width="240" height="160" fill="url(#brainGlow)" />
      {/* Neural connections */}
      {connections.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].cx} y1={nodes[a].cy}
          x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="#7C3AED" strokeWidth="1"
          animate={{ opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
      {/* Neural nodes */}
      {nodes.map((node, i) => (
        <motion.circle
          key={i}
          cx={node.cx} cy={node.cy} r={3.5}
          fill="#7C3AED"
          animate={{ r: [3, 5, 3], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2 + (i % 3) * 0.5, repeat: Infinity, delay: i * 0.25 }}
        />
      ))}
      {/* Books silhouette */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={165 + i * 12} y={125} width={9} height={28} rx="1"
          fill={['#4C1D95', '#6D28D9', '#5B21B6', '#7C3AED'][i]} opacity="0.7" />
      ))}
      <rect x="163" y="125" width="52" height="3" rx="1" fill="#3730A3" opacity="0.8" />
      {/* Floating orbs */}
      {[{ x: 20, y: 50 }, { x: 210, y: 100 }, { x: 50, y: 130 }].map((orb, i) => (
        <motion.circle
          key={i}
          cx={orb.x} cy={orb.y} r={6}
          fill="none" stroke="#7C3AED" strokeWidth="1.5"
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3 + i, repeat: Infinity, delay: i * 1.5 }}
        />
      ))}
    </svg>
  )
}

function OpsBackground() {
  const gaugeArcs = [
    'M30 85 A45 45 0 0 1 118 85',
  ]
  return (
    <svg viewBox="0 0 240 160" fill="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }}>
      <radialGradient id="opsGlow" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stopColor="#F97316" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <rect width="240" height="160" fill="url(#opsGlow)" />
      {/* Server racks */}
      <rect x="15" y="30" width="45" height="100" rx="3" fill="#0D1117" stroke="#F97316" strokeWidth="1.5" />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <rect x="18" y={33 + i * 12} width="39" height="10" rx="1.5" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="0.5" />
          <motion.circle
            cx="51" cy={38 + i * 12} r="2.5"
            fill={i % 3 === 0 ? '#22C55E' : i % 3 === 1 ? '#F97316' : '#EF4444'}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
          />
          <rect x="22" y={36 + i * 12} width="20" height="2" rx="0.5" fill="#1E3A1E" />
          <rect x="22" y={40 + i * 12} width="14" height="1.5" rx="0.5" fill="#1E3A1E" />
        </g>
      ))}
      {/* Server rack 2 */}
      <rect x="68" y="40" width="38" height="85" rx="3" fill="#0D1117" stroke="#F97316" strokeWidth="1.5" />
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <rect x="71" y={43 + i * 13} width="32" height="10" rx="1.5" fill="#1a1a1a" />
          <motion.circle
            cx="96" cy={48 + i * 13} r="2"
            fill={i % 2 === 0 ? '#22C55E' : '#F97316'}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
          />
        </g>
      ))}
      {/* Dashboard gauge */}
      {gaugeArcs.map((d, i) => (
        <path key={i} d={d} stroke="#F97316" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      ))}
      <motion.path
        d="M74 85 A45 45 0 0 1 100 47"
        stroke="#F97316" strokeWidth="3" strokeLinecap="round" opacity="0.8"
        animate={{ d: ['M74 85 A45 45 0 0 1 88 50', 'M74 85 A45 45 0 0 1 118 55', 'M74 85 A45 45 0 0 1 88 50'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <circle cx="74" cy="85" r="5" fill="#F97316" opacity="0.8" />
      {/* Gauge ticks */}
      {Array.from({ length: 7 }, (_, i) => {
        const angle = (i / 6) * 180 - 180
        const rad = angle * Math.PI / 180
        const cx = 74 + Math.cos(rad) * 45
        const cy = 85 + Math.sin(rad) * 45
        return <circle key={i} cx={cx} cy={cy} r="1.5" fill="#F97316" opacity="0.5" />
      })}
      {/* Status board top right */}
      <rect x="150" y="25" width="80" height="90" rx="3" fill="#0D1117" stroke="#F97316" strokeWidth="1.5" />
      <rect x="150" y="25" width="80" height="12" rx="3" fill="#F97316" opacity="0.4" />
      <text x="190" y="35" textAnchor="middle" fill="#F97316" fontSize="6" fontFamily="monospace">SYS STATUS</text>
      {/* Status rows */}
      {['CPU', 'MEM', 'NET', 'DSK', 'AGT'].map((label, i) => (
        <g key={i}>
          <text x="156" y={48 + i * 15} fill="#6B7280" fontSize="6" fontFamily="monospace">{label}</text>
          <rect x="174" y={41 + i * 15} width="46" height="8" rx="1" fill="#111" />
          <motion.rect
            x="174" y={41 + i * 15}
            width={[30, 38, 20, 25, 42][i]}
            height="8" rx="1"
            fill={['#22C55E', '#F97316', '#22C55E', '#22C55E', '#A855F7'][i]}
            opacity="0.7"
            animate={{ width: [[30, 38, 20, 25, 42][i], [30, 38, 20, 25, 42][i] + 8, [30, 38, 20, 25, 42][i]] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle cx="224" cy={45 + i * 15} r="3"
            fill={['#22C55E', '#F97316', '#22C55E', '#22C55E', '#A855F7'][i]}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
          />
        </g>
      ))}
    </svg>
  )
}

const ROOM_CONFIGS: Record<RoomType, { gradient: string; border: string; headerBg: string }> = {
  lobby: {
    gradient: 'radial-gradient(ellipse at 50% 30%, #1a0e00 0%, #0a0500 100%)',
    border: '#FFD70040',
    headerBg: '#FFD70020',
  },
  dev: {
    gradient: 'radial-gradient(ellipse at 50% 30%, #001a0a 0%, #000d05 100%)',
    border: '#16A34A40',
    headerBg: '#16A34A20',
  },
  comms: {
    gradient: 'radial-gradient(ellipse at 50% 30%, #0d001a 0%, #070010 100%)',
    border: '#A855F740',
    headerBg: '#A855F720',
  },
  brain: {
    gradient: 'radial-gradient(ellipse at 50% 30%, #0d001a 0%, #050010 100%)',
    border: '#7C3AED40',
    headerBg: '#7C3AED20',
  },
  ops: {
    gradient: 'radial-gradient(ellipse at 50% 30%, #1a0800 0%, #0d0500 100%)',
    border: '#F9731640',
    headerBg: '#F9731620',
  },
}

export default function Room({ id, name, emoji, isSelected, onRoomClick, children }: RoomProps) {
  const config = ROOM_CONFIGS[id]
  const hasCharacters = !!children && (Array.isArray(children) ? children.some(Boolean) : true)

  return (
    <motion.div
      onClick={onRoomClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'relative',
        minWidth: 220,
        flex: 1,
        height: 280,
        borderRadius: 20,
        background: config.gradient,
        border: `2px solid ${isSelected ? config.border.replace('40', 'a0') : config.border}`,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: isSelected ? `0 0 30px ${config.border}` : '0 4px 24px #00000080',
      }}
    >
      {/* Animated background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {id === 'lobby' && <LobbyBackground />}
        {id === 'dev' && <DevBackground />}
        {id === 'comms' && <CommsBackground />}
        {id === 'brain' && <BrainBackground />}
        {id === 'ops' && <OpsBackground />}
      </div>

      {/* Floor line */}
      <div style={{
        position: 'absolute',
        bottom: 48,
        left: 16,
        right: 16,
        height: 1.5,
        background: config.border.replace('40', '60'),
        borderRadius: 1,
      }} />

      {/* Room header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '10px 14px',
          background: config.headerBg,
          borderBottom: `1px solid ${config.border}`,
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>{emoji}</span>
          <span style={{ color: 'var(--c-text)', fontSize: 13, fontWeight: 600 }}>{name}</span>
        </div>
        {hasCharacters && (
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#22C55E',
            boxShadow: '0 0 8px #22C55E',
          }} />
        )}
      </div>

      {/* Character floor area */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 12,
          padding: '0 12px',
        }}
      >
        {children}
      </div>

      {/* Selected overlay */}
      {isSelected && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            border: `2px solid ${config.border.replace('40', 'c0')}`,
            borderRadius: 18,
            pointerEvents: 'none',
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
}
