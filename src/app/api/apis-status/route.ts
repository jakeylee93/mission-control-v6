import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    { id: 'anthropic', name: 'Claude (Anthropic)', icon: '🤖', status: 'connected', lastUsed: new Date().toISOString(), model: 'claude-sonnet-4-6', color: '#a855f7' },
    { id: 'kimi', name: 'Kimi (Moonshot)', icon: '🧠', status: 'connected', lastUsed: new Date().toISOString(), model: 'kimi-k1-5', color: '#4ecdc4' },
    { id: 'brave', name: 'Brave Search', icon: '🔍', status: 'configured', lastUsed: null, color: '#ff6b6b' },
    { id: 'google-calendar', name: 'Google Calendar', icon: '📅', status: 'configured', lastUsed: null, color: '#4285f4' },
    { id: 'google-drive', name: 'Google Drive', icon: '📁', status: 'configured', lastUsed: null, color: '#34a853' },
    { id: 'tailscale', name: 'Tailscale Mesh', icon: '🔗', status: 'connected', lastUsed: new Date().toISOString(), color: '#00ffff' },
  ])
}
