export type AgentId = 'marg' | 'doc' | 'cindy'
export type MessageRole = 'user' | 'assistant'
export type VoiceState = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking'
export type TabId = 'dashboard' | 'chat' | 'memory' | 'settings'

export interface Agent {
  id: AgentId
  name: string
  role: string
  voice: string
  accent: string
  avatar: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  hasAudio?: boolean
  audioBase64?: string
  createdAt: string
}

export const AGENTS: Record<AgentId, Agent> = {
  marg: {
    id: 'marg',
    name: 'Margarita',
    role: 'Orchestrator',
    voice: 'ElevenLabs Marg',
    accent: '#FFD700',
    avatar: '/images/marg.png',
  },
  doc: {
    id: 'doc',
    name: 'Doc',
    role: 'Builder',
    voice: 'ElevenLabs Doc',
    accent: '#60A5FA',
    avatar: '/images/doc.png',
  },
  cindy: {
    id: 'cindy',
    name: 'Cindy',
    role: 'Assistant',
    voice: 'ElevenLabs Cindy',
    accent: '#C084FC',
    avatar: '/images/cindy.png',
  },
}
