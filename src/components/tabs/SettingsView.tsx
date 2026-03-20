'use client'

import { useEffect, useState } from 'react'
import { AGENTS } from '@/components/types'

interface SettingsViewProps {
  autoPlayTts: boolean
  onToggleAutoPlay: () => void
}

type ApiStatus = Record<string, boolean>

export function SettingsView({ autoPlayTts, onToggleAutoPlay }: SettingsViewProps) {
  const [status, setStatus] = useState<ApiStatus>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const res = await fetch('/api/settings/status', { cache: 'no-store' })
      const data = await res.json()
      if (mounted) {
        setStatus(data)
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="mx-4 flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.035] p-3 backdrop-blur-2xl">
      <h2 className="text-lg font-semibold">Settings</h2>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Object.values(AGENTS).map((agent) => (
          <article key={agent.id} className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
            <p className="text-sm font-medium">{agent.name}</p>
            <p className="text-xs text-white/65">Role: {agent.role}</p>
            <p className="text-xs text-white/65">Voice: {agent.voice}</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: agent.accent }} />
              <span>{agent.accent}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs uppercase tracking-[0.12em] text-white/55">API Status</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {(loading ? ['loading'] : Object.keys(status)).map((key) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <span className="truncate text-white/75">{key}</span>
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: loading ? '#6B7280' : status[key] ? '#22C55E' : '#EF4444' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm">Auto-play TTS</p>
          <button
            onClick={onToggleAutoPlay}
            className={`rounded-full border px-3 py-1 text-xs ${
              autoPlayTts ? 'border-emerald-400/60 bg-emerald-400/20' : 'border-white/20 bg-white/10'
            }`}
          >
            {autoPlayTts ? 'On' : 'Off'}
          </button>
        </div>
        <p className="mt-1 text-xs text-white/60">Play assistant audio automatically after response.</p>
      </div>

      <div className="mt-auto rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
        Version 6.0.0-rebuild
      </div>
    </div>
  )
}
