'use client'

interface HeaderProps {
  now: Date
}

export function Header({ now }: HeaderProps) {
  const dateLabel = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const timeLabel = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <header className="px-4 pt-3 pb-2">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/55">
        <span>{dateLabel}</span>
        <span>Jake</span>
        <span>{timeLabel}</span>
      </div>
      <div className="mt-1 text-center">
        <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Mission Control</p>
      </div>
    </header>
  )
}
