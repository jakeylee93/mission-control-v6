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

export default function MargCharacter({ size = 64, state = 'idle', isSelected = false, onClick }: CharacterProps) {
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
          ? 'drop-shadow(0 0 14px #FFD700) drop-shadow(0 0 28px #FFD70060)'
          : 'drop-shadow(0 0 5px #FFD70040)',
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
          background: '#FFD700',
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
              stroke="#FFD700" strokeWidth="1.5" opacity="0.5" strokeDasharray="5 3"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '30px 40px' }}
            />
          )}

          {/* Hair back layer */}
          <path d="M11 28 Q13 13 22 16 Q25 5 30 9 Q35 5 38 16 Q47 13 49 28" fill="#E6A800" />

          {/* Head */}
          <circle cx="30" cy="28" r="16.5" fill="#FDDCAA" />

          {/* Hair front */}
          <path d="M14 22 Q18 8 30 12 Q42 8 46 22 L46 19 Q41 6 30 10 Q19 6 14 19 Z" fill="#FFD700" />

          {/* Star ornament */}
          <path d="M30 5 L31.8 10 L37 10 L32.5 13 L34.5 18 L30 15.5 L25.5 18 L27.5 13 L23 10 L28.2 10 Z" fill="#FFD700" stroke="#E6A800" strokeWidth="0.5" />

          {/* Eyes */}
          <circle cx="24.5" cy="27" r="2.8" fill="#1a0a00" />
          <circle cx="35.5" cy="27" r="2.8" fill="#1a0a00" />
          <circle cx="25.5" cy="26" r="1" fill="white" />
          <circle cx="36.5" cy="26" r="1" fill="white" />
          {/* Eyelashes top */}
          <path d="M22 24.5 Q24.5 23 27 24.5" stroke="#1a0a00" strokeWidth="1" strokeLinecap="round" fill="none" />
          <path d="M33 24.5 Q35.5 23 38 24.5" stroke="#1a0a00" strokeWidth="1" strokeLinecap="round" fill="none" />

          {/* Smile */}
          <path d="M25.5 34 Q30 38.5 34.5 34" stroke="#8B5E3C" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Blush */}
          <ellipse cx="19.5" cy="31.5" rx="4" ry="2.2" fill="#FF8FA3" opacity="0.5" />
          <ellipse cx="40.5" cy="31.5" rx="4" ry="2.2" fill="#FF8FA3" opacity="0.5" />

          {/* Gold earrings */}
          <circle cx="14" cy="29" r="2.2" fill="#FFD700" />
          <circle cx="14" cy="29" r="1" fill="#FFF" opacity="0.5" />
          <circle cx="46" cy="29" r="2.2" fill="#FFD700" />
          <circle cx="46" cy="29" r="1" fill="#FFF" opacity="0.5" />

          {/* Neck */}
          <rect x="27" y="43" width="6" height="6" fill="#FDDCAA" rx="2" />

          {/* Dress */}
          <path d="M12 50 Q30 56 48 50 L53 76 L7 76 Z" fill="#FFD700" />
          {/* Dress highlight */}
          <path d="M13 51 L9 76 L15 76 L19 51 Z" fill="white" opacity="0.12" />
          {/* Belt */}
          <path d="M12 50 Q30 56 48 50" fill="none" stroke="#FFC200" strokeWidth="3" strokeLinecap="round" />

          {/* Left arm */}
          <path d="M13 56 Q7 61 3 65" stroke="#FDDCAA" strokeWidth="5.5" strokeLinecap="round" />

          {/* Martini glass */}
          {/* Bowl */}
          <path d="M-1 63 L7 63 L3 69.5 Z" fill="#FFE57A" opacity="0.9" />
          <path d="M-1 63 L7 63 L3 69.5 Z" fill="none" stroke="#FFD700" strokeWidth="1.5" />
          {/* Stem */}
          <line x1="3" y1="69.5" x2="3" y2="74" stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round" />
          {/* Base */}
          <line x1="-0.5" y1="74" x2="6.5" y2="74" stroke="#FFD700" strokeWidth="2.2" strokeLinecap="round" />
          {/* Olive on pick */}
          <line x1="3" y1="61.5" x2="3" y2="65" stroke="#A16207" strokeWidth="1" />
          <circle cx="3" cy="61" r="1.8" fill="#4ADE80" />
          <circle cx="3" cy="61" r="0.7" fill="#16A34A" />

          {/* Right arm */}
          <path d="M47 56 Q53 61 55 65" stroke="#FDDCAA" strokeWidth="5.5" strokeLinecap="round" />

          {/* Sparkle decorations on dress */}
          <path d="M20 60 L21 62 L23 62 L21.5 63.5 L22.5 65.5 L20 64 L17.5 65.5 L18.5 63.5 L17 62 L19 62 Z" fill="#FFF" opacity="0.3" />
          <path d="M37 65 L37.8 67 L40 67 L38.3 68.3 L39 70.5 L37 69 L35 70.5 L35.7 68.3 L34 67 L36.2 67 Z" fill="#FFF" opacity="0.3" />
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
