'use client'

import { motion } from 'framer-motion'

interface CharacterProps {
  size?: number
  state?: 'active' | 'thinking' | 'idle' | 'error'
  isSelected?: boolean
  onClick?: () => void
}

const STATE_COLORS = {
  active: '#22C55E',
  thinking: '#F59E0B',
  idle: '#6B7280',
  error: '#EF4444',
}

export default function DocCharacter({ size = 64, state = 'idle', isSelected = false, onClick }: CharacterProps) {
  const dotColor = STATE_COLORS[state]
  const isPulsing = state === 'active' || state === 'thinking'

  const bobY = state === 'active' ? [0, -9, 0] : state === 'thinking' ? [0, -6, 0] : [0, -5, 0]
  const bobDuration = state === 'active' ? 1.4 : state === 'thinking' ? 2 : 3

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size * 1.3,
        cursor: 'pointer',
        filter: isSelected
          ? 'drop-shadow(0 0 14px #16A34A) drop-shadow(0 0 28px #16A34A60)'
          : 'drop-shadow(0 0 5px #16A34A40)',
      }}
      onClick={onClick}
    >
      {/* Ground glow */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: size * 0.65,
          height: 5,
          background: '#16A34A',
          borderRadius: '50%',
          opacity: 0.35,
          filter: 'blur(4px)',
        }}
      />

      <motion.div
        animate={{ y: bobY }}
        transition={{ duration: bobDuration, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: size, height: size * 1.2 }}
      >
        <svg viewBox="0 0 60 78" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size * 1.2} overflow="visible">
          {/* Selection ring */}
          {isSelected && (
            <motion.circle
              cx="30" cy="40" r="28"
              stroke="#16A34A" strokeWidth="1.5" opacity="0.5" strokeDasharray="5 3"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '30px 40px' }}
            />
          )}

          {/* Hair (dark brown) */}
          <ellipse cx="30" cy="22" rx="17" ry="14" fill="#3D1C00" />
          <path d="M13 22 Q14 14 30 12 Q46 14 47 22" fill="#3D1C00" />
          {/* Hair highlight */}
          <path d="M16 14 Q24 10 34 12" stroke="#5C3000" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Head */}
          <circle cx="30" cy="28" r="16" fill="#FDDCAA" />

          {/* Glasses frames */}
          {/* Left lens */}
          <rect x="18" y="23" width="9" height="7" rx="2.5" fill="none" stroke="#16A34A" strokeWidth="1.8" />
          {/* Right lens */}
          <rect x="33" y="23" width="9" height="7" rx="2.5" fill="none" stroke="#16A34A" strokeWidth="1.8" />
          {/* Bridge */}
          <line x1="27" y1="26.5" x2="33" y2="26.5" stroke="#16A34A" strokeWidth="1.5" />
          {/* Left arm */}
          <line x1="18" y1="26.5" x2="14" y2="27" stroke="#16A34A" strokeWidth="1.5" />
          {/* Right arm */}
          <line x1="42" y1="26.5" x2="46" y2="27" stroke="#16A34A" strokeWidth="1.5" />

          {/* Eyes behind glasses */}
          <circle cx="22.5" cy="26.5" r="2" fill="#1a0a00" />
          <circle cx="37.5" cy="26.5" r="2" fill="#1a0a00" />
          <circle cx="23.2" cy="25.8" r="0.7" fill="white" />
          <circle cx="38.2" cy="25.8" r="0.7" fill="white" />

          {/* Smile - slight knowing smirk */}
          <path d="M26 34 Q30 37.5 34 34" stroke="#8B5E3C" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Blush */}
          <ellipse cx="20" cy="32" rx="3.5" ry="2" fill="#FF8FA3" opacity="0.4" />
          <ellipse cx="40" cy="32" rx="3.5" ry="2" fill="#FF8FA3" opacity="0.4" />

          {/* Neck */}
          <rect x="27" y="43" width="6" height="5" fill="#FDDCAA" rx="2" />

          {/* Lab coat body - white */}
          <path d="M10 48 Q30 54 50 48 L54 76 L6 76 Z" fill="#F0F0F0" />
          {/* Lab coat lapels */}
          <path d="M22 48 L26 56 L24 76 L10 76 Z" fill="#E0E0E0" />
          <path d="M38 48 L34 56 L36 76 L50 76 Z" fill="#E0E0E0" />
          {/* Coat collar left */}
          <path d="M22 48 Q26 44 30 46" stroke="#CCC" strokeWidth="1.5" fill="none" />
          <path d="M38 48 Q34 44 30 46" stroke="#CCC" strokeWidth="1.5" fill="none" />
          {/* Green pocket square */}
          <rect x="36" y="56" width="5" height="4" rx="1" fill="#16A34A" opacity="0.9" />
          {/* Pen in pocket */}
          <line x1="37.5" y1="54" x2="37.5" y2="57" stroke="#16A34A" strokeWidth="1.5" />
          <line x1="39.5" y1="54" x2="39.5" y2="57" stroke="#4ADE80" strokeWidth="1.5" />

          {/* Stethoscope around neck */}
          <path d="M22 49 Q20 60 18 64 Q17 68 20 68 Q23 68 23 64" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="20" cy="68" r="3" fill="none" stroke="#16A34A" strokeWidth="2" />
          <circle cx="20" cy="68" r="1" fill="#16A34A" />

          {/* Left arm */}
          <path d="M11 54 Q6 62 5 68" stroke="#F0F0F0" strokeWidth="6" strokeLinecap="round" />
          <path d="M11 54 Q6 62 5 68" stroke="#E0E0E0" strokeWidth="4" strokeLinecap="round" />

          {/* Right arm + hand slightly out */}
          <path d="M49 54 Q54 62 55 68" stroke="#F0F0F0" strokeWidth="6" strokeLinecap="round" />
          <path d="M49 54 Q54 62 55 68" stroke="#E0E0E0" strokeWidth="4" strokeLinecap="round" />
          {/* Hand */}
          <circle cx="55" cy="69" r="3" fill="#FDDCAA" />
        </svg>
      </motion.div>

      {/* Status dot */}
      <div
        style={{
          position: 'absolute',
          top: 3,
          right: 2,
          width: 11,
          height: 11,
          borderRadius: '50%',
          background: dotColor,
          border: '2px solid #000',
          zIndex: 10,
        }}
      >
        {isPulsing && (
          <motion.div
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              background: dotColor,
              opacity: 0.5,
            }}
            animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  )
}
