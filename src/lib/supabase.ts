import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function createBrowserSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export function createServerSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const key = serviceRoleKey || supabaseAnonKey

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export const supabase = createBrowserSupabaseClient()
