'use client'

import { Agent, AgentId, ChatMessage, VoiceState } from '@/components/types'
import { AgentHero } from '@/components/AgentHero'
import { ChatArea } from '@/components/ChatArea'
import { VoiceInput } from '@/components/VoiceInput'

interface ChatViewProps {
  agent: Agent
  messages: ChatMessage[]
  voiceState: VoiceState
  audioPlayingId: string | null
  analyser: AnalyserNode | null
  textInput: string
  onTextChange: (value: string) => void
  onSwitchAgent: (agentId: AgentId) => void
  onReplayAudio: (message: ChatMessage) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onSendText: () => void
}

export function ChatView(props: ChatViewProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AgentHero agent={props.agent} isSpeaking={props.voiceState === 'speaking'} onSwitchAgent={props.onSwitchAgent} />
      <ChatArea
        agent={props.agent}
        messages={props.messages}
        isThinking={props.voiceState === 'thinking'}
        audioPlayingId={props.audioPlayingId}
        onReplayAudio={props.onReplayAudio}
      />
      <VoiceInput
        agent={props.agent}
        voiceState={props.voiceState}
        analyser={props.analyser}
        textInput={props.textInput}
        onTextChange={props.onTextChange}
        onStartRecording={props.onStartRecording}
        onStopRecording={props.onStopRecording}
        onSendText={props.onSendText}
      />
    </div>
  )
}
