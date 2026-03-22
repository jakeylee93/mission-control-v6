import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    supabaseUrlFirst10: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + '...',
    platform: process.platform,
    nodeVersion: process.version
  })
}