import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    voiceMarg: Boolean(process.env.ELEVENLABS_VOICE_MARG),
    voiceDoc: Boolean(process.env.ELEVENLABS_VOICE_DOC),
    voiceCindy: Boolean(process.env.ELEVENLABS_VOICE_CINDY),
  })
}
