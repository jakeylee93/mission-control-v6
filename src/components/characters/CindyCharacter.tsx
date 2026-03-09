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

export default function CindyCharacter({ size = 64, state = 'idle', isSelected = false, onClick }: CharacterProps) {
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
          ? 'drop-shadow(0 0 14px #A855F7) drop-shadow(0 0 28px #A855F760)'
          : 'drop-shadow(0 0 5px #A855F740)',
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
          background: '#A855F7',
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
              stroke="#A855F7" strokeWidth="1.5" opacity="0.5" strokeDasharray="5 3"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '30px 40px' }}
            />
          )}

          {/* Hair back (dark, flowing) */}
          <path d="M13 26 Q14 10 30 10 Q46 10 47 26" fill="#3D1C00" />
          <path d="M13 26 Q10 40 12 50" fill="#3D1C00" />
          <path d="M47 26 Q50 40 48 50" fill="#3D1C00" />

          {/* Head */}
          <circle cx="30" cy="28" r="16" fill="#FDDCAA" />

          {/* Purple headband */}
          <path d="M14 22 Q18 14 30 13 Q42 14 46 22" fill="none" stroke="#A855F7" strokeWidth="4" strokeLinecap="round" />
          {/* Headband bow */}
          <ellipse cx="46" cy="22" rx="4" ry="3" fill="#A855F7" transform="rotate(-20 46 22)" />
          <ellipse cx="42" cy="20" rx="4" ry="3" fill="#A855F7" transform="rotate(20 42 20)" />
          <circle cx="44" cy="21" r="2" fill="#C084FC" />

          {/* Eyes */}
          <circle cx="24.5" cy="27" r="2.6" fill="#1a0a00" />
          <circle cx="35.5" cy="27" r="2.6" fill="#1a0a00" />
          <circle cx="25.3" cy="26" r="0.9" fill="white" />
          <circle cx="36.3" cy="26" r="0.9" fill="white" />
          {/* Eyelashes */}
          <path d="M22 24.5 Q24.5 23 27 24.5" stroke="#1a0a00" strokeWidth="1" strokeLinecap="round" fill="none" />
          <path d="M33 24.5 Q35.5 23 38 24.5" stroke="#1a0a00" strokeWidth="1" strokeLinecap="round" fill="none" />

          {/* Smile - confident */}
          <path d="M25.5 34 Q30 38 34.5 34" stroke="#8B5E3C" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Blush */}
          <ellipse cx="20" cy="31.5" rx="3.5" ry="2" fill="#FF8FA3" opacity="0.45" />
          <ellipse cx="40" cy="31.5" rx="3.5" ry="2" fill="#FF8FA3" opacity="0.45" />

          {/* Pearl earrings */}
          <circle cx="14.5" cy="29" r="2" fill="#F0E6FF" stroke="#A855F7" strokeWidth="0.8" />
          <circle cx="45.5" cy="29" r="2" fill="#F0E6FF" stroke="#A855F7" strokeWidth="0.8" />

          {/* Neck */}
          <rect x="27" y="43" width="6" height="5" fill="#FDDCAA" rx="2" />

          {/* Blazer body - purple */}
          <path d="M12 50 Q30 55 48 50 L52 76 L8 76 Z" fill="#7E22CE" />
          {/* Blazer lapels */}
          <path d="M22 50 L26 57 L24 76 L8 76 Z" fill="#9333EA" />
          <path d="M38 50 L34 57 L36 76 L52 76 Z" fill="#9333EA" />
          {/* Blazer collar */}
          <path d="M22 50 Q26 44 30 47 Q34 44 38 50" fill="none" stroke="#6B21A8" strokeWidth="1.5" />
          {/* White blouse showing */}
          <path d="M27 47 L30 57 L33 47 Q30 50 27 47 Z" fill="#F0E6FF" opacity="0.7" />
          {/* Purple gem brooch */}
          <circle cx="30" cy="52" r="2.5" fill="#A855F7" />
          <circle cx="30" cy="52" r="1.2" fill="#D8B4FE" />

          {/* Left arm */}
          <path d="M13 55 Q8 62 7 68" stroke="#9333EA" strokeWidth="5.5" strokeLinecap="round" />
          {/* Left hand */}
          <circle cx="7" cy="69" r="3.5" fill="#FDDCAA" />

          {/* Right arm - holding clipboard */}
          <path d="M47 55 Q53 58 54 62" stroke="#9333EA" strokeWidth="5.5" strokeLinecap="round" />

          {/* Clipboard */}
          <rect x="50" y="58" width="12" height="16" rx="1.5" fill="#F5F5DC" stroke="#D4A853" strokeWidth="1" />
          {/* Clipboard clip at top */}
          <rect x="54" y="55.5" width="4" height="5" rx="1" fill="#D4A853" />
          {/* Paper lines */}
          <line x1="52" y1="65" x2="60" y2="65" stroke="#A855F7" strokeWidth="0.8" />
          <line x1="52" y1="68" x2="60" y2="68" stroke="#A855F7" strokeWidth="0.8" />
          <line x1="52" y1="71" x2="57" y2="71" stroke="#A855F7" strokeWidth="0.8" />
          {/* Checkmark on clipboard */}
          <path d="M52 62 L54 64 L58 60" stroke="#16A34A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
