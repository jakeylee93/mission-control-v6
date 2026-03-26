import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const INSTALLED_SKILLS = [
  {
    slug: 'coding-agent',
    name: 'Coding Agent',
    description: 'AI-powered coding assistant for software development tasks',
    source: 'bundled',
    eligible: true,
  },
  {
    slug: 'github',
    name: 'GitHub',
    description: 'GitHub integration for repos, PRs, issues and workflows',
    source: 'clawhub',
    eligible: true,
  },
  {
    slug: 'gog',
    name: 'GoG',
    description: 'Game of Games integration',
    source: 'clawhub',
    eligible: true,
  },
  {
    slug: 'weather',
    name: 'Weather',
    description: 'Real-time weather forecasts and conditions',
    source: 'clawhub',
    eligible: true,
  },
  {
    slug: 'skill-creator',
    name: 'Skill Creator',
    description: 'Create and publish new Claude skills',
    source: 'bundled',
    eligible: true,
  },
  {
    slug: 'healthcheck',
    name: 'Health Check',
    description: 'System health monitoring and diagnostics',
    source: 'bundled',
    eligible: true,
  },
  {
    slug: 'video-frames',
    name: 'Video Frames',
    description: 'Extract and analyse frames from video files',
    source: 'clawhub',
    eligible: true,
  },
  {
    slug: 'openai-whisper-api',
    name: 'OpenAI Whisper API',
    description: 'Speech-to-text transcription via Whisper',
    source: 'clawhub',
    eligible: true,
  },
  {
    slug: 'openai-image-gen',
    name: 'OpenAI Image Gen',
    description: 'AI image generation via DALL-E',
    source: 'clawhub',
    eligible: true,
  },
  {
    slug: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    description: 'Lightweight task automation tool',
    source: 'clawhub',
    eligible: true,
  },
  {
    slug: 'gh-issues',
    name: 'GH Issues',
    description: 'GitHub Issues management and tracking',
    source: 'clawhub',
    eligible: true,
  },
  {
    slug: 'acp-router',
    name: 'ACP Router',
    description: 'Agent Communication Protocol routing',
    source: 'bundled',
    eligible: true,
  },
  {
    slug: 'node-connect',
    name: 'Node Connect',
    description: 'Node.js runtime integration and execution',
    source: 'clawhub',
    eligible: true,
  },
]

// GET: return Jake's known installed skills (hardcoded, no CLI needed)
export async function GET() {
  return NextResponse.json({ ok: true, skills: INSTALLED_SKILLS })
}
